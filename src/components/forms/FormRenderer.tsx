'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Save, Send, RotateCcw } from 'lucide-react'

interface QuestionnaireItem {
  linkId: string
  text?: string
  type: string
  required?: boolean
  repeats?: boolean
  answerOption?: Array<{
    value: {
      Coding?: { code: string; display: string }
      string?: string
      integer?: number
    }
  }>
  item?: QuestionnaireItem[]
  extension?: Array<{
    url: string
    value: any
  }>
  enableWhen?: Array<{
    question: string
    operator: string
    answer: any
  }>
}

interface Questionnaire {
  id: string
  title: string
  status: string
  item: QuestionnaireItem[]
}

interface FormRendererProps {
  questionnaire: Questionnaire
  onSubmit?: (responses: Record<string, any>) => void
  onSaveDraft?: (responses: Record<string, any>) => void
  patientId?: string
}

export function FormRenderer({
  questionnaire,
  onSubmit,
  onSaveDraft,
  patientId,
}: FormRendererProps) {
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateResponse = (linkId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [linkId]: value }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit?.(responses)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setResponses({})
  }

  const checkEnableWhen = (item: QuestionnaireItem): boolean => {
    if (!item.enableWhen || item.enableWhen.length === 0) return true

    return item.enableWhen.every((condition) => {
      const answer = responses[condition.question]
      if (!answer) return false

      switch (condition.operator) {
        case '=':
          if (condition.answer?.Coding) {
            return answer === condition.answer.Coding.code
          }
          return answer === condition.answer?.boolean
        case '!=':
          return answer !== condition.answer
        default:
          return true
      }
    })
  }

  const renderItem = (item: QuestionnaireItem, depth: number = 0): JSX.Element | null => {
    if (!checkEnableWhen(item)) return null

    const itemControl = item.extension?.find(
      (e) => e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl'
    )?.value?.CodeableConcept?.coding?.[0]?.code

    switch (item.type) {
      case 'display':
        return (
          <div key={item.linkId} className="text-sm text-muted-foreground italic py-2">
            {item.text}
          </div>
        )

      case 'group':
        return (
          <div key={item.linkId} className={`space-y-4 ${depth > 0 ? 'ml-4 pl-4 border-l' : ''}`}>
            {item.text && (
              <h3 className={`font-semibold ${depth === 0 ? 'text-lg' : 'text-base'}`}>
                {item.text}
              </h3>
            )}
            {item.item?.map((child) => renderItem(child, depth + 1))}
          </div>
        )

      case 'string':
        return (
          <div key={item.linkId} className="space-y-2">
            <Label htmlFor={item.linkId}>
              {item.text}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={item.linkId}
              value={responses[item.linkId] || ''}
              onChange={(e) => updateResponse(item.linkId, e.target.value)}
              placeholder={`Enter ${item.text?.toLowerCase() || 'value'}`}
            />
          </div>
        )

      case 'text':
        return (
          <div key={item.linkId} className="space-y-2">
            <Label htmlFor={item.linkId}>
              {item.text}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={item.linkId}
              value={responses[item.linkId] || ''}
              onChange={(e) => updateResponse(item.linkId, e.target.value)}
              rows={3}
            />
          </div>
        )

      case 'integer':
      case 'decimal':
        return (
          <div key={item.linkId} className="space-y-2">
            <Label htmlFor={item.linkId}>
              {item.text}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={item.linkId}
              type="number"
              value={responses[item.linkId] || ''}
              onChange={(e) => updateResponse(item.linkId, parseFloat(e.target.value))}
            />
          </div>
        )

      case 'boolean':
        return (
          <div key={item.linkId} className="flex items-center gap-2">
            <Checkbox
              id={item.linkId}
              checked={responses[item.linkId] || false}
              onCheckedChange={(checked) => updateResponse(item.linkId, checked)}
            />
            <Label htmlFor={item.linkId} className="font-normal">
              {item.text}
            </Label>
          </div>
        )

      case 'choice':
        if (itemControl === 'radio-button') {
          return (
            <div key={item.linkId} className="space-y-2">
              <Label>
                {item.text}
                {item.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <RadioGroup
                value={responses[item.linkId] || ''}
                onValueChange={(value) => updateResponse(item.linkId, value)}
                className="flex gap-4"
              >
                {item.answerOption?.map((option, idx) => {
                  const value = option.value.Coding?.code || option.value.string || String(idx)
                  const label = option.value.Coding?.display || option.value.string || `Option ${idx + 1}`
                  return (
                    <div key={value} className="flex items-center gap-2">
                      <RadioGroupItem value={value} id={`${item.linkId}-${value}`} />
                      <Label htmlFor={`${item.linkId}-${value}`} className="font-normal">
                        {label}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>
          )
        }
        
        // Default dropdown
        return (
          <div key={item.linkId} className="space-y-2">
            <Label>
              {item.text}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={responses[item.linkId] || ''}
              onValueChange={(value) => updateResponse(item.linkId, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {item.answerOption?.map((option, idx) => {
                  const value = option.value.Coding?.code || option.value.string || String(idx)
                  const label = option.value.Coding?.display || option.value.string || `Option ${idx + 1}`
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        )

      case 'date':
        return (
          <div key={item.linkId} className="space-y-2">
            <Label htmlFor={item.linkId}>
              {item.text}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={item.linkId}
              type="date"
              value={responses[item.linkId] || ''}
              onChange={(e) => updateResponse(item.linkId, e.target.value)}
            />
          </div>
        )

      case 'dateTime':
        return (
          <div key={item.linkId} className="space-y-2">
            <Label htmlFor={item.linkId}>
              {item.text}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={item.linkId}
              type="datetime-local"
              value={responses[item.linkId] || ''}
              onChange={(e) => updateResponse(item.linkId, e.target.value)}
            />
          </div>
        )

      default:
        return (
          <div key={item.linkId} className="space-y-2">
            <Label>{item.text}</Label>
            <Input
              value={responses[item.linkId] || ''}
              onChange={(e) => updateResponse(item.linkId, e.target.value)}
            />
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{questionnaire.title}</CardTitle>
            <Badge variant="outline" className="mt-2">
              {questionnaire.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            {onSaveDraft && (
              <Button variant="outline" size="sm" onClick={() => onSaveDraft(responses)}>
                <Save className="h-4 w-4 mr-1" />
                Save Draft
              </Button>
            )}
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {questionnaire.item?.map((item) => renderItem(item))}
      </CardContent>
    </Card>
  )
}

export default FormRenderer
