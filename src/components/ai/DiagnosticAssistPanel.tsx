'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Stethoscope,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Brain,
  Activity,
  Pill,
  FileText,
  RefreshCw,
} from 'lucide-react'
import type { DiagnosticAssistOutput } from '@/lib/llm/schemas'
import {
  usePatientConditions,
  usePatientLabs,
  usePatientVitals,
  usePatientMedications,
} from '@/hooks/useFHIRData'
import type { Condition, Observation, MedicationRequest } from '@medplum/fhirtypes'

interface DiagnosticAssistPanelProps {
  patientId: string
  encounterId?: string
  patientName?: string
}

// Filter out social determinant findings
const isMedicalCondition = (condition: Condition): boolean => {
  const name = condition.code?.text || condition.code?.coding?.[0]?.display || ''
  const excludePatterns = [
    '(finding)', '(situation)', '(social concept)', 'employment', 'education',
    'housing', 'stress', 'lack of', 'Received higher', 'Social isolation',
    'Misuses drugs', 'Full-time employment', 'Part-time employment',
  ]
  const lowerName = name.toLowerCase()
  return !excludePatterns.some(pattern => lowerName.includes(pattern.toLowerCase()))
}

// Generate differential diagnosis suggestions based on patient data
function generateSmartDifferentials(
  conditions: Condition[],
  labs: Observation[],
  vitals: Observation[],
  medications: MedicationRequest[]
): { differentials: string[]; workup: string[]; considerations: string[] } {
  const differentials: string[] = []
  const workup: string[] = []
  const considerations: string[] = []
  
  const problemNames = conditions
    .filter(isMedicalCondition)
    .filter(c => c.clinicalStatus?.coding?.[0]?.code === 'active')
    .map(c => (c.code?.text || c.code?.coding?.[0]?.display || '').toLowerCase())
  
  const findLab = (codes: string[], names: string[]): Observation | undefined => {
    return labs.find(l => {
      const code = l.code?.coding?.[0]?.code || ''
      const name = (l.code?.text || l.code?.coding?.[0]?.display || '').toLowerCase()
      return codes.includes(code) || names.some(n => name.includes(n))
    })
  }
  
  const findVital = (code: string): number | undefined => {
    const v = vitals.find(v => v.code?.coding?.[0]?.code === code)
    return v?.valueQuantity?.value
  }

  // Chest pain differentials
  if (problemNames.some(p => p.includes('chest pain') || p.includes('angina'))) {
    differentials.push('Acute Coronary Syndrome', 'Pulmonary Embolism', 'Aortic Dissection', 'GERD', 'Musculoskeletal')
    workup.push('12-lead ECG', 'Serial troponins', 'Chest X-ray', 'D-dimer if PE suspected')
    considerations.push('Risk stratify with HEART score', 'Consider CT-PA if Wells score elevated')
  }
  
  // Shortness of breath
  if (problemNames.some(p => p.includes('dyspnea') || p.includes('shortness of breath'))) {
    const bnp = findLab(['33762-6', '42637-9'], ['bnp', 'natriuretic'])
    differentials.push('Heart Failure Exacerbation', 'COPD/Asthma Exacerbation', 'Pneumonia', 'PE', 'Anemia')
    workup.push('BNP/NT-proBNP', 'Chest X-ray', 'ABG if hypoxic', 'Pulmonary function tests')
    if (bnp?.valueQuantity?.value && bnp.valueQuantity.value > 300) {
      considerations.push(`Elevated BNP (${bnp.valueQuantity.value}) suggests cardiac etiology`)
    }
  }
  
  // Diabetes complications
  if (problemNames.some(p => p.includes('diabetes'))) {
    const glucose = findLab(['2345-7', '2339-0'], ['glucose'])
    const cr = findLab(['2160-0'], ['creatinine'])
    if (glucose?.valueQuantity?.value && glucose.valueQuantity.value > 250) {
      differentials.push('DKA', 'HHS', 'Infection precipitant')
      workup.push('Anion gap', 'Beta-hydroxybutyrate', 'Serum osmolality', 'Urinalysis')
    }
    if (cr?.valueQuantity?.value && cr.valueQuantity.value > 1.5) {
      considerations.push('Consider diabetic nephropathy workup: urine albumin/creatinine ratio')
    }
  }
  
  // Hypertension complications
  if (problemNames.some(p => p.includes('hypertension'))) {
    const sbp = findVital('8480-6')
    if (sbp && sbp >= 180) {
      differentials.push('Hypertensive Emergency', 'Hypertensive Urgency', 'Secondary Hypertension')
      workup.push('Renal function', 'Urinalysis', 'ECG', 'Fundoscopy')
      considerations.push('Assess for target organ damage', 'Consider secondary causes if resistant')
    }
  }
  
  // Anemia workup
  const hgb = findLab(['718-7'], ['hemoglobin'])
  if (hgb?.valueQuantity?.value && hgb.valueQuantity.value < 10) {
    differentials.push('Iron deficiency anemia', 'Anemia of chronic disease', 'B12/Folate deficiency', 'GI blood loss')
    workup.push('Iron studies', 'B12/Folate', 'Reticulocyte count', 'Peripheral smear')
    considerations.push('Consider GI evaluation if iron deficiency confirmed')
  }
  
  // Renal impairment
  const cr = findLab(['2160-0'], ['creatinine'])
  if (cr?.valueQuantity?.value && cr.valueQuantity.value > 2.0) {
    differentials.push('Acute Kidney Injury', 'CKD progression', 'Prerenal azotemia', 'Obstructive uropathy')
    workup.push('Renal ultrasound', 'Urinalysis with sediment', 'FENa', 'Urine protein/creatinine')
    considerations.push('Review nephrotoxic medications', 'Consider nephrology consultation')
  }

  // Default suggestions
  if (differentials.length === 0) {
    considerations.push('Review active problem list for targeted diagnostic approach')
    considerations.push('Consider comprehensive metabolic panel and CBC if not recent')
  }

  return { differentials, workup, considerations }
}

const confidenceColors = {
  high: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800',
}

export function DiagnosticAssistPanel({
  patientId,
  encounterId,
  patientName,
}: DiagnosticAssistPanelProps) {
  const [selectedText, setSelectedText] = useState('')
  const [result, setResult] = useState<DiagnosticAssistOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)
  const [smartAnalysis, setSmartAnalysis] = useState<{
    differentials: string[]
    workup: string[]
    considerations: string[]
  } | null>(null)

  // Fetch patient data for smart analysis
  const { data: conditions = [] } = usePatientConditions(patientId)
  const { data: labs = [] } = usePatientLabs(patientId)
  const { data: vitals = [] } = usePatientVitals(patientId)
  const { inpatientMedications = [] } = usePatientMedications(patientId)

  // Auto-generate smart differentials when data loads
  useEffect(() => {
    if (conditions.length > 0 || labs.length > 0) {
      const analysis = generateSmartDifferentials(conditions, labs, vitals, inpatientMedications)
      setSmartAnalysis(analysis)
    }
  }, [conditions, labs, vitals, inpatientMedications])

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

  const handleRefreshAnalysis = () => {
    if (conditions.length > 0 || labs.length > 0) {
      const analysis = generateSmartDifferentials(conditions, labs, vitals, inpatientMedications)
      setSmartAnalysis(analysis)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Diagnostic Assist
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshAnalysis}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="smart">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="smart">
              <Brain className="h-4 w-4 mr-1" />
              Smart Analysis
            </TabsTrigger>
            <TabsTrigger value="custom">
              <FileText className="h-4 w-4 mr-1" />
              Custom Query
            </TabsTrigger>
          </TabsList>

          {/* Smart Analysis Tab - Auto-generated from patient data */}
          <TabsContent value="smart" className="space-y-4">
            {smartAnalysis && (smartAnalysis.differentials.length > 0 || smartAnalysis.considerations.length > 0) ? (
              <>
                {/* Differential Diagnoses */}
                {smartAnalysis.differentials.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2 text-blue-700">
                      <Stethoscope className="h-4 w-4" />
                      Differential Diagnoses to Consider
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {smartAnalysis.differentials.map((dx, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                          {dx}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Workup */}
                {smartAnalysis.workup.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2 text-purple-700">
                      <Activity className="h-4 w-4" />
                      Recommended Workup
                    </h4>
                    <div className="space-y-1">
                      {smartAnalysis.workup.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-purple-50 border border-purple-200 rounded p-2">
                          <span className="text-purple-600">→</span>
                          <span className="text-purple-800">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Considerations */}
                {smartAnalysis.considerations.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2 text-amber-700">
                      <Lightbulb className="h-4 w-4" />
                      Clinical Considerations
                    </h4>
                    <div className="space-y-1">
                      {smartAnalysis.considerations.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded p-2">
                          <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span className="text-amber-800">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Analyzing patient data for diagnostic insights...</p>
                <p className="text-xs mt-1">Add conditions or labs to generate smart differentials</p>
              </div>
            )}
          </TabsContent>

          {/* Custom Query Tab */}
          <TabsContent value="custom" className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Enter clinical text to analyze:
              </label>
              <textarea
                className="mt-1 w-full rounded-md border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="e.g., Patient presents with chest pain radiating to left arm, diaphoresis..."
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
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

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
