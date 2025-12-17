/**
 * Payment Notices API - List
 * FHIR Resource: PaymentNotice
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment-status')
    const created = searchParams.get('created')
    const _count = searchParams.get('_count') || '50'
    const _sort = searchParams.get('_sort') || '-created'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (status) params.set('status', status)
    if (paymentStatus) params.set('payment-status', paymentStatus)
    if (created) params.set('created', created)

    const response = await aidboxFetch(`/PaymentNotice?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch payment notices: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
