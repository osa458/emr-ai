'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sparkles,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  ChevronRight,
  X,
  Send,
  Stethoscope,
  BookOpen,
  ClipboardList,
} from 'lucide-react'

interface AISidebarProps {
  patientId: string
  encounterId: string
  isOpen: boolean
  onClose: () => void
}

interface SelectionContext {
  text: string
  source: string
  timestamp: Date
}

interface AISuggestion {
  id: string
  type: 'diagnosis' | 'test' | 'medication' | 'info' | 'warning'
  title: string
  content: string
  confidence?: number
  source?: string
}

export function AISidebar({ patientId, encounterId, isOpen, onClose }: AISidebarProps) {
  const [selectedText, setSelectedText] = useState<SelectionContext | null>(null)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState('context')
  const [customQuery, setCustomQuery] = useState('')

  // Listen for text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()
      
      if (text && text.length > 3) {
        // Find the source element
        const range = selection?.getRangeAt(0)
        const container = range?.commonAncestorContainer
        let source = 'Clinical Note'
        
        // Try to find a card title or section header
        const cardElement = container?.parentElement?.closest('[data-section]')
        if (cardElement) {
          source = cardElement.getAttribute('data-section') || source
        }
        
        setSelectedText({
          text,
          source,
          timestamp: new Date(),
        })
        setActiveTab('context')
      }
    }

    document.addEventListener('mouseup', handleSelection)
    return () => document.removeEventListener('mouseup', handleSelection)
  }, [])

  // Analyze selected text
  const analyzeSelection = useCallback(async () => {
    if (!selectedText) return
    
    setIsAnalyzing(true)
    setSuggestions([])

    // Simulate AI analysis - in production, this would call the API
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Generate contextual suggestions based on selected text
    const newSuggestions: AISuggestion[] = []
    const textLower = selectedText.text.toLowerCase()

    // Check for clinical terms and provide relevant suggestions
    if (textLower.includes('chest pain') || textLower.includes('angina')) {
      newSuggestions.push({
        id: '1',
        type: 'diagnosis',
        title: 'Consider Acute Coronary Syndrome',
        content: 'Based on the mention of chest pain, consider ruling out ACS with serial troponins, EKG, and risk stratification using HEART score.',
        confidence: 0.85,
      })
      newSuggestions.push({
        id: '2',
        type: 'test',
        title: 'Recommended Workup',
        content: 'Serial troponins (0h, 3h, 6h), 12-lead EKG, Chest X-ray, BMP, CBC',
      })
    }

    if (textLower.includes('shortness of breath') || textLower.includes('dyspnea') || textLower.includes('sob')) {
      newSuggestions.push({
        id: '3',
        type: 'diagnosis',
        title: 'Differential Diagnosis',
        content: 'Consider: CHF exacerbation, COPD exacerbation, Pneumonia, Pulmonary embolism, Anxiety',
        confidence: 0.78,
      })
      newSuggestions.push({
        id: '4',
        type: 'test',
        title: 'Suggested Tests',
        content: 'BNP/NT-proBNP, D-dimer (if PE suspected), ABG, Chest X-ray, CT-PA if indicated',
      })
    }

    if (textLower.includes('creatinine') || textLower.includes('kidney') || textLower.includes('aki')) {
      newSuggestions.push({
        id: '5',
        type: 'warning',
        title: 'Renal Function Alert',
        content: 'Monitor for contrast-induced nephropathy if imaging planned. Consider holding nephrotoxic medications.',
      })
      newSuggestions.push({
        id: '6',
        type: 'medication',
        title: 'Medication Considerations',
        content: 'Review dose adjustments for: Metformin (hold if Cr >1.5), Gabapentin, ACE inhibitors, NSAIDs (avoid)',
      })
    }

    if (textLower.includes('diabetes') || textLower.includes('glucose') || textLower.includes('a1c')) {
      newSuggestions.push({
        id: '7',
        type: 'info',
        title: 'Diabetes Management',
        content: 'Consider checking HbA1c if not done in 3 months. Review home glucose logs and adjust insulin regimen as needed.',
      })
    }

    if (textLower.includes('infection') || textLower.includes('fever') || textLower.includes('wbc')) {
      newSuggestions.push({
        id: '8',
        type: 'diagnosis',
        title: 'Infection Workup',
        content: 'Consider source identification: UA/UCx, Blood cultures x2, Chest X-ray, Procalcitonin',
        confidence: 0.72,
      })
    }

    // Default suggestion if no specific matches
    if (newSuggestions.length === 0) {
      newSuggestions.push({
        id: '9',
        type: 'info',
        title: 'Clinical Context',
        content: `Selected text: "${selectedText.text.substring(0, 100)}${selectedText.text.length > 100 ? '...' : ''}"`,
      })
      newSuggestions.push({
        id: '10',
        type: 'info',
        title: 'No Specific Suggestions',
        content: 'Try selecting a specific clinical finding, diagnosis, or lab value for more targeted assistance.',
      })
    }

    setSuggestions(newSuggestions)
    setIsAnalyzing(false)
  }, [selectedText])

  // Auto-analyze when text is selected
  useEffect(() => {
    if (selectedText) {
      analyzeSelection()
    }
  }, [selectedText, analyzeSelection])

  const handleCustomQuery = async () => {
    if (!customQuery.trim()) return
    
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSuggestions([{
      id: 'custom',
      type: 'info',
      title: 'Response',
      content: `Analysis for: "${customQuery}" - In production, this would provide clinical decision support based on the patient's full context.`,
    }])
    
    setIsAnalyzing(false)
    setCustomQuery('')
  }

  const getSuggestionIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'diagnosis': return <Stethoscope className="h-4 w-4" />
      case 'test': return <ClipboardList className="h-4 w-4" />
      case 'medication': return <BookOpen className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getSuggestionColor = (type: AISuggestion['type']) => {
    switch (type) {
      case 'diagnosis': return 'border-l-blue-500 bg-blue-50'
      case 'test': return 'border-l-green-500 bg-green-50'
      case 'medication': return 'border-l-purple-500 bg-purple-50'
      case 'warning': return 'border-l-amber-500 bg-amber-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="font-semibold">AI Clinical Assistant</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="context" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-1" />
            Context
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex-1">
            <Lightbulb className="h-4 w-4 mr-1" />
            Suggestions
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="context" className="mt-0 space-y-4">
            {/* Selected Text */}
            {selectedText ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Selected Text</CardTitle>
                    <Badge variant="outline" className="text-xs">{selectedText.source}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                    &ldquo;{selectedText.text.substring(0, 200)}{selectedText.text.length > 200 ? '...' : ''}&rdquo;
                  </p>
                  <Button 
                    className="w-full mt-3" 
                    size="sm"
                    onClick={analyzeSelection}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Select text from the patient chart to get AI-powered clinical insights
                  </p>
                </CardContent>
              </Card>
            )}

            {/* AI Suggestions */}
            {isAnalyzing ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">AI Insights</h3>
                {suggestions.map(suggestion => (
                  <Card 
                    key={suggestion.id}
                    className={`border-l-4 ${getSuggestionColor(suggestion.type)}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{suggestion.title}</h4>
                            {suggestion.confidence && (
                              <Badge variant="outline" className="text-xs">
                                {Math.round(suggestion.confidence * 100)}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {suggestion.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="suggestions" className="mt-0 space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  Generate Assessment & Plan
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  Summarize Hospital Course
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  Review Medication Interactions
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  Suggest Differential Diagnoses
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Custom Query */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ask a Question</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="Ask about this patient..."
                    className="flex-1 px-3 py-2 text-sm border rounded-md"
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomQuery()}
                  />
                  <Button size="sm" onClick={handleCustomQuery} disabled={isAnalyzing}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer Disclaimer */}
      <div className="p-3 border-t bg-muted/50">
        <p className="text-xs text-muted-foreground text-center">
          AI suggestions are for decision support only. Always verify with clinical judgment.
        </p>
      </div>
    </div>
  )
}
