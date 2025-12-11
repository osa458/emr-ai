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

export function BooleanItem({ item, answer, onChange, readOnly, suggestion, onApplySuggestion }: ItemProps) {
  const value = answer?.valueBoolean

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onChange(value === true ? null : { valueBoolean: true })}
          disabled={readOnly}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            value === true
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-slate-300 hover:border-blue-400'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {value === true && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        
        <div className="flex-1">
          <label className="text-sm font-medium cursor-pointer" onClick={() => !readOnly && onChange(value === true ? null : { valueBoolean: true })}>
            {item.text}
            {item.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {suggestion && value === undefined && (
            <button
              onClick={onApplySuggestion}
              className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 mt-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Suggestion: {suggestion.suggestedValue ? 'Yes' : 'No'}</span>
              <Badge variant="outline" className="text-[10px] ml-1">{Math.round(suggestion.confidence * 100)}%</Badge>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
