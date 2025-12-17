/**
 * Care Plans API - List and Create
 * FHIR Resource: CarePlan
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const _count = searchParams.get('_count') || '50'
    const _sort = searchParams.get('_sort') || '-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (status) params.set('status', status)
    if (category) params.set('category', category)

    const response = await aidboxFetch(`/CarePlan?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch care plans: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const carePlans = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || carePlans.length

    return NextResponse.json({
      success: true,
      data: carePlans,
      total,
    })
  } catch (error: any) {
    console.error('CarePlans fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch care plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const carePlan = {
      resourceType: 'CarePlan',
      status: 'active',
      intent: 'plan',
      ...body,
    }

    const response = await aidboxFetch('/CarePlan', {
      method: 'POST',
      body: JSON.stringify(carePlan),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create care plan: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('CarePlan create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create care plan' },
      { status: 500 }
    )
  }
}
