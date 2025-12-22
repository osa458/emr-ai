'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Heart,
  Pill,
  AlertTriangle,
  Calendar,
  Bot,
  LogOut,
  Loader2,
  Activity,
  FileText,
  User,
} from 'lucide-react'
import { AIHealthChat } from '@/components/patient-portal'
import { cn } from '@/lib/utils'

interface PatientSession {
  patientId: string
  name: string
  accessToken: string
}

interface HealthData {
  patient: { id: string; name: string; birthDate?: string; gender?: string }
  conditions: { id: string; name: string; status: string }[]
  medications: { id: string; name: string; dosage: string; status: string }[]
  allergies: { id: string; substance: string; reaction: string }[]
  appointments: { id: string; date: string; description: string; status: string }[]
  summary: { conditionCount: number; medicationCount: number; allergyCount: number; upcomingAppointments: number }
}

export default function PatientPortalPage() {
  const [session, setSession] = useState<PatientSession | null>(null)
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Login form
  const [mrn, setMrn] = useState('')
  const [dob, setDob] = useState('')
  const [lastName, setLastName] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError('')

    try {
      const response = await fetch('/api/patient-portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mrn,
          dateOfBirth: dob,
          lastName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSession(data.session)
        localStorage.setItem('patientSession', JSON.stringify(data.session))
      } else {
        setLoginError(data.error || 'Login failed')
      }
    } catch {
      setLoginError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setSession(null)
    setHealthData(null)
    localStorage.removeItem('patientSession')
  }

  // Load session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('patientSession')
    if (stored) {
      try {
        setSession(JSON.parse(stored))
      } catch {
        localStorage.removeItem('patientSession')
      }
    }
  }, [])

  // Fetch health data when session changes
  useEffect(() => {
    if (session?.accessToken) {
      fetchHealthData()
    }
  }, [session?.accessToken])

  const fetchHealthData = async () => {
    if (!session?.accessToken) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/patient-portal/my-health', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setHealthData(data)
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Login Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Patient Portal</CardTitle>
            <p className="text-muted-foreground">
              Access your health information and AI Health Companion
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Medical Record Number (MRN)</label>
                <Input
                  value={mrn}
                  onChange={(e) => setMrn(e.target.value)}
                  placeholder="e.g., MRN-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Birth</label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
              {loginError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  {loginError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Sign In
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Demo: Use any seeded patient MRN (e.g., MRN-001, MRN-002)
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Portal Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold">Welcome, {session.name}</h1>
                <p className="text-sm text-muted-foreground">Patient Portal</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading && !healthData ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Health Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{healthData?.summary.conditionCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Conditions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Pill className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{healthData?.summary.medicationCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Medications</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold">{healthData?.summary.allergyCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Allergies</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold">{healthData?.summary.upcomingAppointments || 0}</p>
                    <p className="text-xs text-muted-foreground">Appointments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Health Details Tabs */}
              <Card>
                <Tabs defaultValue="conditions">
                  <CardHeader className="pb-0">
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="conditions">Conditions</TabsTrigger>
                      <TabsTrigger value="medications">Medications</TabsTrigger>
                      <TabsTrigger value="allergies">Allergies</TabsTrigger>
                      <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <TabsContent value="conditions" className="mt-0">
                      {healthData?.conditions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No conditions on record</p>
                      ) : (
                        <div className="space-y-2">
                          {healthData?.conditions.map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span>{c.name}</span>
                              <Badge variant="outline">{c.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="medications" className="mt-0">
                      {healthData?.medications.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No medications on record</p>
                      ) : (
                        <div className="space-y-2">
                          {healthData?.medications.map(m => (
                            <div key={m.id} className="p-3 rounded-lg bg-muted/50">
                              <div className="font-medium">{m.name}</div>
                              {m.dosage && <div className="text-sm text-muted-foreground">{m.dosage}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="allergies" className="mt-0">
                      {healthData?.allergies.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No allergies on record</p>
                      ) : (
                        <div className="space-y-2">
                          {healthData?.allergies.map(a => (
                            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                              <span className="font-medium">{a.substance}</span>
                              <span className="text-sm text-muted-foreground">{a.reaction}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="appointments" className="mt-0">
                      {healthData?.appointments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No upcoming appointments</p>
                      ) : (
                        <div className="space-y-2">
                          {healthData?.appointments.map(a => (
                            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <div>
                                <div className="font-medium">{a.description}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(a.date).toLocaleString()}
                                </div>
                              </div>
                              <Badge>{a.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>

            {/* Right Column - AI Health Chat */}
            <div>
              <AIHealthChat
                accessToken={session.accessToken}
                patientName={session.name.split(' ')[0]}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
