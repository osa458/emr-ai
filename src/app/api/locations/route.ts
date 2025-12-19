/**
 * Locations API - List and Create
 * FHIR Resource: Location
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const type = searchParams.get('type')
    const organizationId = searchParams.get('organization')
    const status = searchParams.get('status')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Location').count(_count)
    if (name) query = query.where('name', name as any)
    if (type) query = query.where('type', type as any)
    if (organizationId) query = query.where('organization', organizationId as any)
    if (status) query = query.where('status', status as any)

    const bundle = await query
    const locations = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || locations.length

    return NextResponse.json({
      success: true,
      data: locations,
      total,
    })
  } catch (error: any) {
    console.error('Locations fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Location', {
      status: 'active',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Location create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create location' },
      { status: 500 }
    )
  }
}
