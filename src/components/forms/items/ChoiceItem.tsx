'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Check } from 'lucide-react'
import type { QuestionnaireItem, QuestionnaireResponseItemAnswer, Coding } from '@medplum/fhirtypes'
import type { AISuggestion } from '@/lib/fhir/questionnaire-service'

export interface ItemProps {
  item: QuestionnaireItem
  answer?: QuestionnaireResponseItemAnswer
  onChange: (answer: QuestionnaireResponseItemAnswer | null) => void
  readOnly?: boolean
  suggestion?: AISuggestion
  onApplySuggestion?: () => void
}

export function ChoiceItem({ item, answer, onChange, readOnly, suggestion, onApplySuggestion }: ItemProps) {
  const selectedCode = answer?.valueCoding?.code || answer?.valueString
  
  // Get answer options from item
  const options: { code: string; display: string }[] = []
  
  if (item.answerOption) {
    item.answerOption.forEach(opt => {
      if (opt.valueCoding) {
        options.push({ code: opt.valueCoding.code || '', display: opt.valueCoding.display || opt.valueCoding.code || '' })
      } else if (opt.valueString) {
        options.push({ code: opt.valueString, display: opt.valueString })
      }
    })
  }

  const handleSelect = (code: string, display: string) => {
    if (readOnly) return
    
    if (selectedCode === code) {
      onChange(null)
    } else {
      onChange({ valueCoding: { code, display } })
    }
  }

  // Determine display style based on number of options
  const useRadioStyle = options.length <= 5
  const useDropdown = options.length > 10

  if (useDropdown) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">
          {item.text}
          {item.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <select
          value={selectedCode || ''}
          onChange={(e) => {
            const opt = options.find(o => o.code === e.target.value)
            if (opt) {
              onChange({ valueCoding: { code: opt.code, display: opt.display } })
            } else {
              onChange(null)
            }
          }}
          disabled={readOnly}
          className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
        >
          <option value="">Select...</option>
          {options.map(opt => (
            <option key={opt.code} value={opt.code}>{opt.display}</option>
          ))}
        </select>
        
        {suggestion && !selectedCode && (
          <button
            onClick={onApplySuggestion}
            className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700"
          >
            <Sparkles className="h-3 w-3" />
            <span>Suggestion: {suggestion.suggestedValue}</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {item.text}
        {item.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className={useRadioStyle ? 'space-y-2' : 'flex flex-wrap gap-2'}>
        {options.map(opt => (
          <button
            key={opt.code}
            type="button"
            onClick={() => handleSelect(opt.code, opt.display)}
            disabled={readOnly}
            className={`${
              useRadioStyle 
                ? 'flex items-center gap-2 w-full text-left px-3 py-2 border rounded-md text-sm'
                : 'px-3 py-1.5 border rounded-md text-sm'
            } ${
              selectedCode === opt.code
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'hover:bg-slate-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {useRadioStyle && (
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedCode === opt.code ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
              }`}>
                {selectedCode === opt.code && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            )}
            {opt.display}
            {!useRadioStyle && selectedCode === opt.code && (
              <Check className="h-3 w-3 ml-1 inline" />
            )}
          </button>
        ))}
      </div>
      
      {suggestion && !selectedCode && (
        <button
          onClick={onApplySuggestion}
          className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 mt-1"
        >
          <Sparkles className="h-3 w-3" />
          <span>Suggestion: {suggestion.suggestedValue}</span>
          <Badge variant="outline" className="text-[10px] ml-1">{Math.round(suggestion.confidence * 100)}%</Badge>
        </button>
      )}
    </div>
  )
}
