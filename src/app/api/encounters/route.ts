/**
 * Encounters API - List and Create
 * FHIR Resource: Encounter
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const _count = searchParams.get('_count') || '50'
    const _sort = searchParams.get('_sort') || '-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (status) params.set('status', status)

    const response = await aidboxFetch(`/Encounter?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch encounters: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const encounters = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || encounters.length

    return NextResponse.json({
      success: true,
      data: encounters,
      total,
    })
  } catch (error: any) {
    console.error('Encounters fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch encounters' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const encounter = {
      resourceType: 'Encounter',
      ...body,
    }

    const response = await aidboxFetch('/Encounter', {
      method: 'POST',
      body: JSON.stringify(encounter),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create encounter: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Encounter create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create encounter' },
      { status: 500 }
    )
  }
}
