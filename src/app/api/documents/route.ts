/**
 * Documents API - List and Create
 * FHIR Resource: DocumentReference
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('DocumentReference').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (encounterId) query = query.where('context', `Encounter/${encounterId}` as any)
    if (status) query = query.where('status', status as any)
    if (type) query = query.where('type', type as any)
    if (category) query = query.where('category', category as any)

    const bundle = await query
    const documents = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || documents.length

    return NextResponse.json({
      success: true,
      data: documents,
      total,
    })
  } catch (error: any) {
    console.error('DocumentReference fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('DocumentReference', {
      status: 'current',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('DocumentReference create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create document' },
      { status: 500 }
    )
  }
}
