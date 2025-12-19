/**
 * Schedules API - List and Create
 * FHIR Resource: Schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const actorId = searchParams.get('actor')
    const date = searchParams.get('date')
    const serviceType = searchParams.get('service-type')
    const specialty = searchParams.get('specialty')
    const active = searchParams.get('active')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Schedule').count(_count)
    if (actorId) query = query.where('actor', actorId as any)
    if (date) query = query.where('date', date as any)
    if (serviceType) query = query.where('service-type', serviceType as any)
    if (specialty) query = query.where('specialty', specialty as any)
    if (active) query = query.where('active', active as any)

    const bundle = await query
    const schedules = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || schedules.length

    return NextResponse.json({
      success: true,
      data: schedules,
      total,
    })
  } catch (error: any) {
    console.error('Schedules fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Schedule', {
      active: true,
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Schedule create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
