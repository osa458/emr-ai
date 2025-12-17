/**
 * Imaging Studies API - List
 * FHIR Resource: ImagingStudy
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const modality = searchParams.get('modality')
    const started = searchParams.get('started')
    const _count = searchParams.get('_count') || '50'
    const _sort = searchParams.get('_sort') || '-started'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (status) params.set('status', status)
    if (modality) params.set('modality', modality)
    if (started) params.set('started', started)

    const response = await aidboxFetch(`/ImagingStudy?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch imaging studies: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
