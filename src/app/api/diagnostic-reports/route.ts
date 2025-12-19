/**
 * Diagnostic Reports API - List and Create
 * FHIR Resource: DiagnosticReport (Lab results, Imaging, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const code = searchParams.get('code')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('DiagnosticReport').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}`)
    if (encounterId) query = query.where('encounter', `Encounter/${encounterId}`)
    if (category) query = query.where('category', category)
    if (status) query = query.where('status', status)
    if (code) query = query.where('code', code)

    const bundle = await query
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
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('DiagnosticReport', {
      status: 'final',
      ...body,
    } as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('DiagnosticReport create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create diagnostic report' },
      { status: 500 }
    )
  }
}
