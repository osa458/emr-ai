/**
 * Practitioners API - List and Create
 * FHIR Resource: Practitioner
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const identifier = searchParams.get('identifier')
    const active = searchParams.get('active')
    const _count = searchParams.get('_count') || '100'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (name) params.set('name', name)
    if (identifier) params.set('identifier', identifier)
    if (active) params.set('active', active)

    const response = await aidboxFetch(`/Practitioner?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch practitioners: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
    
    const practitioner = {
      resourceType: 'Practitioner',
      active: true,
      ...body,
    }

    const response = await aidboxFetch('/Practitioner', {
      method: 'POST',
      body: JSON.stringify(practitioner),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create practitioner: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Practitioner create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create practitioner' },
      { status: 500 }
    )
  }
}
