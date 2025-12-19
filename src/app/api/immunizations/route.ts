/**
 * Immunizations API - List and Create
 * FHIR Resource: Immunization
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Immunization').count(_count)
    if (patientId) query = query.where('patient', patientId as any)
    if (status) query = query.where('status', status as any)
    if (date) query = query.where('date', date as any)

    const bundle = await query
    const immunizations = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || immunizations.length

    return NextResponse.json({
      success: true,
      data: immunizations,
      total,
    })
  } catch (error: any) {
    console.error('Immunizations fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch immunizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Immunization', {
      status: 'completed',
      ...body,
    } as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Immunization create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create immunization' },
      { status: 500 }
    )
  }
}
