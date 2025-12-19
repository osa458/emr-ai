/**
 * Payment Notices API - List
 * FHIR Resource: PaymentNotice
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment-status')
    const created = searchParams.get('created')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('PaymentNotice').count(_count)
    if (status) query = query.where('status', status as any)
    if (paymentStatus) query = query.where('payment-status', paymentStatus as any)
    if (created) query = query.where('created', created as any)

    const bundle = await query
    const notices = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || notices.length

    return NextResponse.json({
      success: true,
      data: notices,
      total,
    })
  } catch (error: any) {
    console.error('PaymentNotice fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch payment notices' },
      { status: 500 }
    )
  }
}
