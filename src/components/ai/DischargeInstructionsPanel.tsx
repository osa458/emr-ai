'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Printer,
  Download,
  Loader2,
  Heart,
  Pill,
  Calendar,
  AlertTriangle,
  Phone,
} from 'lucide-react'
import type { DischargeMaterialsOutput } from '@/lib/llm/schemas'

interface DischargeInstructionsPanelProps {
  encounterId: string
}

export function DischargeInstructionsPanel({
  encounterId,
}: DischargeInstructionsPanelProps) {
  const [materials, setMaterials] = useState<DischargeMaterialsOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const generateMaterials = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/ai/discharge-materials/${encounterId}`)
      const data = await response.json()
      if (data.success) {
        setMaterials(data.data)
      }
    } catch (error) {
      console.error('Error generating materials:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!materials) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Discharge Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">
              Generate Patient Discharge Instructions
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Create personalized, patient-friendly discharge materials written at
              a 6th-8th grade reading level.
            </p>
            <Button className="mt-4" onClick={generateMaterials} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Instructions'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { patientInstructions, medicationSection, followupPlan, clinicianSummary } =
    materials

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Discharge Instructions
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
        <Badge variant="outline">Reading Level: {materials.readingLevel}</Badge>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patient">
          <TabsList className="mb-4">
            <TabsTrigger value="patient">Patient Instructions</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="followup">Follow-up</TabsTrigger>
            <TabsTrigger value="clinician">Clinician Summary</TabsTrigger>
          </TabsList>

          {/* Patient Instructions */}
          <TabsContent value="patient" className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-lg">{patientInstructions.greeting}</p>
            </div>

            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-red-500" />
                What Happened During Your Hospital Stay
              </h3>
              <p>{patientInstructions.hospitalSummary}</p>
            </div>

            {patientInstructions.diagnosisExplanations.map((dx, i) => (
              <div key={i} className="rounded-lg border p-4">
                <h4 className="font-semibold text-blue-700">{dx.diagnosisName}</h4>
                <div className="mt-2 space-y-2 text-sm">
                  <p>
                    <strong>What it means:</strong> {dx.whatItMeans}
                  </p>
                  <p>
                    <strong>What we did:</strong> {dx.whatWeDid}
                  </p>
                  <p>
                    <strong>Ongoing care:</strong> {dx.ongoingCare}
                  </p>
                </div>
              </div>
            ))}

            <div>
              <h3 className="font-semibold mb-2">What to Expect at Home</h3>
              <p>{patientInstructions.homeExpectations}</p>
            </div>

            {patientInstructions.activityRestrictions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Activity</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {patientInstructions.activityRestrictions.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {patientInstructions.dietInstructions && (
              <div>
                <h3 className="font-semibold mb-2">Diet</h3>
                <p>{patientInstructions.dietInstructions}</p>
              </div>
            )}

            {/* Warning Signs */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Warning Signs - When to Get Help
              </h3>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <h4 className="font-medium text-yellow-800">📞 Call the Clinic</h4>
                <ul className="list-disc pl-5 text-sm mt-1">
                  {patientInstructions.warningSigns.callClinic.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <h4 className="font-medium text-orange-800">🏥 Go to Urgent Care</h4>
                <ul className="list-disc pl-5 text-sm mt-1">
                  {patientInstructions.warningSigns.goToUrgentCare.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <h4 className="font-medium text-red-800">🚨 Call 911 or Go to ER</h4>
                <ul className="list-disc pl-5 text-sm mt-1">
                  {patientInstructions.warningSigns.callOrGoToER.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="rounded-lg bg-gray-100 p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4" />
                Important Phone Numbers
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>Clinic:</strong>{' '}
                  {patientInstructions.emergencyContacts.clinicPhone}
                </div>
                <div>
                  <strong>After Hours:</strong>{' '}
                  {patientInstructions.emergencyContacts.afterHoursPhone}
                </div>
                {patientInstructions.emergencyContacts.nurseLinePhone && (
                  <div>
                    <strong>Nurse Line:</strong>{' '}
                    {patientInstructions.emergencyContacts.nurseLinePhone}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Medications */}
          <TabsContent value="medications" className="space-y-4">
            <p className="text-muted-foreground">{medicationSection.summary}</p>

            {medicationSection.medications.map((med, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{med.medicationName}</span>
                  </div>
                  <Badge
                    className={
                      med.status === 'new'
                        ? 'bg-green-100 text-green-800'
                        : med.status === 'changed'
                        ? 'bg-yellow-100 text-yellow-800'
                        : med.status === 'stopped'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {med.status}
                  </Badge>
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Dose:</strong> {med.dosage} - {med.frequency}
                  </p>
                  <p>
                    <strong>Purpose:</strong> {med.purpose}
                  </p>
                  {med.specialInstructions && (
                    <p className="text-blue-600">
                      <strong>Special Instructions:</strong> {med.specialInstructions}
                    </p>
                  )}
                  {med.sideEffectsToWatch && med.sideEffectsToWatch.length > 0 && (
                    <p className="text-orange-600">
                      <strong>Watch for:</strong> {med.sideEffectsToWatch.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="font-medium mb-2">General Medication Tips</h4>
              <ul className="list-disc pl-5 text-sm">
                {medicationSection.generalMedicationTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </TabsContent>

          {/* Follow-up */}
          <TabsContent value="followup" className="space-y-4">
            <p className="text-muted-foreground">{followupPlan.summary}</p>

            {followupPlan.appointments.map((apt, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">{apt.providerType}</span>
                  <Badge variant="outline">{apt.timeframe}</Badge>
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Purpose:</strong> {apt.purpose}
                  </p>
                  <p>
                    <strong>What to expect:</strong> {apt.whatToExpect}
                  </p>
                  {apt.questionsToAsk && (
                    <div>
                      <strong>Questions to ask:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        {apt.questionsToAsk.map((q, j) => (
                          <li key={j}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Clinician Summary */}
          <TabsContent value="clinician" className="space-y-4">
            <div className="rounded-lg bg-gray-100 p-4">
              <h4 className="font-semibold mb-2">Hospital Course</h4>
              <p className="text-sm">{clinicianSummary.briefHospitalCourse}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Discharge Diagnoses</h4>
              <ul className="list-disc pl-5">
                {clinicianSummary.dischargeDiagnoses.map((dx, i) => (
                  <li key={i}>{dx}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Key Interventions</h4>
              <ul className="list-disc pl-5">
                {clinicianSummary.keyInterventions.map((int, i) => (
                  <li key={i}>{int}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Pending Items</h4>
              <ul className="list-disc pl-5">
                {clinicianSummary.pendingItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Follow-up Needs</h4>
              <ul className="list-disc pl-5">
                {clinicianSummary.followupNeeds.map((need, i) => (
                  <li key={i}>{need}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
