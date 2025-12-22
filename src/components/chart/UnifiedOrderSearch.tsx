'use client'

/**
 * UnifiedOrderSearch Component
 * 
 * Single search bar that searches ALL order types (meds, labs, imaging, procedures)
 * Results are grouped by category with visual distinction
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useQuery } from '@tanstack/react-query'
import {
    Search,
    Pill,
    FlaskConical,
    ImageIcon,
    Syringe,
    Stethoscope,
    Loader2,
    Plus,
    X,
    Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface UnifiedOrderResult {
    id: string
    name: string
    category: 'Medications' | 'Labs' | 'Imaging' | 'Procedures' | 'Consults'
    code?: string
    system?: string
    specialty?: string
    details?: string
}

interface GroupedResults {
    Medications: UnifiedOrderResult[]
    Labs: UnifiedOrderResult[]
    Imaging: UnifiedOrderResult[]
    Procedures: UnifiedOrderResult[]
    Consults: UnifiedOrderResult[]
}

interface UnifiedOrderSearchProps {
    patientId: string
    onOrderSelect: (order: UnifiedOrderResult) => void
    placeholder?: string
    className?: string
}

const categoryConfig = {
    Medications: { icon: Pill, color: 'bg-green-100 text-green-700 border-green-300' },
    Labs: { icon: FlaskConical, color: 'bg-blue-100 text-blue-700 border-blue-300' },
    Imaging: { icon: ImageIcon, color: 'bg-purple-100 text-purple-700 border-purple-300' },
    Procedures: { icon: Syringe, color: 'bg-orange-100 text-orange-700 border-orange-300' },
    Consults: { icon: Stethoscope, color: 'bg-pink-100 text-pink-700 border-pink-300' },
}

async function searchOrders(query: string): Promise<{ results: GroupedResults; totalCount: number }> {
    if (!query || query.length < 2) {
        return { results: { Medications: [], Labs: [], Imaging: [], Procedures: [], Consults: [] }, totalCount: 0 }
    }

    const res = await fetch(`/api/orders/unified-search?q=${encodeURIComponent(query)}&limit=10`)
    const data = await res.json()

    return {
        results: data.results || { Medications: [], Labs: [], Imaging: [], Procedures: [], Consults: [] },
        totalCount: data.totalCount || 0,
    }
}

export function UnifiedOrderSearch({
    patientId,
    onOrderSelect,
    placeholder = 'Search all orders (meds, labs, imaging, procedures)...',
    className = '',
}: UnifiedOrderSearchProps) {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const debouncedQuery = useDebounce(query, 300)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const { data, isLoading } = useQuery({
        queryKey: ['unified-order-search', debouncedQuery],
        queryFn: () => searchOrders(debouncedQuery),
        enabled: debouncedQuery.length >= 2,
    })

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = useCallback((order: UnifiedOrderResult) => {
        onOrderSelect(order)
        setQuery('')
        setIsOpen(false)
    }, [onOrderSelect])

    const results = data?.results || { Medications: [], Labs: [], Imaging: [], Procedures: [], Consults: [] }
    const totalCount = data?.totalCount || 0
    const hasResults = totalCount > 0

    // Order categories by which have results
    const orderedCategories = (Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>)
        .filter(cat => results[cat]?.length > 0)

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {query && !isLoading && (
                    <button
                        onClick={() => { setQuery(''); setIsOpen(false) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {isLoading && (
                        <div className="p-4 text-center text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                            Searching...
                        </div>
                    )}

                    {!isLoading && !hasResults && (
                        <div className="p-4 text-center text-muted-foreground">
                            No orders found for "{query}"
                        </div>
                    )}

                    {!isLoading && hasResults && (
                        <div className="divide-y">
                            {orderedCategories.map(category => {
                                const config = categoryConfig[category]
                                const Icon = config.icon
                                const categoryResults = results[category]

                                if (!categoryResults?.length) return null

                                return (
                                    <div key={category} className="py-2">
                                        {/* Category Header */}
                                        <div className="px-3 py-1 flex items-center gap-2">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                {category}
                                            </span>
                                            <Badge variant="secondary" className="text-[10px] ml-auto">
                                                {categoryResults.length}
                                            </Badge>
                                        </div>

                                        {/* Category Results */}
                                        {categoryResults.map(order => (
                                            <button
                                                key={order.id}
                                                onClick={() => handleSelect(order)}
                                                className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-3 group`}
                                            >
                                                <div className={`p-1.5 rounded ${config.color}`}>
                                                    <Icon className="h-3 w-3" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{order.name}</div>
                                                    {(order.code || order.specialty || order.details) && (
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {order.code && <span>{order.system}: {order.code}</span>}
                                                            {order.specialty && <span> • {order.specialty}</span>}
                                                            {order.details && <span> • {order.details}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default UnifiedOrderSearch
