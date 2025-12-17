/**
 * Risk Assessments API - List and Create
 * FHIR Resource: RiskAssessment
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const condition = searchParams.get('condition')
    const method = searchParams.get('method')
    const _count = searchParams.get('_count') || '50'
    const _sort = searchParams.get('_sort') || '-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (condition) params.set('condition', condition)
    if (method) params.set('method', method)

    const response = await aidboxFetch(`/RiskAssessment?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch risk assessments: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
    
    const assessment = {
      resourceType: 'RiskAssessment',
      status: 'final',
      ...body,
    }

    const response = await aidboxFetch('/RiskAssessment', {
      method: 'POST',
      body: JSON.stringify(assessment),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create risk assessment: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('RiskAssessment create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create risk assessment' },
      { status: 500 }
    )
  }
}
