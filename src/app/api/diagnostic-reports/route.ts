/**
 * Diagnostic Reports API - List and Create
 * FHIR Resource: DiagnosticReport (Lab results, Imaging, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const category = searchParams.get('category') // LAB, RAD, etc.
    const status = searchParams.get('status')
    const code = searchParams.get('code')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || '-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (category) params.set('category', category)
    if (status) params.set('status', status)
    if (code) params.set('code', code)

    const response = await aidboxFetch(`/DiagnosticReport?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch diagnostic reports: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const reports = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || reports.length

    return NextResponse.json({
      success: true,
      data: reports,
      total,
    })
  } catch (error: any) {
    console.error('DiagnosticReports fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch diagnostic reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const report = {
      resourceType: 'DiagnosticReport',
      status: 'final',
      ...body,
    }

    const response = await aidboxFetch('/DiagnosticReport', {
      method: 'POST',
      body: JSON.stringify(report),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create diagnostic report: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('DiagnosticReport create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create diagnostic report' },
      { status: 500 }
    )
  }
}
