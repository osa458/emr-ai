/**
 * Conditions API - List and Create
 * FHIR Resource: Condition (Diagnoses, Problems)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const category = searchParams.get('category')
    const clinicalStatus = searchParams.get('clinical-status')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Condition').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}`)
    if (encounterId) query = query.where('encounter', `Encounter/${encounterId}`)
    if (category) query = query.where('category', category)
    if (clinicalStatus) query = query.where('clinical-status', clinicalStatus)

    const bundle = await query
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
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Condition', {
      clinicalStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
      },
      ...body,
    } as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Condition create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create condition' },
      { status: 500 }
    )
  }
}
