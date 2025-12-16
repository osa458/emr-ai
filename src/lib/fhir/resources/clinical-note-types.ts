/**
 * Clinical Note Types and FHIR Mapping
 * Defines type codes, extensions, and interfaces for clinical notes
 */

import type { DocumentReference, Extension, CodeableConcept } from '@medplum/fhirtypes'

// Note type LOINC codes (standard clinical document types)
export const NoteTypeCodes: Record<string, { code: string; display: string }> = {
    'Progress Note': { code: '11506-3', display: 'Progress Note' },
    'H&P': { code: '34117-2', display: 'History and Physical' },
    'Consult Note': { code: '11488-4', display: 'Consultation Note' },
    'Discharge Summary': { code: '18842-5', display: 'Discharge Summary' },
    'Procedure Note': { code: '28570-0', display: 'Procedure Note' },
    'Nursing Note': { code: '68478-9', display: 'Nursing Note' },
    'Therapy Note': { code: '68656-0', display: 'Therapy Note' },
}

// Services list (matching NotesPanel.tsx)
export const NoteServices = [
    'Hospitalist',
    'Cardiology',
    'Case Manager/Care Coordinator',
    'Critical Care Medicine',
    'Dialysis',
    'Dietitian, Registered',
    'Gastroenterology',
    'Heart Failure',
    'Infectious Disease',
    'Nephrology',
    'Occupational Therapy',
    'Oncology and Hematology',
    'Palliative Care',
    'Pharmacist',
    'Physical Therapy',
    'Pulmonary Medicine',
    'Registered Nurse',
    'Social Work',
    'Urology',
] as const

export type NoteService = typeof NoteServices[number]

// Extension URLs for custom fields
export const NoteExtensionUrls = {
    service: 'http://emmai.local/fhir/StructureDefinition/note-service',
    authorRole: 'http://emmai.local/fhir/StructureDefinition/note-author-role',
    isSmartNote: 'http://emmai.local/fhir/StructureDefinition/note-smart-builder',
    sections: 'http://emmai.local/fhir/StructureDefinition/note-sections',
} as const

// Note status mapping to FHIR docStatus
export type NoteStatus = 'draft' | 'pended' | 'signed'

export const NoteStatusToFHIR: Record<NoteStatus, { status: string; docStatus: string }> = {
    'draft': { status: 'current', docStatus: 'preliminary' },
    'pended': { status: 'current', docStatus: 'preliminary' },
    'signed': { status: 'current', docStatus: 'final' },
}

export const FHIRToNoteStatus = (docStatus: string): NoteStatus => {
    switch (docStatus) {
        case 'final': return 'signed'
        case 'amended': return 'signed'
        default: return 'draft'
    }
}

// Custom text block for editable sections
export interface NoteSection {
    id: string
    afterSection: string
    content: string
}

// Version tracking
export interface NoteVersion {
    id: string
    content: string
    author: string
    date: string
    action: 'created' | 'edited' | 'cosigned' | 'attested' | 'addendum'
}

// Addendum
export interface NoteAddendum {
    id: string
    author: string
    authorRole: string
    date: string
    content: string
}

// Full note interface matching NotesPanel (UI-friendly)
export interface ClinicalNote {
    id: string
    type: string
    service: string
    title: string
    author: string
    authorRole: string
    date: Date
    content: string
    status: NoteStatus
    isSmartNote?: boolean
    sections?: NoteSection[]
    versions?: NoteVersion[]
    cosigners?: { name: string; role: string; date: Date }[]
    attestations?: { name: string; role: string; date: Date }[]
    addendums?: NoteAddendum[]
}

/**
 * Convert DocumentReference to ClinicalNote
 */
export function documentReferenceToNote(doc: DocumentReference): ClinicalNote {
    // Get extensions
    const getExt = (url: string) => doc.extension?.find(e => e.url?.includes(url))

    // Decode content
    const attachment = doc.content?.[0]?.attachment
    let content = ''
    if (attachment?.data) {
        try {
            content = atob(attachment.data)
        } catch {
            content = attachment.data
        }
    }

    // Parse sections from extension
    let sections: NoteSection[] | undefined
    const sectionsExt = getExt('note-sections')
    if (sectionsExt?.valueString) {
        try {
            sections = JSON.parse(sectionsExt.valueString)
        } catch { }
    }

    return {
        id: doc.id || '',
        type: doc.type?.text || doc.type?.coding?.[0]?.display || 'Progress Note',
        service: getExt('note-service')?.valueString || 'Hospitalist',
        title: `${doc.type?.text || 'Note'} - ${getExt('note-service')?.valueString || 'Unknown'}`,
        author: doc.author?.[0]?.display || 'Unknown',
        authorRole: getExt('note-author-role')?.valueString || 'Provider',
        date: doc.date ? new Date(doc.date) : new Date(),
        content,
        status: FHIRToNoteStatus(doc.docStatus || 'preliminary'),
        isSmartNote: getExt('note-smart-builder')?.valueBoolean || false,
        sections,
    }
}

/**
 * Convert ClinicalNote to DocumentReference for saving
 */
export function noteToDocumentReference(
    note: Partial<ClinicalNote>,
    patientId: string,
    encounterId?: string
): Omit<DocumentReference, 'id'> {
    const typeCode = NoteTypeCodes[note.type || 'Progress Note'] || NoteTypeCodes['Progress Note']
    const fhirStatus = NoteStatusToFHIR[note.status || 'draft']

    // Build extensions
    const extensions: Extension[] = []

    if (note.service) {
        extensions.push({ url: NoteExtensionUrls.service, valueString: note.service })
    }
    if (note.authorRole) {
        extensions.push({ url: NoteExtensionUrls.authorRole, valueString: note.authorRole })
    }
    if (note.isSmartNote !== undefined) {
        extensions.push({ url: NoteExtensionUrls.isSmartNote, valueBoolean: note.isSmartNote })
    }
    if (note.sections) {
        extensions.push({ url: NoteExtensionUrls.sections, valueString: JSON.stringify(note.sections) })
    }

    // Encode content as base64
    const contentBase64 = typeof btoa !== 'undefined'
        ? btoa(note.content || '')
        : Buffer.from(note.content || '').toString('base64')

    const docRef: Omit<DocumentReference, 'id'> = {
        resourceType: 'DocumentReference',
        status: fhirStatus.status as DocumentReference['status'],
        docStatus: fhirStatus.docStatus as DocumentReference['docStatus'],
        type: {
            coding: [{ system: 'http://loinc.org', code: typeCode.code, display: typeCode.display }],
            text: note.type || 'Progress Note',
        },
        category: [
            { coding: [{ code: 'clinical-note', display: 'Clinical Note' }], text: 'Clinical Note' }
        ],
        subject: { reference: `Patient/${patientId}` },
        date: note.date?.toISOString() || new Date().toISOString(),
        author: [{ display: note.author || 'Unknown Provider' }],
        content: [{
            attachment: {
                contentType: 'text/plain',
                data: contentBase64,
            }
        }],
        extension: extensions.length > 0 ? extensions : undefined,
    }

    if (encounterId) {
        docRef.context = { encounter: [{ reference: `Encounter/${encounterId}` }] }
    }

    return docRef
}

/**
 * Get note type CodeableConcept
 */
export function getNoteTypeCodeable(type: string): CodeableConcept {
    const code = NoteTypeCodes[type] || NoteTypeCodes['Progress Note']
    return {
        coding: [{ system: 'http://loinc.org', code: code.code, display: code.display }],
        text: type,
    }
}
