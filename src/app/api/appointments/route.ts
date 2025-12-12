/**
 * Appointments API Route
 * Full CRUD operations for appointment management
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// In-memory store for demo (would be FHIR server in production)
let appointments: Appointment[] = [
  {
    id: 'appt-1',
    patientId: 'patient-3',
    patientName: 'John Smith',
    providerId: 'prov-1',
    providerName: 'Dr. Sarah Johnson',
    serviceType: 'Cardiology Follow-up',
    status: 'booked',
    start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    minutesDuration: 30,
    reason: 'Post-discharge CHF follow-up',
    mode: 'in_person',
    notes: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'appt-2',
    patientId: 'patient-4',
    patientName: 'Maria Garcia',
    providerId: 'prov-2',
    providerName: 'Dr. Michael Chen',
    serviceType: 'Primary Care',
    status: 'booked',
    start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    minutesDuration: 20,
    reason: 'Pneumonia follow-up',
    mode: 'telehealth',
    notes: 'Patient prefers video visit',
    createdAt: new Date().toISOString(),
  },
]

interface Appointment {
  id: string
  patientId: string
  patientName: string
  providerId?: string
  providerName?: string
  serviceType: string
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow'
  start: string
  end: string
  minutesDuration: number
  reason?: string
  mode?: 'in_person' | 'telehealth' | 'phone'
  notes?: string
  createdAt: string
  updatedAt?: string
}

const CreateAppointmentSchema = z.object({
  patientId: z.string(),
  patientName: z.string(),
  providerId: z.string().optional(),
  providerName: z.string().optional(),
  serviceType: z.string(),
  start: z.string(),
  minutesDuration: z.number().min(5).max(480).default(30),
  reason: z.string().optional(),
  mode: z.enum(['in_person', 'telehealth', 'phone']).optional(),
  notes: z.string().optional(),
})

const UpdateAppointmentSchema = z.object({
  providerId: z.string().optional(),
  providerName: z.string().optional(),
  serviceType: z.string().optional(),
  status: z.enum(['proposed', 'pending', 'booked', 'arrived', 'fulfilled', 'cancelled', 'noshow']).optional(),
  start: z.string().optional(),
  minutesDuration: z.number().min(5).max(480).optional(),
  reason: z.string().optional(),
  mode: z.enum(['in_person', 'telehealth', 'phone']).optional(),
  notes: z.string().optional(),
})

// GET - List appointments with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const providerId = searchParams.get('providerId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let filtered = [...appointments]

    if (patientId) {
      filtered = filtered.filter(a => a.patientId === patientId)
    }
    if (providerId) {
      filtered = filtered.filter(a => a.providerId === providerId)
    }
    if (status) {
      filtered = filtered.filter(a => a.status === status)
    }
    if (startDate) {
      filtered = filtered.filter(a => new Date(a.start) >= new Date(startDate))
    }
    if (endDate) {
      filtered = filtered.filter(a => new Date(a.start) <= new Date(endDate))
    }

    // Sort by start date
    filtered.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
    })
  } catch (error) {
    console.error('GET appointments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// POST - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = CreateAppointmentSchema.parse(body)

    const startDate = new Date(validated.start)
    const endDate = new Date(startDate.getTime() + validated.minutesDuration * 60 * 1000)

    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`,
      patientId: validated.patientId,
      patientName: validated.patientName,
      providerId: validated.providerId,
      providerName: validated.providerName,
      serviceType: validated.serviceType,
      status: 'booked',
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      minutesDuration: validated.minutesDuration,
      reason: validated.reason,
      mode: validated.mode,
      notes: validated.notes,
      createdAt: new Date().toISOString(),
    }

    appointments.push(newAppointment)

    return NextResponse.json({
      success: true,
      data: newAppointment,
      message: 'Appointment created successfully',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('POST appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}

// PUT - Update appointment (requires id in body)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    const validated = UpdateAppointmentSchema.parse(updates)
    const index = appointments.findIndex(a => a.id === id)

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Update end time if start or duration changed
    let newEnd = appointments[index].end
    if (validated.start || validated.minutesDuration) {
      const startDate = new Date(validated.start || appointments[index].start)
      const duration = validated.minutesDuration || appointments[index].minutesDuration
      newEnd = new Date(startDate.getTime() + duration * 60 * 1000).toISOString()
    }

    appointments[index] = {
      ...appointments[index],
      ...validated,
      end: newEnd,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: appointments[index],
      message: 'Appointment updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('PUT appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel or delete appointment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const hardDelete = searchParams.get('hardDelete') === 'true'

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    const index = appointments.findIndex(a => a.id === id)

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (hardDelete) {
      // Actually remove the appointment
      appointments.splice(index, 1)
      return NextResponse.json({
        success: true,
        message: 'Appointment deleted successfully',
      })
    } else {
      // Soft delete - just mark as cancelled
      appointments[index] = {
        ...appointments[index],
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      }
      return NextResponse.json({
        success: true,
        data: appointments[index],
        message: 'Appointment cancelled successfully',
      })
    }
  } catch (error) {
    console.error('DELETE appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}
