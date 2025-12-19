/**
 * Family Member Histories API - List and Create
 * FHIR Resource: FamilyMemberHistory
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const relationship = searchParams.get('relationship')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('FamilyMemberHistory').count(_count)
    if (patientId) query = query.where('patient', `Patient/${patientId}` as any)
    if (status) query = query.where('status', status as any)
    if (relationship) query = query.where('relationship', relationship as any)

    const bundle = await query
    const histories = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || histories.length

    return NextResponse.json({
      success: true,
      data: histories,
      total,
    })
  } catch (error: any) {
    console.error('FamilyMemberHistory fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch family histories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('FamilyMemberHistory', {
      status: 'completed',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('FamilyMemberHistory create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create family history' },
      { status: 500 }
    )
  }
}
