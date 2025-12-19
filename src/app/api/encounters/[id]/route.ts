/**
 * Encounters API - Read, Update, Delete by ID
 * FHIR Resource: Encounter
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
    const encounter = await aidbox.resource.get('Encounter', id)
    return NextResponse.json({ success: true, data: encounter })
  } catch (error: any) {
    console.error('Encounter fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch encounter' },
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
    const updated = await aidbox.resource.update('Encounter', id, {
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Encounter update error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update encounter' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Use Aidbox SDK
    await aidbox.resource.delete('Encounter', id)

    return NextResponse.json({ success: true, message: 'Encounter deleted' })
  } catch (error: any) {
    console.error('Encounter delete error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete encounter' },
      { status: 500 }
    )
  }
}
