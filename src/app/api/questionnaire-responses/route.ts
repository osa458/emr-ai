/**
 * Questionnaire Responses API - List and Create
 * FHIR Resource: QuestionnaireResponse
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const questionnaireId = searchParams.get('questionnaire')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const _count = searchParams.get('_count') || '50'
    const _sort = searchParams.get('_sort') || '-authored'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (questionnaireId) params.set('questionnaire', questionnaireId)
    if (encounterId) params.set('encounter', encounterId)
    if (status) params.set('status', status)

    const response = await aidboxFetch(`/QuestionnaireResponse?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch questionnaire responses: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
    
    const qr = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      ...body,
    }

    const response = await aidboxFetch('/QuestionnaireResponse', {
      method: 'POST',
      body: JSON.stringify(qr),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create questionnaire response: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('QuestionnaireResponse create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create questionnaire response' },
      { status: 500 }
    )
  }
}
