/**
 * Coverage API - List and Create
 * FHIR Resource: Coverage (Insurance)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const beneficiaryId = searchParams.get('beneficiary')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const payorId = searchParams.get('payor')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Coverage').count(_count)
    if (patientId) query = query.where('patient', `Patient/${patientId}` as any)
    if (beneficiaryId) query = query.where('beneficiary', beneficiaryId as any)
    if (status) query = query.where('status', status as any)
    if (type) query = query.where('type', type as any)
    if (payorId) query = query.where('payor', payorId as any)

    const bundle = await query
    const coverage = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || coverage.length

    return NextResponse.json({
      success: true,
      data: coverage,
      total,
    })
  } catch (error: any) {
    console.error('Coverage fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch coverage' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Coverage', {
      status: 'active',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Coverage create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create coverage' },
      { status: 500 }
    )
  }
}
