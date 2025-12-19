/**
 * Observations API - List and Create
 * FHIR Resource: Observation (Vitals, Labs, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const category = searchParams.get('category')
    const code = searchParams.get('code')
    const status = searchParams.get('status')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Observation').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}`)
    if (category) query = query.where('category', category)
    if (code) query = query.where('code', code)
    if (status) query = query.where('status', status)

    const bundle = await query
    const observations = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || observations.length

    return NextResponse.json({
      success: true,
      data: observations,
      total,
    })
  } catch (error: any) {
    console.error('Observations fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch observations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Observation', {
      status: 'final',
      ...body,
    } as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Observation create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create observation' },
      { status: 500 }
    )
  }
}
