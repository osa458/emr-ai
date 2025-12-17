/**
 * Observations API - List and Create
 * FHIR Resource: Observation (Vitals, Labs, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const category = searchParams.get('category') // vital-signs, laboratory, etc.
    const code = searchParams.get('code')
    const status = searchParams.get('status')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || '-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (category) params.set('category', category)
    if (code) params.set('code', code)
    if (status) params.set('status', status)

    const response = await aidboxFetch(`/Observation?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch observations: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const observations = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || observations.length

    return NextResponse.json({
      success: true,
      data: observations,
      total,
    })
  } catch (error: any) {
    console.error('Observations fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch observations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const observation = {
      resourceType: 'Observation',
      status: 'final',
      ...body,
    }

    const response = await aidboxFetch('/Observation', {
      method: 'POST',
      body: JSON.stringify(observation),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create observation: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Observation create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create observation' },
      { status: 500 }
    )
  }
}
