/**
 * Conditions API - Read, Update, Delete by ID
 * FHIR Resource: Condition
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
    const condition = await aidbox.resource.get('Condition', id)
    return NextResponse.json({ success: true, data: condition })
  } catch (error: any) {
    console.error('Condition fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch condition' },
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
    const updated = await aidbox.resource.update('Condition', id, {
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Condition update error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update condition' },
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
    await aidbox.resource.delete('Condition', id)

    return NextResponse.json({ success: true, message: 'Condition deleted' })
  } catch (error: any) {
    console.error('Condition delete error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete condition' },
      { status: 500 }
    )
  }
}
