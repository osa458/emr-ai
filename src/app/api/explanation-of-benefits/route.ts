/**
 * Explanation of Benefits API - List
 * FHIR Resource: ExplanationOfBenefit
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const claimId = searchParams.get('claim')
    const status = searchParams.get('status')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('ExplanationOfBenefit').count(_count)
    if (patientId) query = query.where('patient', `Patient/${patientId}` as any)
    if (claimId) query = query.where('claim', claimId as any)
    if (status) query = query.where('status', status as any)

    const bundle = await query
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
