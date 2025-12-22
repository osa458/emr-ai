/**
 * useMedicationSearch Hook
 * 
 * React hook for searching medications with debouncing
 */

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'

export interface MedicationSearchResult {
    id: string
    ndc: string
    name: string
    manufacturer?: string
    form?: string
    ingredients?: { name: string; strength: string }[]
    rxnorm?: string
}

interface SearchResponse {
    success: boolean
    count: number
    total: number
    medications: MedicationSearchResult[]
    error?: string
}

async function searchMedications(query: string): Promise<SearchResponse> {
    if (!query || query.length < 2) {
        return { success: true, count: 0, total: 0, medications: [] }
    }

    const response = await fetch(`/api/medications/search?q=${encodeURIComponent(query)}&limit=20`)
    const data = await response.json()

    if (!data.success) {
        throw new Error(data.error || 'Search failed')
    }

    return data
}

export function useMedicationSearch(initialQuery: string = '') {
    const [query, setQuery] = useState(initialQuery)
    const debouncedQuery = useDebounce(query, 300)

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['medication-search', debouncedQuery],
        queryFn: () => searchMedications(debouncedQuery),
        enabled: debouncedQuery.length >= 2,
        staleTime: 30 * 1000, // 30 seconds
    })

    return {
        query,
        setQuery,
        medications: data?.medications || [],
        count: data?.count || 0,
        total: data?.total || 0,
        isLoading,
        error: error as Error | null,
        refetch,
    }
}

/**
 * Order medication for a patient
 */
export interface OrderMedicationParams {
    patientId: string
    medicationId: string
    medicationName: string
    dosage: string
    frequency: string
    route?: string
    quantity?: number
    refills?: number
    instructions?: string
    encounterId?: string
    practitionerId?: string
}

export async function orderMedication(params: OrderMedicationParams): Promise<{ success: boolean; medicationRequestId?: string; error?: string }> {
    const response = await fetch('/api/medications/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    })

    return response.json()
}
