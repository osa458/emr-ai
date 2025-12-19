/**
 * Questionnaire Responses API - List and Create
 * FHIR Resource: QuestionnaireResponse
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const questionnaireId = searchParams.get('questionnaire')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('QuestionnaireResponse').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (questionnaireId) query = query.where('questionnaire', questionnaireId as any)
    if (encounterId) query = query.where('encounter', `Encounter/${encounterId}` as any)
    if (status) query = query.where('status', status as any)

    const bundle = await query
    const responses = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || responses.length

    return NextResponse.json({
      success: true,
      data: responses,
      total,
    })
  } catch (error: any) {
    console.error('QuestionnaireResponse fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch questionnaire responses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('QuestionnaireResponse', {
      status: 'completed',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('QuestionnaireResponse create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create questionnaire response' },
      { status: 500 }
    )
  }
}
