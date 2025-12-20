/**
 * useOrderSuggestions - Hook to fetch AI-powered order suggestions
 * 
 * Analyzes patient conditions, labs, vitals, and medications to suggest
 * clinically appropriate orders.
 */

import { useQuery } from '@tanstack/react-query'

export interface OrderSuggestion {
    id: string
    name: string
    category: 'Labs' | 'Imaging' | 'Medications' | 'Consults' | 'Procedures'
    priority: 'routine' | 'urgent' | 'stat'
    reason: string
    evidence: string[]
    aiConfidence: number
}

interface OrderSuggestionsResponse {
    suggestions: OrderSuggestion[]
    patientId: string
    dataUsed: {
        conditions: number
        labs: number
        vitals: number
        medications: number
    }
}

async function fetchOrderSuggestions(patientId: string): Promise<OrderSuggestionsResponse> {
    const res = await fetch('/api/ai/order-suggestions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientId }),
    })

    if (!res.ok) {
        throw new Error('Failed to fetch order suggestions')
    }

    return res.json()
}

/**
 * Hook to fetch AI-powered order suggestions for a patient
 */
export function useOrderSuggestions(patientId: string | undefined) {
    return useQuery({
        queryKey: ['ai', 'order-suggestions', patientId],
        queryFn: () => fetchOrderSuggestions(patientId!),
        enabled: !!patientId,
        staleTime: 2 * 60 * 1000, // Cache for 2 minutes
        refetchOnWindowFocus: false,
    })
}
