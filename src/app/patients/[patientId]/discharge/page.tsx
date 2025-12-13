'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { DischargeReadinessOutput } from '@/lib/llm/schemas'
import { DischargeInstructionsPanel } from '@/components/ai/DischargeInstructionsPanel'
import { MedicationReconciliation } from '@/components/discharge/MedicationReconciliation'
import type { MedicationRequest, MedicationStatement, Coverage, Organization } from '@medplum/fhirtypes'
import { Pill } from 'lucide-react'

// Mock data for medication reconciliation
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
  {
    resourceType: 'MedicationRequest',
    id: '5',
    status: 'active',
    intent: 'order',
    subject: { reference: 'Patient/mock' },
    medicationCodeableConcept: { text: 'Eliquis 5mg' },
    dosageInstruction: [{ timing: { code: { text: 'BID' } } }],
    reasonCode: [{ text: 'Afib' }],
  },
]

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
    medicationCodeableConcept: { text: 'Empagliflozin 10mg' },
    category: { coding: [{ code: 'community' }] },
    dosage: [{ text: '10mg Daily', timing: { code: { text: 'Daily' } } }],
    note: [{ text: 'May not be covered by insurance - prior auth may be required' }],
  },
]

const getMockCoverage = (): Coverage[] => [
  {
    resourceType: 'Coverage',
    id: 'cov1',
    status: 'active',
    subscriber: { reference: 'Patient/mock' },
    beneficiary: { reference: 'Patient/mock' },
    payor: [{ reference: 'Organization/ins1' }],
    class: [{
      type: { coding: [{ code: 'plan' }] },
      value: 'preferred',
      name: 'Blue Cross Blue Shield PPO - preferred formulary',
    }],
  },
]

const getMockPharmacies = (): Organization[] => [
  {
    resourceType: 'Organization',
    id: 'pharm1',
    name: 'CVS Pharmacy - Main St',
    type: [{ text: 'Pharmacy' }],
    telecom: [{ system: 'phone', value: '555-0101' }],
    address: [{ text: '123 Main Street' }],
    extension: [{ url: 'http://example.org/fhir/StructureDefinition/pharmacy-delivery', valueBoolean: true }],
  },
  {
    resourceType: 'Organization',
    id: 'pharm2',
    name: 'Walgreens - Oak Ave',
    type: [{ text: 'Pharmacy' }],
    telecom: [{ system: 'phone', value: '555-0102' }],
    address: [{ text: '456 Oak Avenue' }],
    extension: [{ url: 'http://example.org/fhir/StructureDefinition/pharmacy-delivery', valueBoolean: true }],
  },
  {
    resourceType: 'Organization',
    id: 'pharm3',
    name: 'Hospital Outpatient Pharmacy',
    type: [{ text: 'Pharmacy' }],
    telecom: [{ system: 'phone', value: '555-0103' }],
    address: [{ text: '789 Medical Center Dr' }],
  },
  {
    resourceType: 'Organization',
    id: 'pharm4',
    name: 'Costco Pharmacy',
    type: [{ text: 'Pharmacy' }],
    telecom: [{ system: 'phone', value: '555-0104' }],
    address: [{ text: '321 Commerce Blvd' }],
  },
]

const readinessConfig: Record<string, { color: string; bgColor: string }> = {
  READY_TODAY: { color: 'text-green-700', bgColor: 'bg-green-100' },
  READY_SOON: { color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  NOT_READY: { color: 'text-red-700', bgColor: 'bg-red-100' },
}

export default function DischargeReadinessPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.patientId as string

  const [readiness, setReadiness] = useState<DischargeReadinessOutput | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchReadiness = async () => {
    setIsLoading(true)
    try {
      // Using mock encounter ID for demo
      const response = await fetch(`/api/ai/discharge-readiness/encounter-${patientId}`)
      const result = await response.json()
      if (result.success) {
        setReadiness(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch readiness:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchReadiness()
  }, [patientId])

  const handleGenerateMaterials = async () => {
    setIsGenerating(true)
    // Simulate generating materials
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsGenerating(false)
    setActiveTab('instructions')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const config = readiness
    ? readinessConfig[readiness.readinessLevel]
    : readinessConfig.NOT_READY

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => router.push(`/patients/${patientId}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Chart
      </Button>

      {/* Patient Banner */}
      <Card className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Discharge Planning</h1>
                <p className="text-slate-300">Patient ID: {patientId}</p>
              </div>
            </div>
            {readiness && (
              <Badge className={`${config.bgColor} ${config.color} text-lg px-4 py-2`}>
                {readiness.readinessLevel.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Discharge Readiness Assessment</h2>
            {readiness && (
              <span className="text-sm text-muted-foreground">
                Score: {readiness.readinessScore}/100
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchReadiness}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateMaterials}
              disabled={isGenerating}
            >
              <FileText className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Instructions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {readiness && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center gap-1">
              <Pill className="h-4 w-4" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="followup">Follow-up Plan</TabsTrigger>
            <TabsTrigger value="pending">Pending Tests</TabsTrigger>
            <TabsTrigger value="safety">Safety Checks</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Readiness Reasons */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {readiness.readinessReasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Clinical Status */}
            <Card>
              <CardHeader>
                <CardTitle>Clinical Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <StatusItem
                    label="Vitals"
                    status={readiness.clinicalStatus.vitalsStable}
                    notes={readiness.clinicalStatus.vitalsNotes}
                  />
                  <StatusItem
                    label="Labs"
                    status={readiness.clinicalStatus.labsAcceptable}
                    notes={readiness.clinicalStatus.labsNotes}
                  />
                  <StatusItem
                    label="Symptoms"
                    status={readiness.clinicalStatus.symptomsControlled}
                    notes={readiness.clinicalStatus.symptomsNotes}
                  />
                  <div>
                    <div className="font-medium">Oxygen</div>
                    <div className="text-sm text-muted-foreground">
                      {readiness.clinicalStatus.oxygenRequirement}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blocking Factors */}
            {readiness.blockingFactors.length > 0 && (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <AlertCircle className="h-5 w-5" />
                    Blocking Factors ({readiness.blockingFactors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {readiness.blockingFactors.map((factor, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-orange-200 bg-orange-50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{factor.factor}</span>
                          <Badge variant="outline">{factor.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {factor.details}
                        </p>
                        {factor.estimatedResolutionTime && (
                          <div className="flex items-center gap-1 text-sm mt-2">
                            <Clock className="h-3 w-3" />
                            <span>Est. resolution: {factor.estimatedResolutionTime}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="medications">
            <MedicationReconciliation
              patientId={patientId}
              encounterId={`encounter-${patientId}`}
              inpatientMedications={getMockInpatientMeds()}
              homeMedications={getMockHomeMeds()}
              coverage={getMockCoverage()}
              pharmacies={getMockPharmacies()}
            />
          </TabsContent>

          <TabsContent value="followup">
            <Card>
              <CardHeader>
                <CardTitle>Follow-up Appointments Needed</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Timeframe</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readiness.followupNeeds.map((followup, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{followup.specialty}</TableCell>
                      <TableCell>{followup.timeframe.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{followup.reason}</TableCell>
                      <TableCell className="capitalize">
                        {followup.mode.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            followup.priority === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : followup.priority === 'important'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }
                        >
                          {followup.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Calendar className="mr-1 h-3 w-3" />
                          Schedule
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Tests</CardTitle>
              </CardHeader>
              {readiness.pendingTests.length === 0 ? (
                <CardContent>
                  <div className="py-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <p className="mt-2 text-muted-foreground">
                      No pending tests - all complete!
                    </p>
                  </div>
                </CardContent>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Why It Matters</TableHead>
                      <TableHead>Responsible</TableHead>
                      <TableHead>Critical</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readiness.pendingTests.map((test, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{test.testName}</TableCell>
                        <TableCell>{test.expectedResultDate}</TableCell>
                        <TableCell>{test.whyItMattersClinician}</TableCell>
                        <TableCell>{test.responsiblePhysicianRole}</TableCell>
                        <TableCell>
                          {test.criticalForDischarge ? (
                            <Badge className="bg-red-100 text-red-800">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="safety">
            <Card>
              <CardHeader>
                <CardTitle>Discharge Safety Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {readiness.safetyChecks.map((check, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        check.completed ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {check.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2" />
                        )}
                        <div>
                          <div className="font-medium">{check.item}</div>
                          {check.notes && (
                            <div className="text-sm text-muted-foreground">
                              {check.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{check.category}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructions">
            <DischargeInstructionsPanel encounterId={`encounter-${patientId}`} />
          </TabsContent>
        </Tabs>
      )}

      {/* Disclaimer */}
      {readiness?.disclaimer && (
        <p className="text-xs text-muted-foreground text-center">
          {readiness.disclaimer}
        </p>
      )}
    </div>
  )
}

function StatusItem({
  label,
  status,
  notes,
}: {
  label: string
  status: boolean
  notes: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-medium">{label}</span>
        {status ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        )}
      </div>
      <div className="text-sm text-muted-foreground">{notes}</div>
    </div>
  )
}
