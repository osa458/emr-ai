/**
 * Audit Events API - List
 * FHIR Resource: AuditEvent
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agent')
    const patientId = searchParams.get('patient')
    const type = searchParams.get('type')
    const date = searchParams.get('date')
    const outcome = searchParams.get('outcome')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('AuditEvent').count(_count)
    if (agentId) query = query.where('agent', agentId as any)
    if (patientId) query = query.where('patient', `Patient/${patientId}` as any)
    if (type) query = query.where('type', type as any)
    if (date) query = query.where('date', date as any)
    if (outcome) query = query.where('outcome', outcome as any)

    const bundle = await query
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
