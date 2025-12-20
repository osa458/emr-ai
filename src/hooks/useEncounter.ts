/**
 * useEncounter Hook
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { Encounter } from '@medplum/fhirtypes'

// Helper to fetch through the authenticated proxy
async function fhirFetch(path: string) {
  const response = await fetch(`/api/fhir/proxy?path=${encodeURIComponent(path)}`)
  if (!response.ok) {
    throw new Error(`FHIR request failed: ${response.status}`)
  }
  return response.json()
}

export function useEncounter(encounterId: string | undefined) {
  return useQuery({
    queryKey: ['encounter', encounterId],
    queryFn: async (): Promise<Encounter> => {
      const encounter = await fhirFetch(`Encounter/${encounterId}`)
      return encounter as Encounter
    },
    enabled: !!encounterId,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePatientEncounters(patientId: string | undefined) {
  return useQuery({
    queryKey: ['encounters', 'patient', patientId],
    queryFn: async (): Promise<Encounter[]> => {
      const bundle = await fhirFetch(
        `Encounter?patient=${patientId}&_sort=-date&_count=50`
      )
      return (bundle.entry || []).map((e: any) => e.resource as Encounter)
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useActiveEncounter(patientId: string | undefined) {
  return useQuery({
    queryKey: ['encounter', 'active', patientId],
    queryFn: async (): Promise<Encounter | null> => {
      const bundle = await fhirFetch(
        `Encounter?patient=${patientId}&status=in-progress&class=IMP&_count=1`
      )
      const encounters = (bundle.entry || []).map((e: any) => e.resource as Encounter)
      return encounters[0] || null
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  })
}
