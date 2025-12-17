/**
 * Immunizations API - List and Create
 * FHIR Resource: Immunization
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || '-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (status) params.set('status', status)
    if (date) params.set('date', date)

    const response = await aidboxFetch(`/Immunization?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch immunizations: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const immunizations = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || immunizations.length

    return NextResponse.json({
      success: true,
      data: immunizations,
      total,
    })
  } catch (error: any) {
    console.error('Immunizations fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch immunizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const immunization = {
      resourceType: 'Immunization',
      status: 'completed',
      ...body,
    }

    const response = await aidboxFetch('/Immunization', {
      method: 'POST',
      body: JSON.stringify(immunization),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create immunization: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Immunization create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create immunization' },
      { status: 500 }
    )
  }
}
