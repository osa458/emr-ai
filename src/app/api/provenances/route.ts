/**
 * Provenances API - List
 * FHIR Resource: Provenance
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('target')
    const agentId = searchParams.get('agent')
    const recorded = searchParams.get('recorded')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Provenance').count(_count)
    if (targetId) query = query.where('target', targetId as any)
    if (agentId) query = query.where('agent', agentId as any)
    if (recorded) query = query.where('recorded', recorded as any)

    const bundle = await query
    const provenances = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || provenances.length

    return NextResponse.json({
      success: true,
      data: provenances,
      total,
    })
  } catch (error: any) {
    console.error('Provenance fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch provenances' },
      { status: 500 }
    )
  }
}
