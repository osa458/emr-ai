/**
 * Practitioners API - List and Create
 * FHIR Resource: Practitioner
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const identifier = searchParams.get('identifier')
    const active = searchParams.get('active')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Practitioner').count(_count)
    if (name) query = query.where('name', name)
    if (identifier) query = query.where('identifier', identifier)
    if (active) query = query.where('active', active)

    const bundle = await query
    const practitioners = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || practitioners.length

    return NextResponse.json({
      success: true,
      data: practitioners,
      total,
    })
  } catch (error: any) {
    console.error('Practitioners fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch practitioners' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Practitioner', {
      active: true,
      ...body,
    } as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Practitioner create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create practitioner' },
      { status: 500 }
    )
  }
}
