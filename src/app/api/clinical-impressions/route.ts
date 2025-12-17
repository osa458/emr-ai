/**
 * Clinical Impressions API - List and Create
 * FHIR Resource: ClinicalImpression
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const _count = searchParams.get('_count') || '50'
    const _sort = searchParams.get('_sort') || '-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (status) params.set('status', status)

    const response = await aidboxFetch(`/ClinicalImpression?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch clinical impressions: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const impressions = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || impressions.length

    return NextResponse.json({
      success: true,
      data: impressions,
      total,
    })
  } catch (error: any) {
    console.error('ClinicalImpression fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch clinical impressions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const impression = {
      resourceType: 'ClinicalImpression',
      status: 'completed',
      ...body,
    }

    const response = await aidboxFetch('/ClinicalImpression', {
      method: 'POST',
      body: JSON.stringify(impression),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create clinical impression: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('ClinicalImpression create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create clinical impression' },
      { status: 500 }
    )
  }
}
