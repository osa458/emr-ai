/**
 * Care Plans API - List and Create
 * FHIR Resource: CarePlan
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('CarePlan').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}`)
    if (encounterId) query = query.where('encounter', `Encounter/${encounterId}`)
    if (status) query = query.where('status', status)
    if (category) query = query.where('category', category)

    const bundle = await query
    const carePlans = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || carePlans.length

    return NextResponse.json({
      success: true,
      data: carePlans,
      total,
    })
  } catch (error: any) {
    console.error('CarePlans fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch care plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('CarePlan', {
      status: 'active',
      intent: 'plan',
      ...body,
    } as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('CarePlan create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create care plan' },
      { status: 500 }
    )
  }
}
