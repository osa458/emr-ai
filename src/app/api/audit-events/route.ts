/**
 * Audit Events API - List
 * FHIR Resource: AuditEvent
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent')
    const patientId = searchParams.get('patient')
    const type = searchParams.get('type')
    const date = searchParams.get('date')
    const outcome = searchParams.get('outcome')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || '-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (agentId) params.set('agent', agentId)
    if (patientId) params.set('patient', patientId)
    if (type) params.set('type', type)
    if (date) params.set('date', date)
    if (outcome) params.set('outcome', outcome)

    const response = await aidboxFetch(`/AuditEvent?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch audit events: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const events = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || events.length

    return NextResponse.json({
      success: true,
      data: events,
      total,
    })
  } catch (error: any) {
    console.error('AuditEvent fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch audit events' },
      { status: 500 }
    )
  }
}
