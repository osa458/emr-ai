'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFHIRServices } from '@/lib/fhir/beda-service'
import { 
  searchPatients, 
  searchEncounters, 
  searchAppointments, 
  searchDocuments,
  type PatientSearchOptions,
  type EncounterSearchOptions,
  type AppointmentSearchOptions,
  type DocumentSearchOptions,
  type SearchResult
} from '@/lib/fhir/search-service'
import {
  getQuestionnaires,
  getQuestionnaire,
  saveQuestionnaireResponse,
  getQuestionnaireResponses,
  populateQuestionnaire,
  validateResponse,
  getAISuggestionsForQuestionnaire,
  type QuestionnaireContext
} from '@/lib/fhir/questionnaire-service'
import type {
  Patient,
  Encounter,
  Observation,
  Condition,
  MedicationRequest,
  Appointment,
  DocumentReference,
  Questionnaire,
  QuestionnaireResponse,
  Resource
} from '@medplum/fhirtypes'

// Generic FHIR resource hook
export function useFHIRResource<T extends Resource>(
  resourceType: string,
  resourceId: string | undefined,
  options?: { enabled?: boolean }
) {
  const services = getFHIRServices()
  
  return useQuery({
    queryKey: ['fhir', resourceType, resourceId],
    queryFn: async () => {
      if (!resourceId) return null
      const result = await services.getFHIRResource<T>({ reference: `${resourceType}/${resourceId}` })
      // Handle RemoteDataResult
      if (result && 'id' in result && result.id === 'success') {
        return (result as any).data as T
      }
      return result as unknown as T
    },
    enabled: !!resourceId && (options?.enabled !== false)
  })
}

// Patient hook
export function usePatient(patientId: string | undefined) {
  return useFHIRResource<Patient>('Patient', patientId)
}

// Patient search hook
export function usePatientSearch(options: PatientSearchOptions = {}) {
  const [searchOptions, setSearchOptions] = useState(options)
  
  const query = useQuery({
    queryKey: ['fhir', 'Patient', 'search', searchOptions],
    queryFn: () => searchPatients(searchOptions)
  })

  const search = useCallback((newOptions: PatientSearchOptions) => {
    setSearchOptions(newOptions)
  }, [])

  return { ...query, search, searchOptions }
}

// Encounter hook
export function useEncounter(encounterId: string | undefined) {
  return useFHIRResource<Encounter>('Encounter', encounterId)
}

// Patient encounters hook
export function usePatientEncounters(patientId: string | undefined, options?: EncounterSearchOptions) {
  return useQuery({
    queryKey: ['fhir', 'Encounter', 'patient', patientId, options],
    queryFn: () => searchEncounters({ ...options, patientId }),
    enabled: !!patientId
  })
}

// Current encounter hook (in-progress encounter for patient)
export function useCurrentEncounter(patientId: string | undefined) {
  return useQuery({
    queryKey: ['fhir', 'Encounter', 'current', patientId],
    queryFn: () => searchEncounters({ patientId, status: 'in-progress' }),
    enabled: !!patientId,
    select: (data) => data.resources[0] || null
  })
}

// Observations hook (labs, vitals)
export function useObservations(
  patientId: string | undefined,
  category?: 'vital-signs' | 'laboratory' | 'social-history' | 'exam',
  options?: { limit?: number }
) {
  const services = getFHIRServices()
  
  return useQuery({
    queryKey: ['fhir', 'Observation', patientId, category, options],
    queryFn: async () => {
      if (!patientId) return []
      const params: Record<string, any> = {
        subject: `Patient/${patientId}`,
        _sort: '-date',
        _count: options?.limit || 50
      }
      if (category) params.category = category
      
      const result = await services.getFHIRResources<Observation>('Observation', params)
      if (result && 'id' in result && result.id === 'success') {
        const bundle = (result as any).data
        return (bundle.entry || []).map((e: any) => e.resource) as Observation[]
      }
      return []
    },
    enabled: !!patientId
  })
}

// Vitals hook (convenience)
export function useVitals(patientId: string | undefined, limit?: number) {
  return useObservations(patientId, 'vital-signs', { limit })
}

// Labs hook (convenience)
export function useLabs(patientId: string | undefined, limit?: number) {
  return useObservations(patientId, 'laboratory', { limit })
}

// Conditions hook
export function useConditions(patientId: string | undefined, clinicalStatus?: 'active' | 'resolved' | 'inactive') {
  const services = getFHIRServices()
  
  return useQuery({
    queryKey: ['fhir', 'Condition', patientId, clinicalStatus],
    queryFn: async () => {
      if (!patientId) return []
      const params: Record<string, any> = {
        subject: `Patient/${patientId}`,
        _sort: '-recorded-date'
      }
      if (clinicalStatus) params['clinical-status'] = clinicalStatus
      
      const result = await services.getFHIRResources<Condition>('Condition', params)
      if (result && 'id' in result && result.id === 'success') {
        const bundle = (result as any).data
        return (bundle.entry || []).map((e: any) => e.resource) as Condition[]
      }
      return []
    },
    enabled: !!patientId
  })
}

// Medications hook
export function useMedications(patientId: string | undefined, status?: 'active' | 'completed' | 'stopped') {
  const services = getFHIRServices()
  
  return useQuery({
    queryKey: ['fhir', 'MedicationRequest', patientId, status],
    queryFn: async () => {
      if (!patientId) return []
      const params: Record<string, any> = {
        subject: `Patient/${patientId}`,
        _sort: '-authoredon',
        _include: ['MedicationRequest:medication']
      }
      if (status) params.status = status
      
      const result = await services.getFHIRResources<MedicationRequest>('MedicationRequest', params)
      if (result && 'id' in result && result.id === 'success') {
        const bundle = (result as any).data
        return (bundle.entry || []).map((e: any) => e.resource).filter((r: any) => r.resourceType === 'MedicationRequest') as MedicationRequest[]
      }
      return []
    },
    enabled: !!patientId
  })
}

// Appointments hook
export function useAppointments(options: AppointmentSearchOptions = {}) {
  return useQuery({
    queryKey: ['fhir', 'Appointment', 'search', options],
    queryFn: () => searchAppointments(options)
  })
}

// Patient appointments hook
export function usePatientAppointments(patientId: string | undefined, options?: Omit<AppointmentSearchOptions, 'patientId'>) {
  return useQuery({
    queryKey: ['fhir', 'Appointment', 'patient', patientId, options],
    queryFn: () => searchAppointments({ ...options, patientId }),
    enabled: !!patientId
  })
}

// Documents hook
export function useDocuments(options: DocumentSearchOptions = {}) {
  return useQuery({
    queryKey: ['fhir', 'DocumentReference', 'search', options],
    queryFn: () => searchDocuments(options)
  })
}

// Patient documents hook
export function usePatientDocuments(patientId: string | undefined, options?: Omit<DocumentSearchOptions, 'patientId'>) {
  return useQuery({
    queryKey: ['fhir', 'DocumentReference', 'patient', patientId, options],
    queryFn: () => searchDocuments({ ...options, patientId }),
    enabled: !!patientId
  })
}

// Questionnaire hooks
export function useQuestionnaires(status?: string) {
  return useQuery({
    queryKey: ['fhir', 'Questionnaire', 'list', status],
    queryFn: () => getQuestionnaires(status)
  })
}

export function useQuestionnaire(questionnaireId: string | undefined) {
  return useQuery({
    queryKey: ['fhir', 'Questionnaire', questionnaireId],
    queryFn: () => questionnaireId ? getQuestionnaire(questionnaireId) : null,
    enabled: !!questionnaireId
  })
}

export function useQuestionnaireResponses(patientId: string | undefined, questionnaireId?: string) {
  return useQuery({
    queryKey: ['fhir', 'QuestionnaireResponse', patientId, questionnaireId],
    queryFn: () => patientId ? getQuestionnaireResponses(patientId, questionnaireId) : null,
    enabled: !!patientId
  })
}

// Questionnaire form state management
export function useQuestionnaireForm(
  questionnaire: Questionnaire | undefined,
  context: QuestionnaireContext
) {
  const queryClient = useQueryClient()
  const [response, setResponse] = useState<QuestionnaireResponse | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])

  // Initialize response when questionnaire loads
  useEffect(() => {
    if (questionnaire && !response) {
      const initialItems = populateQuestionnaire(questionnaire, context)
      setResponse({
        resourceType: 'QuestionnaireResponse',
        questionnaire: `Questionnaire/${questionnaire.id}`,
        status: 'in-progress',
        item: initialItems,
        authored: new Date().toISOString()
      })
    }
  }, [questionnaire, context, response])

  // Fetch AI suggestions
  useEffect(() => {
    if (questionnaire) {
      getAISuggestionsForQuestionnaire(questionnaire, context).then(setAiSuggestions)
    }
  }, [questionnaire, context])

  // Update answer
  const updateAnswer = useCallback((linkId: string, value: any) => {
    if (!response) return
    
    setResponse(prev => {
      if (!prev) return prev
      const newItems = updateItemAnswer(prev.item || [], linkId, value)
      return { ...prev, item: newItems }
    })
  }, [response])

  // Validate
  const validate = useCallback(() => {
    if (!questionnaire || !response) return false
    const result = validateResponse(questionnaire, response)
    setValidationErrors(result.errors)
    return result.valid
  }, [questionnaire, response])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (status: 'in-progress' | 'completed') => {
      if (!response) throw new Error('No response to save')
      return saveQuestionnaireResponse({ ...response, status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fhir', 'QuestionnaireResponse'] })
    }
  })

  return {
    response,
    setResponse,
    updateAnswer,
    validate,
    validationErrors,
    aiSuggestions,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error
  }
}

// Helper to update nested item answer
function updateItemAnswer(items: any[], linkId: string, value: any): any[] {
  return items.map(item => {
    if (item.linkId === linkId) {
      return { ...item, answer: [{ valueString: value }] }
    }
    if (item.item) {
      return { ...item, item: updateItemAnswer(item.item, linkId, value) }
    }
    return item
  })
}

// FHIR resource mutation hooks
export function useCreateResource<T extends Resource>(resourceType: string) {
  const queryClient = useQueryClient()
  const services = getFHIRServices()

  return useMutation({
    mutationFn: (resource: T) => services.createFHIRResource(resource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fhir', resourceType] })
    }
  })
}

export function useUpdateResource<T extends Resource>(resourceType: string) {
  const queryClient = useQueryClient()
  const services = getFHIRServices()

  return useMutation({
    mutationFn: (resource: T) => services.updateFHIRResource(resource as any),
    onSuccess: (_, resource) => {
      queryClient.invalidateQueries({ queryKey: ['fhir', resourceType] })
      queryClient.invalidateQueries({ queryKey: ['fhir', resourceType, (resource as any).id] })
    }
  })
}

export function useDeleteResource(resourceType: string) {
  const queryClient = useQueryClient()
  const services = getFHIRServices()

  return useMutation({
    mutationFn: (resourceId: string) => services.deleteFHIRResource({ reference: `${resourceType}/${resourceId}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fhir', resourceType] })
    }
  })
}
