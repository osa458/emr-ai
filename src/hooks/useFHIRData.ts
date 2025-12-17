/**
 * useFHIRData Hooks
 * Fetches clinical data (labs, vitals, medications, imaging) from FHIR/Aidbox
 * Uses /api/fhir/proxy to handle authentication
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
  ServiceRequest,
  Encounter,
  CareTeam
} from '@medplum/fhirtypes'

// Helper to fetch through the authenticated proxy
async function fhirFetch(path: string) {
  const response = await fetch(`/api/fhir/proxy?path=${encodeURIComponent(path)}`)
  if (!response.ok) {
    throw new Error(`FHIR request failed: ${response.status}`)
  }
  return response.json()
}

// === Labs Hook ===
export function usePatientLabs(patientId: string | undefined, count = 100) {
  return useQuery({
    queryKey: ['labs', patientId, count],
    queryFn: async (): Promise<Observation[]> => {
      const bundle = await fhirFetch(
        `/Observation?subject=Patient/${patientId}&category=laboratory&_sort=-date&_count=${count}`
      )
      return (bundle.entry || []).map((e: any) => e.resource as Observation)
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  })
}

// === Vitals Hook ===
export function usePatientVitals(patientId: string | undefined, count = 50) {
  return useQuery({
    queryKey: ['vitals', patientId, count],
    queryFn: async (): Promise<Observation[]> => {
      const bundle = await fhirFetch(
        `/Observation?subject=Patient/${patientId}&category=vital-signs&_sort=-date&_count=${count}`
      )
      return (bundle.entry || []).map((e: any) => e.resource as Observation)
    },
    enabled: !!patientId,
    staleTime: 1 * 60 * 1000,
  })
}

// === Medications Hooks ===
export function usePatientMedicationRequests(patientId: string | undefined) {
  return useQuery({
    queryKey: ['medicationRequests', patientId],
    queryFn: async (): Promise<MedicationRequest[]> => {
      const bundle = await fhirFetch(
        `/MedicationRequest?subject=Patient/${patientId}&status=active&_sort=-authoredon`
      )
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
      const bundle = await fhirFetch(
        `/MedicationStatement?subject=Patient/${patientId}&status=active`
      )
      const meds = (bundle.entry || []).map((e: any) => e.resource as MedicationStatement)
      return meds.filter((m: MedicationStatement) =>
        m.category?.coding?.some((c: any) => c.code === 'community') || true
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
      const bundle = await fhirFetch(
        `/DiagnosticReport?subject=Patient/${patientId}&_sort=-date&_count=${count}`
      )
      const reports = (bundle.entry || []).map((e: any) => e.resource as DiagnosticReport)
      return reports.filter((r: DiagnosticReport) => {
        const isRad = r.category?.some((c: any) =>
          c.coding?.some((cod: any) => cod.code === 'RAD' || cod.code === 'imaging')
        )
        const name = r.code?.text?.toLowerCase() || r.code?.coding?.[0]?.display?.toLowerCase() || ''
        const isImagingName = name.includes('x-ray') || name.includes('ct') ||
          name.includes('mri') || name.includes('ultrasound') ||
          name.includes('echo') || name.includes('scan')
        return isRad || isImagingName || reports.length <= 10
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
      const bundle = await fhirFetch(
        `/Condition?subject=Patient/${patientId}&clinical-status=active`
      )
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
      const bundle = await fhirFetch(
        `/Appointment?actor=Patient/${patientId}&status=proposed,pending,booked&_sort=date`
      )
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
      const bundle = await fhirFetch(
        `/Appointment?status=proposed,pending,booked,arrived&_sort=date&_count=100`
      )
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
      const bundle = await fhirFetch(
        `/Procedure?subject=Patient/${patientId}&_sort=-date&_count=50`
      )
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
      const bundle = await fhirFetch(
        `/Task?subject=Patient/${patientId}&status=requested,in-progress,ready&_sort=-authored-on`
      )
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
      const bundle = await fhirFetch(
        `/CarePlan?subject=Patient/${patientId}&status=active`
      )
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
      const bundle = await fhirFetch(
        `/Coverage?beneficiary=Patient/${patientId}&status=active`
      )
      return (bundle.entry || []).map((e: any) => e.resource as Coverage)
    },
    enabled: !!patientId,
    staleTime: 10 * 60 * 1000,
  })
}

// === Service Requests (Orders) Hook ===
export function usePatientOrders(patientId: string | undefined) {
  return useQuery({
    queryKey: ['orders', patientId],
    queryFn: async (): Promise<ServiceRequest[]> => {
      // Aidbox requires dot notation for reference searches
      const bundle = await fhirFetch(
        `/ServiceRequest?.subject.id=${patientId}&status=active,completed&_sort=-authored`
      )
      // Fallback: if no results, try fetching all and filter client-side
      const entries = bundle.entry || []
      if (entries.length === 0) {
        const allBundle = await fhirFetch(`/ServiceRequest?status=active&_count=100`)
        const allEntries = allBundle.entry || []
        return allEntries
          .map((e: any) => e.resource as ServiceRequest)
          .filter((sr: ServiceRequest) => {
            const ref = sr.subject?.reference || ''
            return ref.includes(patientId || '')
          })
      }
      return entries.map((e: any) => e.resource as ServiceRequest)
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  })
}

// === Encounters Hooks ===
// Note: usePatientEncounters is in useEncounter.ts to avoid duplicate exports

// All encounters (for encounters list page)
export function useAllEncounters(params?: { status?: string; _count?: number }) {
  const status = params?.status
  const count = params?._count || 50
  
  return useQuery({
    queryKey: ['encounters', 'all', status, count],
    queryFn: async (): Promise<{ encounters: Encounter[]; total: number }> => {
      const searchParams = new URLSearchParams()
      searchParams.set('_count', String(count))
      searchParams.set('_sort', '-date')
      if (status && status !== 'all') searchParams.set('status', status)
      
      const response = await fetch(
        `/api/encounters?${searchParams.toString()}`
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch encounters: ${response.status}`)
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch encounters')
      }
      return { encounters: result.data, total: result.total }
    },
    staleTime: 1 * 60 * 1000,
  })
}

// === CareTeam Hook ===
export function usePatientCareTeam(patientId: string | undefined) {
  return useQuery({
    queryKey: ['careTeam', patientId],
    queryFn: async (): Promise<CareTeam[]> => {
      const bundle = await fhirFetch(
        `/CareTeam?patient=${patientId}&status=active`
      )
      return (bundle.entry || []).map((e: any) => e.resource as CareTeam)
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

// === Allergies Hook ===
export function usePatientAllergies(patientId: string | undefined) {
  return useQuery({
    queryKey: ['allergies', patientId],
    queryFn: async () => {
      const response = await fetch(`/api/allergy-intolerances?patient=${patientId}&clinical-status=active`)
      if (!response.ok) {
        throw new Error(`Failed to fetch allergies: ${response.status}`)
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch allergies')
      }
      return result.data || []
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

// === Practitioners Hook ===
export function useAllPractitioners(params?: { name?: string; _count?: number }) {
  const name = params?.name
  const count = params?._count || 100
  
  return useQuery({
    queryKey: ['practitioners', 'all', name, count],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set('_count', String(count))
      if (name) searchParams.set('name', name)
      
      const response = await fetch(`/api/practitioners?${searchParams.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch practitioners: ${response.status}`)
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch practitioners')
      }
      return { practitioners: result.data, total: result.total }
    },
    staleTime: 5 * 60 * 1000,
  })
}
