'use client'

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
  Phone,
  Mail,
  Heart,
  Globe,
  Users,
  CreditCard,
  AlertCircle,
  LayoutDashboard,
  Home,
} from 'lucide-react'
import { RealTimeVitals } from '@/components/clinical/RealTimeVitals'
import { ClinicalNotes } from '@/components/clinical/ClinicalNotes'
import { DiagnosticAssistPanel } from '@/components/ai/DiagnosticAssistPanel'
import {
  usePatientLabs,
  usePatientVitals,
  usePatientMedications,
  usePatientConditions,
  usePatientProcedures,
  usePatientImaging,
  usePatientTasks,
  usePatientCarePlans,
  usePatientCoverage,
  usePatientAllergies,
} from '@/hooks/useFHIRData'
import { BillingAssistPanel } from '@/components/ai/BillingAssistPanel'
import { SmartNotesPanel } from '@/components/ai/SmartNotesPanel'
import { ClinicalNotePanel } from '@/components/ai/ClinicalNotePanel'
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
import { PatientStickyNote } from '@/components/patients/PatientStickyNote'
import { EncountersPanel } from '@/components/chart/EncountersPanel'
import Link from 'next/link'
// CDS Components
import { CDSAlertBanner, SepsisRiskPanel, RiskScoresPanel, CareGapsPanel } from '@/components/cds'
import { useDrugInteractions } from '@/hooks/useDrugInteractions'
import { useSepsisRisk } from '@/hooks/useSepsisRisk'
import { useRiskScores } from '@/hooks/useRiskScores'
import { useCareGaps } from '@/hooks/useCareGaps'

interface FHIRPatientChartProps {
  patient: any
  patientId: string
}

// Helper functions to format FHIR data
const formatCondition = (condition: any) => ({
  name: condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown condition',
  status: condition.clinicalStatus?.coding?.[0]?.code || condition.clinicalStatus?.text || 'active',
  verificationStatus: condition.verificationStatus?.coding?.[0]?.code || condition.verificationStatus?.text || 'confirmed',
  onset: condition.onsetDateTime || condition.onsetAge?.text || 'Unknown',
})

// Filter out social determinant "findings" that aren't real medical conditions
const isMedicalCondition = (condition: any): boolean => {
  const name = condition.code?.text || condition.code?.coding?.[0]?.display || ''
  const excludePatterns = [
    '(finding)',
    '(situation)',
    '(social concept)',
    'employment',
    'education',
    'housing',
    'stress',
    'lack of',
    'Received higher',
    'Social isolation',
    'Reports of violence',
    'Victim of intimate partner abuse',
    'Has a criminal record',
    'Misuses drugs',
    'Unhealthy alcohol drinking behavior',
    'Limited social contact',
    'Not in labor force',
    'Part-time employment',
    'Full-time employment',
  ]
  const lowerName = name.toLowerCase()
  return !excludePatterns.some(pattern => lowerName.includes(pattern.toLowerCase()))
}

const formatVital = (vital: any) => {
  const code = vital.code?.text || vital.code?.coding?.[0]?.display || 'Unknown'
  const value = vital.valueQuantity?.value || vital.component?.[0]?.valueQuantity?.value
  const unit = vital.valueQuantity?.unit || vital.component?.[0]?.valueQuantity?.unit || ''
  const date = vital.effectiveDateTime || vital.effectivePeriod?.start || 'Unknown'

  return {
    name: code,
    value: value ? `${value} ${unit}`.trim() : 'No value',
    date: new Date(date).toLocaleDateString(),
    time: new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
}

const formatLab = (lab: any) => {
  const name = lab.code?.text || lab.code?.coding?.[0]?.display || 'Unknown test'
  const value = lab.valueQuantity?.value
  const unit = lab.valueQuantity?.unit || ''
  const date = lab.effectiveDateTime || 'Unknown'

  // Determine if value is abnormal from FHIR interpretation
  let flag = ''
  if (lab.interpretation?.length > 0) {
    const interpCode = lab.interpretation[0]?.coding?.[0]?.code?.toUpperCase()
    if (interpCode === 'H' || interpCode === 'HH' || interpCode === 'HIGH') flag = 'H'
    else if (interpCode === 'L' || interpCode === 'LL' || interpCode === 'LOW') flag = 'L'
    else if (interpCode === 'A' || interpCode === 'AA') flag = 'A' // Abnormal
  }

  // Fallback: check reference ranges if no interpretation
  if (!flag && value && lab.referenceRange?.length > 0) {
    const range = lab.referenceRange[0]
    const low = range.low?.value
    const high = range.high?.value
    if (low !== undefined && value < low) flag = 'L'
    else if (high !== undefined && value > high) flag = 'H'
  }

  return {
    name,
    value: value !== undefined ? `${Math.round(value * 100) / 100} ${unit}`.trim() : 'Pending',
    flag,
    date: new Date(date).toLocaleDateString(),
    rawValue: value,
    unit,
  }
}

const formatMedication = (med: any) => {
  const name = med.medicationCodeableConcept?.text ||
    med.medicationCodeableConcept?.coding?.[0]?.display ||
    med.medicationReference?.display || 'Unknown medication'
  const dosage = med.dosageInstruction?.[0]
  const dose = dosage?.doseAndRate?.[0]?.doseQuantity?.value || ''
  const doseUnit = dosage?.doseAndRate?.[0]?.doseQuantity?.unit || ''
  const frequency = dosage?.timing?.repeat?.frequency || dosage?.timing?.repeat?.code?.coding?.[0]?.display || 'Unknown'

  return {
    name,
    dose: dose ? `${dose} ${doseUnit}`.trim() : '',
    frequency,
    status: med.status || 'active',
    route: dosage?.route?.coding?.[0]?.display || '',
  }
}

const formatProcedure = (procedure: any) => {
  const name = procedure.code?.text || procedure.code?.coding?.[0]?.display || 'Unknown procedure'
  const date = procedure.performedDateTime || procedure.performedPeriod?.start || 'Unknown'
  const status = procedure.status || 'completed'

  return {
    name,
    date: new Date(date).toLocaleDateString(),
    status,
  }
}

const formatImaging = (report: any) => {
  const name = report.code?.text || report.code?.coding?.[0]?.display || 'Unknown study'
  const date = report.effectiveDateTime || 'Unknown'
  const conclusion = report.conclusion || 'No conclusion available'

  return {
    type: name,
    date: new Date(date).toLocaleDateString(),
    finding: conclusion,
  }
}

export function FHIRPatientChart({ patient, patientId }: FHIRPatientChartProps) {
  // Fetch real FHIR data
  const { data: conditions = [], isLoading: conditionsLoading } = usePatientConditions(patientId)
  const { data: vitals = [], isLoading: vitalsLoading } = usePatientVitals(patientId)
  const { data: labs = [], isLoading: labsLoading } = usePatientLabs(patientId)
  const medications = usePatientMedications(patientId)
  const { data: procedures = [], isLoading: proceduresLoading } = usePatientProcedures(patientId)
  const { data: imaging = [], isLoading: imagingLoading } = usePatientImaging(patientId)
  const { data: tasks = [], isLoading: tasksLoading } = usePatientTasks(patientId)
  const { data: carePlans = [], isLoading: carePlansLoading } = usePatientCarePlans(patientId)
  const { data: coverage = [], isLoading: coverageLoading } = usePatientCoverage(patientId)
  const { data: allergies = [], isLoading: allergiesLoading } = usePatientAllergies(patientId)

  // CDS Hooks
  const { data: drugInteractions } = useDrugInteractions(patientId)
  const { data: sepsisRisk } = useSepsisRisk(patientId)
  const { data: riskScores } = useRiskScores(patientId)
  const { data: careGaps } = useCareGaps(patientId)

  // Format data for display - filter out social determinant findings
  const formattedConditions = conditions.filter(isMedicalCondition).map(formatCondition)
  const formattedVitals = vitals.slice(0, 6).map(formatVital)
  const formattedLabs = labs.slice(0, 10).map(formatLab)
  const formattedMedications = [
    ...medications.inpatientMedications.map(formatMedication),
    ...medications.homeMedications.map(formatMedication)
  ].slice(0, 10)
  const formattedProcedures = procedures.slice(0, 10).map(formatProcedure)
  const formattedImaging = imaging.slice(0, 10).map(formatImaging)

  // Calculate key labs for header
  const keyLabs = labs.slice(0, 6).map(lab => {
    const formatted = formatLab(lab)
    return {
      name: lab.code?.coding?.[0]?.code || formatted.name,
      value: formatted.value.split(' ')[0],
      unit: formatted.value.split(' ')[1] || '',
      status: formatted.flag === 'H' || formatted.flag === 'HH' ? 'high' as const :
        formatted.flag === 'L' || formatted.flag === 'LL' ? 'low' as const : 'normal' as const,
      trend: 'stable' as const, // Would need historical data for trend
    }
  })

  const isLoading = conditionsLoading || vitalsLoading || labsLoading ||
    proceduresLoading || imagingLoading || tasksLoading ||
    carePlansLoading || coverageLoading || allergiesLoading

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PatientStickyNote patientId={patientId} />

      {/* CDS Alert Banner - Shows critical alerts at top */}
      {(drugInteractions?.hasInteractions || drugInteractions?.hasAllergyAlerts ||
        sepsisRisk?.overallRisk === 'high' || sepsisRisk?.overallRisk === 'critical') && (
          <CDSAlertBanner
            alerts={[
              ...(drugInteractions?.allergyAlerts?.length ? [{
                id: 'allergy',
                type: 'allergy' as const,
                severity: 'high' as const,
                title: `${drugInteractions.allergyAlerts.length} Allergy Alert${drugInteractions.allergyAlerts.length > 1 ? 's' : ''}`
              }] : []),
              ...(drugInteractions?.drugInteractions?.length ? [{
                id: 'drug-interaction',
                type: 'drug-interaction' as const,
                severity: drugInteractions.drugInteractions.some(d => d.severity === 'major' || d.severity === 'contraindicated') ? 'high' as const : 'moderate' as const,
                title: `${drugInteractions.drugInteractions.length} Drug Interaction${drugInteractions.drugInteractions.length > 1 ? 's' : ''}`
              }] : []),
              ...(sepsisRisk?.overallRisk === 'high' || sepsisRisk?.overallRisk === 'critical' ? [{
                id: 'sepsis',
                type: 'sepsis' as const,
                severity: sepsisRisk.overallRisk === 'critical' ? 'critical' as const : 'high' as const,
                title: `Sepsis Risk: ${sepsisRisk.overallRisk.toUpperCase()}`
              }] : [])
            ]}
            patientId={patientId}
            className="mx-4 mt-2"
          />
        )}

      {/* Sticky Top Navigation Bar - Mobile Responsive */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white px-2 sm:px-4 py-2 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/patients" className="flex items-center gap-1 sm:gap-2 hover:bg-slate-800 px-2 sm:px-3 py-1.5 rounded-md transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </Link>
            <div className="h-6 w-px bg-slate-700 hidden sm:block" />
            <div className="hidden md:flex items-center gap-1">
              <Link href="/" className="flex items-center gap-1.5 hover:bg-slate-800 px-2 py-1.5 rounded-md transition-colors text-sm">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
              <Link href="/patients" className="flex items-center gap-1.5 hover:bg-slate-800 px-2 py-1.5 rounded-md transition-colors text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden lg:inline">Patients</span>
              </Link>
              <Link href="/encounters" className="flex items-center gap-1.5 hover:bg-slate-800 px-2 py-1.5 rounded-md transition-colors text-sm">
                <Stethoscope className="h-4 w-4" />
                <span className="hidden lg:inline">Encounters</span>
              </Link>
              <Link href="/appointments" className="flex items-center gap-1.5 hover:bg-slate-800 px-2 py-1.5 rounded-md transition-colors text-sm">
                <Calendar className="h-4 w-4" />
                <span className="hidden lg:inline">Appointments</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-sm">
            <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{patient.name}</span>
            <Badge variant="secondary" className="bg-slate-700 text-slate-200 text-xs">
              {patient.mrn}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left Sidebar - Patient Demographics - Collapsible on mobile */}
        <div className="lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r bg-muted/30 p-3 lg:p-4 space-y-3 lg:space-y-4">
          {/* Patient Avatar & Name */}
          <div className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
              {patient.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
            </div>
            <h2 className="text-lg font-bold">{patient.name}</h2>
            <p className="text-sm text-muted-foreground">MRN: {patient.mrn}</p>
          </div>

          {/* Demographics Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">DOB</span>
                <span className="font-medium">
                  {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age</span>
                <span className="font-medium">{patient.age || 0} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sex</span>
                <span className="font-medium capitalize">{patient.gender}</span>
              </div>
              {patient.maritalStatus && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marital Status</span>
                  <span className="font-medium">{patient.maritalStatus}</span>
                </div>
              )}
              {patient.language && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <span className="font-medium">{patient.language}</span>
                </div>
              )}
              {patient.race && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Race</span>
                  <span className="font-medium">{patient.race}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {patient.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">No phone on file</div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="pt-2 border-t">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-1" />
                    <div>
                      {patient.address.lines && <div>{patient.address.lines}</div>}
                      <div>
                        {patient.address.city}{patient.address.state ? `, ${patient.address.state}` : ''} {patient.address.postalCode}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clinical Info Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Clinical Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Code Status</span>
                <Badge className="bg-green-100 text-green-800">Not Specified</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Attending</span>
                <span className="font-medium text-muted-foreground">Not Assigned</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Allergies</span>
                </div>
                <div className="mt-1">
                  {allergies.length > 0 ? (
                    allergies.slice(0, 3).map((allergy: any, i: number) => {
                      const allergenName = allergy.code?.text ||
                        allergy.code?.coding?.[0]?.display ||
                        'Unknown allergen'
                      return (
                        <Badge key={i} variant="destructive" className="text-xs mr-1 mb-1">
                          {allergenName}
                        </Badge>
                      )
                    })
                  ) : (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      NKDA
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Insurance
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {coverage.length > 0 ? (
                <div className="space-y-2">
                  {coverage.slice(0, 2).map((cov: any, i: number) => (
                    <div key={i} className="text-xs">
                      <div className="font-medium">{cov.payor?.[0]?.display || 'Insurance'}</div>
                      <div className="text-muted-foreground">{cov.subscriberId || 'No ID'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-xs">No insurance on file</div>
              )}
            </CardContent>
          </Card>

          <Link href="/patients" className="block">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Patient Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{patient.name}</h1>
              <p className="text-muted-foreground">
                {patient.age}y • {patient.gender} • MRN: {patient.mrn}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Summary
              </Button>
              <Button>
                <Stethoscope className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold">{patient.location || 'Unknown'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Attending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-semibold text-muted-foreground">Not Assigned</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Code Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="bg-gray-100 text-gray-800">Not Specified</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Allergies</CardTitle>
              </CardHeader>
              <CardContent>
                {allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {allergies.slice(0, 2).map((allergy: any, i: number) => {
                      const allergenName = allergy.code?.text ||
                        allergy.code?.coding?.[0]?.display ||
                        'Unknown'
                      return (
                        <Badge key={i} variant="destructive" className="text-xs">
                          {allergenName}
                        </Badge>
                      )
                    })}
                    {allergies.length > 2 && (
                      <Badge variant="outline" className="text-xs">+{allergies.length - 2}</Badge>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-700">NKDA</Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Key Labs */}
          <Card>
            <CardHeader>
              <CardTitle>Key Labs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {keyLabs.map((lab, i) => (
                  <div key={i} className="text-center">
                    <div className="text-sm text-muted-foreground">{lab.name}</div>
                    <div className={`font-bold ${lab.status === 'high' ? 'text-red-600' :
                      lab.status === 'low' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                      {lab.value}
                    </div>
                    <div className="text-xs text-muted-foreground">{lab.unit}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs - Mobile Responsive */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1 sm:grid sm:grid-cols-5 md:grid-cols-10">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="cds" className="text-xs sm:text-sm bg-purple-50">CDS</TabsTrigger>
              <TabsTrigger value="encounters" className="text-xs sm:text-sm">Encounters</TabsTrigger>
              <TabsTrigger value="labs" className="text-xs sm:text-sm">Labs</TabsTrigger>
              <TabsTrigger value="medications" className="text-xs sm:text-sm">Meds</TabsTrigger>
              <TabsTrigger value="imaging" className="text-xs sm:text-sm">Imaging</TabsTrigger>
              <TabsTrigger value="procedures" className="text-xs sm:text-sm">Procedures</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs sm:text-sm">Notes</TabsTrigger>
              <TabsTrigger value="orders" className="text-xs sm:text-sm">Orders</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs sm:text-sm">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Active Problems */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Active Problems ({formattedConditions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {formattedConditions.slice(0, 8).map((condition, i) => (
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
                      Latest Vitals ({formattedVitals.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {formattedVitals.map((vital, i) => (
                        <div key={i} className="rounded-lg border p-2">
                          <div className="text-xs text-muted-foreground">
                            {vital.name}
                          </div>
                          <div className="font-medium">{vital.value}</div>
                          <div className="text-xs text-muted-foreground">
                            {vital.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Labs Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Labs ({formattedLabs.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {formattedLabs.slice(0, 8).map((lab, i) => (
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
                                  lab.flag === 'H' || lab.flag === 'HH'
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
                      Active Medications ({formattedMedications.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {formattedMedications.slice(0, 8).map((med, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border p-2"
                        >
                          <div>
                            <div className="font-medium">{med.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {med.dose} {med.frequency}
                            </div>
                          </div>
                          <Badge variant="outline">{med.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Panels */}
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <ClinicalNotePanel patientId={patientId} patientName={patient.name} />
                </div>
                <div className="space-y-4">
                  <SmartNotesPanel patientId={patientId} patientName={patient.name} />
                  <DiagnosticAssistPanel patientId={patientId} patientName={patient.name} />
                </div>
              </div>
            </TabsContent>

            {/* CDS Tab */}
            <TabsContent value="cds" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {sepsisRisk && <SepsisRiskPanel data={sepsisRisk} />}
                {riskScores && <RiskScoresPanel data={riskScores} />}
              </div>
              {careGaps && <CareGapsPanel data={careGaps} />}
            </TabsContent>

            <TabsContent value="encounters">
              <EncountersPanel patientId={patientId} />
            </TabsContent>

            <TabsContent value="labs">
              <div className="space-y-4">
                <LabsTable labs={labs} isLoading={labsLoading} />
                <LabsTrend patientId={patientId} />
              </div>
            </TabsContent>

            <TabsContent value="medications">
              <MedicationsPanel
                patientId={patientId}
                inpatientMedications={medications.inpatientMedications}
                homeMedications={medications.homeMedications}
              />
            </TabsContent>

            <TabsContent value="imaging">
              <ImagingList imagingStudies={imaging} isLoading={imagingLoading} />
            </TabsContent>

            <TabsContent value="procedures">
              <ProceduresPanel patientId={patientId} />
            </TabsContent>

            <TabsContent value="notes">
              <NotesPanel patientId={patientId} />
            </TabsContent>

            <TabsContent value="orders">
              <OrdersPanel patientId={patientId} />
            </TabsContent>

            <TabsContent value="tasks">
              <TasksPanel patientId={patientId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
