'use client'

import { getFHIRServices, extractBundleResources, uuid4 } from './beda-service'
import type { 
  Questionnaire, 
  QuestionnaireResponse, 
  QuestionnaireItem,
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer,
  Patient,
  Encounter,
  Observation,
  Condition,
  Reference,
  Bundle
} from '@medplum/fhirtypes'
import fhirpath from 'fhirpath'

// Types for SDC operations
export interface QuestionnaireContext {
  patient?: Patient
  encounter?: Encounter
  observations?: Observation[]
  conditions?: Condition[]
  [key: string]: any
}

export interface PopulatedItem {
  linkId: string
  answer?: QuestionnaireResponseItemAnswer[]
  item?: PopulatedItem[]
}

export interface ExtractionResult {
  resources: any[]
  errors: string[]
}

// Get all questionnaires
export async function getQuestionnaires(status?: string) {
  const services = getFHIRServices()
  const params: Record<string, any> = { _sort: '-date', _count: 100 }
  if (status) params.status = status
  return services.getFHIRResources<Questionnaire>('Questionnaire', params)
}

// Get a specific questionnaire by ID
export async function getQuestionnaire(questionnaireId: string) {
  const services = getFHIRServices()
  return services.getFHIRResource<Questionnaire>({ reference: `Questionnaire/${questionnaireId}` })
}

// Save a questionnaire response
export async function saveQuestionnaireResponse(response: QuestionnaireResponse) {
  const services = getFHIRServices()
  if (response.id) {
    return services.updateFHIRResource(response as any)
  }
  return services.createFHIRResource(response)
}

// Get questionnaire responses for a patient
export async function getQuestionnaireResponses(patientId: string, questionnaireId?: string) {
  const services = getFHIRServices()
  const params: Record<string, any> = {
    subject: `Patient/${patientId}`,
    _sort: '-authored',
    _count: 50
  }
  if (questionnaireId) {
    params.questionnaire = questionnaireId
  }
  return services.getFHIRResources<QuestionnaireResponse>('QuestionnaireResponse', params)
}

// Evaluate FHIRPath expression
export function evaluateFHIRPath(expression: string, context: any, environment?: Record<string, any>): any[] {
  try {
    const result = fhirpath.evaluate(context, expression, environment || {})
    return Array.isArray(result) ? result : [result]
  } catch (error) {
    console.error('FHIRPath evaluation error:', error)
    return []
  }
}

// Check if item should be enabled based on enableWhen conditions
export function evaluateEnableWhen(
  item: QuestionnaireItem, 
  responseItems: QuestionnaireResponseItem[]
): boolean {
  if (!item.enableWhen || item.enableWhen.length === 0) {
    return true
  }

  const results = item.enableWhen.map(condition => {
    const targetItem = findResponseItem(responseItems, condition.question || '')
    if (!targetItem || !targetItem.answer || targetItem.answer.length === 0) {
      return condition.operator === 'exists' ? !condition.answerBoolean : false
    }

    const answer = targetItem.answer[0]
    
    switch (condition.operator) {
      case 'exists':
        return condition.answerBoolean === true
      case '=':
        return compareAnswers(answer, condition)
      case '!=':
        return !compareAnswers(answer, condition)
      case '>':
        return compareNumeric(answer, condition, '>')
      case '<':
        return compareNumeric(answer, condition, '<')
      case '>=':
        return compareNumeric(answer, condition, '>=')
      case '<=':
        return compareNumeric(answer, condition, '<=')
      default:
        return true
    }
  })

  // Apply enableBehavior (all = AND, any = OR)
  if (item.enableBehavior === 'any') {
    return results.some(r => r)
  }
  return results.every(r => r)
}

// Find a response item by linkId (recursive)
function findResponseItem(items: QuestionnaireResponseItem[], linkId: string): QuestionnaireResponseItem | undefined {
  for (const item of items) {
    if (item.linkId === linkId) return item
    if (item.item) {
      const found = findResponseItem(item.item, linkId)
      if (found) return found
    }
  }
  return undefined
}

// Compare answer values
function compareAnswers(answer: QuestionnaireResponseItemAnswer, condition: any): boolean {
  if (condition.answerString !== undefined) {
    return answer.valueString === condition.answerString
  }
  if (condition.answerInteger !== undefined) {
    return answer.valueInteger === condition.answerInteger
  }
  if (condition.answerDecimal !== undefined) {
    return answer.valueDecimal === condition.answerDecimal
  }
  if (condition.answerBoolean !== undefined) {
    return answer.valueBoolean === condition.answerBoolean
  }
  if (condition.answerCoding !== undefined) {
    return answer.valueCoding?.code === condition.answerCoding.code
  }
  return false
}

// Compare numeric values
function compareNumeric(answer: QuestionnaireResponseItemAnswer, condition: any, operator: string): boolean {
  const answerValue = answer.valueInteger ?? answer.valueDecimal ?? 0
  const conditionValue = condition.answerInteger ?? condition.answerDecimal ?? 0
  
  switch (operator) {
    case '>': return answerValue > conditionValue
    case '<': return answerValue < conditionValue
    case '>=': return answerValue >= conditionValue
    case '<=': return answerValue <= conditionValue
    default: return false
  }
}

// Populate questionnaire with initial values from context
export function populateQuestionnaire(
  questionnaire: Questionnaire,
  context: QuestionnaireContext
): QuestionnaireResponseItem[] {
  if (!questionnaire.item) return []
  
  return questionnaire.item.map(item => populateItem(item, context)).filter(Boolean) as QuestionnaireResponseItem[]
}

function populateItem(item: QuestionnaireItem, context: QuestionnaireContext): QuestionnaireResponseItem | null {
  const responseItem: QuestionnaireResponseItem = {
    linkId: item.linkId,
    text: item.text
  }

  // Check for initial value
  if (item.initial && item.initial.length > 0) {
    responseItem.answer = item.initial.map(init => {
      const answer: QuestionnaireResponseItemAnswer = {}
      if (init.valueString !== undefined) answer.valueString = init.valueString
      if (init.valueInteger !== undefined) answer.valueInteger = init.valueInteger
      if (init.valueDecimal !== undefined) answer.valueDecimal = init.valueDecimal
      if (init.valueBoolean !== undefined) answer.valueBoolean = init.valueBoolean
      if (init.valueDate !== undefined) answer.valueDate = init.valueDate
      if (init.valueDateTime !== undefined) answer.valueDateTime = init.valueDateTime
      if (init.valueCoding !== undefined) answer.valueCoding = init.valueCoding
      return answer
    })
  }

  // Check for initialExpression (SDC extension)
  const initialExpression = item.extension?.find(
    e => e.url === 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression'
  )
  if (initialExpression?.valueExpression?.expression) {
    try {
      const result = evaluateFHIRPath(initialExpression.valueExpression.expression, context)
      if (result.length > 0) {
        responseItem.answer = [convertToAnswer(result[0], item.type)]
      }
    } catch (e) {
      console.error('Error evaluating initial expression:', e)
    }
  }

  // Process nested items
  if (item.item && item.item.length > 0) {
    responseItem.item = item.item.map(child => populateItem(child, context)).filter(Boolean) as QuestionnaireResponseItem[]
  }

  return responseItem
}

// Convert a value to QuestionnaireResponseItemAnswer based on item type
function convertToAnswer(value: any, type?: string): QuestionnaireResponseItemAnswer {
  const answer: QuestionnaireResponseItemAnswer = {}
  
  switch (type) {
    case 'string':
    case 'text':
      answer.valueString = String(value)
      break
    case 'integer':
      answer.valueInteger = parseInt(value, 10)
      break
    case 'decimal':
      answer.valueDecimal = parseFloat(value)
      break
    case 'boolean':
      answer.valueBoolean = Boolean(value)
      break
    case 'date':
      answer.valueDate = value
      break
    case 'dateTime':
      answer.valueDateTime = value
      break
    case 'coding':
    case 'choice':
      if (typeof value === 'object' && value.code) {
        answer.valueCoding = value
      }
      break
    default:
      answer.valueString = String(value)
  }
  
  return answer
}

// Calculate value based on calculatedExpression
export function calculateValue(
  expression: string,
  responseItems: QuestionnaireResponseItem[],
  context: QuestionnaireContext
): any {
  // Build a context object with response values
  const responseContext = {
    ...context,
    QuestionnaireResponse: {
      item: responseItems
    }
  }
  
  try {
    const result = evaluateFHIRPath(expression, responseContext)
    return result.length > 0 ? result[0] : null
  } catch (e) {
    console.error('Error calculating value:', e)
    return null
  }
}

// Create a new QuestionnaireResponse
export function createQuestionnaireResponse(
  questionnaire: Questionnaire,
  patientRef: Reference,
  encounterRef?: Reference,
  authorRef?: Reference
): QuestionnaireResponse {
  const response: QuestionnaireResponse = {
    resourceType: 'QuestionnaireResponse',
    id: uuid4(),
    questionnaire: `Questionnaire/${questionnaire.id}`,
    status: 'in-progress',
    subject: patientRef,
    authored: new Date().toISOString(),
    item: []
  }
  
  if (encounterRef) {
    response.encounter = encounterRef as any
  }
  if (authorRef) {
    response.author = authorRef as any
  }
  
  return response
}

// Validate questionnaire response
export function validateResponse(
  questionnaire: Questionnaire,
  response: QuestionnaireResponse
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!questionnaire.item) {
    return { valid: true, errors: [] }
  }

  // Check required items
  for (const item of questionnaire.item) {
    validateItem(item, response.item || [], errors)
  }

  return { valid: errors.length === 0, errors }
}

function validateItem(
  questionnaireItem: QuestionnaireItem,
  responseItems: QuestionnaireResponseItem[],
  errors: string[]
): void {
  const responseItem = responseItems.find(r => r.linkId === questionnaireItem.linkId)
  
  // Check if required
  if (questionnaireItem.required) {
    if (!responseItem || !responseItem.answer || responseItem.answer.length === 0) {
      // Check if item is enabled
      if (evaluateEnableWhen(questionnaireItem, responseItems)) {
        errors.push(`Required field "${questionnaireItem.text || questionnaireItem.linkId}" is missing`)
      }
    }
  }

  // Check maxLength for string/text
  if (questionnaireItem.maxLength && responseItem?.answer) {
    for (const answer of responseItem.answer) {
      if (answer.valueString && answer.valueString.length > questionnaireItem.maxLength) {
        errors.push(`Field "${questionnaireItem.text}" exceeds maximum length of ${questionnaireItem.maxLength}`)
      }
    }
  }

  // Validate nested items
  if (questionnaireItem.item) {
    for (const child of questionnaireItem.item) {
      validateItem(child, responseItem?.item || [], errors)
    }
  }
}

// AI-powered questionnaire suggestions
export interface AISuggestion {
  linkId: string
  suggestedValue: any
  confidence: number
  reasoning: string
}

export async function getAISuggestionsForQuestionnaire(
  questionnaire: Questionnaire,
  context: QuestionnaireContext
): Promise<AISuggestion[]> {
  // This would call our AI endpoint to get suggestions based on patient context
  const suggestions: AISuggestion[] = []
  
  if (!questionnaire.item || !context.patient) {
    return suggestions
  }

  // For now, return mock suggestions based on context
  // In production, this would call /api/ai/questionnaire-suggest
  for (const item of questionnaire.item) {
    const suggestion = generateMockSuggestion(item, context)
    if (suggestion) {
      suggestions.push(suggestion)
    }
  }

  return suggestions
}

function generateMockSuggestion(item: QuestionnaireItem, context: QuestionnaireContext): AISuggestion | null {
  // Mock AI suggestions based on item text/linkId
  const text = (item.text || item.linkId).toLowerCase()
  
  if (text.includes('allerg') && context.patient) {
    return {
      linkId: item.linkId,
      suggestedValue: 'No known allergies',
      confidence: 0.85,
      reasoning: 'Based on patient record review'
    }
  }
  
  if (text.includes('chief complaint') && context.encounter) {
    return {
      linkId: item.linkId,
      suggestedValue: 'Chest pain',
      confidence: 0.9,
      reasoning: 'Extracted from encounter reason'
    }
  }

  if (text.includes('history') && context.conditions) {
    const conditionNames = context.conditions.map(c => c.code?.text).filter(Boolean).join(', ')
    if (conditionNames) {
      return {
        linkId: item.linkId,
        suggestedValue: conditionNames,
        confidence: 0.95,
        reasoning: 'Populated from active conditions'
      }
    }
  }

  return null
}
