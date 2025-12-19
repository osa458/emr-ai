/**
 * Procedures API - List and Create
 * FHIR Resource: Procedure
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Procedure').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (encounterId) query = query.where('encounter', `Encounter/${encounterId}` as any)
    if (status) query = query.where('status', status as any)
    if (date) query = query.where('date', date as any)

    const bundle = await query
    const procedures = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || procedures.length

    return NextResponse.json({
      success: true,
      data: procedures,
      total,
    })
  } catch (error: any) {
    console.error('Procedures fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch procedures' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Procedure', {
      status: 'completed',
      ...body,
    } as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Procedure create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create procedure' },
      { status: 500 }
    )
  }
}
