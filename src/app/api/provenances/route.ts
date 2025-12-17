/**
 * Provenances API - List
 * FHIR Resource: Provenance
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('target')
    const agentId = searchParams.get('agent')
    const recorded = searchParams.get('recorded')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || '-recorded'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (targetId) params.set('target', targetId)
    if (agentId) params.set('agent', agentId)
    if (recorded) params.set('recorded', recorded)

    const response = await aidboxFetch(`/Provenance?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch provenances: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
