'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  FileText,
  Calendar,
  MessageSquare,
  Pill,
  Activity,
  Download,
  Clock,
  CheckCircle,
  Bell,
  Plus,
  AlertCircle,
} from 'lucide-react'
import {
  usePatientLabs,
  usePatientMedications,
  usePatientConditions,
  useAllAppointments,
} from '@/hooks/useFHIRData'
import type { Appointment, MedicationRequest, Observation } from '@medplum/fhirtypes'

interface PatientPortalData {
  name: string
  dob: string
  mrn: string
  email?: string
  phone?: string
}

// Format medication for display
function formatMedication(med: MedicationRequest) {
  const name = med.medicationCodeableConcept?.text || 
               med.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown'
  const dosage = med.dosageInstruction?.[0]
  const dose = dosage?.doseAndRate?.[0]?.doseQuantity?.value || ''
  const unit = dosage?.doseAndRate?.[0]?.doseQuantity?.unit || ''
  const freq = dosage?.timing?.code?.coding?.[0]?.display || 
               dosage?.text || 'As directed'
  return {
    name: `${name} ${dose}${unit}`.trim(),
    instructions: freq,
    refillsRemaining: med.dispenseRequest?.numberOfRepeatsAllowed || 0,
  }
}

// Format lab result for display
function formatLabResult(obs: Observation) {
  return {
    id: obs.id || '',
    name: obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown Test',
    date: obs.effectiveDateTime ? new Date(obs.effectiveDateTime).toLocaleDateString() : 'Unknown',
    status: 'ready' as const,
  }
}

// Format appointment for display
function formatAppointment(apt: Appointment) {
  const startDate = apt.start ? new Date(apt.start) : null
  return {
    id: apt.id || '',
    date: startDate?.toISOString().split('T')[0] || '',
    time: startDate?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) || '',
    provider: apt.participant?.find(p => p.actor?.reference?.startsWith('Practitioner'))?.actor?.display || 'Provider',
    type: apt.appointmentType?.text || apt.serviceType?.[0]?.text || 'Visit',
    location: apt.participant?.find(p => p.actor?.reference?.startsWith('Location'))?.actor?.display || 'Clinic',
  }
}

// Mock messages (would come from a messaging system)
const messages = [
  { id: '1', from: 'Dr. Johnson', subject: 'Lab Results Review', date: '2024-12-11', unread: true },
  { id: '2', from: 'Nurse Smith', subject: 'Appointment Reminder', date: '2024-12-09', unread: false },
]

export default function PatientPortalPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId') || 'patient-1'  // Default demo patient
  
  // Fetch real FHIR data
  const { data: labs = [], isLoading: labsLoading } = usePatientLabs(patientId)
  const { inpatientMedications = [], homeMedications = [], isLoading: medsLoading } = usePatientMedications(patientId)
  const { data: conditions = [], isLoading: conditionsLoading } = usePatientConditions(patientId)
  const { data: appointmentsData = [], isLoading: appointmentsLoading } = useAllAppointments()

  // Format data for display
  const allMedications = [...inpatientMedications, ...homeMedications]
  const medications = allMedications
    .filter((m): m is MedicationRequest => 'intent' in m && m.status === 'active')
    .map(formatMedication)
  const recentResults = labs.slice(0, 10).map(formatLabResult)
  const upcomingAppointments = appointmentsData
    .filter((apt) => apt.status !== 'cancelled')
    .slice(0, 5)
    .map(formatAppointment)
  
  // Patient data (would come from auth context in production)
  const patientData: PatientPortalData = {
    name: 'Patient',  // Would be fetched from patient resource
    dob: '',
    mrn: patientId,
  }

  const isLoading = labsLoading || medsLoading || conditionsLoading || appointmentsLoading

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">Welcome, {patientData.name}</h1>
                <p className="text-sm text-muted-foreground">Patient Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  2
                </span>
              </Button>
              <Button variant="outline">Sign Out</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="records">My Records</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('appointments')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
                      <p className="text-sm text-muted-foreground">Upcoming Visits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('results')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{recentResults.length}</p>
                      <p className="text-sm text-muted-foreground">New Results</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('medications')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Pill className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{medications.length}</p>
                      <p className="text-sm text-muted-foreground">Active Meds</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('messages')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{messages.filter(m => m.unread).length}</p>
                      <p className="text-sm text-muted-foreground">Unread Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button><Calendar className="h-4 w-4 mr-2" />Schedule Appointment</Button>
                  <Button variant="outline"><MessageSquare className="h-4 w-4 mr-2" />Message Provider</Button>
                  <Button variant="outline"><Pill className="h-4 w-4 mr-2" />Request Refill</Button>
                  <Button variant="outline"><Download className="h-4 w-4 mr-2" />Download Records</Button>
                </div>
              </CardContent>
            </Card>

            {/* Next Appointment */}
            {upcomingAppointments[0] && (
              <Card>
                <CardHeader>
                  <CardTitle>Next Appointment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {new Date(upcomingAppointments[0].date).getDate()}
                        </div>
                        <div className="text-sm text-blue-600">
                          {new Date(upcomingAppointments[0].date).toLocaleString('default', { month: 'short' })}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{upcomingAppointments[0].type} with {upcomingAppointments[0].provider}</p>
                        <p className="text-sm text-muted-foreground">
                          {upcomingAppointments[0].time} • {upcomingAppointments[0].location}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Reschedule</Button>
                      <Button size="sm">Check In</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Appointments</CardTitle>
                <Button><Plus className="h-4 w-4 mr-2" />Schedule New</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map(apt => (
                    <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Calendar className="h-10 w-10 text-blue-500" />
                        <div>
                          <p className="font-medium">{apt.type}</p>
                          <p className="text-sm text-muted-foreground">{apt.provider}</p>
                          <p className="text-sm text-muted-foreground">{apt.date} at {apt.time}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Cancel</Button>
                        <Button variant="outline" size="sm">Reschedule</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentResults.map(result => (
                    <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">{result.date}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <Card>
              <CardHeader>
                <CardTitle>My Medications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {medications.map((med, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Pill className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-muted-foreground">{med.instructions}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{med.refillsRemaining} refills left</Badge>
                        <Button size="sm">Request Refill</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <Button><Plus className="h-4 w-4 mr-2" />New Message</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${msg.unread ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className={`h-5 w-5 ${msg.unread ? 'text-blue-500' : 'text-gray-400'}`} />
                        <div>
                          <p className={`${msg.unread ? 'font-semibold' : 'font-medium'}`}>{msg.subject}</p>
                          <p className="text-sm text-muted-foreground">From: {msg.from} • {msg.date}</p>
                        </div>
                      </div>
                      {msg.unread && <Badge className="bg-blue-500">New</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>My Health Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Complete Medical Record
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    View Immunization History
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Pill className="h-4 w-4 mr-2" />
                    View Medication History
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Visit History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
