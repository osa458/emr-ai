/**
 * Procedures API - List and Create
 * FHIR Resource: Procedure
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || '-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (status) params.set('status', status)
    if (date) params.set('date', date)

    const response = await aidboxFetch(`/Procedure?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch procedures: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const procedures = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || procedures.length

    return NextResponse.json({
      success: true,
      data: procedures,
      total,
    })
  } catch (error: any) {
    console.error('Procedures fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch procedures' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const procedure = {
      resourceType: 'Procedure',
      status: 'completed',
      ...body,
    }

    const response = await aidboxFetch('/Procedure', {
      method: 'POST',
      body: JSON.stringify(procedure),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create procedure: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Procedure create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create procedure' },
      { status: 500 }
    )
  }
}
