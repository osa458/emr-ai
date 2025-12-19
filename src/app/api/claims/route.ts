/**
 * Claims API - List and Create
 * FHIR Resource: Claim
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const use = searchParams.get('use')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Claim').count(_count)
    if (patientId) query = query.where('patient', `Patient/${patientId}` as any)
    if (encounterId) query = query.where('encounter', `Encounter/${encounterId}` as any)
    if (status) query = query.where('status', status as any)
    if (use) query = query.where('use', use as any)

    const bundle = await query
    const claims = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || claims.length

    return NextResponse.json({
      success: true,
      data: claims,
      total,
    })
  } catch (error: any) {
    console.error('Claims fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Claim', {
      status: 'active',
      use: 'claim',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Claim create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create claim' },
      { status: 500 }
    )
  }
}
