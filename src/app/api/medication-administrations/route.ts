/**
 * Medication Administrations API - List and Create
 * FHIR Resource: MedicationAdministration (MAR)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const medication = searchParams.get('medication')
    const effectiveTime = searchParams.get('effective-time')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || '-effective-time'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (status) params.set('status', status)
    if (medication) params.set('medication', medication)
    if (effectiveTime) params.set('effective-time', effectiveTime)

    const response = await aidboxFetch(`/MedicationAdministration?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch medication administrations: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const administrations = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || administrations.length

    return NextResponse.json({
      success: true,
      data: administrations,
      total,
    })
  } catch (error: any) {
    console.error('MedicationAdministration fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch medication administrations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const administration = {
      resourceType: 'MedicationAdministration',
      status: 'completed',
      ...body,
    }

    const response = await aidboxFetch('/MedicationAdministration', {
      method: 'POST',
      body: JSON.stringify(administration),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create medication administration: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('MedicationAdministration create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create medication administration' },
      { status: 500 }
    )
  }
}
