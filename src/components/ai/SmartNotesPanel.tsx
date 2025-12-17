'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sparkles,
  FileText,
  AlertTriangle,
  TrendingUp,
  Pill,
  Activity,
  Loader2,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react'
import {
  usePatientConditions,
  usePatientLabs,
  usePatientVitals,
  usePatientMedications,
  usePatientProcedures,
} from '@/hooks/useFHIRData'
import type { Condition, Observation, MedicationRequest, Procedure } from '@medplum/fhirtypes'

interface SmartNotesPanelProps {
  patientId: string
  patientName?: string
}

interface ClinicalSummary {
  chiefComplaint: string
  clinicalSummary: string
  activeProblems: string[]
  keyFindings: { vitals: string; labs: string }
  medicationSummary: string
  recentLabs: { name: string; value: string; interpretation: string }[]
  vitals: { name: string; value: string; status: string }[]
  medications: string[]
  recommendations: string[]
  clinicalAlerts: string[]
  isAIGenerated?: boolean
}

// Helper to format condition name
const formatConditionName = (condition: Condition): string => {
  return condition.code?.text || 
         condition.code?.coding?.[0]?.display || 
         'Unknown condition'
}

// Helper to format observation
const formatObservation = (obs: Observation): { name: string; value: string; interpretation: string } => {
  const name = obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown'
  const value = obs.valueQuantity?.value 
    ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit || ''}`
    : 'No value'
  const interp = obs.interpretation?.[0]?.coding?.[0]?.code || 'N'
  const interpretation = interp === 'H' ? 'High' : interp === 'L' ? 'Low' : 'Normal'
  return { name, value, interpretation }
}

// Helper to format vital sign
const formatVital = (obs: Observation): { name: string; value: string; status: string } => {
  const name = obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown'
  let value = 'No value'
  
  if (obs.valueQuantity?.value) {
    value = `${Math.round(obs.valueQuantity.value * 10) / 10} ${obs.valueQuantity.unit || ''}`
  }
  
  // Determine status based on common vital ranges
  let status = 'normal'
  const val = obs.valueQuantity?.value
  const code = obs.code?.coding?.[0]?.code
  
  if (val && code) {
    if (code === '8480-6' && (val > 140 || val < 90)) status = val > 140 ? 'high' : 'low' // Systolic
    if (code === '8462-4' && (val > 90 || val < 60)) status = val > 90 ? 'high' : 'low' // Diastolic
    if (code === '8867-4' && (val > 100 || val < 60)) status = val > 100 ? 'high' : 'low' // Heart rate
    if (code === '2708-6' && val < 94) status = 'low' // O2 sat
    if (code === '8310-5' && (val > 38 || val < 36)) status = val > 38 ? 'high' : 'low' // Temp
  }
  
  return { name, value, status }
}

// Helper to format medication
const formatMedication = (med: MedicationRequest): string => {
  const name = med.medicationCodeableConcept?.text || 
               med.medicationCodeableConcept?.coding?.[0]?.display || 
               'Unknown medication'
  const dosage = med.dosageInstruction?.[0]
  const dose = dosage?.doseAndRate?.[0]?.doseQuantity?.value || ''
  const unit = dosage?.doseAndRate?.[0]?.doseQuantity?.unit || ''
  const freq = dosage?.timing?.code?.coding?.[0]?.display || 
               dosage?.timing?.repeat?.frequency || ''
  
  return dose ? `${name} ${dose}${unit} ${freq}`.trim() : name
}

// Generate clinical summary from FHIR data
function generateClinicalSummary(
  conditions: Condition[],
  labs: Observation[],
  vitals: Observation[],
  medications: MedicationRequest[]
): ClinicalSummary {
  const activeProblems = conditions
    .filter(c => c.clinicalStatus?.coding?.[0]?.code === 'active')
    .map(formatConditionName)
    .slice(0, 8)

  // Get most recent vitals (one of each type)
  const vitalsByType = new Map<string, Observation>()
  vitals.forEach(v => {
    const code = v.code?.coding?.[0]?.code
    if (code && !vitalsByType.has(code)) {
      vitalsByType.set(code, v)
    }
  })
  const recentVitals = Array.from(vitalsByType.values())
    .slice(0, 6)
    .map(formatVital)

  // Get abnormal labs
  const abnormalLabs = labs
    .filter(l => {
      const interp = l.interpretation?.[0]?.coding?.[0]?.code
      return interp === 'H' || interp === 'L' || interp === 'HH' || interp === 'LL'
    })
    .slice(0, 6)
    .map(formatObservation)

  // Get recent normal labs if not enough abnormal
  const recentLabs = abnormalLabs.length >= 3 
    ? abnormalLabs 
    : [...abnormalLabs, ...labs.slice(0, 6 - abnormalLabs.length).map(formatObservation)]

  const activeMeds = medications
    .filter(m => m.status === 'active')
    .map(formatMedication)
    .slice(0, 10)

  // Generate recommendations based on conditions and labs
  const recommendations: string[] = []
  const clinicalAlerts: string[] = []

  // Check for common clinical scenarios
  if (activeProblems.some(p => p.toLowerCase().includes('diabetes'))) {
    const hba1c = labs.find(l => l.code?.coding?.[0]?.code === '4548-4')
    if (hba1c && hba1c.valueQuantity?.value && hba1c.valueQuantity.value > 7) {
      recommendations.push('Consider intensifying diabetes management - HbA1c above target')
    }
    recommendations.push('Ensure annual diabetic eye exam and foot exam are current')
  }

  if (activeProblems.some(p => p.toLowerCase().includes('hypertension'))) {
    const systolic = vitals.find(v => v.code?.coding?.[0]?.code === '8480-6')
    if (systolic && systolic.valueQuantity?.value && systolic.valueQuantity.value > 140) {
      clinicalAlerts.push('Blood pressure above target - consider medication adjustment')
    }
    recommendations.push('Continue monitoring blood pressure and sodium restriction')
  }

  // Check for critical lab values
  const potassium = labs.find(l => l.code?.coding?.[0]?.code === '2823-3')
  if (potassium?.valueQuantity?.value) {
    const k = potassium.valueQuantity.value
    if (k > 5.5) clinicalAlerts.push(`Critical: Potassium ${k} mEq/L - risk of arrhythmia`)
    if (k < 3.0) clinicalAlerts.push(`Critical: Potassium ${k} mEq/L - risk of arrhythmia`)
  }

  const creatinine = labs.find(l => l.code?.coding?.[0]?.code === '2160-0')
  if (creatinine?.valueQuantity?.value && creatinine.valueQuantity.value > 2.0) {
    clinicalAlerts.push('Elevated creatinine - review nephrotoxic medications')
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Continue current management plan')
    recommendations.push('Schedule follow-up as appropriate')
  }

  // Determine chief complaint from most recent/severe condition
  const chiefComplaint = activeProblems[0] || 'Routine follow-up'

  return {
    chiefComplaint,
    clinicalSummary: '',
    activeProblems,
    keyFindings: { vitals: '', labs: '' },
    medicationSummary: '',
    recentLabs,
    vitals: recentVitals,
    medications: activeMeds,
    recommendations,
    clinicalAlerts,
    isAIGenerated: false,
  }
}

// Generate narrative summary
function generateNarrativeSummary(summary: ClinicalSummary, patientName?: string): string {
  const name = patientName || 'The patient'
  
  let narrative = `**Clinical Summary**\n\n`
  
  narrative += `${name} presents with ${summary.chiefComplaint.toLowerCase()}. `
  
  if (summary.activeProblems.length > 0) {
    narrative += `Active problems include ${summary.activeProblems.slice(0, 3).join(', ')}`
    if (summary.activeProblems.length > 3) {
      narrative += ` and ${summary.activeProblems.length - 3} other condition(s)`
    }
    narrative += `. `
  }

  if (summary.vitals.length > 0) {
    const bp = summary.vitals.find(v => v.name.toLowerCase().includes('systolic'))
    const hr = summary.vitals.find(v => v.name.toLowerCase().includes('heart'))
    const o2 = summary.vitals.find(v => v.name.toLowerCase().includes('oxygen'))
    
    narrative += `\n\n**Vitals:** `
    if (bp) narrative += `BP ${bp.value.replace(' mmHg', '')} `
    if (hr) narrative += `HR ${hr.value.replace(' /min', '')} `
    if (o2) narrative += `SpO2 ${o2.value.replace(' %', '')}% `
  }

  if (summary.recentLabs.length > 0) {
    const abnormal = summary.recentLabs.filter(l => l.interpretation !== 'Normal')
    if (abnormal.length > 0) {
      narrative += `\n\n**Notable Labs:** `
      narrative += abnormal.map(l => `${l.name}: ${l.value} (${l.interpretation})`).join(', ')
    }
  }

  if (summary.medications.length > 0) {
    narrative += `\n\n**Active Medications:** ${summary.medications.length} medications including ${summary.medications.slice(0, 3).join(', ')}`
    if (summary.medications.length > 3) {
      narrative += ` and ${summary.medications.length - 3} others`
    }
  }

  if (summary.clinicalAlerts.length > 0) {
    narrative += `\n\n**⚠️ Alerts:**\n`
    narrative += summary.clinicalAlerts.map((a: string) => `- ${a}`).join('\n')
  }

  if (summary.recommendations.length > 0) {
    narrative += `\n\n**Recommendations:**\n`
    narrative += summary.recommendations.map(r => `- ${r}`).join('\n')
  }

  return narrative
}

export function SmartNotesPanel({ patientId, patientName }: SmartNotesPanelProps) {
  const [summary, setSummary] = useState<ClinicalSummary | null>(null)
  const [narrative, setNarrative] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Fetch real FHIR data
  const { data: conditions = [], isLoading: conditionsLoading } = usePatientConditions(patientId)
  const { data: labs = [], isLoading: labsLoading } = usePatientLabs(patientId)
  const { data: vitals = [], isLoading: vitalsLoading } = usePatientVitals(patientId)
  const { inpatientMedications = [], isLoading: medsLoading } = usePatientMedications(patientId)
  const { data: procedures = [], isLoading: proceduresLoading } = usePatientProcedures(patientId)

  const isLoading = conditionsLoading || labsLoading || vitalsLoading || medsLoading || proceduresLoading

  // Generate AI-powered summary when data loads
  const generateAISummary = async () => {
    setIsGenerating(true)
    setAiError(null)

    try {
      // Prepare data for AI
      const patientData = {
        patientName: patientName || 'Patient',
        conditions: conditions.map(c => ({
          name: formatConditionName(c),
          status: c.clinicalStatus?.coding?.[0]?.code || 'active',
        })),
        vitals: vitals.slice(0, 10).map(v => ({
          name: v.code?.text || v.code?.coding?.[0]?.display || 'Unknown',
          value: v.valueQuantity?.value?.toString() || '',
          unit: v.valueQuantity?.unit || '',
          status: '',
        })),
        labs: labs.slice(0, 15).map(l => {
          const obs = formatObservation(l)
          return {
            name: obs.name,
            value: l.valueQuantity?.value?.toString() || '',
            unit: l.valueQuantity?.unit || '',
            interpretation: obs.interpretation,
          }
        }),
        medications: inpatientMedications.map(m => ({
          name: m.medicationCodeableConcept?.text || m.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown',
          dose: m.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.value?.toString() || '',
          frequency: m.dosageInstruction?.[0]?.timing?.code?.coding?.[0]?.display || '',
        })),
        procedures: procedures.slice(0, 5).map(p => ({
          name: p.code?.text || p.code?.coding?.[0]?.display || 'Unknown',
          date: p.performedDateTime || 'Unknown date',
          status: p.status || 'completed',
        })),
      }

      const response = await fetch('/api/ai/clinical-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      })

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`)
      }

      const aiResult = await response.json()

      // Build summary from AI response
      const baseSummary = generateClinicalSummary(conditions, labs, vitals, inpatientMedications)
      const newSummary: ClinicalSummary = {
        ...baseSummary,
        chiefComplaint: aiResult.chiefComplaint || baseSummary.chiefComplaint,
        clinicalSummary: aiResult.clinicalSummary || '',
        keyFindings: aiResult.keyFindings || { vitals: '', labs: '' },
        medicationSummary: aiResult.medicationSummary || '',
        recommendations: aiResult.recommendations || baseSummary.recommendations,
        clinicalAlerts: aiResult.clinicalAlerts || baseSummary.clinicalAlerts,
        isAIGenerated: true,
      }

      setSummary(newSummary)

      // Generate AI narrative
      let aiNarrative = `**Clinical Summary** *(AI-Generated)*\n\n`
      aiNarrative += aiResult.clinicalSummary || `${patientName || 'Patient'} presents for clinical assessment.`
      
      if (aiResult.keyFindings?.vitals) {
        aiNarrative += `\n\n**Vitals:** ${aiResult.keyFindings.vitals}`
      }
      if (aiResult.keyFindings?.labs) {
        aiNarrative += `\n\n**Labs:** ${aiResult.keyFindings.labs}`
      }
      if (aiResult.medicationSummary) {
        aiNarrative += `\n\n**Medications:** ${aiResult.medicationSummary}`
      }
      if (aiResult.clinicalAlerts?.length > 0) {
        aiNarrative += `\n\n**⚠️ Alerts:**\n${aiResult.clinicalAlerts.map((a: string) => `- ${a}`).join('\n')}`
      }
      if (aiResult.recommendations?.length > 0) {
        aiNarrative += `\n\n**Recommendations:**\n${aiResult.recommendations.map((r: string) => `- ${r}`).join('\n')}`
      }

      setNarrative(aiNarrative)
    } catch (error) {
      console.error('AI summary error:', error)
      setAiError('Failed to generate AI summary. Using rule-based summary instead.')
      // Fallback to local summary
      const fallbackSummary = generateClinicalSummary(conditions, labs, vitals, inpatientMedications)
      setSummary(fallbackSummary)
      setNarrative(generateNarrativeSummary(fallbackSummary, patientName))
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate summary when data loads
  useEffect(() => {
    if (!isLoading && (conditions.length > 0 || labs.length > 0 || vitals.length > 0)) {
      generateAISummary()
    }
  }, [isLoading, conditions.length, labs.length, vitals.length])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(narrative)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    generateAISummary()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Smart Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2">Analyzing patient data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Smart Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No clinical data available to generate summary.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Smart Notes
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isGenerating}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {summary.clinicalAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1">{summary.clinicalAlerts.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-lg bg-muted/50 p-4">
              {narrative.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <h4 key={i} className="font-semibold mt-2 mb-1">{line.replace(/\*\*/g, '')}</h4>
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="ml-4">{line.substring(2)}</li>
                }
                return <p key={i} className="my-1">{line}</p>
              })}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* Active Problems */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Active Problems ({summary.activeProblems.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {summary.activeProblems.map((problem, i) => (
                  <Badge key={i} variant="outline">{problem}</Badge>
                ))}
              </div>
            </div>

            {/* Vitals */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4" />
                Recent Vitals
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {summary.vitals.map((vital, i) => (
                  <div key={i} className="rounded-lg border p-2">
                    <div className="text-xs text-muted-foreground">{vital.name}</div>
                    <div className={`font-medium ${
                      vital.status === 'high' ? 'text-red-600' :
                      vital.status === 'low' ? 'text-blue-600' : ''
                    }`}>
                      {vital.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Labs */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                Recent Labs
              </h4>
              <div className="space-y-1">
                {summary.recentLabs.map((lab, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b last:border-0">
                    <span className="text-sm">{lab.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lab.value}</span>
                      {lab.interpretation !== 'Normal' && (
                        <Badge className={
                          lab.interpretation === 'High' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }>
                          {lab.interpretation}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medications */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Pill className="h-4 w-4" />
                Active Medications ({summary.medications.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {summary.medications.slice(0, 6).map((med, i) => (
                  <Badge key={i} variant="secondary">{med}</Badge>
                ))}
                {summary.medications.length > 6 && (
                  <Badge variant="outline">+{summary.medications.length - 6} more</Badge>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {summary.clinicalAlerts.length > 0 ? (
              <div className="space-y-2">
                {summary.clinicalAlerts.map((alert: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-800">{alert}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No active alerts</p>
            )}

            {summary.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {summary.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
