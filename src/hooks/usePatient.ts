/**
 * usePatient Hook
 * Fetches patient data with React Query
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { Patient } from '@medplum/fhirtypes'

const FHIR_BASE = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103/fhir/R4'

async function fetchPatient(patientId: string): Promise<Patient> {
  const response = await fetch(`${FHIR_BASE}/Patient/${patientId}`, {
    headers: { 'Content-Type': 'application/fhir+json' },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch patient: ${response.status}`)
  }
  return response.json()
}

export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => fetchPatient(patientId!),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePatients(options: { name?: string; _count?: number } = {}) {
  return useQuery({
    queryKey: ['patients', options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options.name) params.append('name', options.name)
      if (options._count) params.append('_count', options._count.toString())
      
      const query = params.toString()
      const url = query ? `${FHIR_BASE}/Patient?${query}` : `${FHIR_BASE}/Patient`
      
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/fhir+json' },
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as Patient)
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useActiveInpatients() {
  return useQuery({
    queryKey: ['inpatients', 'active'],
    queryFn: async () => {
      const response = await fetch(
        `${FHIR_BASE}/Encounter?status=in-progress&class=IMP&_include=Encounter:patient&_count=100`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch inpatients: ${response.status}`)
      }
      const bundle = await response.json()
      const patients: Patient[] = []
      for (const entry of bundle.entry || []) {
        if (entry.resource?.resourceType === 'Patient') {
          patients.push(entry.resource)
        }
      }
      return patients
    },
    staleTime: 2 * 60 * 1000,
  })
}
