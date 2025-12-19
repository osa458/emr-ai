/**
 * Imaging Studies API - List
 * FHIR Resource: ImagingStudy
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const modality = searchParams.get('modality')
    const started = searchParams.get('started')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('ImagingStudy').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (encounterId) query = query.where('encounter', `Encounter/${encounterId}` as any)
    if (status) query = query.where('status', status as any)
    if (modality) query = query.where('modality', modality as any)
    if (started) query = query.where('started', started as any)

    const bundle = await query
    const studies = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || studies.length

    return NextResponse.json({
      success: true,
      data: studies,
      total,
    })
  } catch (error: any) {
    console.error('ImagingStudy fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch imaging studies' },
      { status: 500 }
    )
  }
}
