/**
 * Devices API - List
 * FHIR Resource: Device
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const identifier = searchParams.get('identifier')
    const _count = searchParams.get('_count') || '100'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (patientId) params.set('patient', patientId)
    if (type) params.set('type', type)
    if (status) params.set('status', status)
    if (identifier) params.set('identifier', identifier)

    const response = await aidboxFetch(`/Device?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch devices: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
