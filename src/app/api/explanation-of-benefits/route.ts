/**
 * Explanation of Benefits API - List
 * FHIR Resource: ExplanationOfBenefit
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const claimId = searchParams.get('claim')
    const status = searchParams.get('status')
    const _count = searchParams.get('_count') || '50'
    const _sort = searchParams.get('_sort') || '-created'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (claimId) params.set('claim', claimId)
    if (status) params.set('status', status)

    const response = await aidboxFetch(`/ExplanationOfBenefit?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch EOBs: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const eobs = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || eobs.length

    return NextResponse.json({
      success: true,
      data: eobs,
      total,
    })
  } catch (error: any) {
    console.error('ExplanationOfBenefit fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch EOBs' },
      { status: 500 }
    )
  }
}
