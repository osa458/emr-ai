/**
 * Service Requests API - List and Create
 * FHIR Resource: ServiceRequest (Orders)
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
    const intent = searchParams.get('intent')
    const priority = searchParams.get('priority')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('ServiceRequest').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (encounterId) query = query.where('encounter', `Encounter/${encounterId}` as any)
    if (status) query = query.where('status', status as any)
    if (category) query = query.where('category', category as any)
    if (intent) query = query.where('intent', intent as any)
    if (priority) query = query.where('priority', priority as any)

    const bundle = await query
    const requests = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || requests.length

    return NextResponse.json({
      success: true,
      data: requests,
      total,
    })
  } catch (error: any) {
    console.error('ServiceRequest fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch service requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('ServiceRequest', {
      status: 'active',
      intent: 'order',
      ...body,
    } as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('ServiceRequest create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create service request' },
      { status: 500 }
    )
  }
}
