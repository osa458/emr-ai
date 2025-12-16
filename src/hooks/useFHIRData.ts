/**
 * useFHIRData Hooks
 * Fetches clinical data (labs, vitals, medications, imaging) from FHIR/Aidbox
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type {
  Observation,
  MedicationRequest,
  MedicationStatement,
  DiagnosticReport,
  Condition,
  Appointment,
  Procedure,
  Task,
  CarePlan,
  Coverage,
  ServiceRequest
} from '@medplum/fhirtypes'

const FHIR_BASE = process.env.NEXT_PUBLIC_AIDBOX_BASE_URL ||
  process.env.NEXT_PUBLIC_FHIR_BASE_URL ||
  'https://aoadhslfxc.edge.aidbox.app'

// === Labs Hook ===
export function usePatientLabs(patientId: string | undefined, count = 100) {
  return useQuery({
    queryKey: ['labs', patientId, count],
    queryFn: async (): Promise<Observation[]> => {
      const response = await fetch(
        `${FHIR_BASE}/Observation?patient=${patientId}&category=laboratory&_sort=-date&_count=${count}`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch labs: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as Observation)
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// === Vitals Hook ===
export function usePatientVitals(patientId: string | undefined, count = 50) {
  return useQuery({
    queryKey: ['vitals', patientId, count],
    queryFn: async (): Promise<Observation[]> => {
      const response = await fetch(
        `${FHIR_BASE}/Observation?patient=${patientId}&category=vital-signs&_sort=-date&_count=${count}`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch vitals: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as Observation)
    },
    enabled: !!patientId,
    staleTime: 1 * 60 * 1000, // 1 minute (vitals update more frequently)
  })
}

// === Medications Hooks ===
export function usePatientMedicationRequests(patientId: string | undefined) {
  return useQuery({
    queryKey: ['medicationRequests', patientId],
    queryFn: async (): Promise<MedicationRequest[]> => {
      const response = await fetch(
        `${FHIR_BASE}/MedicationRequest?patient=${patientId}&status=active&_sort=-authoredon`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch medication requests: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as MedicationRequest)
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePatientMedicationStatements(patientId: string | undefined) {
  return useQuery({
    queryKey: ['medicationStatements', patientId],
    queryFn: async (): Promise<MedicationStatement[]> => {
      const response = await fetch(
        `${FHIR_BASE}/MedicationStatement?patient=${patientId}&status=active`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch medication statements: ${response.status}`)
      }
      const bundle = await response.json()
      // Filter for community/home medications
      const meds = (bundle.entry || []).map((e: any) => e.resource as MedicationStatement)
      return meds.filter((m: MedicationStatement) =>
        m.category?.coding?.some((c: any) => c.code === 'community') || true // Include all if no category
      )
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

// Combined medications hook for convenience
export function usePatientMedications(patientId: string | undefined) {
  const inpatient = usePatientMedicationRequests(patientId)
  const home = usePatientMedicationStatements(patientId)

  return {
    inpatientMedications: inpatient.data || [],
    homeMedications: home.data || [],
    isLoading: inpatient.isLoading || home.isLoading,
    isError: inpatient.isError || home.isError,
    error: inpatient.error || home.error,
  }
}

// === Imaging Hook ===
export function usePatientImaging(patientId: string | undefined, count = 50) {
  return useQuery({
    queryKey: ['imaging', patientId, count],
    queryFn: async (): Promise<DiagnosticReport[]> => {
      // Try with category=RAD first, fallback to all diagnostic reports
      const response = await fetch(
        `${FHIR_BASE}/DiagnosticReport?patient=${patientId}&_sort=-date&_count=${count}`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch imaging: ${response.status}`)
      }
      const bundle = await response.json()
      const reports = (bundle.entry || []).map((e: any) => e.resource as DiagnosticReport)
      // Filter for imaging-related reports (RAD category or common imaging codes)
      return reports.filter((r: DiagnosticReport) => {
        const isRad = r.category?.some((c: any) =>
          c.coding?.some((cod: any) => cod.code === 'RAD' || cod.code === 'imaging')
        )
        const name = r.code?.text?.toLowerCase() || r.code?.coding?.[0]?.display?.toLowerCase() || ''
        const isImagingName = name.includes('x-ray') || name.includes('ct') ||
          name.includes('mri') || name.includes('ultrasound') ||
          name.includes('echo') || name.includes('scan')
        return isRad || isImagingName || reports.length <= 10 // If few results, show all
      })
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

// === Conditions Hook ===
export function usePatientConditions(patientId: string | undefined) {
  return useQuery({
    queryKey: ['conditions', patientId],
    queryFn: async (): Promise<Condition[]> => {
      const response = await fetch(
        `${FHIR_BASE}/Condition?patient=${patientId}&clinical-status=active`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch conditions: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as Condition)
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

// === Appointments Hook ===
export function usePatientAppointments(patientId: string | undefined) {
  return useQuery({
    queryKey: ['appointments', patientId],
    queryFn: async (): Promise<Appointment[]> => {
      const response = await fetch(
        `${FHIR_BASE}/Appointment?patient=${patientId}&status=proposed,pending,booked&_sort=date`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as Appointment)
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  })
}

// All appointments (for scheduling page)
export function useAllAppointments() {
  return useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: async (): Promise<Appointment[]> => {
      const response = await fetch(
        `${FHIR_BASE}/Appointment?status=proposed,pending,booked,arrived&_sort=date&_count=100`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as Appointment)
    },
    staleTime: 1 * 60 * 1000,
  })
}

// === Procedures Hook ===
export function usePatientProcedures(patientId: string | undefined) {
  return useQuery({
    queryKey: ['procedures', patientId],
    queryFn: async (): Promise<Procedure[]> => {
      const response = await fetch(
        `${FHIR_BASE}/Procedure?patient=${patientId}&_sort=-date&_count=50`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch procedures: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as Procedure)
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

// === Tasks Hook ===
export function usePatientTasks(patientId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', patientId],
    queryFn: async (): Promise<Task[]> => {
      const response = await fetch(
        `${FHIR_BASE}/Task?patient=${patientId}&status=requested,in-progress,ready&_sort=-authored-on`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as Task)
    },
    enabled: !!patientId,
    staleTime: 1 * 60 * 1000,
  })
}

// === CarePlans Hook ===
export function usePatientCarePlans(patientId: string | undefined) {
  return useQuery({
    queryKey: ['carePlans', patientId],
    queryFn: async (): Promise<CarePlan[]> => {
      const response = await fetch(
        `${FHIR_BASE}/CarePlan?patient=${patientId}&status=active`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch care plans: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as CarePlan)
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

// === Coverage (Insurance) Hook ===
export function usePatientCoverage(patientId: string | undefined) {
  return useQuery({
    queryKey: ['coverage', patientId],
    queryFn: async (): Promise<Coverage[]> => {
      const response = await fetch(
        `${FHIR_BASE}/Coverage?patient=${patientId}&status=active`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch coverage: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as Coverage)
    },
    enabled: !!patientId,
    staleTime: 10 * 60 * 1000, // Insurance changes infrequently
  })
}

// === Service Requests (Orders) Hook ===
export function usePatientOrders(patientId: string | undefined) {
  return useQuery({
    queryKey: ['orders', patientId],
    queryFn: async (): Promise<ServiceRequest[]> => {
      const response = await fetch(
        `${FHIR_BASE}/ServiceRequest?patient=${patientId}&status=active,completed&_sort=-authored`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as ServiceRequest)
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  })
}
