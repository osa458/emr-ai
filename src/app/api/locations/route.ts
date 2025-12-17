/**
 * Locations API - List and Create
 * FHIR Resource: Location
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const type = searchParams.get('type')
    const organizationId = searchParams.get('organization')
    const status = searchParams.get('status')
    const _count = searchParams.get('_count') || '100'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (name) params.set('name', name)
    if (type) params.set('type', type)
    if (organizationId) params.set('organization', organizationId)
    if (status) params.set('status', status)

    const response = await aidboxFetch(`/Location?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch locations: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
    
    const location = {
      resourceType: 'Location',
      status: 'active',
      ...body,
    }

    const response = await aidboxFetch('/Location', {
      method: 'POST',
      body: JSON.stringify(location),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create location: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Location create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create location' },
      { status: 500 }
    )
  }
}
