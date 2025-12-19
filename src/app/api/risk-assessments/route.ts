/**
 * Risk Assessments API - List and Create
 * FHIR Resource: RiskAssessment
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const condition = searchParams.get('condition')
    const method = searchParams.get('method')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('RiskAssessment').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (encounterId) query = query.where('encounter', `Encounter/${encounterId}` as any)
    if (condition) query = query.where('condition', condition as any)
    if (method) query = query.where('method', method as any)

    const bundle = await query
    const assessments = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || assessments.length

    return NextResponse.json({
      success: true,
      data: assessments,
      total,
    })
  } catch (error: any) {
    console.error('RiskAssessment fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch risk assessments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('RiskAssessment', {
      status: 'final',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('RiskAssessment create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create risk assessment' },
      { status: 500 }
    )
  }
}
