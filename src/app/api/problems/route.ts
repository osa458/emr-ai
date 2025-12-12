/**
 * Problem List API Routes
 * CRUD operations for patient problems/conditions
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const ProblemSchema = z.object({
  patientId: z.string(),
  code: z.string().min(1),
  codeSystem: z.enum(['ICD-10', 'SNOMED']),
  description: z.string().min(1),
  status: z.enum(['active', 'resolved', 'inactive']),
  severity: z.enum(['mild', 'moderate', 'severe']),
  onsetDate: z.string(),
  resolvedDate: z.string().optional(),
  notes: z.string().optional(),
})

// In-memory store for demo (in production, use FHIR Condition resource)
const problemsStore: Map<string, any[]> = new Map()

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

    const problems = problemsStore.get(patientId) || []

    return NextResponse.json({
      success: true,
      data: problems,
      total: problems.length,
    })
  } catch (error) {
    console.error('Error fetching problems:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch problems' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = ProblemSchema.parse(body)

    const problem = {
      id: `prob-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...validated,
      addedAt: new Date().toISOString(),
      addedBy: 'Current User', // In production, get from session
    }

    const patientProblems = problemsStore.get(validated.patientId) || []
    patientProblems.push(problem)
    problemsStore.set(validated.patientId, patientProblems)

    return NextResponse.json({
      success: true,
      data: problem,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid problem data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating problem:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create problem' },
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
        { success: false, error: 'Problem ID and Patient ID are required' },
        { status: 400 }
      )
    }

    const patientProblems = problemsStore.get(patientId) || []
    const problemIndex = patientProblems.findIndex((p) => p.id === id)

    if (problemIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Problem not found' },
        { status: 404 }
      )
    }

    patientProblems[problemIndex] = {
      ...patientProblems[problemIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    problemsStore.set(patientId, patientProblems)

    return NextResponse.json({
      success: true,
      data: patientProblems[problemIndex],
    })
  } catch (error) {
    console.error('Error updating problem:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update problem' },
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
        { success: false, error: 'Problem ID and Patient ID are required' },
        { status: 400 }
      )
    }

    const patientProblems = problemsStore.get(patientId) || []
    const filteredProblems = patientProblems.filter((p) => p.id !== id)

    if (filteredProblems.length === patientProblems.length) {
      return NextResponse.json(
        { success: false, error: 'Problem not found' },
        { status: 404 }
      )
    }

    problemsStore.set(patientId, filteredProblems)

    return NextResponse.json({
      success: true,
      message: 'Problem deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting problem:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete problem' },
      { status: 500 }
    )
  }
}
