/**
 * Coverage API - List and Create
 * FHIR Resource: Coverage (Insurance)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const beneficiaryId = searchParams.get('beneficiary')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const payorId = searchParams.get('payor')
    const _count = searchParams.get('_count') || '50'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (patientId) params.set('patient', patientId)
    if (beneficiaryId) params.set('beneficiary', beneficiaryId)
    if (status) params.set('status', status)
    if (type) params.set('type', type)
    if (payorId) params.set('payor', payorId)

    const response = await aidboxFetch(`/Coverage?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch coverage: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const coverage = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || coverage.length

    return NextResponse.json({
      success: true,
      data: coverage,
      total,
    })
  } catch (error: any) {
    console.error('Coverage fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch coverage' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const coverage = {
      resourceType: 'Coverage',
      status: 'active',
      ...body,
    }

    const response = await aidboxFetch('/Coverage', {
      method: 'POST',
      body: JSON.stringify(coverage),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create coverage: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Coverage create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create coverage' },
      { status: 500 }
    )
  }
}
