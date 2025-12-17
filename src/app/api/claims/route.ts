/**
 * Claims API - List and Create
 * FHIR Resource: Claim
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const use = searchParams.get('use')
    const _count = searchParams.get('_count') || '50'
    const _sort = searchParams.get('_sort') || '-created'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (status) params.set('status', status)
    if (use) params.set('use', use)

    const response = await aidboxFetch(`/Claim?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch claims: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const claims = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || claims.length

    return NextResponse.json({
      success: true,
      data: claims,
      total,
    })
  } catch (error: any) {
    console.error('Claims fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const claim = {
      resourceType: 'Claim',
      status: 'active',
      use: 'claim',
      ...body,
    }

    const response = await aidboxFetch('/Claim', {
      method: 'POST',
      body: JSON.stringify(claim),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create claim: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Claim create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create claim' },
      { status: 500 }
    )
  }
}
