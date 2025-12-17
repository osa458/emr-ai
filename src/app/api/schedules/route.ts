/**
 * Schedules API - List and Create
 * FHIR Resource: Schedule
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const actorId = searchParams.get('actor')
    const date = searchParams.get('date')
    const serviceType = searchParams.get('service-type')
    const specialty = searchParams.get('specialty')
    const active = searchParams.get('active')
    const _count = searchParams.get('_count') || '50'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (actorId) params.set('actor', actorId)
    if (date) params.set('date', date)
    if (serviceType) params.set('service-type', serviceType)
    if (specialty) params.set('specialty', specialty)
    if (active) params.set('active', active)

    const response = await aidboxFetch(`/Schedule?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch schedules: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
    
    const schedule = {
      resourceType: 'Schedule',
      active: true,
      ...body,
    }

    const response = await aidboxFetch('/Schedule', {
      method: 'POST',
      body: JSON.stringify(schedule),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create schedule: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Schedule create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
