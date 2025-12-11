'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'
import type { QuestionnaireItem, QuestionnaireResponseItemAnswer } from '@medplum/fhirtypes'
import type { AISuggestion } from '@/lib/fhir/questionnaire-service'

export interface ItemProps {
  item: QuestionnaireItem
  answer?: QuestionnaireResponseItemAnswer
  onChange: (answer: QuestionnaireResponseItemAnswer | null) => void
  readOnly?: boolean
  suggestion?: AISuggestion
  onApplySuggestion?: () => void
}

export function IntegerItem({ item, answer, onChange, readOnly, suggestion, onApplySuggestion }: ItemProps) {
  const value = answer?.valueInteger

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {item.text}
        {item.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const num = parseInt(e.target.value, 10)
          onChange(isNaN(num) ? null : { valueInteger: num })
        }}
        disabled={readOnly}
        step="1"
        className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
      />
      
      {suggestion && value === undefined && (
        <button
          onClick={onApplySuggestion}
          className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700"
        >
          <Sparkles className="h-3 w-3" />
          <span>Suggestion: {suggestion.suggestedValue}</span>
          <Badge variant="outline" className="text-[10px] ml-1">{Math.round(suggestion.confidence * 100)}%</Badge>
        </button>
      )}
    </div>
  )
}
