/**
 * useEncounterTimeline Hook
 * 
 * Aggregates FHIR resources into a chronological timeline of clinical events.
 * Replaces the mock data in EncounterTimeline component.
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { Observation, Procedure, MedicationAdministration, DocumentReference, ServiceRequest } from '@medplum/fhirtypes'

export interface TimelineEvent {
    id: string
    type: 'note' | 'order' | 'lab' | 'vital' | 'medication' | 'procedure' | 'consult' | 'alert'
    title: string
    description?: string
    timestamp: Date
    author?: string
    status?: 'completed' | 'pending' | 'cancelled'
    priority?: 'routine' | 'urgent' | 'stat'
    details?: Record<string, string | number>
    resourceType?: string
    resourceId?: string
}

// Helper to fetch through the authenticated proxy
async function fhirFetch(path: string) {
    const response = await fetch(`/api/fhir/proxy?path=${encodeURIComponent(path)}`)
    if (!response.ok) {
        throw new Error(`FHIR fetch failed: ${response.statusText}`)
    }
    return response.json()
}

// Transform FHIR Observation (vital) to timeline event
function vitalToEvent(obs: Observation): TimelineEvent {
    const name = obs.code?.text || obs.code?.coding?.[0]?.display || 'Vital Sign'
    const value = obs.valueQuantity?.value
    const unit = obs.valueQuantity?.unit || ''

    return {
        id: `vital-${obs.id}`,
        type: 'vital',
        title: 'Vital Signs Recorded',
        description: value ? `${name}: ${value} ${unit}` : name,
        timestamp: new Date(obs.effectiveDateTime || obs.effectivePeriod?.start || Date.now()),
        author: obs.performer?.[0]?.display || 'Clinical Staff',
        status: 'completed',
        resourceType: 'Observation',
        resourceId: obs.id,
    }
}

// Transform FHIR Observation (lab) to timeline event
function labToEvent(obs: Observation): TimelineEvent {
    const name = obs.code?.text || obs.code?.coding?.[0]?.display || 'Lab Result'
    const value = obs.valueQuantity?.value
    const unit = obs.valueQuantity?.unit || ''
    const interp = obs.interpretation?.[0]?.coding?.[0]?.code

    let priority: TimelineEvent['priority'] = 'routine'
    if (interp === 'HH' || interp === 'LL' || interp === 'A') {
        priority = 'stat'
    } else if (interp === 'H' || interp === 'L') {
        priority = 'urgent'
    }

    return {
        id: `lab-${obs.id}`,
        type: interp === 'HH' || interp === 'LL' ? 'alert' : 'lab',
        title: priority === 'stat' ? 'Critical Lab Value' : 'Lab Results',
        description: value ? `${name}: ${value} ${unit}${interp ? ` (${interp})` : ''}` : name,
        timestamp: new Date(obs.effectiveDateTime || obs.effectivePeriod?.start || Date.now()),
        status: 'completed',
        priority,
        resourceType: 'Observation',
        resourceId: obs.id,
        details: value ? { [name]: `${value} ${unit}` } : undefined,
    }
}

// Transform FHIR Procedure to timeline event
function procedureToEvent(proc: Procedure): TimelineEvent {
    const name = proc.code?.text || proc.code?.coding?.[0]?.display || 'Procedure'

    return {
        id: `proc-${proc.id}`,
        type: 'procedure',
        title: name,
        description: proc.note?.[0]?.text || undefined,
        timestamp: new Date(
            proc.performedDateTime ||
            proc.performedPeriod?.start ||
            Date.now()
        ),
        author: proc.performer?.[0]?.actor?.display || 'Clinical Staff',
        status: proc.status === 'completed' ? 'completed' :
            proc.status === 'not-done' ? 'cancelled' : 'pending',
        resourceType: 'Procedure',
        resourceId: proc.id,
    }
}

// Transform FHIR MedicationAdministration to timeline event
function medAdminToEvent(admin: MedicationAdministration): TimelineEvent {
    const medName = admin.medicationCodeableConcept?.text ||
        admin.medicationCodeableConcept?.coding?.[0]?.display ||
        'Medication'
    const dose = admin.dosage?.dose?.value
    const unit = admin.dosage?.dose?.unit || ''

    return {
        id: `med-${admin.id}`,
        type: 'medication',
        title: 'Medication Administered',
        description: dose ? `${medName} ${dose}${unit} given` : `${medName} given`,
        timestamp: new Date(
            admin.effectiveDateTime ||
            admin.effectivePeriod?.start ||
            Date.now()
        ),
        author: admin.performer?.[0]?.actor?.display || 'Nursing Staff',
        status: admin.status === 'completed' ? 'completed' :
            admin.status === 'stopped' || admin.status === 'not-done' ? 'cancelled' : 'pending',
        resourceType: 'MedicationAdministration',
        resourceId: admin.id,
    }
}

// Transform FHIR ServiceRequest to timeline event
function orderToEvent(order: ServiceRequest): TimelineEvent {
    const name = order.code?.text || order.code?.coding?.[0]?.display || 'Order'
    const category = order.category?.[0]?.text || order.category?.[0]?.coding?.[0]?.display || ''

    let type: TimelineEvent['type'] = 'order'
    if (category.toLowerCase().includes('consult')) {
        type = 'consult'
    }

    return {
        id: `order-${order.id}`,
        type,
        title: type === 'consult' ? `${name} Consult` : `New Order: ${name}`,
        description: order.note?.[0]?.text || undefined,
        timestamp: new Date(order.authoredOn || Date.now()),
        author: order.requester?.display || 'Provider',
        status: order.status === 'completed' ? 'completed' :
            order.status === 'revoked' || order.status === 'cancelled' ? 'cancelled' : 'pending',
        priority: order.priority === 'stat' ? 'stat' :
            order.priority === 'urgent' ? 'urgent' : 'routine',
        resourceType: 'ServiceRequest',
        resourceId: order.id,
    }
}

// Transform FHIR DocumentReference to timeline event
function noteToEvent(doc: DocumentReference): TimelineEvent {
    const title = doc.type?.text || doc.type?.coding?.[0]?.display || 'Clinical Note'
    const category = doc.category?.[0]?.text || doc.category?.[0]?.coding?.[0]?.display || ''

    return {
        id: `note-${doc.id}`,
        type: 'note',
        title,
        description: doc.description || category,
        timestamp: new Date(doc.date || doc.content?.[0]?.attachment?.creation || Date.now()),
        author: doc.author?.[0]?.display || 'Provider',
        status: doc.status === 'current' ? 'completed' : 'pending',
        resourceType: 'DocumentReference',
        resourceId: doc.id,
    }
}

export function useEncounterTimeline(
    patientId: string | undefined,
    encounterId?: string,
    options?: { limit?: number }
) {
    const limit = options?.limit || 50

    return useQuery<TimelineEvent[]>({
        queryKey: ['encounter-timeline', patientId, encounterId, limit],
        queryFn: async () => {
            if (!patientId) return []

            // Build query strings
            const encounterFilter = encounterId ? `&encounter=${encounterId}` : ''

            // Fetch all relevant FHIR resources in parallel
            const [vitalsBundle, labsBundle, medsBundle, procsBundle, ordersBundle, notesBundle] = await Promise.all([
                fhirFetch(`/Observation?patient=${patientId}&category=vital-signs&_sort=-date&_count=${limit}${encounterFilter}`),
                fhirFetch(`/Observation?patient=${patientId}&category=laboratory&_sort=-date&_count=${limit}${encounterFilter}`),
                fhirFetch(`/MedicationAdministration?patient=${patientId}&_sort=-effective-time&_count=${limit}${encounterFilter}`),
                fhirFetch(`/Procedure?patient=${patientId}&_sort=-date&_count=${limit}${encounterFilter}`),
                fhirFetch(`/ServiceRequest?patient=${patientId}&_sort=-authored&_count=${limit}${encounterFilter}`),
                fhirFetch(`/DocumentReference?patient=${patientId}&_sort=-date&_count=${limit}${encounterFilter}`),
            ])

            // Transform each resource type to timeline events
            const events: TimelineEvent[] = []

            // Add vitals (grouped by timestamp to avoid flooding)
            const vitals = (vitalsBundle.entry || []).map((e: any) => e.resource as Observation)
            const vitalsByTime: Record<string, Observation[]> = {}
            vitals.forEach((v: Observation) => {
                const time = v.effectiveDateTime || v.effectivePeriod?.start || ''
                const key = time.substring(0, 16) // Group by minute
                if (!vitalsByTime[key]) vitalsByTime[key] = []
                vitalsByTime[key].push(v)
            })

            // Create one event per time group for vitals
            Object.entries(vitalsByTime).slice(0, 10).forEach(([, group]) => {
                const firstVital = group[0]
                const descriptions = group.map(v => {
                    const name = v.code?.coding?.[0]?.code || v.code?.text || 'Vital'
                    const value = v.valueQuantity?.value
                    const unit = v.valueQuantity?.unit || ''
                    return value ? `${name}: ${value}${unit}` : null
                }).filter(Boolean)

                events.push({
                    id: `vitals-${firstVital.id}`,
                    type: 'vital',
                    title: 'Vital Signs Recorded',
                    description: descriptions.join(', '),
                    timestamp: new Date(firstVital.effectiveDateTime || firstVital.effectivePeriod?.start || Date.now()),
                    author: firstVital.performer?.[0]?.display || 'Clinical Staff',
                    status: 'completed',
                    details: group.reduce((acc, v) => {
                        const name = v.code?.coding?.[0]?.code || v.code?.text || 'Vital'
                        const value = v.valueQuantity?.value
                        const unit = v.valueQuantity?.unit || ''
                        if (value) acc[name] = `${value}${unit}`
                        return acc
                    }, {} as Record<string, string>),
                })
            })

            // Add labs (show critical ones prominently)
            const labs = (labsBundle.entry || []).map((e: any) => e.resource as Observation)
            labs.slice(0, 15).forEach((lab: Observation) => {
                events.push(labToEvent(lab))
            })

            // Add medication administrations
            const meds = (medsBundle.entry || []).map((e: any) => e.resource as MedicationAdministration)
            meds.slice(0, 15).forEach((med: MedicationAdministration) => {
                events.push(medAdminToEvent(med))
            })

            // Add procedures
            const procs = (procsBundle.entry || []).map((e: any) => e.resource as Procedure)
            procs.slice(0, 10).forEach((proc: Procedure) => {
                events.push(procedureToEvent(proc))
            })

            // Add orders
            const orders = (ordersBundle.entry || []).map((e: any) => e.resource as ServiceRequest)
            orders.slice(0, 15).forEach((order: ServiceRequest) => {
                events.push(orderToEvent(order))
            })

            // Add notes
            const notes = (notesBundle.entry || []).map((e: any) => e.resource as DocumentReference)
            notes.slice(0, 10).forEach((note: DocumentReference) => {
                events.push(noteToEvent(note))
            })

            // Sort all events by timestamp (most recent first)
            events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

            return events.slice(0, limit)
        },
        enabled: !!patientId,
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
        refetchOnWindowFocus: false,
    })
}
