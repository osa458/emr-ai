/**
 * Consents API - List and Create
 * FHIR Resource: Consent
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Consent').count(_count)
    if (patientId) query = query.where('patient', `Patient/${patientId}` as any)
    if (status) query = query.where('status', status as any)
    if (category) query = query.where('category', category as any)

    const bundle = await query
    const consents = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || consents.length

    return NextResponse.json({
      success: true,
      data: consents,
      total,
    })
  } catch (error: any) {
    console.error('Consent fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch consents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Consent', {
      status: 'active',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Consent create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create consent' },
      { status: 500 }
    )
  }
}
