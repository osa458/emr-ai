'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const FHIR_BASE = process.env.NEXT_PUBLIC_AIDBOX_BASE_URL ||
    process.env.NEXT_PUBLIC_FHIR_BASE_URL ||
    'https://aoadhslfxc.edge.aidbox.app'

interface MedicationOrder {
    patientId: string
    encounterId?: string
    medicationCode: string
    medicationDisplay: string
    dosage: string
    route: string
    frequency: string
    duration?: string
    notes?: string
    priority?: 'routine' | 'urgent' | 'asap' | 'stat'
}

interface LabOrder {
    patientId: string
    encounterId?: string
    loincCode: string
    loincDisplay: string
    priority?: 'routine' | 'urgent' | 'asap' | 'stat'
    notes?: string
}

// Search medications in Aidbox
export function useMedicationSearch(query: string) {
    return useQuery({
        queryKey: ['medications', 'search', query],
        queryFn: async () => {
            if (!query || query.length < 2) return []

            const response = await fetch(
                `${FHIR_BASE}/Medication?code:text=${encodeURIComponent(query)}&_count=20`,
                { headers: { 'Content-Type': 'application/fhir+json' } }
            )
            if (!response.ok) return []

            const bundle = await response.json()
            return (bundle.entry || []).map((e: any) => e.resource)
        },
        enabled: query.length >= 2,
        staleTime: 5 * 60 * 1000,
    })
}

// Create a medication order (MedicationRequest)
export function useCreateMedicationOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (order: MedicationOrder) => {
            const medicationRequest = {
                resourceType: 'MedicationRequest',
                status: 'active',
                intent: 'order',
                priority: order.priority || 'routine',
                medicationCodeableConcept: {
                    coding: [{
                        system: 'http://hl7.org/fhir/sid/ndc',
                        code: order.medicationCode,
                        display: order.medicationDisplay,
                    }],
                    text: order.medicationDisplay,
                },
                subject: { reference: `Patient/${order.patientId}` },
                encounter: order.encounterId ? { reference: `Encounter/${order.encounterId}` } : undefined,
                authoredOn: new Date().toISOString(),
                dosageInstruction: [{
                    text: `${order.dosage} ${order.route} ${order.frequency}`,
                    timing: { code: { text: order.frequency } },
                    route: { text: order.route },
                    doseAndRate: [{ doseQuantity: { value: parseFloat(order.dosage) || 1 } }],
                }],
                note: order.notes ? [{ text: order.notes }] : undefined,
            }

            const response = await fetch(`${FHIR_BASE}/MedicationRequest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/fhir+json' },
                body: JSON.stringify(medicationRequest),
            })

            if (!response.ok) {
                throw new Error(`Failed to create medication order: ${response.status}`)
            }

            return response.json()
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['medicationRequests', variables.patientId] })
        },
    })
}

// Update an existing medication order
export function useUpdateMedicationOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, patientId, updates }: { id: string; patientId: string; updates: Partial<any> }) => {
            // Get existing resource
            const getResponse = await fetch(`${FHIR_BASE}/MedicationRequest/${id}`, {
                headers: { 'Content-Type': 'application/fhir+json' },
            })

            if (!getResponse.ok) {
                throw new Error(`Failed to fetch medication: ${getResponse.status}`)
            }

            const existing = await getResponse.json()
            const updated = { ...existing, ...updates }

            const response = await fetch(`${FHIR_BASE}/MedicationRequest/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/fhir+json' },
                body: JSON.stringify(updated),
            })

            if (!response.ok) {
                throw new Error(`Failed to update medication: ${response.status}`)
            }

            return response.json()
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['medicationRequests', variables.patientId] })
        },
    })
}

// Discontinue a medication
export function useDiscontinueMedication() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, patientId }: { id: string; patientId: string }) => {
            const response = await fetch(`${FHIR_BASE}/MedicationRequest/${id}`, {
                headers: { 'Content-Type': 'application/fhir+json' },
            })

            const existing = await response.json()
            existing.status = 'stopped'
            existing.statusReason = { text: 'Discontinued by provider' }

            const updateResponse = await fetch(`${FHIR_BASE}/MedicationRequest/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/fhir+json' },
                body: JSON.stringify(existing),
            })

            if (!updateResponse.ok) {
                throw new Error(`Failed to discontinue medication: ${updateResponse.status}`)
            }

            return updateResponse.json()
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['medicationRequests', variables.patientId] })
        },
    })
}

// Create a lab order (ServiceRequest)
export function useCreateLabOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (order: LabOrder) => {
            const serviceRequest = {
                resourceType: 'ServiceRequest',
                status: 'active',
                intent: 'order',
                priority: order.priority || 'routine',
                category: [{
                    coding: [{ system: 'http://snomed.info/sct', code: '108252007', display: 'Laboratory procedure' }],
                    text: 'Laboratory',
                }],
                code: {
                    coding: [{
                        system: 'http://loinc.org',
                        code: order.loincCode,
                        display: order.loincDisplay,
                    }],
                    text: order.loincDisplay,
                },
                subject: { reference: `Patient/${order.patientId}` },
                encounter: order.encounterId ? { reference: `Encounter/${order.encounterId}` } : undefined,
                authoredOn: new Date().toISOString(),
                requester: { display: 'Current User' }, // Should be actual practitioner
                note: order.notes ? [{ text: order.notes }] : undefined,
            }

            const response = await fetch(`${FHIR_BASE}/ServiceRequest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/fhir+json' },
                body: JSON.stringify(serviceRequest),
            })

            if (!response.ok) {
                throw new Error(`Failed to create lab order: ${response.status}`)
            }

            return response.json()
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['orders', variables.patientId] })
        },
    })
}
