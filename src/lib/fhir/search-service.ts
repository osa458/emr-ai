'use client'

import { getFHIRServices } from './beda-service'
import type { 
  Patient, 
  Practitioner, 
  Encounter, 
  Observation,
  Condition,
  MedicationRequest,
  DocumentReference,
  Appointment,
  Bundle,
  Resource
} from '@medplum/fhirtypes'

// Search filter types
export type SearchOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | 'contains' | 'exact' | 'missing'
export type SearchModifier = 'exact' | 'contains' | 'text' | 'not' | 'above' | 'below' | 'in' | 'not-in'

export interface SearchFilter {
  field: string
  operator: SearchOperator
  value: string | number | boolean
  modifier?: SearchModifier
}

export interface SearchSort {
  field: string
  direction: 'asc' | 'desc'
}

export interface SearchOptions {
  filters?: SearchFilter[]
  sort?: SearchSort[]
  include?: string[]
  revinclude?: string[]
  count?: number
  offset?: number
}

export interface SearchResult<T extends Resource> {
  resources: T[]
  total: number
  hasMore: boolean
  nextOffset?: number
}

// Build FHIR search params from our filter structure
function buildSearchParams(options: SearchOptions): Record<string, any> {
  const params: Record<string, any> = {}

  // Apply filters
  if (options.filters) {
    for (const filter of options.filters) {
      let paramName = filter.field
      let paramValue: string = String(filter.value)

      // Apply modifier
      if (filter.modifier) {
        paramName = `${filter.field}:${filter.modifier}`
      }

      // Apply operator prefix
      switch (filter.operator) {
        case 'ne':
          paramValue = `ne${filter.value}`
          break
        case 'gt':
          paramValue = `gt${filter.value}`
          break
        case 'lt':
          paramValue = `lt${filter.value}`
          break
        case 'ge':
          paramValue = `ge${filter.value}`
          break
        case 'le':
          paramValue = `le${filter.value}`
          break
        case 'missing':
          paramName = `${filter.field}:missing`
          paramValue = String(filter.value)
          break
        default:
          paramValue = String(filter.value)
      }

      params[paramName] = paramValue
    }
  }

  // Apply sorting
  if (options.sort && options.sort.length > 0) {
    params._sort = options.sort
      .map(s => s.direction === 'desc' ? `-${s.field}` : s.field)
      .join(',')
  }

  // Apply includes
  if (options.include) {
    params._include = options.include
  }
  if (options.revinclude) {
    params._revinclude = options.revinclude
  }

  // Pagination
  if (options.count) {
    params._count = options.count
  }
  if (options.offset) {
    params._offset = options.offset
  }

  return params
}

// Generic search function
export async function searchResources<T extends Resource>(
  resourceType: string,
  options: SearchOptions = {}
): Promise<SearchResult<T>> {
  const services = getFHIRServices()
  const params = buildSearchParams(options)
  
  try {
    const result = await services.getFHIRResources<T>(resourceType as any, params)
    
    // RemoteDataResult is a discriminated union - check if it's a success
    if ('id' in result && result.id === 'success') {
      const bundle = (result as any).data as Bundle<T>
      const resources = (bundle.entry || []).map(e => e.resource).filter(Boolean) as T[]
      const total = bundle.total || resources.length
      
      return {
        resources,
        total,
        hasMore: resources.length === (options.count || 10),
        nextOffset: (options.offset || 0) + resources.length
      }
    }
    
    // Also handle if result is directly the bundle (mock mode)
    if (result && typeof result === 'object' && 'resourceType' in (result as any)) {
      const bundle = result as unknown as Bundle<T>
      const resources = (bundle.entry || []).map(e => e.resource).filter(Boolean) as T[]
      const total = bundle.total || resources.length
      
      return {
        resources,
        total,
        hasMore: resources.length === (options.count || 10),
        nextOffset: (options.offset || 0) + resources.length
      }
    }
    
    return { resources: [], total: 0, hasMore: false }
  } catch (error) {
    console.error(`Error searching ${resourceType}:`, error)
    return { resources: [], total: 0, hasMore: false }
  }
}

// Patient search with common filters
export interface PatientSearchOptions {
  name?: string
  identifier?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other' | 'unknown'
  phone?: string
  email?: string
  address?: string
  active?: boolean
  count?: number
  offset?: number
}

export async function searchPatients(options: PatientSearchOptions = {}): Promise<SearchResult<Patient>> {
  const filters: SearchFilter[] = []
  
  if (options.name) {
    filters.push({ field: 'name', operator: 'contains', value: options.name })
  }
  if (options.identifier) {
    filters.push({ field: 'identifier', operator: 'eq', value: options.identifier })
  }
  if (options.birthDate) {
    filters.push({ field: 'birthdate', operator: 'eq', value: options.birthDate })
  }
  if (options.gender) {
    filters.push({ field: 'gender', operator: 'eq', value: options.gender })
  }
  if (options.phone) {
    filters.push({ field: 'phone', operator: 'contains', value: options.phone })
  }
  if (options.email) {
    filters.push({ field: 'email', operator: 'contains', value: options.email })
  }
  if (options.address) {
    filters.push({ field: 'address', operator: 'contains', value: options.address })
  }
  if (options.active !== undefined) {
    filters.push({ field: 'active', operator: 'eq', value: options.active })
  }

  return searchResources<Patient>('Patient', {
    filters,
    sort: [{ field: 'family', direction: 'asc' }],
    count: options.count || 20,
    offset: options.offset
  })
}

// Encounter search
export interface EncounterSearchOptions {
  patientId?: string
  status?: string | string[]
  type?: string
  dateFrom?: string
  dateTo?: string
  practitionerId?: string
  locationId?: string
  count?: number
  offset?: number
}

export async function searchEncounters(options: EncounterSearchOptions = {}): Promise<SearchResult<Encounter>> {
  const filters: SearchFilter[] = []
  
  if (options.patientId) {
    filters.push({ field: 'subject', operator: 'eq', value: `Patient/${options.patientId}` })
  }
  if (options.status) {
    const statuses = Array.isArray(options.status) ? options.status.join(',') : options.status
    filters.push({ field: 'status', operator: 'eq', value: statuses })
  }
  if (options.type) {
    filters.push({ field: 'type', operator: 'eq', value: options.type })
  }
  if (options.dateFrom) {
    filters.push({ field: 'date', operator: 'ge', value: options.dateFrom })
  }
  if (options.dateTo) {
    filters.push({ field: 'date', operator: 'le', value: options.dateTo })
  }
  if (options.practitionerId) {
    filters.push({ field: 'participant', operator: 'eq', value: `Practitioner/${options.practitionerId}` })
  }

  return searchResources<Encounter>('Encounter', {
    filters,
    sort: [{ field: 'date', direction: 'desc' }],
    include: ['Encounter:patient', 'Encounter:participant'],
    count: options.count || 20,
    offset: options.offset
  })
}

// Appointment search
export interface AppointmentSearchOptions {
  patientId?: string
  practitionerId?: string
  status?: string | string[]
  dateFrom?: string
  dateTo?: string
  serviceType?: string
  count?: number
  offset?: number
}

export async function searchAppointments(options: AppointmentSearchOptions = {}): Promise<SearchResult<Appointment>> {
  const filters: SearchFilter[] = []
  
  if (options.patientId) {
    filters.push({ field: 'patient', operator: 'eq', value: `Patient/${options.patientId}` })
  }
  if (options.practitionerId) {
    filters.push({ field: 'practitioner', operator: 'eq', value: `Practitioner/${options.practitionerId}` })
  }
  if (options.status) {
    const statuses = Array.isArray(options.status) ? options.status.join(',') : options.status
    filters.push({ field: 'status', operator: 'eq', value: statuses })
  }
  if (options.dateFrom) {
    filters.push({ field: 'date', operator: 'ge', value: options.dateFrom })
  }
  if (options.dateTo) {
    filters.push({ field: 'date', operator: 'le', value: options.dateTo })
  }
  if (options.serviceType) {
    filters.push({ field: 'service-type', operator: 'eq', value: options.serviceType })
  }

  return searchResources<Appointment>('Appointment', {
    filters,
    sort: [{ field: 'date', direction: 'asc' }],
    include: ['Appointment:patient', 'Appointment:practitioner'],
    count: options.count || 20,
    offset: options.offset
  })
}

// Document search
export interface DocumentSearchOptions {
  patientId?: string
  type?: string
  category?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  author?: string
  count?: number
  offset?: number
}

export async function searchDocuments(options: DocumentSearchOptions = {}): Promise<SearchResult<DocumentReference>> {
  const filters: SearchFilter[] = []
  
  if (options.patientId) {
    filters.push({ field: 'subject', operator: 'eq', value: `Patient/${options.patientId}` })
  }
  if (options.type) {
    filters.push({ field: 'type', operator: 'eq', value: options.type })
  }
  if (options.category) {
    filters.push({ field: 'category', operator: 'eq', value: options.category })
  }
  if (options.status) {
    filters.push({ field: 'status', operator: 'eq', value: options.status })
  }
  if (options.dateFrom) {
    filters.push({ field: 'date', operator: 'ge', value: options.dateFrom })
  }
  if (options.dateTo) {
    filters.push({ field: 'date', operator: 'le', value: options.dateTo })
  }
  if (options.author) {
    filters.push({ field: 'author', operator: 'eq', value: options.author })
  }

  return searchResources<DocumentReference>('DocumentReference', {
    filters,
    sort: [{ field: 'date', direction: 'desc' }],
    count: options.count || 20,
    offset: options.offset
  })
}

// AI-powered search suggestions
export interface SearchSuggestion {
  type: 'patient' | 'condition' | 'medication' | 'procedure' | 'document'
  display: string
  reference: string
  relevanceScore: number
  context?: string
}

export async function getAISearchSuggestions(
  query: string,
  context?: { patientId?: string; encounterId?: string }
): Promise<SearchSuggestion[]> {
  // This would integrate with our AI endpoint for smart search
  // For now, provide intelligent mock suggestions
  const suggestions: SearchSuggestion[] = []
  const queryLower = query.toLowerCase()

  // Pattern matching for common clinical searches
  if (queryLower.includes('diabetes') || queryLower.includes('dm') || queryLower.includes('a1c')) {
    suggestions.push({
      type: 'condition',
      display: 'Type 2 Diabetes Mellitus',
      reference: 'Condition/dm-example',
      relevanceScore: 0.95,
      context: 'ICD-10: E11.9'
    })
    suggestions.push({
      type: 'medication',
      display: 'Metformin 500mg',
      reference: 'MedicationRequest/metformin-example',
      relevanceScore: 0.85,
      context: 'Common first-line treatment'
    })
  }

  if (queryLower.includes('heart') || queryLower.includes('chf') || queryLower.includes('cardiac')) {
    suggestions.push({
      type: 'condition',
      display: 'Heart Failure',
      reference: 'Condition/hf-example',
      relevanceScore: 0.92,
      context: 'ICD-10: I50.9'
    })
  }

  if (queryLower.includes('lab') || queryLower.includes('result')) {
    suggestions.push({
      type: 'document',
      display: 'Recent Lab Results',
      reference: 'DocumentReference/labs-recent',
      relevanceScore: 0.88,
      context: 'Last 7 days'
    })
  }

  // Sort by relevance
  return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

// Full-text search across multiple resource types
export async function globalSearch(
  query: string,
  resourceTypes: string[] = ['Patient', 'Encounter', 'Condition', 'MedicationRequest', 'DocumentReference'],
  options: { count?: number } = {}
): Promise<{ resourceType: string; results: Resource[] }[]> {
  const results: { resourceType: string; results: Resource[] }[] = []
  const count = options.count || 5

  for (const resourceType of resourceTypes) {
    try {
      const searchResult = await searchResources(resourceType, {
        filters: [{ field: '_content', operator: 'contains', value: query }],
        count
      })
      
      if (searchResult.resources.length > 0) {
        results.push({
          resourceType,
          results: searchResult.resources
        })
      }
    } catch (error) {
      console.error(`Error searching ${resourceType}:`, error)
    }
  }

  return results
}
