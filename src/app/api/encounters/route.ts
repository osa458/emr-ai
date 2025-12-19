/**
 * Encounters API - List and Create
 * FHIR Resource: Encounter
 * Uses Aidbox SDK for data fetching
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Encounter').count(_count)
    
    if (patientId) {
      query = query.where('subject', `Patient/${patientId}`)
    }
    if (status) {
      query = query.where('status', status)
    }

    const bundle = await query
    const encounters = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || encounters.length

    return NextResponse.json({
      success: true,
      data: encounters,
      total,
    })
  } catch (error: any) {
    console.error('Encounters fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch encounters' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK to create encounter
    const created = await aidbox.resource.create('Encounter', body as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Encounter create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create encounter' },
      { status: 500 }
    )
  }
}
