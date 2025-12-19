/**
 * Healthcare Services API - List and Create
 * FHIR Resource: HealthcareService
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const category = searchParams.get('category')
    const organizationId = searchParams.get('organization')
    const locationId = searchParams.get('location')
    const active = searchParams.get('active')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('HealthcareService').count(_count)
    if (name) query = query.where('name', name as any)
    if (category) query = query.where('category', category as any)
    if (organizationId) query = query.where('organization', organizationId as any)
    if (locationId) query = query.where('location', locationId as any)
    if (active) query = query.where('active', active as any)

    const bundle = await query
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
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('HealthcareService', {
      active: true,
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('HealthcareService create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create healthcare service' },
      { status: 500 }
    )
  }
}
