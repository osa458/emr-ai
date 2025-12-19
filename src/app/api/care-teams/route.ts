/**
 * Care Teams API - List and Create
 * FHIR Resource: CareTeam
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('CareTeam').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (encounterId) query = query.where('encounter', `Encounter/${encounterId}` as any)
    if (status) query = query.where('status', status as any)

    const bundle = await query
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
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('CareTeam', {
      status: 'active',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('CareTeam create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create care team' },
      { status: 500 }
    )
  }
}
