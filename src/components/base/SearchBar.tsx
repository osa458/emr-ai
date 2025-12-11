'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Filter, Sparkles, Clock, User, FileText, Pill, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAISearchSuggestions, type SearchSuggestion } from '@/lib/fhir/search-service'
import debounce from 'lodash/debounce'

// Filter types
export interface SearchFilterConfig {
  id: string
  label: string
  type: 'text' | 'select' | 'date' | 'dateRange' | 'boolean' | 'reference'
  placeholder?: string
  options?: { value: string; label: string }[]
  resourceType?: string // For reference filters
}

export interface ActiveFilter {
  id: string
  value: any
  label: string
}

export interface SearchBarProps {
  placeholder?: string
  filters?: SearchFilterConfig[]
  onSearch: (query: string, filters: ActiveFilter[]) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  showAISuggestions?: boolean
  recentSearches?: string[]
  className?: string
  context?: { patientId?: string; encounterId?: string }
}

export function SearchBar({
  placeholder = 'Search patients, conditions, medications...',
  filters = [],
  onSearch,
  onSuggestionSelect,
  showAISuggestions = true,
  recentSearches = [],
  className = '',
  context
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced AI suggestions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!showAISuggestions || searchQuery.length < 2) {
        setAiSuggestions([])
        return
      }
      
      setIsLoadingSuggestions(true)
      try {
        const suggestions = await getAISearchSuggestions(searchQuery, context)
        setAiSuggestions(suggestions)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 300),
    [showAISuggestions, context]
  )

  useEffect(() => {
    fetchSuggestions(query)
  }, [query, fetchSuggestions])

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = () => {
    onSearch(query, activeFilters)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = aiSuggestions.length + recentSearches.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < aiSuggestions.length) {
        handleSuggestionClick(aiSuggestions[selectedIndex])
      } else if (selectedIndex >= aiSuggestions.length) {
        const recentIndex = selectedIndex - aiSuggestions.length
        setQuery(recentSearches[recentIndex])
        handleSearch()
      } else {
        handleSearch()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion)
    } else {
      setQuery(suggestion.display)
      handleSearch()
    }
    setShowSuggestions(false)
  }

  const addFilter = (filter: SearchFilterConfig, value: any) => {
    const label = filter.type === 'select' 
      ? filter.options?.find(o => o.value === value)?.label || value
      : value
    
    setActiveFilters(prev => [
      ...prev.filter(f => f.id !== filter.id),
      { id: filter.id, value, label: `${filter.label}: ${label}` }
    ])
  }

  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId))
  }

  const clearAll = () => {
    setQuery('')
    setActiveFilters([])
    onSearch('', [])
  }

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'patient': return <User className="h-4 w-4" />
      case 'condition': return <Activity className="h-4 w-4" />
      case 'medication': return <Pill className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main search input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {filters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        )}
        
        <Button onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeFilters.map(filter => (
            <Badge key={filter.id} variant="secondary" className="gap-1">
              {filter.label}
              <button onClick={() => removeFilter(filter.id)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter panel */}
      {showFilters && filters.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filters.map(filter => (
              <div key={filter.id}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {filter.label}
                </label>
                {filter.type === 'select' ? (
                  <select
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    onChange={(e) => e.target.value && addFilter(filter, e.target.value)}
                    value={activeFilters.find(f => f.id === filter.id)?.value || ''}
                  >
                    <option value="">{filter.placeholder || 'Select...'}</option>
                    {filter.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    onChange={(e) => e.target.value && addFilter(filter, e.target.value)}
                    value={activeFilters.find(f => f.id === filter.id)?.value || ''}
                  />
                ) : filter.type === 'boolean' ? (
                  <select
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    onChange={(e) => e.target.value !== '' && addFilter(filter, e.target.value === 'true')}
                    value={activeFilters.find(f => f.id === filter.id)?.value?.toString() || ''}
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    placeholder={filter.placeholder}
                    onChange={(e) => e.target.value && addFilter(filter, e.target.value)}
                    value={activeFilters.find(f => f.id === filter.id)?.value || ''}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (query || recentSearches.length > 0) && (
        <div className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* AI Suggestions */}
          {showAISuggestions && aiSuggestions.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-slate-50 flex items-center gap-1 border-b">
                <Sparkles className="h-3 w-3 text-purple-500" />
                AI Suggestions
              </div>
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.reference}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-3 ${
                    selectedIndex === index ? 'bg-blue-100' : ''
                  }`}
                >
                  <span className="text-muted-foreground">
                    {getSuggestionIcon(suggestion.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{suggestion.display}</div>
                    {suggestion.context && (
                      <div className="text-xs text-muted-foreground truncate">{suggestion.context}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {Math.round(suggestion.relevanceScore * 100)}%
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {isLoadingSuggestions && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse inline mr-2" />
              Getting AI suggestions...
            </div>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-slate-50 flex items-center gap-1 border-b">
                <Clock className="h-3 w-3" />
                Recent Searches
              </div>
              {recentSearches.map((search, index) => {
                const itemIndex = aiSuggestions.length + index
                return (
                  <button
                    key={search}
                    onClick={() => {
                      setQuery(search)
                      handleSearch()
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-3 ${
                      selectedIndex === itemIndex ? 'bg-blue-100' : ''
                    }`}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{search}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* No results */}
          {!isLoadingSuggestions && aiSuggestions.length === 0 && recentSearches.length === 0 && query.length >= 2 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Press Enter to search for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Pre-configured filter sets for common use cases
export const patientFilters: SearchFilterConfig[] = [
  { id: 'gender', label: 'Gender', type: 'select', options: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ]},
  { id: 'birthDate', label: 'Birth Date', type: 'date' },
  { id: 'active', label: 'Active', type: 'boolean' }
]

export const encounterFilters: SearchFilterConfig[] = [
  { id: 'status', label: 'Status', type: 'select', options: [
    { value: 'planned', label: 'Planned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'finished', label: 'Finished' },
    { value: 'cancelled', label: 'Cancelled' }
  ]},
  { id: 'type', label: 'Type', type: 'select', options: [
    { value: 'inpatient', label: 'Inpatient' },
    { value: 'outpatient', label: 'Outpatient' },
    { value: 'emergency', label: 'Emergency' }
  ]},
  { id: 'dateFrom', label: 'From Date', type: 'date' },
  { id: 'dateTo', label: 'To Date', type: 'date' }
]

export const appointmentFilters: SearchFilterConfig[] = [
  { id: 'status', label: 'Status', type: 'select', options: [
    { value: 'proposed', label: 'Proposed' },
    { value: 'pending', label: 'Pending' },
    { value: 'booked', label: 'Booked' },
    { value: 'arrived', label: 'Arrived' },
    { value: 'fulfilled', label: 'Fulfilled' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'noshow', label: 'No Show' }
  ]},
  { id: 'dateFrom', label: 'From Date', type: 'date' },
  { id: 'dateTo', label: 'To Date', type: 'date' }
]

export const documentFilters: SearchFilterConfig[] = [
  { id: 'status', label: 'Status', type: 'select', options: [
    { value: 'current', label: 'Current' },
    { value: 'superseded', label: 'Superseded' },
    { value: 'entered-in-error', label: 'Entered in Error' }
  ]},
  { id: 'category', label: 'Category', type: 'select', options: [
    { value: 'clinical-note', label: 'Clinical Note' },
    { value: 'discharge-summary', label: 'Discharge Summary' },
    { value: 'lab-report', label: 'Lab Report' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'procedure', label: 'Procedure' }
  ]},
  { id: 'dateFrom', label: 'From Date', type: 'date' },
  { id: 'dateTo', label: 'To Date', type: 'date' }
]

