/**
 * Devices API - List
 * FHIR Resource: Device
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const identifier = searchParams.get('identifier')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Device').count(_count)
    if (patientId) query = query.where('patient', `Patient/${patientId}` as any)
    if (type) query = query.where('type', type as any)
    if (status) query = query.where('status', status as any)
    if (identifier) query = query.where('identifier', identifier as any)

    const bundle = await query
    const devices = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || devices.length

    return NextResponse.json({
      success: true,
      data: devices,
      total,
    })
  } catch (error: any) {
    console.error('Devices fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}
