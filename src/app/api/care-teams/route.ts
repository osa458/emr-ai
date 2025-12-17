/**
 * Care Teams API - List and Create
 * FHIR Resource: CareTeam
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const _count = searchParams.get('_count') || '50'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (status) params.set('status', status)

    const response = await aidboxFetch(`/CareTeam?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch care teams: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const careTeams = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || careTeams.length

    return NextResponse.json({
      success: true,
      data: careTeams,
      total,
    })
  } catch (error: any) {
    console.error('CareTeams fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch care teams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const careTeam = {
      resourceType: 'CareTeam',
      status: 'active',
      ...body,
    }

    const response = await aidboxFetch('/CareTeam', {
      method: 'POST',
      body: JSON.stringify(careTeam),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create care team: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('CareTeam create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create care team' },
      { status: 500 }
    )
  }
}
