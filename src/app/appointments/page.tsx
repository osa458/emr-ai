'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, CalendarEvent } from '@/components/base/Calendar'
import { SearchBar, patientFilters } from '@/components/base/SearchBar'
import { ResourceTable, appointmentColumns, viewAction, editAction } from '@/components/base/ResourceTable'
import {
  Plus, Calendar as CalendarIcon, List, Grid, 
  Clock, User, MapPin, Video, Phone, Sparkles, X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

// Mock appointments data
const mockAppointments: CalendarEvent[] = [
  {
    id: 'apt-1',
    title: 'John Smith - Follow-up',
    start: new Date(Date.now() + 2 * 60 * 60 * 1000),
    end: new Date(Date.now() + 2.5 * 60 * 60 * 1000),
    extendedProps: {
      patientId: 'patient-1',
      patientName: 'John Smith',
      practitionerId: 'dr-williams',
      practitionerName: 'Dr. Williams',
      status: 'booked',
      type: 'follow-up',
      notes: 'CHF follow-up, review echo results'
    }
  },
  {
    id: 'apt-2',
    title: 'Mary Johnson - New Patient',
    start: new Date(Date.now() + 4 * 60 * 60 * 1000),
    end: new Date(Date.now() + 5 * 60 * 60 * 1000),
    extendedProps: {
      patientId: 'patient-2',
      patientName: 'Mary Johnson',
      practitionerId: 'dr-williams',
      practitionerName: 'Dr. Williams',
      status: 'booked',
      type: 'new-patient'
    }
  },
  {
    id: 'apt-3',
    title: 'Robert Davis - Telemedicine',
    start: new Date(Date.now() + 24 * 60 * 60 * 1000),
    end: new Date(Date.now() + 24.5 * 60 * 60 * 1000),
    extendedProps: {
      patientId: 'patient-3',
      patientName: 'Robert Davis',
      practitionerId: 'dr-patel',
      practitionerName: 'Dr. Patel',
      status: 'booked',
      type: 'telemedicine'
    }
  },
  {
    id: 'apt-4',
    title: 'Susan Wilson - Urgent',
    start: new Date(Date.now() + 1 * 60 * 60 * 1000),
    end: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
    extendedProps: {
      patientId: 'patient-4',
      patientName: 'Susan Wilson',
      practitionerId: 'dr-williams',
      practitionerName: 'Dr. Williams',
      status: 'arrived',
      type: 'urgent'
    }
  }
]

// Convert to table format
const appointmentsForTable = mockAppointments.map(apt => ({
  resourceType: 'Appointment' as const,
  id: apt.id,
  status: (apt.extendedProps?.status || 'booked') as 'booked' | 'arrived' | 'pending' | 'fulfilled' | 'cancelled',
  start: apt.start instanceof Date ? apt.start.toISOString() : apt.start,
  serviceType: [{ text: apt.extendedProps?.type }],
  description: apt.title,
  participant: [{ actor: { display: apt.extendedProps?.patientName } }]
})) as any[]

// New appointment form state
interface NewAppointmentForm {
  patientName: string
  patientId: string
  type: 'follow-up' | 'new-patient' | 'telemedicine' | 'urgent' | 'routine'
  date: string
  time: string
  duration: string
  practitioner: string
  notes: string
}

const initialFormState: NewAppointmentForm = {
  patientName: '',
  patientId: '',
  type: 'follow-up',
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  duration: '30',
  practitioner: 'dr-williams',
  notes: ''
}

export default function AppointmentsPage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarEvent | null>(null)
  const [appointments, setAppointments] = useState<CalendarEvent[]>(mockAppointments)
  const [newAppointment, setNewAppointment] = useState<NewAppointmentForm>(initialFormState)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' })

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedAppointment(event)
  }

  const handleDateSelect = (start: Date, end: Date) => {
    setSelectedDate(start)
    setNewAppointment(prev => ({
      ...prev,
      date: start.toISOString().split('T')[0],
      time: start.toTimeString().slice(0, 5)
    }))
    setShowNewAppointment(true)
  }

  const handleCreateAppointment = () => {
    const startDate = new Date(`${newAppointment.date}T${newAppointment.time}`)
    const endDate = new Date(startDate.getTime() + parseInt(newAppointment.duration) * 60000)
    
    const newApt: CalendarEvent = {
      id: `apt-${Date.now()}`,
      title: `${newAppointment.patientName} - ${newAppointment.type.replace('-', ' ')}`,
      start: startDate,
      end: endDate,
      extendedProps: {
        patientId: newAppointment.patientId || `patient-${Date.now()}`,
        patientName: newAppointment.patientName,
        practitionerId: newAppointment.practitioner,
        practitionerName: newAppointment.practitioner === 'dr-williams' ? 'Dr. Williams' : 'Dr. Patel',
        status: 'booked',
        type: newAppointment.type,
        notes: newAppointment.notes
      }
    }
    
    setAppointments(prev => [...prev, newApt])
    setShowNewAppointment(false)
    setNewAppointment(initialFormState)
  }

  const handleReschedule = () => {
    if (selectedAppointment) {
      const aptDate = new Date(selectedAppointment.start)
      setRescheduleForm({
        date: aptDate.toISOString().split('T')[0],
        time: aptDate.toTimeString().slice(0, 5)
      })
      setRescheduleDialogOpen(true)
    }
  }

  const handleConfirmReschedule = () => {
    if (selectedAppointment && rescheduleForm.date && rescheduleForm.time) {
      const newStart = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`)
      const startVal = selectedAppointment.start
      const endVal = selectedAppointment.end
      const oldStart = startVal instanceof Date ? startVal : new Date(startVal as string)
      const oldEnd = endVal ? (endVal instanceof Date ? endVal : new Date(endVal as string)) : new Date(oldStart.getTime() + 30 * 60000)
      const duration = oldEnd.getTime() - oldStart.getTime()
      const newEnd = new Date(newStart.getTime() + duration)
      
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { ...apt, start: newStart, end: newEnd }
          : apt
      ))
      setSelectedAppointment({ ...selectedAppointment, start: newStart, end: newEnd })
      setRescheduleDialogOpen(false)
    }
  }

  const handleCancelAppointment = () => {
    setCancelDialogOpen(true)
  }

  const handleConfirmCancel = () => {
    if (selectedAppointment) {
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { ...apt, extendedProps: { ...apt.extendedProps, status: 'cancelled' } }
          : apt
      ))
      setSelectedAppointment({ 
        ...selectedAppointment, 
        extendedProps: { ...selectedAppointment.extendedProps, status: 'cancelled' } 
      })
      setCancelDialogOpen(false)
    }
  }

  const handleCheckIn = () => {
    if (selectedAppointment) {
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { ...apt, extendedProps: { ...apt.extendedProps, status: 'arrived' } }
          : apt
      ))
      setSelectedAppointment({ 
        ...selectedAppointment, 
        extendedProps: { ...selectedAppointment.extendedProps, status: 'arrived' } 
      })
    }
  }

  // Stats
  const todayAppointments = mockAppointments.filter(a => {
    const today = new Date()
    const aptDate = new Date(a.start)
    return aptDate.toDateString() === today.toDateString()
  })

  const upcomingCount = mockAppointments.filter(a => new Date(a.start) > new Date()).length
  const arrivedCount = mockAppointments.filter(a => a.extendedProps?.status === 'arrived').length

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Appointments
          </h1>
          <p className="text-muted-foreground">Manage patient appointments and scheduling</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={view === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setView('calendar')}
            >
              <Grid className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
          <Button onClick={() => setShowNewAppointment(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{todayAppointments.length}</div>
                <div className="text-sm text-muted-foreground">Today&apos;s Appointments</div>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{arrivedCount}</div>
                <div className="text-sm text-muted-foreground">Arrived / Waiting</div>
              </div>
              <User className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{upcomingCount}</div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </div>
              <Clock className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {mockAppointments.filter(a => a.extendedProps?.type === 'telemedicine').length}
                </div>
                <div className="text-sm text-muted-foreground">Telemedicine</div>
              </div>
              <Video className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-4 gap-6">
        {/* Calendar/List View */}
        <div className="col-span-3">
          {view === 'calendar' ? (
            <Calendar
              events={appointments}
              onEventClick={handleEventClick}
              onDateSelect={handleDateSelect}
              onCreateEvent={() => setShowNewAppointment(true)}
              selectable
              height={600}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Appointments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ResourceTable
                  data={appointmentsForTable}
                  columns={appointmentColumns}
                  actions={[
                    viewAction((row) => console.log('View', row)),
                    editAction((row) => console.log('Edit', row))
                  ]}
                  onRowClick={(row) => console.log('Clicked', row)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Appointment Details */}
          {selectedAppointment ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium">{selectedAppointment.extendedProps?.patientName}</div>
                  <div className="text-sm text-muted-foreground">{selectedAppointment.title}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {new Date(selectedAppointment.start).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {selectedAppointment.extendedProps?.practitionerName}
                </div>
                <Badge className="capitalize">{selectedAppointment.extendedProps?.status}</Badge>
                
                {selectedAppointment.extendedProps?.notes && (
                  <div className="p-2 bg-slate-50 rounded text-sm">
                    {selectedAppointment.extendedProps.notes}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2 flex-wrap">
                  {selectedAppointment.extendedProps?.status === 'cancelled' ? (
                    <Badge variant="destructive">Cancelled</Badge>
                  ) : (
                    <>
                      {selectedAppointment.extendedProps?.type === 'telemedicine' ? (
                        <Button size="sm" className="flex-1">
                          <Video className="h-4 w-4 mr-1" />
                          Start Video
                        </Button>
                      ) : selectedAppointment.extendedProps?.status === 'arrived' ? (
                        <Button size="sm" className="flex-1" variant="secondary">
                          <User className="h-4 w-4 mr-1" />
                          Checked In
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1" onClick={handleCheckIn}>
                          Check In
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={handleReschedule}>
                        Reschedule
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleCancelAppointment}>
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select an appointment to view details
              </CardContent>
            </Card>
          )}

          {/* AI Scheduling Suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="p-2 bg-purple-50 rounded">
                <div className="font-medium text-purple-700">Optimize Schedule</div>
                <div className="text-purple-600">3 appointments can be consolidated to reduce gaps</div>
              </div>
              <div className="p-2 bg-amber-50 rounded">
                <div className="font-medium text-amber-700">Follow-up Reminder</div>
                <div className="text-amber-600">5 patients due for follow-up this week</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* New Appointment Dialog */}
      <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patientName" className="text-right">Patient</Label>
              <Input
                id="patientName"
                value={newAppointment.patientName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAppointment(prev => ({ ...prev, patientName: e.target.value }))}
                className="col-span-3"
                placeholder="Enter patient name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <select
                id="type"
                value={newAppointment.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewAppointment(prev => ({ ...prev, type: e.target.value as any }))}
                className="col-span-3 px-3 py-2 border rounded-md"
              >
                <option value="follow-up">Follow-up</option>
                <option value="new-patient">New Patient</option>
                <option value="telemedicine">Telemedicine</option>
                <option value="urgent">Urgent</option>
                <option value="routine">Routine</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Date</Label>
              <Input
                id="date"
                type="date"
                value={newAppointment.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">Time</Label>
              <Input
                id="time"
                type="time"
                value={newAppointment.time}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">Duration</Label>
              <select
                id="duration"
                value={newAppointment.duration}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewAppointment(prev => ({ ...prev, duration: e.target.value }))}
                className="col-span-3 px-3 py-2 border rounded-md"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="practitioner" className="text-right">Provider</Label>
              <select
                id="practitioner"
                value={newAppointment.practitioner}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewAppointment(prev => ({ ...prev, practitioner: e.target.value }))}
                className="col-span-3 px-3 py-2 border rounded-md"
              >
                <option value="dr-williams">Dr. Williams</option>
                <option value="dr-patel">Dr. Patel</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Input
                id="notes"
                value={newAppointment.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                className="col-span-3"
                placeholder="Appointment notes (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAppointment(false)}>Cancel</Button>
            <Button onClick={handleCreateAppointment} disabled={!newAppointment.patientName}>
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              {selectedAppointment?.extendedProps?.patientName} - {selectedAppointment?.extendedProps?.type}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reschedule-date" className="text-right">Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleForm.date}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reschedule-time" className="text-right">Time</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleForm.time}
                onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmReschedule}>Confirm Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel the appointment for <strong>{selectedAppointment?.extendedProps?.patientName}</strong>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>No, Keep It</Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>Yes, Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
