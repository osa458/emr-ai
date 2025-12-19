/**
 * usePatient Hook
 * Fetches patient data with React Query
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { Patient } from '@medplum/fhirtypes'

const FHIR_BASE = process.env.NEXT_PUBLIC_AIDBOX_BASE_URL ||
  process.env.NEXT_PUBLIC_FHIR_BASE_URL ||
  'https://aoadhslfxc.edge.aidbox.app'

async function fetchPatient(patientId: string): Promise<Patient> {
  const response = await fetch(`/api/fhir/patients?id=${patientId}`)
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch patient')
  }
  return data.data as Patient
}

export function usePatient(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => fetchPatient(patientId!),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function usePatients(options: { name?: string; _count?: number; page?: number } = {}) {
  return useQuery({
    queryKey: ['patients', options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options.name) params.append('name', options.name)
      if (options._count) params.append('_count', options._count.toString())
      if (options.page) params.append('page', options.page.toString())

      const query = params.toString()
      const url = query ? `/api/fhir/patients?${query}` : '/api/fhir/patients'

      const response = await fetch(url)
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch patients')
      }
      return { patients: data.data as Patient[], total: data.total as number }
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useActiveInpatients() {
  return useQuery({
    queryKey: ['inpatients', 'active'],
    queryFn: async () => {
      const path = `/Encounter?status=in-progress&class=IMP&_include=Encounter:patient&_count=100`
      const response = await fetch(`/api/fhir/proxy?path=${encodeURIComponent(path)}`)
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
