/**
 * Individual Appointment API Route
 * GET, PUT, DELETE for single appointment by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// This would connect to the same store - for demo we'll return mock data
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

// GET - Get single appointment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Mock appointment data for demo
    const mockAppointment = {
      id,
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
    }

    return NextResponse.json({
      success: true,
      data: mockAppointment,
    })
  } catch (error) {
    console.error('GET appointment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}

// PUT - Update single appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = UpdateAppointmentSchema.parse(body)

    // In production, this would update the FHIR server
    const updatedAppointment = {
      id,
      patientId: 'patient-3',
      patientName: 'John Smith',
      ...validated,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
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

// DELETE - Cancel or delete single appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hardDelete') === 'true'

    if (hardDelete) {
      return NextResponse.json({
        success: true,
        message: `Appointment ${id} deleted successfully`,
      })
    } else {
      return NextResponse.json({
        success: true,
        data: { id, status: 'cancelled', updatedAt: new Date().toISOString() },
        message: `Appointment ${id} cancelled successfully`,
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
