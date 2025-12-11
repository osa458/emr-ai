'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Stethoscope,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import type { DiagnosticAssistOutput } from '@/lib/llm/schemas'

interface DiagnosticAssistPanelProps {
  patientId: string
  encounterId?: string
}

const confidenceColors = {
  high: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800',
}

export function DiagnosticAssistPanel({
  patientId,
  encounterId,
}: DiagnosticAssistPanelProps) {
  const [selectedText, setSelectedText] = useState('')
  const [result, setResult] = useState<DiagnosticAssistOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const handleAnalyze = async () => {
    if (!selectedText.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/diagnostic-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedText, patientId, encounterId }),
      })
      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('Diagnostic assist error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-blue-600" />
          Diagnostic Assist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Area */}
        <div>
          <label className="text-sm font-medium">
            Enter or paste clinical text to analyze:
          </label>
          <textarea
            className="mt-1 w-full rounded-md border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="e.g., Patient presents with chest pain radiating to left arm, diaphoresis, and shortness of breath..."
            value={selectedText}
            onChange={(e) => setSelectedText(e.target.value)}
          />
          <Button
            className="mt-2"
            onClick={handleAnalyze}
            disabled={isLoading || !selectedText.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Lightbulb className="mr-2 h-4 w-4" />
                Analyze
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {result.clinicalContext}
            </div>

            {result.suggestions.map((suggestion, i) => (
              <div key={i} className="rounded-lg border">
                <button
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                  onClick={() =>
                    setExpandedIndex(expandedIndex === i ? null : i)
                  }
                >
                  <div className="flex items-center gap-3">
                    <Badge className={confidenceColors[suggestion.confidence]}>
                      {suggestion.confidence}
                    </Badge>
                    <div>
                      <div className="font-medium">{suggestion.condition}</div>
                      <div className="text-sm text-muted-foreground">
                        {suggestion.icd10Code}
                      </div>
                    </div>
                  </div>
                  {expandedIndex === i ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {expandedIndex === i && (
                  <div className="border-t p-4 space-y-3 bg-gray-50">
                    <div>
                      <div className="font-medium text-sm">Rationale</div>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.rationale}
                      </p>
                    </div>

                    {suggestion.supportingEvidence.length > 0 && (
                      <div>
                        <div className="font-medium text-sm">
                          Supporting Evidence
                        </div>
                        <ul className="text-sm text-muted-foreground list-disc pl-4">
                          {suggestion.supportingEvidence.map((e, j) => (
                            <li key={j}>
                              <span className="font-medium">[{e.type}]</span>{' '}
                              {e.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {suggestion.differentialConsiderations && (
                      <div>
                        <div className="font-medium text-sm">
                          Differential Considerations
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestion.differentialConsiderations.map((d, j) => (
                            <Badge key={j} variant="outline">
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestion.suggestedWorkup && (
                      <div>
                        <div className="font-medium text-sm">
                          Suggested Workup
                        </div>
                        <ul className="text-sm text-muted-foreground list-disc pl-4">
                          {suggestion.suggestedWorkup.map((w, j) => (
                            <li key={j}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Limitations */}
            {result.limitations.length > 0 && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <div className="flex items-center gap-2 font-medium text-yellow-800 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Limitations
                </div>
                <ul className="text-sm text-yellow-700 list-disc pl-6 mt-1">
                  {result.limitations.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
