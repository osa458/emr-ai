/**
 * Practitioners API - Read and Update by ID
 * FHIR Resource: Practitioner
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
    const practitioner = await aidbox.resource.get('Practitioner', id)
    return NextResponse.json({ success: true, data: practitioner })
  } catch (error: any) {
    console.error('Practitioner fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch practitioner' },
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
    const updated = await aidbox.resource.update('Practitioner', id, {
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Practitioner update error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update practitioner' },
      { status: 500 }
    )
  }
}
