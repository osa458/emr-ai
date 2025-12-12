/**
 * Allergy List API Routes
 * CRUD operations for patient allergies
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const AllergySchema = z.object({
  patientId: z.string(),
  allergen: z.string().min(1),
  type: z.enum(['medication', 'food', 'environmental', 'other']),
  reaction: z.string().min(1),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening']),
  status: z.enum(['active', 'inactive', 'resolved']),
  onsetDate: z.string().optional(),
  verifiedDate: z.string().optional(),
  verifiedBy: z.string().optional(),
  notes: z.string().optional(),
})

// In-memory store for demo (in production, use FHIR AllergyIntolerance resource)
const allergiesStore: Map<string, any[]> = new Map()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    const allergies = allergiesStore.get(patientId) || []

    return NextResponse.json({
      success: true,
      data: allergies,
      total: allergies.length,
      hasLifeThreatening: allergies.some(
        (a) => a.severity === 'life-threatening' && a.status === 'active'
      ),
    })
  } catch (error) {
    console.error('Error fetching allergies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch allergies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = AllergySchema.parse(body)

    const allergy = {
      id: `allergy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...validated,
      addedAt: new Date().toISOString(),
    }

    const patientAllergies = allergiesStore.get(validated.patientId) || []
    patientAllergies.push(allergy)
    allergiesStore.set(validated.patientId, patientAllergies)

    return NextResponse.json({
      success: true,
      data: allergy,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid allergy data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating allergy:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create allergy' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, patientId, ...updates } = body

    if (!id || !patientId) {
      return NextResponse.json(
        { success: false, error: 'Allergy ID and Patient ID are required' },
        { status: 400 }
      )
    }

    const patientAllergies = allergiesStore.get(patientId) || []
    const allergyIndex = patientAllergies.findIndex((a) => a.id === id)

    if (allergyIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Allergy not found' },
        { status: 404 }
      )
    }

    patientAllergies[allergyIndex] = {
      ...patientAllergies[allergyIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    allergiesStore.set(patientId, patientAllergies)

    return NextResponse.json({
      success: true,
      data: patientAllergies[allergyIndex],
    })
  } catch (error) {
    console.error('Error updating allergy:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update allergy' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const patientId = searchParams.get('patientId')

    if (!id || !patientId) {
      return NextResponse.json(
        { success: false, error: 'Allergy ID and Patient ID are required' },
        { status: 400 }
      )
    }

    const patientAllergies = allergiesStore.get(patientId) || []
    const filteredAllergies = patientAllergies.filter((a) => a.id !== id)

    if (filteredAllergies.length === patientAllergies.length) {
      return NextResponse.json(
        { success: false, error: 'Allergy not found' },
        { status: 404 }
      )
    }

    allergiesStore.set(patientId, filteredAllergies)

    return NextResponse.json({
      success: true,
      message: 'Allergy deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting allergy:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete allergy' },
      { status: 500 }
    )
  }
}
