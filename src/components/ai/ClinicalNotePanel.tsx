'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pill,
  Activity,
  Beaker,
  Image as ImageIcon,
  FileText,
  Heart,
  Stethoscope,
  Home,
  Shield,
  Truck,
  DollarSign,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from 'lucide-react'
import {
  usePatientLabs,
  usePatientVitals,
  usePatientMedications,
  usePatientConditions,
  usePatientImaging,
} from '@/hooks/useFHIRData'
import type { Observation, MedicationRequest, MedicationStatement, Condition, DiagnosticReport } from '@medplum/fhirtypes'

type AnyMedication = MedicationRequest | MedicationStatement

interface ClinicalNotePanelProps {
  patientId: string
  patientName?: string
}

// Helper to get vital value
const getVitalValue = (vitals: Observation[], code: string): string => {
  const vital = vitals.find(v => 
    v.code?.coding?.some(c => c.code === code) ||
    v.code?.text?.toLowerCase().includes(code.toLowerCase())
  )
  if (!vital?.valueQuantity?.value) return '--'
  return `${Math.round(vital.valueQuantity.value * 10) / 10}`
}

// Helper to get vital with unit
const getVitalWithUnit = (vitals: Observation[], code: string): { value: string; unit: string } => {
  const vital = vitals.find(v => 
    v.code?.coding?.some(c => c.code === code) ||
    v.code?.text?.toLowerCase().includes(code.toLowerCase())
  )
  if (!vital?.valueQuantity?.value) return { value: '--', unit: '' }
  return {
    value: `${Math.round(vital.valueQuantity.value * 10) / 10}`,
    unit: vital.valueQuantity.unit || ''
  }
}

// Helper to format lab with interpretation
const formatLabValue = (obs: Observation): { value: string; flag: string; trend: 'up' | 'down' | 'stable' } => {
  const value = obs.valueQuantity?.value
  const unit = obs.valueQuantity?.unit || ''
  const interp = obs.interpretation?.[0]?.coding?.[0]?.code
  
  let flag = ''
  if (interp === 'H' || interp === 'HH') flag = 'H'
  else if (interp === 'L' || interp === 'LL') flag = 'L'
  
  return {
    value: value ? `${Math.round(value * 10) / 10} ${unit}`.trim() : '--',
    flag,
    trend: 'stable' // Would need historical data
  }
}

// Group labs by category
const groupLabsByCategory = (labs: Observation[]) => {
  const categories: Record<string, Observation[]> = {
    CBC: [],
    CMP: [],
    Cardiac: [],
    Minerals: [],
    Other: []
  }
  
  const cbcCodes = ['6690-2', '718-7', '4544-3', '777-3', '26515-7'] // WBC, Hgb, Hct, Plt
  const cmpCodes = ['2951-2', '2823-3', '2075-0', '1963-8', '3094-0', '2160-0', '2345-7'] // Na, K, Cl, CO2, BUN, Cr, Glucose
  const cardiacCodes = ['6598-7', '42637-9', '33762-6'] // Troponin, BNP
  const mineralCodes = ['19123-9', '2777-1', '17861-6'] // Mg, Phos, Ca
  
  labs.forEach(lab => {
    const code = lab.code?.coding?.[0]?.code || ''
    if (cbcCodes.includes(code)) categories.CBC.push(lab)
    else if (cmpCodes.includes(code)) categories.CMP.push(lab)
    else if (cardiacCodes.includes(code)) categories.Cardiac.push(lab)
    else if (mineralCodes.includes(code)) categories.Minerals.push(lab)
    else categories.Other.push(lab)
  })
  
  return categories
}

// Section component with collapse
function Section({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true,
  badge
}: { 
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string | number
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border rounded-lg">
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4" />
          {title}
          {badge && <Badge variant="secondary" className="ml-2">{badge}</Badge>}
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isOpen && <div className="p-3 pt-0 border-t">{children}</div>}
    </div>
  )
}

// Vitals display component
function VitalsSection({ vitals }: { vitals: Observation[] }) {
  const hr = getVitalValue(vitals, '8867-4')
  const sbp = getVitalValue(vitals, '8480-6')
  const dbp = getVitalValue(vitals, '8462-4')
  const temp = getVitalValue(vitals, '8310-5')
  const rr = getVitalValue(vitals, '9279-1')
  const spo2 = getVitalValue(vitals, '2708-6')
  
  const map = sbp !== '--' && dbp !== '--' 
    ? Math.round((parseInt(sbp) + 2 * parseInt(dbp)) / 3) 
    : '--'

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-muted-foreground">Latest:</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-xs text-muted-foreground">HR</div>
          <div className="font-bold">{hr} <span className="text-xs font-normal">bpm</span></div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-xs text-muted-foreground">BP (MAP)</div>
          <div className="font-bold">{sbp}/{dbp} <span className="text-xs font-normal">({map})</span></div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-xs text-muted-foreground">Temp</div>
          <div className="font-bold">{temp} <span className="text-xs font-normal">°C</span></div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-xs text-muted-foreground">RR</div>
          <div className="font-bold">{rr} <span className="text-xs font-normal">/min</span></div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-xs text-muted-foreground">SpO2</div>
          <div className="font-bold">{spo2} <span className="text-xs font-normal">%</span></div>
        </div>
      </div>
    </div>
  )
}

// Labs table component
function LabsTable({ labs, title }: { labs: Observation[]; title: string }) {
  if (labs.length === 0) return null
  
  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1 font-medium">Lab</th>
              <th className="py-1 font-medium text-right">Value</th>
              <th className="py-1 font-medium text-center w-12">Flag</th>
            </tr>
          </thead>
          <tbody>
            {labs.slice(0, 6).map((lab, i) => {
              const name = lab.code?.text || lab.code?.coding?.[0]?.display || 'Unknown'
              const { value, flag } = formatLabValue(lab)
              return (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1">{name}</td>
                  <td className="py-1 text-right font-mono">{value}</td>
                  <td className="py-1 text-center">
                    {flag && (
                      <Badge className={flag === 'H' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                        {flag}
                      </Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Medications section
function MedicationsSection({ medications }: { medications: AnyMedication[] }) {
  const activeMeds = medications.filter(m => m.status === 'active')
  
  // Check if medication is home med
  const isHomeMed = (m: AnyMedication): boolean => {
    const category = m.category
    if (!category) return false
    const cats = Array.isArray(category) ? category : [category]
    return cats.some((c: any) => c.coding?.some((code: any) => code.code === 'community'))
  }
  
  const homeMeds = activeMeds.filter(isHomeMed)
  const inpatientMeds = activeMeds.filter(m => !isHomeMed(m))
  
  const formatMed = (med: AnyMedication) => {
    const name = med.medicationCodeableConcept?.text || 
                 med.medicationCodeableConcept?.coding?.[0]?.display || 
                 'Unknown medication'
    const medAny = med as any
    const dosage = medAny.dosage?.[0] || medAny.dosageInstruction?.[0]
    const doseRate = dosage?.doseAndRate?.[0]
    const dose = doseRate?.doseQuantity?.value || ''
    const unit = doseRate?.doseQuantity?.unit || ''
    const route = dosage?.route?.coding?.[0]?.display || ''
    const freq = dosage?.timing?.code?.coding?.[0]?.display || ''
    
    return { name, dose: `${dose}${unit}`.trim(), route, freq }
  }

  return (
    <div className="space-y-4">
      {homeMeds.length > 0 && (
        <div>
          <div className="text-sm font-medium flex items-center gap-2 mb-2">
            <Home className="h-3 w-3" />
            Home Medications ({homeMeds.length})
          </div>
          <ul className="space-y-1 text-sm">
            {homeMeds.map((med, i) => {
              const { name, dose, route, freq } = formatMed(med)
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{name}</span>
                  {dose && <span className="text-muted-foreground">{dose}</span>}
                  {route && <span className="text-muted-foreground">{route}</span>}
                  {freq && <span className="text-muted-foreground">{freq}</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
      
      {inpatientMeds.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">
            Inpatient Medications ({inpatientMeds.length})
          </div>
          <ul className="space-y-1 text-sm">
            {inpatientMeds.slice(0, 10).map((med, i) => {
              const { name, dose, route, freq } = formatMed(med)
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{name}</span>
                  {dose && <span className="text-muted-foreground">{dose}</span>}
                  {route && <span className="text-muted-foreground">{route}</span>}
                  {freq && <span className="text-muted-foreground">{freq}</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
      
      {activeMeds.length === 0 && (
        <div className="text-sm text-muted-foreground">No active medications</div>
      )}
    </div>
  )
}

// Imaging section
function ImagingSection({ imaging }: { imaging: DiagnosticReport[] }) {
  if (imaging.length === 0) {
    return <div className="text-sm text-muted-foreground">No imaging studies</div>
  }
  
  return (
    <div className="space-y-3">
      {imaging.slice(0, 5).map((study, i) => {
        const name = study.code?.text || study.code?.coding?.[0]?.display || 'Study'
        const date = study.effectiveDateTime 
          ? new Date(study.effectiveDateTime).toLocaleDateString()
          : 'Unknown date'
        const conclusion = study.conclusion || 'No conclusion available'
        
        return (
          <div key={i} className="border-l-2 border-blue-500 pl-3 py-1">
            <div className="font-medium text-sm">{name}</div>
            <div className="text-xs text-muted-foreground">{date}</div>
            <div className="text-sm mt-1">{conclusion}</div>
          </div>
        )
      })}
    </div>
  )
}

// Assessment & Plan section
function AssessmentPlanSection({ conditions }: { conditions: Condition[] }) {
  const activeConditions = conditions.filter(c => 
    c.clinicalStatus?.coding?.[0]?.code === 'active'
  ).slice(0, 8)
  
  if (activeConditions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No active problems. Add assessment items manually.
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {activeConditions.map((condition, i) => {
        const name = condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown'
        const icd = condition.code?.coding?.[0]?.code || ''
        
        return (
          <div key={i} className="border rounded-lg p-3 bg-amber-50/50">
            <div className="flex items-center justify-between">
              <div className="font-medium">{name}</div>
              {icd && <Badge variant="outline" className="text-xs">{icd}</Badge>}
            </div>
            <div className="mt-2">
              <Textarea 
                placeholder="• Add plan items..."
                className="min-h-[60px] text-sm"
              />
            </div>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Quick Orders
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ClinicalNotePanel({ patientId, patientName }: ClinicalNotePanelProps) {
  // Fetch real FHIR data
  const { data: conditions = [], isLoading: conditionsLoading } = usePatientConditions(patientId)
  const { data: labs = [], isLoading: labsLoading } = usePatientLabs(patientId)
  const { data: vitals = [], isLoading: vitalsLoading } = usePatientVitals(patientId)
  const { inpatientMedications = [], homeMedications = [], isLoading: medsLoading } = usePatientMedications(patientId)
  const { data: imaging = [], isLoading: imagingLoading } = usePatientImaging(patientId)

  const isLoading = conditionsLoading || labsLoading || vitalsLoading || medsLoading || imagingLoading
  const allMedications = [...inpatientMedications, ...homeMedications]
  const labCategories = groupLabsByCategory(labs)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full" />
            <span className="ml-2">Loading clinical data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Clinical Note
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Save Draft</Button>
            <Button size="sm">Sign Note</Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
        {/* SUBJECTIVE */}
        <Section title="SUBJECTIVE" icon={FileText} defaultOpen={true}>
          <div className="text-sm text-muted-foreground italic mb-2">
            ***Snippets: Type .. followed by a keyword (e.g., ..physicalexam, ..labs, ..heartfailure)
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            F2 = Jump to next ***
          </div>
          <Textarea 
            placeholder="Enter subjective findings, patient history, chief complaint..."
            className="min-h-[80px]"
          />
          <Button variant="ghost" size="sm" className="mt-2 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add text block
          </Button>
        </Section>

        {/* OBJECTIVE */}
        <Section title="OBJECTIVE" icon={Activity} defaultOpen={true}>
          {/* Vitals */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Vitals</div>
            <VitalsSection vitals={vitals} />
          </div>
          
          {/* Physical Exam placeholder */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Physical Exam</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {['General', 'HEENT', 'Neck', 'CV', 'Lungs', 'Abd', 'Ext', 'Neuro'].map(exam => (
                <div key={exam} className="border rounded p-2 hover:bg-muted/50 cursor-pointer">
                  <span className="text-muted-foreground">{exam}</span>
                </div>
              ))}
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add text block
          </Button>
        </Section>

        {/* LABS */}
        <Section title="LABS (Recent)" icon={Beaker} badge={labs.length} defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabsTable labs={labCategories.CBC} title="CBC" />
            <LabsTable labs={labCategories.CMP} title="CMP" />
            <LabsTable labs={labCategories.Cardiac} title="Cardiac" />
            <LabsTable labs={labCategories.Minerals} title="Minerals" />
          </div>
          {labCategories.Other.length > 0 && (
            <LabsTable labs={labCategories.Other} title="Other" />
          )}
        </Section>

        {/* MEDICATIONS */}
        <Section title="MEDICATIONS" icon={Pill} badge={allMedications.length} defaultOpen={true}>
          <MedicationsSection medications={allMedications} />
        </Section>

        {/* IMAGING */}
        <Section title="IMAGING" icon={ImageIcon} badge={imaging.length} defaultOpen={true}>
          <ImagingSection imaging={imaging} />
        </Section>

        {/* ASSESSMENT & PLAN */}
        <Section title="ASSESSMENT & PLAN" icon={Stethoscope} defaultOpen={true}>
          <AssessmentPlanSection conditions={conditions} />
          <Button variant="ghost" size="sm" className="mt-3 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add problem
          </Button>
        </Section>

        {/* DIET */}
        <Section title="DIET" icon={Heart} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              'Regular diet',
              'Cardiac/Low sodium (2g Na)',
              'Diabetic/Carb controlled',
              'Renal diet',
              'Clear liquids',
              'NPO'
            ].map(diet => (
              <label key={diet} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                <Checkbox />
                <span>{diet}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* DVT PROPHYLAXIS */}
        <Section title="DVT PROPHYLAXIS" icon={Shield} defaultOpen={false}>
          <div className="space-y-3">
            <div className="text-sm font-medium">Prophylaxis</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                'Heparin 5000 units SC TID',
                'Enoxaparin 40mg SC daily',
                'SCDs bilateral',
                'TEDs stockings'
              ].map(ppx => (
                <label key={ppx} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                  <Checkbox />
                  <span>{ppx}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* DISPOSITION */}
        <Section title="DISPOSITION" icon={Truck} defaultOpen={false}>
          <div className="space-y-3">
            <div className="text-sm font-medium">Discharge Destination</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['Home', 'SNF', 'Rehab', 'LTAC', 'Hospice'].map(dest => (
                <label key={dest} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                  <Checkbox />
                  <span>{dest}</span>
                </label>
              ))}
            </div>
            <Textarea 
              placeholder="Add disposition notes, PT/OT/CM notes..."
              className="min-h-[60px] text-sm"
            />
          </div>
        </Section>

        {/* BILLING */}
        <Section title="CMI / DIAGNOSES & BILLING" icon={DollarSign} defaultOpen={false}>
          <div className="space-y-3">
            <div className="text-sm font-medium">Active Diagnoses</div>
            <div className="space-y-2">
              {conditions.slice(0, 6).map((cond, i) => {
                const name = cond.code?.text || cond.code?.coding?.[0]?.display || 'Unknown'
                const icd = cond.code?.coding?.[0]?.code || ''
                return (
                  <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span>{name}</span>
                    <div className="flex items-center gap-2">
                      {icd && <Badge variant="outline">{icd}</Badge>}
                      <Badge variant="secondary">CC</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Section>
      </CardContent>
    </Card>
  )
}
