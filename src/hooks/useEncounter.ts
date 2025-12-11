/**
 * useEncounter Hook
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { Encounter } from '@medplum/fhirtypes'

const FHIR_BASE = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103/fhir/R4'

async function fetchEncounter(encounterId: string): Promise<Encounter> {
  const response = await fetch(`${FHIR_BASE}/Encounter/${encounterId}`, {
    headers: { 'Content-Type': 'application/fhir+json' },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch encounter: ${response.status}`)
  }
  return response.json()
}

export function useEncounter(encounterId: string | undefined) {
  return useQuery({
    queryKey: ['encounter', encounterId],
    queryFn: () => fetchEncounter(encounterId!),
    enabled: !!encounterId,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePatientEncounters(patientId: string | undefined) {
  return useQuery({
    queryKey: ['encounters', 'patient', patientId],
    queryFn: async () => {
      const response = await fetch(
        `${FHIR_BASE}/Encounter?patient=${patientId}&_sort=-date&_count=50`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch encounters: ${response.status}`)
      }
      const bundle = await response.json()
      return (bundle.entry || []).map((e: any) => e.resource as Encounter)
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useActiveEncounter(patientId: string | undefined) {
  return useQuery({
    queryKey: ['encounter', 'active', patientId],
    queryFn: async () => {
      const response = await fetch(
        `${FHIR_BASE}/Encounter?patient=${patientId}&status=in-progress&class=IMP&_count=1`,
        { headers: { 'Content-Type': 'application/fhir+json' } }
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch active encounter: ${response.status}`)
      }
      const bundle = await response.json()
      const encounters = (bundle.entry || []).map((e: any) => e.resource as Encounter)
      return encounters[0] || null
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  })
}
