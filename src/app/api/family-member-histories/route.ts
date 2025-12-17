/**
 * Family Member Histories API - List and Create
 * FHIR Resource: FamilyMemberHistory
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const relationship = searchParams.get('relationship')
    const _count = searchParams.get('_count') || '50'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (patientId) params.set('patient', patientId)
    if (status) params.set('status', status)
    if (relationship) params.set('relationship', relationship)

    const response = await aidboxFetch(`/FamilyMemberHistory?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch family histories: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const histories = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || histories.length

    return NextResponse.json({
      success: true,
      data: histories,
      total,
    })
  } catch (error: any) {
    console.error('FamilyMemberHistory fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch family histories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const history = {
      resourceType: 'FamilyMemberHistory',
      status: 'completed',
      ...body,
    }

    const response = await aidboxFetch('/FamilyMemberHistory', {
      method: 'POST',
      body: JSON.stringify(history),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create family history: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('FamilyMemberHistory create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create family history' },
      { status: 500 }
    )
  }
}
