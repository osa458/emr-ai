/**
 * Slots API - List
 * FHIR Resource: Slot (Appointment availability)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('schedule')
    const status = searchParams.get('status')
    const start = searchParams.get('start')
    const serviceType = searchParams.get('service-type')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Slot').count(_count)
    if (scheduleId) query = query.where('schedule', scheduleId as any)
    if (status) query = query.where('status', status as any)
    if (start) query = query.where('start', start as any)
    if (serviceType) query = query.where('service-type', serviceType as any)

    const bundle = await query
    const slots = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || slots.length

    return NextResponse.json({
      success: true,
      data: slots,
      total,
    })
  } catch (error: any) {
    console.error('Slots fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch slots' },
      { status: 500 }
    )
  }
}
