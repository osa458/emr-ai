/**
 * Conditions API - List and Create
 * FHIR Resource: Condition (Diagnoses, Problems)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const category = searchParams.get('category')
    const clinicalStatus = searchParams.get('clinical-status')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || '-recorded-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (category) params.set('category', category)
    if (clinicalStatus) params.set('clinical-status', clinicalStatus)

    const response = await aidboxFetch(`/Condition?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch conditions: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const conditions = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || conditions.length

    return NextResponse.json({
      success: true,
      data: conditions,
      total,
    })
  } catch (error: any) {
    console.error('Conditions fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch conditions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const condition = {
      resourceType: 'Condition',
      clinicalStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
      },
      ...body,
    }

    const response = await aidboxFetch('/Condition', {
      method: 'POST',
      body: JSON.stringify(condition),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create condition: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Condition create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create condition' },
      { status: 500 }
    )
  }
}
