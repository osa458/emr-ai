/**
 * usePatientNotes Hook
 * Fetches and manages clinical notes from FHIR/Aidbox
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DocumentReference } from '@medplum/fhirtypes'
import {
    documentReferenceToNote,
    noteToDocumentReference,
    type ClinicalNote,
    type NoteStatus,
} from '@/lib/fhir/resources/clinical-note-types'

const FHIR_BASE = process.env.NEXT_PUBLIC_AIDBOX_BASE_URL ||
    process.env.NEXT_PUBLIC_FHIR_BASE_URL ||
    'https://aoadhslfxc.edge.aidbox.app'

const headers = { 'Content-Type': 'application/fhir+json' }

/**
 * Fetch notes for a patient
 */
export function usePatientNotes(patientId: string | undefined) {
    return useQuery({
        queryKey: ['notes', patientId],
        queryFn: async (): Promise<ClinicalNote[]> => {
            const response = await fetch(
                `${FHIR_BASE}/DocumentReference?patient=${patientId}&category=clinical-note&_sort=-date&_count=100`,
                { headers }
            )
            if (!response.ok) {
                throw new Error(`Failed to fetch notes: ${response.status}`)
            }
            const bundle = await response.json()
            const docs = (bundle.entry || []).map((e: any) => e.resource as DocumentReference)
            return docs.map(documentReferenceToNote)
        },
        enabled: !!patientId,
        staleTime: 2 * 60 * 1000,
    })
}

/**
 * Fetch a single note by ID
 */
export function useNote(noteId: string | undefined) {
    return useQuery({
        queryKey: ['note', noteId],
        queryFn: async (): Promise<ClinicalNote> => {
            const response = await fetch(`${FHIR_BASE}/DocumentReference/${noteId}`, { headers })
            if (!response.ok) {
                throw new Error(`Failed to fetch note: ${response.status}`)
            }
            const doc: DocumentReference = await response.json()
            return documentReferenceToNote(doc)
        },
        enabled: !!noteId,
        staleTime: 1 * 60 * 1000,
    })
}

/**
 * Create a new note
 */
export function useCreateNote() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            note,
            patientId,
            encounterId
        }: {
            note: Partial<ClinicalNote>
            patientId: string
            encounterId?: string
        }): Promise<ClinicalNote> => {
            const docRef = noteToDocumentReference(note, patientId, encounterId)

            const response = await fetch(`${FHIR_BASE}/DocumentReference`, {
                method: 'POST',
                headers,
                body: JSON.stringify(docRef),
            })
            if (!response.ok) {
                throw new Error(`Failed to create note: ${response.status}`)
            }
            const created: DocumentReference = await response.json()
            return documentReferenceToNote(created)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notes', variables.patientId] })
        },
    })
}

/**
 * Update an existing note
 */
export function useUpdateNote() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            noteId,
            note,
            patientId,
            encounterId
        }: {
            noteId: string
            note: Partial<ClinicalNote>
            patientId: string
            encounterId?: string
        }): Promise<ClinicalNote> => {
            const docRef = noteToDocumentReference(note, patientId, encounterId)

            const response = await fetch(`${FHIR_BASE}/DocumentReference/${noteId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ ...docRef, id: noteId }),
            })
            if (!response.ok) {
                throw new Error(`Failed to update note: ${response.status}`)
            }
            const updated: DocumentReference = await response.json()
            return documentReferenceToNote(updated)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notes', variables.patientId] })
            queryClient.invalidateQueries({ queryKey: ['note', variables.noteId] })
        },
    })
}

/**
 * Sign a note (change status to signed)
 */
export function useSignNote() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            noteId,
            patientId,
        }: {
            noteId: string
            patientId: string
        }): Promise<ClinicalNote> => {
            // First fetch the current note
            const getResponse = await fetch(`${FHIR_BASE}/DocumentReference/${noteId}`, { headers })
            if (!getResponse.ok) {
                throw new Error(`Failed to fetch note: ${getResponse.status}`)
            }
            const doc: DocumentReference = await getResponse.json()

            // Update status to signed
            doc.docStatus = 'final'

            const response = await fetch(`${FHIR_BASE}/DocumentReference/${noteId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(doc),
            })
            if (!response.ok) {
                throw new Error(`Failed to sign note: ${response.status}`)
            }
            const updated: DocumentReference = await response.json()
            return documentReferenceToNote(updated)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notes', variables.patientId] })
            queryClient.invalidateQueries({ queryKey: ['note', variables.noteId] })
        },
    })
}

/**
 * Add an addendum to a note
 */
export function useAddAddendum() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            noteId,
            patientId,
            addendumContent,
            author,
            authorRole,
        }: {
            noteId: string
            patientId: string
            addendumContent: string
            author: string
            authorRole: string
        }): Promise<ClinicalNote> => {
            // Fetch the current note
            const getResponse = await fetch(`${FHIR_BASE}/DocumentReference/${noteId}`, { headers })
            if (!getResponse.ok) {
                throw new Error(`Failed to fetch note: ${getResponse.status}`)
            }
            const doc: DocumentReference = await getResponse.json()

            // Convert to note and add addendum
            const note = documentReferenceToNote(doc)
            const addendum = {
                id: `addendum-${Date.now()}`,
                author,
                authorRole,
                date: new Date().toISOString(),
                content: addendumContent,
            }

            const existingAddendums = note.addendums || []
            existingAddendums.push(addendum)

            // Update the note content to include addendum
            const updatedContent = `${note.content}\n\n--- ADDENDUM (${new Date().toLocaleDateString()}) ---\nBy: ${author}, ${authorRole}\n\n${addendumContent}`

            // Update docStatus to amended
            doc.docStatus = 'amended'

            // Update content
            const contentBase64 = typeof btoa !== 'undefined'
                ? btoa(updatedContent)
                : Buffer.from(updatedContent).toString('base64')

            if (doc.content?.[0]?.attachment) {
                doc.content[0].attachment.data = contentBase64
            }

            const response = await fetch(`${FHIR_BASE}/DocumentReference/${noteId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(doc),
            })
            if (!response.ok) {
                throw new Error(`Failed to add addendum: ${response.status}`)
            }
            const updated: DocumentReference = await response.json()
            return documentReferenceToNote(updated)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notes', variables.patientId] })
            queryClient.invalidateQueries({ queryKey: ['note', variables.noteId] })
        },
    })
}

/**
 * Delete a note (actually updates status to entered-in-error)
 */
export function useDeleteNote() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            noteId,
            patientId,
        }: {
            noteId: string
            patientId: string
        }): Promise<void> => {
            const getResponse = await fetch(`${FHIR_BASE}/DocumentReference/${noteId}`, { headers })
            if (!getResponse.ok) {
                throw new Error(`Failed to fetch note: ${getResponse.status}`)
            }
            const doc: DocumentReference = await getResponse.json()

            // Mark as entered-in-error (FHIR way of "deleting")
            doc.status = 'entered-in-error'

            const response = await fetch(`${FHIR_BASE}/DocumentReference/${noteId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(doc),
            })
            if (!response.ok) {
                throw new Error(`Failed to delete note: ${response.status}`)
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notes', variables.patientId] })
        },
    })
}
