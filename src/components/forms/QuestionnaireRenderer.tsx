'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, Save, Send, AlertCircle, CheckCircle, 
  Sparkles, ChevronDown, ChevronRight, Loader2 
} from 'lucide-react'
import type { 
  Questionnaire, 
  QuestionnaireItem, 
  QuestionnaireResponse, 
  QuestionnaireResponseItem,
  QuestionnaireResponseItemAnswer
} from '@medplum/fhirtypes'
import { 
  evaluateEnableWhen, 
  validateResponse,
  getAISuggestionsForQuestionnaire,
  type QuestionnaireContext,
  type AISuggestion
} from '@/lib/fhir/questionnaire-service'

// Item components
import { StringItem } from './items/StringItem'
import { TextItem } from './items/TextItem'
import { ChoiceItem } from './items/ChoiceItem'
import { BooleanItem } from './items/BooleanItem'
import { DateItem } from './items/DateItem'
import { IntegerItem } from './items/IntegerItem'
import { DecimalItem } from './items/DecimalItem'
import { GroupItem } from './items/GroupItem'

export interface QuestionnaireRendererProps {
  questionnaire: Questionnaire
  response?: QuestionnaireResponse
  context?: QuestionnaireContext
  onResponseChange?: (response: QuestionnaireResponse) => void
  onSubmit?: (response: QuestionnaireResponse) => void
  onSaveDraft?: (response: QuestionnaireResponse) => void
  readOnly?: boolean
  showAISuggestions?: boolean
  className?: string
}

export function QuestionnaireRenderer({
  questionnaire,
  response: initialResponse,
  context = {},
  onResponseChange,
  onSubmit,
  onSaveDraft,
  readOnly = false,
  showAISuggestions = true,
  className = ''
}: QuestionnaireRendererProps) {
  const [response, setResponse] = useState<QuestionnaireResponse>(() => 
    initialResponse || createEmptyResponse(questionnaire)
  )
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize expanded groups
  useEffect(() => {
    if (questionnaire.item) {
      const groupIds = new Set<string>()
      questionnaire.item.forEach(item => {
        if (item.type === 'group') {
          groupIds.add(item.linkId)
        }
      })
      setExpandedGroups(groupIds)
    }
  }, [questionnaire])

  // Fetch AI suggestions
  useEffect(() => {
    if (showAISuggestions && questionnaire) {
      setIsLoadingAI(true)
      getAISuggestionsForQuestionnaire(questionnaire, context)
        .then(setAiSuggestions)
        .finally(() => setIsLoadingAI(false))
    }
  }, [questionnaire, context, showAISuggestions])

  // Update response and notify parent
  const updateResponse = useCallback((newResponse: QuestionnaireResponse) => {
    setResponse(newResponse)
    onResponseChange?.(newResponse)
  }, [onResponseChange])

  // Update a specific item answer
  const updateItemAnswer = useCallback((linkId: string, answer: QuestionnaireResponseItemAnswer | null) => {
    setResponse(prev => {
      const newItems = updateItemInResponse(prev.item || [], linkId, answer)
      const newResponse = { ...prev, item: newItems }
      onResponseChange?.(newResponse)
      return newResponse
    })
  }, [onResponseChange])

  // Apply AI suggestion
  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    updateItemAnswer(suggestion.linkId, { valueString: String(suggestion.suggestedValue) })
  }, [updateItemAnswer])

  // Validate and submit
  const handleSubmit = useCallback(async () => {
    const validation = validateResponse(questionnaire, response)
    setValidationErrors(validation.errors)
    
    if (!validation.valid) {
      return
    }
    
    setIsSubmitting(true)
    try {
      const finalResponse = { ...response, status: 'completed' as const }
      await onSubmit?.(finalResponse)
    } finally {
      setIsSubmitting(false)
    }
  }, [questionnaire, response, onSubmit])

  // Save draft
  const handleSaveDraft = useCallback(() => {
    const draftResponse = { ...response, status: 'in-progress' as const }
    onSaveDraft?.(draftResponse)
  }, [response, onSaveDraft])

  // Toggle group expansion
  const toggleGroup = (linkId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(linkId)) {
        next.delete(linkId)
      } else {
        next.add(linkId)
      }
      return next
    })
  }

  // Get AI suggestion for item
  const getSuggestionForItem = (linkId: string) => {
    return aiSuggestions.find(s => s.linkId === linkId)
  }

  // Render a single questionnaire item
  const renderItem = (item: QuestionnaireItem, parentPath: string[] = []): React.ReactNode => {
    const currentPath = [...parentPath, item.linkId]
    const responseItem = findResponseItem(response.item || [], item.linkId)
    const isEnabled = evaluateEnableWhen(item, response.item || [])
    
    if (!isEnabled) return null
    
    const suggestion = getSuggestionForItem(item.linkId)
    const currentAnswer = responseItem?.answer?.[0]
    
    const commonProps = {
      item,
      answer: currentAnswer,
      onChange: (answer: QuestionnaireResponseItemAnswer | null) => updateItemAnswer(item.linkId, answer),
      readOnly,
      suggestion,
      onApplySuggestion: suggestion ? () => applySuggestion(suggestion) : undefined
    }

    switch (item.type) {
      case 'group':
        return (
          <GroupItem
            key={item.linkId}
            item={item}
            expanded={expandedGroups.has(item.linkId)}
            onToggle={() => toggleGroup(item.linkId)}
          >
            {item.item?.map(child => renderItem(child, currentPath))}
          </GroupItem>
        )
      
      case 'string':
        return <StringItem key={item.linkId} {...commonProps} />
      
      case 'text':
        return <TextItem key={item.linkId} {...commonProps} />
      
      case 'choice':
      case 'open-choice':
        return <ChoiceItem key={item.linkId} {...commonProps} />
      
      case 'boolean':
        return <BooleanItem key={item.linkId} {...commonProps} />
      
      case 'date':
        return <DateItem key={item.linkId} {...commonProps} type="date" />
      
      case 'dateTime':
        return <DateItem key={item.linkId} {...commonProps} type="dateTime" />
      
      case 'integer':
        return <IntegerItem key={item.linkId} {...commonProps} />
      
      case 'decimal':
        return <DecimalItem key={item.linkId} {...commonProps} />
      
      case 'display':
        return (
          <div key={item.linkId} className="py-2 text-sm text-muted-foreground">
            {item.text}
          </div>
        )
      
      default:
        return (
          <StringItem key={item.linkId} {...commonProps} />
        )
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {questionnaire.title || 'Questionnaire'}
            </CardTitle>
            {questionnaire.description && (
              <p className="text-sm text-muted-foreground mt-1">{questionnaire.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={response.status === 'completed' ? 'default' : 'secondary'}>
              {response.status || 'in-progress'}
            </Badge>
            {showAISuggestions && aiSuggestions.length > 0 && (
              <Badge variant="outline" className="gap-1 text-purple-600 border-purple-200">
                <Sparkles className="h-3 w-3" />
                {aiSuggestions.length} suggestions
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
              <AlertCircle className="h-4 w-4" />
              Please fix the following errors:
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Suggestions banner */}
        {showAISuggestions && isLoadingAI && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2 text-purple-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading AI suggestions...
          </div>
        )}

        {/* Render questionnaire items */}
        <div className="space-y-4">
          {questionnaire.item?.map(item => renderItem(item))}
        </div>
      </CardContent>
      
      {!readOnly && (
        <CardFooter className="flex justify-between border-t pt-4">
          <div>
            {onSaveDraft && (
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onSubmit && (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

// Helper functions
function createEmptyResponse(questionnaire: Questionnaire): QuestionnaireResponse {
  return {
    resourceType: 'QuestionnaireResponse',
    questionnaire: `Questionnaire/${questionnaire.id}`,
    status: 'in-progress',
    authored: new Date().toISOString(),
    item: []
  }
}

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

function updateItemInResponse(
  items: QuestionnaireResponseItem[], 
  linkId: string, 
  answer: QuestionnaireResponseItemAnswer | null
): QuestionnaireResponseItem[] {
  // Check if item exists
  const existingIndex = items.findIndex(i => i.linkId === linkId)
  
  if (existingIndex >= 0) {
    // Update existing item
    const newItems = [...items]
    if (answer) {
      newItems[existingIndex] = { ...newItems[existingIndex], answer: [answer] }
    } else {
      newItems[existingIndex] = { ...newItems[existingIndex], answer: undefined }
    }
    return newItems
  }
  
  // Check nested items
  let found = false
  const newItems = items.map(item => {
    if (item.item) {
      const updatedNested = updateItemInResponse(item.item, linkId, answer)
      if (updatedNested !== item.item) {
        found = true
        return { ...item, item: updatedNested }
      }
    }
    return item
  })
  
  if (found) return newItems
  
  // Add new item
  if (answer) {
    return [...items, { linkId, answer: [answer] }]
  }
  
  return items
}
