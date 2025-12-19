/**
 * Observations API - Read, Update by ID
 * FHIR Resource: Observation
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Use Aidbox SDK
    const observation = await aidbox.resource.get('Observation', id)
    return NextResponse.json({ success: true, data: observation })
  } catch (error: any) {
    console.error('Observation fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch observation' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Use Aidbox SDK
    const updated = await aidbox.resource.update('Observation', id, {
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Observation update error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update observation' },
      { status: 500 }
    )
  }
}
