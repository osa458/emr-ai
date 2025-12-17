/**
 * Healthcare Services API - List and Create
 * FHIR Resource: HealthcareService
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const category = searchParams.get('category')
    const organizationId = searchParams.get('organization')
    const locationId = searchParams.get('location')
    const active = searchParams.get('active')
    const _count = searchParams.get('_count') || '100'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (name) params.set('name', name)
    if (category) params.set('category', category)
    if (organizationId) params.set('organization', organizationId)
    if (locationId) params.set('location', locationId)
    if (active) params.set('active', active)

    const response = await aidboxFetch(`/HealthcareService?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch healthcare services: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const services = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || services.length

    return NextResponse.json({
      success: true,
      data: services,
      total,
    })
  } catch (error: any) {
    console.error('HealthcareService fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch healthcare services' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const service = {
      resourceType: 'HealthcareService',
      active: true,
      ...body,
    }

    const response = await aidboxFetch('/HealthcareService', {
      method: 'POST',
      body: JSON.stringify(service),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create healthcare service: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('HealthcareService create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create healthcare service' },
      { status: 500 }
    )
  }
}
