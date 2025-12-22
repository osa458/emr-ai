/**
 * useCareGaps Hook
 * 
 * Fetches care gaps (screenings, immunizations, chronic care) for a patient
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { CareGapsResult, CareGap } from '@/lib/cds/care-gaps'

export interface CareGapsResponse extends CareGapsResult {
    success: boolean
}

export function useCareGaps(patientId: string | undefined, options?: { enabled?: boolean }) {
    return useQuery<CareGapsResponse>({
        queryKey: ['care-gaps', patientId],
        queryFn: async () => {
            const response = await fetch(`/api/cds/care-gaps?patientId=${patientId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch care gaps')
            }
            return response.json()
        },
        enabled: !!patientId && (options?.enabled !== false),
        staleTime: 10 * 60 * 1000, // Cache for 10 minutes
        refetchOnWindowFocus: false,
    })
}

// Re-export types for convenience
export type { CareGapsResult, CareGap }
