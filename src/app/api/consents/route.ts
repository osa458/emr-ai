/**
 * Consents API - List and Create
 * FHIR Resource: Consent
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const _count = searchParams.get('_count') || '50'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (patientId) params.set('patient', patientId)
    if (status) params.set('status', status)
    if (category) params.set('category', category)

    const response = await aidboxFetch(`/Consent?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch consents: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const consents = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || consents.length

    return NextResponse.json({
      success: true,
      data: consents,
      total,
    })
  } catch (error: any) {
    console.error('Consent fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch consents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const consent = {
      resourceType: 'Consent',
      status: 'active',
      ...body,
    }

    const response = await aidboxFetch('/Consent', {
      method: 'POST',
      body: JSON.stringify(consent),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create consent: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Consent create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create consent' },
      { status: 500 }
    )
  }
}
