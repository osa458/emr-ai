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
  clinicalInsights: string[]
  riskFactors: string[]
  isAIGenerated?: boolean
}

// Helper to format condition name
const formatConditionName = (condition: Condition): string => {
  return condition.code?.text || 
         condition.code?.coding?.[0]?.display || 
         'Unknown condition'
}

// Filter out social determinant "findings" that aren't real medical conditions
const isMedicalCondition = (condition: Condition): boolean => {
  const name = condition.code?.text || condition.code?.coding?.[0]?.display || ''
  const excludePatterns = [
    '(finding)', '(situation)', '(social concept)', 'employment', 'education',
    'housing', 'stress', 'lack of', 'Received higher', 'Social isolation',
    'Reports of violence', 'Victim of intimate partner abuse', 'Has a criminal record',
    'Misuses drugs', 'Unhealthy alcohol drinking behavior', 'Limited social contact',
    'Not in labor force', 'Part-time employment', 'Full-time employment',
  ]
  const lowerName = name.toLowerCase()
  return !excludePatterns.some(pattern => lowerName.includes(pattern.toLowerCase()))
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

// Clinical decision support - correlate conditions with labs
function generateClinicalInsights(
  conditions: Condition[],
  labs: Observation[],
  vitals: Observation[],
  medications: MedicationRequest[]
): { insights: string[]; risks: string[]; alerts: string[]; recommendations: string[] } {
  const insights: string[] = []
  const risks: string[] = []
  const alerts: string[] = []
  const recommendations: string[] = []
  
  const problemNames = conditions
    .filter(c => c.clinicalStatus?.coding?.[0]?.code === 'active')
    .map(c => (c.code?.text || c.code?.coding?.[0]?.display || '').toLowerCase())
  
  const medNames = medications
    .filter(m => m.status === 'active')
    .map(m => (m.medicationCodeableConcept?.text || m.medicationCodeableConcept?.coding?.[0]?.display || '').toLowerCase())
  
  // Helper to find lab by LOINC or name
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

  // === DIABETES MANAGEMENT ===
  if (problemNames.some(p => p.includes('diabetes'))) {
    const hba1c = findLab(['4548-4', '17856-6'], ['a1c', 'hemoglobin a1c', 'glycated'])
    const glucose = findLab(['2345-7', '2339-0'], ['glucose'])
    const creatinine = findLab(['2160-0'], ['creatinine'])
    
    if (hba1c?.valueQuantity?.value) {
      const val = hba1c.valueQuantity.value
      if (val > 9) {
        alerts.push(`HbA1c critically elevated at ${val}% - intensify glycemic management`)
        recommendations.push('Consider endocrinology referral for uncontrolled diabetes')
      } else if (val > 7) {
        insights.push(`HbA1c ${val}% above ADA target of <7% for most adults`)
        recommendations.push('Optimize diabetes regimen - consider adding/adjusting therapy')
      } else {
        insights.push(`HbA1c ${val}% at goal - continue current diabetes management`)
      }
    }
    
    if (glucose?.valueQuantity?.value && glucose.valueQuantity.value > 200) {
      alerts.push(`Hyperglycemia: glucose ${glucose.valueQuantity.value} mg/dL`)
    }
    
    // Check for diabetic nephropathy risk
    if (creatinine?.valueQuantity?.value && creatinine.valueQuantity.value > 1.5) {
      risks.push('Elevated creatinine in diabetic patient - monitor for nephropathy')
      recommendations.push('Consider ACE-I/ARB for renal protection if not contraindicated')
    }
    
    recommendations.push('Ensure annual diabetic retinal exam and podiatry evaluation')
  }

  // === CARDIOVASCULAR ===
  if (problemNames.some(p => p.includes('hypertension') || p.includes('heart') || p.includes('cardiac'))) {
    const sbp = findVital('8480-6')
    const dbp = findVital('8462-4')
    const bnp = findLab(['33762-6', '42637-9'], ['bnp', 'natriuretic'])
    const troponin = findLab(['6598-7', '10839-9'], ['troponin'])
    
    if (sbp && dbp) {
      if (sbp >= 180 || dbp >= 120) {
        alerts.push(`Hypertensive urgency: BP ${sbp}/${dbp} mmHg - immediate intervention needed`)
      } else if (sbp >= 140 || dbp >= 90) {
        insights.push(`Blood pressure ${sbp}/${dbp} mmHg above target - optimize antihypertensive therapy`)
      }
    }
    
    if (bnp?.valueQuantity?.value && bnp.valueQuantity.value > 100) {
      const val = bnp.valueQuantity.value
      if (val > 500) {
        alerts.push(`BNP significantly elevated at ${val} pg/mL - evaluate for acute heart failure`)
      } else {
        insights.push(`BNP ${val} pg/mL - monitor volume status and cardiac function`)
      }
    }
    
    if (troponin?.valueQuantity?.value && troponin.valueQuantity.value > 0.04) {
      alerts.push(`Elevated troponin ${troponin.valueQuantity.value} - rule out ACS`)
    }
  }

  // === RENAL FUNCTION ===
  const creatinine = findLab(['2160-0'], ['creatinine'])
  const bun = findLab(['3094-0'], ['bun', 'urea nitrogen'])
  const potassium = findLab(['2823-3'], ['potassium'])
  
  if (creatinine?.valueQuantity?.value) {
    const cr = creatinine.valueQuantity.value
    if (cr > 4.0) {
      alerts.push(`Severe renal impairment: Cr ${cr} mg/dL - nephrology consultation recommended`)
    } else if (cr > 2.0) {
      risks.push(`Moderate renal impairment: Cr ${cr} mg/dL`)
      recommendations.push('Review and adjust renally-dosed medications')
    }
  }
  
  if (potassium?.valueQuantity?.value) {
    const k = potassium.valueQuantity.value
    if (k > 6.0) alerts.push(`Critical hyperkalemia: K ${k} mEq/L - cardiac monitoring required`)
    else if (k > 5.5) alerts.push(`Hyperkalemia: K ${k} mEq/L - monitor and consider treatment`)
    else if (k < 3.0) alerts.push(`Critical hypokalemia: K ${k} mEq/L - replace urgently`)
    else if (k < 3.5) insights.push(`Mild hypokalemia: K ${k} mEq/L - oral replacement indicated`)
  }

  // === HEMATOLOGY ===
  const hgb = findLab(['718-7'], ['hemoglobin'])
  const wbc = findLab(['6690-2'], ['wbc', 'leukocytes'])
  const plt = findLab(['777-3', '26515-7'], ['platelet'])
  
  if (hgb?.valueQuantity?.value) {
    const h = hgb.valueQuantity.value
    if (h < 7) alerts.push(`Severe anemia: Hgb ${h} g/dL - consider transfusion`)
    else if (h < 10) insights.push(`Anemia: Hgb ${h} g/dL - evaluate etiology`)
  }
  
  if (wbc?.valueQuantity?.value) {
    const w = wbc.valueQuantity.value
    if (w > 20) alerts.push(`Leukocytosis: WBC ${w} - evaluate for infection/malignancy`)
    else if (w < 2) alerts.push(`Severe leukopenia: WBC ${w} - infection precautions`)
  }

  // === DRUG-LAB INTERACTIONS ===
  if (medNames.some(m => m.includes('warfarin') || m.includes('coumadin'))) {
    const inr = findLab(['5902-2', '6301-6'], ['inr'])
    if (inr?.valueQuantity?.value) {
      const val = inr.valueQuantity.value
      if (val > 4) alerts.push(`INR ${val} supratherapeutic - bleeding risk, hold warfarin`)
      else if (val < 2) insights.push(`INR ${val} subtherapeutic - evaluate compliance/interactions`)
    }
  }
  
  if (medNames.some(m => m.includes('metformin'))) {
    if (creatinine?.valueQuantity?.value && creatinine.valueQuantity.value > 1.5) {
      alerts.push('Metformin with elevated creatinine - assess for lactic acidosis risk')
    }
  }
  
  if (medNames.some(m => m.includes('digoxin'))) {
    const dig = findLab(['10535-3'], ['digoxin'])
    if (dig?.valueQuantity?.value && dig.valueQuantity.value > 2.0) {
      alerts.push(`Digoxin level ${dig.valueQuantity.value} ng/mL - toxicity risk`)
    }
    if (potassium?.valueQuantity?.value && potassium.valueQuantity.value < 3.5) {
      alerts.push('Hypokalemia with digoxin therapy increases toxicity risk')
    }
  }

  // Default if nothing found
  if (insights.length === 0 && alerts.length === 0) {
    insights.push('No significant lab-condition correlations identified')
  }
  if (recommendations.length === 0) {
    recommendations.push('Continue current management and routine monitoring')
  }

  return { insights, risks, alerts, recommendations }
}

// Generate clinical summary from FHIR data
function generateClinicalSummary(
  conditions: Condition[],
  labs: Observation[],
  vitals: Observation[],
  medications: MedicationRequest[]
): ClinicalSummary {
  const medicalConditions = conditions.filter(isMedicalCondition)
  const activeProblems = medicalConditions
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

  // Get abnormal labs first, then recent
  const abnormalLabs = labs
    .filter(l => {
      const interp = l.interpretation?.[0]?.coding?.[0]?.code?.toUpperCase()
      return interp === 'H' || interp === 'L' || interp === 'HH' || interp === 'LL' || interp === 'HIGH' || interp === 'LOW'
    })
    .slice(0, 6)
    .map(formatObservation)

  const recentLabs = abnormalLabs.length >= 3 
    ? abnormalLabs 
    : [...abnormalLabs, ...labs.slice(0, 6 - abnormalLabs.length).map(formatObservation)]

  const activeMeds = medications
    .filter(m => m.status === 'active')
    .map(formatMedication)
    .slice(0, 10)

  // Generate clinical decision support
  const cds = generateClinicalInsights(conditions, labs, vitals, medications)

  // Determine chief complaint
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
    recommendations: cds.recommendations,
    clinicalAlerts: cds.alerts,
    clinicalInsights: cds.insights,
    riskFactors: cds.risks,
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
      // Prepare data for AI - filter out social determinant findings
      const medicalConditions = conditions.filter(isMedicalCondition)
      const patientData = {
        patientName: patientName || 'Patient',
        conditions: medicalConditions.map(c => ({
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
            {/* Critical Alerts */}
            {summary.clinicalAlerts.length > 0 && (
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Critical Alerts
                </h4>
                <div className="space-y-2">
                  {summary.clinicalAlerts.map((alert: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-800">{alert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical Insights */}
            {summary.clinicalInsights && summary.clinicalInsights.length > 0 && (
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-2 text-blue-700">
                  <TrendingUp className="h-4 w-4" />
                  Clinical Insights
                </h4>
                <div className="space-y-2">
                  {summary.clinicalInsights.map((insight: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <span className="text-sm text-blue-800">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {summary.riskFactors && summary.riskFactors.length > 0 && (
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Factors
                </h4>
                <div className="space-y-2">
                  {summary.riskFactors.map((risk: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <span className="text-sm text-amber-800">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {summary.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-2 text-green-700">
                  <Activity className="h-4 w-4" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {summary.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                      <span className="text-green-600 font-bold">→</span>
                      <span className="text-green-800">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.clinicalAlerts.length === 0 && 
             (!summary.clinicalInsights || summary.clinicalInsights.length === 0) &&
             (!summary.riskFactors || summary.riskFactors.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No alerts or insights at this time</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
