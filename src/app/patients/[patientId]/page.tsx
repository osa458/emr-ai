'use client'

import { useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Calendar,
  MapPin,
  FileText,
  Activity,
  Pill,
  ClipboardCheck,
  ArrowLeft,
  Stethoscope,
  DollarSign,
  ImageIcon,
  Sparkles,
  ClipboardList,
  Scissors,
  CheckSquare,
  Shield,
} from 'lucide-react'
import { RealTimeVitals } from '@/components/clinical/RealTimeVitals'
import { ClinicalNotes } from '@/components/clinical/ClinicalNotes'
import { DiagnosticAssistPanel } from '@/components/ai/DiagnosticAssistPanel'
import { BillingAssistPanel } from '@/components/ai/BillingAssistPanel'
import { LabsTable } from '@/components/chart/LabsTable'
import { LabsTrend } from '@/components/chart/LabsTrend'
import { MedicationsPanel } from '@/components/chart/MedicationsPanel'
import { ImagingList } from '@/components/chart/ImagingList'
import { VitalsTrend } from '@/components/chart/VitalsTrend'
import { NotesPanel } from '@/components/chart/NotesPanel'
import { OrdersPanel } from '@/components/chart/OrdersPanel'
import { ProceduresPanel } from '@/components/chart/ProceduresPanel'
import { TasksPanel } from '@/components/chart/TasksPanel'
import { CarePlanPanel } from '@/components/chart/CarePlanPanel'
import { CoveragePanel } from '@/components/chart/CoveragePanel'
import { AISidebar } from '@/components/ai/AISidebar'
import { TextSelectionPopover } from '@/components/ai/TextSelectionPopover'
import { PatientStickyNote } from '@/components/patients/PatientStickyNote'
import { PatientChartLayout } from '@/components/chart-mode/PatientChartLayout'
import type { Observation, MedicationRequest, MedicationStatement, DiagnosticReport } from '@medplum/fhirtypes'
import useSWR from 'swr'
import { usePatient } from '@/hooks/usePatient'
import { usePatientLabs, usePatientMedications, usePatientImaging, usePatientConditions } from '@/hooks/useFHIRData'
import { formatPatientName } from '@/lib/fhir/resources/patient'

// Helper to generate dates
const hoursAgo = (h: number) => {
  const d = new Date()
  d.setHours(d.getHours() - h)
  return d.toISOString()
}
const daysAgo = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(6, 0, 0, 0)
  return d.toISOString()
}

// Mock lab data with time series (60 days outpatient, gap, 7 days inpatient)
const getMockLabs = (): Observation[] => {
  const labs: Observation[] = []
  let id = 1

  // Lab definitions with trending values
  const labDefs = [
    { code: '2160-0', name: 'Creatinine', unit: 'mg/dL', refLow: 0.7, refHigh: 1.3, outpatient: 1.1, admission: 2.4, current: 1.5 },
    { code: '6299-2', name: 'BUN', unit: 'mg/dL', refLow: 7, refHigh: 20, outpatient: 18, admission: 42, current: 28 },
    { code: '2951-2', name: 'Sodium', unit: 'mmol/L', refLow: 136, refHigh: 145, outpatient: 140, admission: 132, current: 138 },
    { code: '2823-3', name: 'Potassium', unit: 'mmol/L', refLow: 3.5, refHigh: 5.0, outpatient: 4.2, admission: 5.6, current: 4.4 },
    { code: '6690-2', name: 'WBC', unit: '10*3/uL', refLow: 4.5, refHigh: 11, outpatient: 7.5, admission: 15.2, current: 9.8 },
    { code: '718-7', name: 'Hemoglobin', unit: 'g/dL', refLow: 12, refHigh: 17.5, outpatient: 13.8, admission: 10.2, current: 11.5 },
    { code: '33762-6', name: 'BNP', unit: 'pg/mL', refLow: 0, refHigh: 100, outpatient: 85, admission: 1250, current: 420 },
    { code: '10839-9', name: 'Troponin I', unit: 'ng/mL', refLow: 0, refHigh: 0.04, outpatient: 0.01, admission: 0.52, current: 0.08 },
    { code: '1742-6', name: 'ALT', unit: 'U/L', refLow: 7, refHigh: 56, outpatient: 28, admission: 65, current: 42 },
    { code: '1920-8', name: 'AST', unit: 'U/L', refLow: 10, refHigh: 40, outpatient: 25, admission: 88, current: 38 },
  ]

  // Time points: outpatient (60, 45 days), then inpatient (7, 5, 3, 1, 0 days)
  const timePoints = [
    { daysAgo: 60, context: 'outpatient' },
    { daysAgo: 45, context: 'outpatient' },
    { daysAgo: 7, context: 'admission' },
    { daysAgo: 5, context: 'inpatient' },
    { daysAgo: 3, context: 'inpatient' },
    { daysAgo: 1, context: 'inpatient' },
    { daysAgo: 0, context: 'inpatient' },
  ]

  for (const tp of timePoints) {
    for (const lab of labDefs) {
      // Calculate value based on context and trend
      let value: number
      if (tp.context === 'outpatient') {
        value = lab.outpatient + (Math.random() - 0.5) * 0.2
      } else if (tp.context === 'admission') {
        value = lab.admission
      } else {
        // Trend from admission to current
        const progress = (7 - tp.daysAgo) / 7
        value = lab.admission + (lab.current - lab.admission) * progress + (Math.random() - 0.5) * 0.1
      }

      const isHigh = value > lab.refHigh
      const isLow = value < lab.refLow

      labs.push({
        resourceType: 'Observation',
        id: String(id++),
        status: 'final',
        category: [{ coding: [{ code: 'laboratory' }] }],
        code: { text: lab.name, coding: [{ system: 'http://loinc.org', code: lab.code }] },
        valueQuantity: { value: Math.round(value * 100) / 100, unit: lab.unit },
        effectiveDateTime: daysAgo(tp.daysAgo),
        referenceRange: [{ low: { value: lab.refLow, unit: lab.unit }, high: { value: lab.refHigh, unit: lab.unit } }],
        interpretation: (isHigh || isLow) ? [{ coding: [{ code: isHigh ? 'H' : 'L', display: isHigh ? 'High' : 'Low' }] }] : undefined,
      })
    }
  }

  // Add cultures
  labs.push({
    resourceType: 'Observation', id: String(id++), status: 'final',
    category: [{ coding: [{ code: 'laboratory' }] }],
    code: { text: 'Blood Culture', coding: [{ system: 'http://loinc.org', code: '600-7' }] },
    valueString: 'No growth after 5 days',
    effectiveDateTime: daysAgo(6),
    interpretation: [{ coding: [{ code: 'NEG', display: 'Negative' }] }],
  })
  labs.push({
    resourceType: 'Observation', id: String(id++), status: 'final',
    category: [{ coding: [{ code: 'laboratory' }] }],
    code: { text: 'Urine Culture', coding: [{ system: 'http://loinc.org', code: '630-4' }] },
    valueString: 'POSITIVE - E. coli >100,000 CFU/mL. Sensitive to: Ciprofloxacin, Nitrofurantoin',
    effectiveDateTime: daysAgo(5),
    interpretation: [{ coding: [{ code: 'POS', display: 'Positive' }] }],
  })
  labs.push({
    resourceType: 'Observation', id: String(id++), status: 'final',
    category: [{ coding: [{ code: 'laboratory' }] }],
    code: { text: 'COVID-19 PCR', coding: [{ system: 'http://loinc.org', code: '94500-6' }] },
    valueString: 'NOT DETECTED',
    effectiveDateTime: daysAgo(6),
    interpretation: [{ coding: [{ code: 'NEG', display: 'Negative' }] }],
  })
  labs.push({
    resourceType: 'Observation', id: String(id++), status: 'final',
    category: [{ coding: [{ code: 'laboratory' }] }],
    code: { text: 'Procalcitonin', coding: [{ system: 'http://loinc.org', code: '75241-0' }] },
    valueQuantity: { value: 0.85, unit: 'ng/mL' },
    effectiveDateTime: daysAgo(7),
    referenceRange: [{ low: { value: 0, unit: 'ng/mL' }, high: { value: 0.1, unit: 'ng/mL' } }],
    interpretation: [{ coding: [{ code: 'H', display: 'High' }] }],
  })
  labs.push({
    resourceType: 'Observation', id: String(id++), status: 'final',
    category: [{ coding: [{ code: 'laboratory' }] }],
    code: { text: 'HbA1c', coding: [{ system: 'http://loinc.org', code: '4548-4' }] },
    valueQuantity: { value: 8.2, unit: '%' },
    effectiveDateTime: daysAgo(5),
    referenceRange: [{ high: { value: 5.7, unit: '%' } }],
    interpretation: [{ coding: [{ code: 'H', display: 'High' }] }],
  })

  return labs
}

// Mock inpatient medications
const getMockInpatientMeds = (): MedicationRequest[] => [
  {
    resourceType: 'MedicationRequest',
    id: '1',
    status: 'active',
    intent: 'order',
    subject: { reference: 'Patient/mock' },
    medicationCodeableConcept: { text: 'Furosemide 40mg IV' },
    dosageInstruction: [{ timing: { code: { text: 'BID' } }, route: { text: 'IV' } }],
  },
  {
    resourceType: 'MedicationRequest',
    id: '2',
    status: 'active',
    intent: 'order',
    subject: { reference: 'Patient/mock' },
    medicationCodeableConcept: { text: 'Lisinopril 10mg' },
    dosageInstruction: [{ timing: { code: { text: 'Daily' } } }],
  },
  {
    resourceType: 'MedicationRequest',
    id: '3',
    status: 'active',
    intent: 'order',
    subject: { reference: 'Patient/mock' },
    medicationCodeableConcept: { text: 'Metoprolol 25mg' },
    dosageInstruction: [{ timing: { code: { text: 'BID' } } }],
  },
  {
    resourceType: 'MedicationRequest',
    id: '4',
    status: 'active',
    intent: 'order',
    subject: { reference: 'Patient/mock' },
    medicationCodeableConcept: { text: 'Spironolactone 25mg' },
    dosageInstruction: [{ timing: { code: { text: 'Daily' } } }],
    reasonCode: [{ text: 'CHF' }],
  },
]

// Mock home medications
const getMockHomeMeds = (): MedicationStatement[] => [
  {
    resourceType: 'MedicationStatement',
    id: 'h1',
    status: 'active',
    subject: { reference: 'Patient/mock' },
    medicationCodeableConcept: { text: 'Lisinopril 10mg' },
    category: { coding: [{ code: 'community' }] },
    dosage: [{ text: '10mg Daily', timing: { code: { text: 'Daily' } } }],
  },
  {
    resourceType: 'MedicationStatement',
    id: 'h2',
    status: 'active',
    subject: { reference: 'Patient/mock' },
    medicationCodeableConcept: { text: 'Metformin 1000mg' },
    category: { coding: [{ code: 'community' }] },
    dosage: [{ text: '1000mg BID', timing: { code: { text: 'BID' } } }],
  },
  {
    resourceType: 'MedicationStatement',
    id: 'h3',
    status: 'active',
    subject: { reference: 'Patient/mock' },
    medicationCodeableConcept: { text: 'Atorvastatin 40mg' },
    category: { coding: [{ code: 'community' }] },
    dosage: [{ text: '40mg Daily', timing: { code: { text: 'Daily' } } }],
  },
  {
    resourceType: 'MedicationStatement',
    id: 'h4',
    status: 'active',
    subject: { reference: 'Patient/mock' },
    medicationCodeableConcept: { text: 'Aspirin 81mg' },
    category: { coding: [{ code: 'community' }] },
    dosage: [{ text: '81mg Daily', timing: { code: { text: 'Daily' } } }],
  },
]

// Mock imaging studies
const getMockImaging = (): DiagnosticReport[] => [
  {
    resourceType: 'DiagnosticReport',
    id: 'img1',
    status: 'final',
    category: [{ coding: [{ code: 'RAD' }] }],
    code: { text: 'Chest X-Ray' },
    effectiveDateTime: new Date(Date.now() - 86400000).toISOString(),
    conclusion: 'No acute cardiopulmonary process. Heart size normal. Lungs clear.',
    conclusionCode: [{ text: 'No acute findings' }],
  },
  {
    resourceType: 'DiagnosticReport',
    id: 'img2',
    status: 'final',
    category: [{ coding: [{ code: 'RAD' }] }],
    code: { text: 'Echocardiogram' },
    effectiveDateTime: new Date(Date.now() - 172800000).toISOString(),
    conclusion: 'LVEF 35-40%. Moderate LVH. Grade II diastolic dysfunction. Mild MR.',
    conclusionCode: [{ text: 'Reduced EF, see report' }],
  },
  {
    resourceType: 'DiagnosticReport',
    id: 'img3',
    status: 'preliminary',
    category: [{ coding: [{ code: 'RAD' }] }],
    code: { text: 'CT Chest with Contrast' },
    effectiveDateTime: new Date().toISOString(),
    conclusion: '',
    conclusionCode: [{ text: 'Pending' }],
  },
]

// Mock patient data
const getMockPatient = (id: string) => ({
  id,
  name: 'John Smith',
  mrn: 'MRN-003',
  age: 65,
  gender: 'male',
  birthDate: '1959-03-15',
  location: 'Room 218',
  admitDate: '2024-01-03',
  attending: 'Dr. Sarah Johnson',
  diagnosis: 'CHF Exacerbation',
  conditions: [
    { name: 'Heart Failure with reduced EF', status: 'active' },
    { name: 'Type 2 Diabetes', status: 'active' },
    { name: 'Hypertension', status: 'active' },
    { name: 'Chronic Kidney Disease Stage 3', status: 'active' },
  ],
  vitals: [
    { name: 'Blood Pressure', value: '128/76 mmHg', time: '08:00' },
    { name: 'Heart Rate', value: '72 bpm', time: '08:00' },
    { name: 'Temperature', value: '98.6°F', time: '08:00' },
    { name: 'Respiratory Rate', value: '16/min', time: '08:00' },
    { name: 'SpO2', value: '96%', time: '08:00', note: 'on 2L NC' },
    { name: 'Weight', value: '185 lbs', time: '06:00', note: '+2 lbs from yesterday' },
  ],
  labs: [
    { name: 'BNP', value: '850 pg/mL', flag: 'H', date: 'Today' },
    { name: 'Creatinine', value: '1.4 mg/dL', flag: 'H', date: 'Today' },
    { name: 'Potassium', value: '4.2 mEq/L', flag: '', date: 'Today' },
    { name: 'Sodium', value: '138 mEq/L', flag: '', date: 'Today' },
    { name: 'Hemoglobin', value: '11.2 g/dL', flag: 'L', date: 'Today' },
  ],
  medications: [
    { name: 'Furosemide 40mg IV', frequency: 'BID', status: 'active' },
    { name: 'Lisinopril 10mg', frequency: 'Daily', status: 'active' },
    { name: 'Metoprolol 25mg', frequency: 'BID', status: 'active' },
    { name: 'Spironolactone 25mg', frequency: 'Daily', status: 'active' },
    { name: 'Metformin 1000mg', frequency: 'BID', status: 'active' },
  ],
})

const mapAidboxPatient = (p: any, fallbackId: string) => {
  const name = p ? formatPatientName(p) : 'Unknown'
  const birthDate = p?.birthDate ? new Date(p.birthDate) : null
  const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined
  return {
    id: p?.id || fallbackId,
    name,
    mrn: p?.identifier?.[0]?.value || 'MRN-N/A',
    age: age ?? 0,
    gender: p?.gender || 'unknown',
    birthDate: p?.birthDate,
    location: p?.address?.[0]?.text || 'Unknown',
    admitDate: p?.meta?.lastUpdated || '',
    attending: 'Attending MD',
    diagnosis: '—',
    conditions: [],
    vitals: [],
    labs: [],
    medications: [],
  }
}

// Enhanced patient data for the 2025 chart layout
const getEnhancedPatientData = (patient: ReturnType<typeof getMockPatient>) => ({
  id: patient.id,
  name: patient.name,
  age: patient.age,
  gender: patient.gender,
  mrn: patient.mrn,
  location: patient.location,
  admitDate: patient.admitDate,
  photo: undefined,
  codeStatus: 'Full' as const,
  isolation: undefined,
  fallRisk: 'Moderate' as const,
  allergies: [
    { name: 'Penicillin', severity: 'high' as const, reaction: 'Anaphylaxis' },
    { name: 'Sulfa', severity: 'moderate' as const, reaction: 'Rash' },
  ],
  problems: patient.conditions.map((c) => c.name),
  keyLabs: [
    { name: 'Cr', value: '1.4', unit: 'mg/dL', status: 'high' as const, trend: 'down' as const },
    { name: 'K', value: '4.2', unit: 'mEq/L', status: 'normal' as const },
    { name: 'BNP', value: '850', unit: 'pg/mL', status: 'high' as const, trend: 'down' as const },
    { name: 'Hgb', value: '11.2', unit: 'g/dL', status: 'low' as const },
    { name: 'Na', value: '138', unit: 'mEq/L', status: 'normal' as const },
    { name: 'WBC', value: '9.8', unit: '10³/µL', status: 'normal' as const },
  ],
  cultures: [
    { type: 'Blood Cx', status: 'pending' as const },
    { type: 'Urine Cx', status: 'negative' as const, result: 'No growth' },
  ],
  imaging: [
    { type: 'CXR', date: '12/11', finding: 'Pulmonary edema improving' },
    { type: 'Echo', date: '12/10', finding: 'EF 35%, moderate MR' },
    { type: 'CT Chest', date: '12/09', finding: 'No PE, bilateral effusions' },
  ],
  medications: patient.medications.length,
  vitals: {
    bp: '128/76',
    hr: 72,
    temp: '98.6°F',
    spo2: 96,
    rr: 16,
  },
  io: {
    input: 2100,
    output: 2800,
  },
  attendingPhysician: patient.attending,
  diagnosis: patient.conditions.map((c) => c.name),
  keyUpdates: [
    'BNP trending down (1250 → 850)',
    'Weight decreased 2 lbs with diuresis',
    'Tolerating PO medications',
    'O2 weaned to 2L NC',
  ],
  overnightTasks: [
    'Daily weight at 6am',
    'Strict I/O monitoring',
    'Recheck BMP in AM',
    'Call if SOB worsens or SpO2 < 92%',
  ],
})

export default function PatientChartPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const patientId = params.patientId as string
  const { data: aidboxPatient } = usePatient(patientId)
  const { data: chartData } = useSWR(patientId ? `/api/fhir/patient-chart?id=${patientId}` : null, (url) =>
    fetch(url).then((r) => r.json())
  )

  // FHIR data hooks for chart components
  const { data: fhirLabs, isLoading: labsLoading } = usePatientLabs(patientId)
  const { inpatientMedications, homeMedications, isLoading: medsLoading } = usePatientMedications(patientId)
  const { data: fhirImaging, isLoading: imagingLoading } = usePatientImaging(patientId)
  const { data: fhirConditions } = usePatientConditions(patientId)

  const patient = aidboxPatient ? mapAidboxPatient(aidboxPatient, patientId) : getMockPatient(patientId)
  const enhancedPatient = getEnhancedPatientData(patient as ReturnType<typeof getMockPatient>)
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false)

  // Get tab from URL if specified (for command palette navigation)
  const defaultTab = searchParams.get('tab') || 'overview'

  const handleTextAnalyze = (text: string) => {
    setIsAISidebarOpen(true)
    // The sidebar will pick up the selection automatically
  }

  const handleTextDefine = (text: string) => {
    // Open a medical dictionary or definition
    window.open(`https://www.google.com/search?q=medical+definition+${encodeURIComponent(text)}`, '_blank')
  }

  const handleTextSearch = (text: string) => {
    // Search in UpToDate or similar
    window.open(`https://www.uptodate.com/contents/search?search=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <PatientChartLayout patient={enhancedPatient}>
      {/* Navigation Tabs */}
      <Tabs defaultValue={defaultTab}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex flex-nowrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="imaging" className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              Imaging
            </TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="diagnostic" className="flex items-center gap-1">
              <Stethoscope className="h-4 w-4" />
              AI Diagnostic
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="procedures" className="flex items-center gap-1">
              <Scissors className="h-4 w-4" />
              Procedures
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1">
              <CheckSquare className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="careplan">Care Plan</TabsTrigger>
            <TabsTrigger value="insurance" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Insurance
            </TabsTrigger>
            <Link href={`/patients/${patientId}/discharge`}>
              <TabsTrigger value="discharge" className="flex items-center gap-1">
                <ClipboardCheck className="h-4 w-4" />
                Discharge
              </TabsTrigger>
            </Link>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Chief Complaint / Diagnosis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Active Problems
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patient.conditions.map((condition, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <span>{condition.name}</span>
                      <Badge variant="outline">{condition.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Vitals Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Latest Vitals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {patient.vitals.slice(0, 6).map((vital, i) => (
                    <div key={i} className="rounded-lg border p-2">
                      <div className="text-xs text-muted-foreground">
                        {vital.name}
                      </div>
                      <div className="font-medium">{vital.value}</div>
                      {vital.note && (
                        <div className="text-xs text-muted-foreground">
                          {vital.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Labs Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Labs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patient.labs.map((lab, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <span>{lab.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lab.value}</span>
                        {lab.flag && (
                          <Badge
                            className={
                              lab.flag === 'H'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {lab.flag}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Medications Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Active Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patient.medications.map((med, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <span>{med.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {med.frequency}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals">
          <div className="space-y-6">
            <RealTimeVitals patientId={patientId} refreshInterval={30} />
            <VitalsTrend patientId={patientId} />
          </div>
        </TabsContent>

        <TabsContent value="labs">
          <div className="space-y-6">
            <LabsTrend patientId={patientId} />
            <LabsTable labs={fhirLabs || []} isLoading={labsLoading} />
          </div>
        </TabsContent>

        <TabsContent value="medications">
          <MedicationsPanel
            inpatientMedications={inpatientMedications}
            homeMedications={homeMedications}
            isLoading={medsLoading}
          />
        </TabsContent>

        <TabsContent value="imaging">
          <ImagingList imagingStudies={fhirImaging || []} isLoading={imagingLoading} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesPanel patientId={patientId} />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersPanel patientId={patientId} />
        </TabsContent>

        <TabsContent value="diagnostic">
          <DiagnosticAssistPanel patientId={patientId} encounterId={`encounter-${patientId}`} />
        </TabsContent>

        <TabsContent value="billing">
          <BillingAssistPanel encounterId={`encounter-${patientId}`} />
        </TabsContent>

        <TabsContent value="procedures">
          <ProceduresPanel patientId={patientId} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksPanel patientId={patientId} />
        </TabsContent>

        <TabsContent value="careplan">
          <CarePlanPanel patientId={patientId} />
        </TabsContent>

        <TabsContent value="insurance">
          <CoveragePanel patientId={patientId} />
        </TabsContent>
      </Tabs>

      {/* AI Sidebar */}
      <AISidebar
        patientId={patientId}
        encounterId={`encounter-${patientId}`}
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
      />

      {/* Text Selection Popover */}
      <TextSelectionPopover
        onAnalyze={handleTextAnalyze}
        onDefine={handleTextDefine}
        onSearch={handleTextSearch}
      />
    </PatientChartLayout>
  )
}
