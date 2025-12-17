/**
 * Slots API - List
 * FHIR Resource: Slot (Appointment availability)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('schedule')
    const status = searchParams.get('status')
    const start = searchParams.get('start')
    const serviceType = searchParams.get('service-type')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || 'start'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (scheduleId) params.set('schedule', scheduleId)
    if (status) params.set('status', status)
    if (start) params.set('start', start)
    if (serviceType) params.set('service-type', serviceType)

    const response = await aidboxFetch(`/Slot?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch slots: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
