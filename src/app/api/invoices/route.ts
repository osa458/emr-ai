/**
 * Invoices API - List and Create
 * FHIR Resource: Invoice
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const date = searchParams.get('date')
    const _count = searchParams.get('_count') || '50'
    const _sort = searchParams.get('_sort') || '-date'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (status) params.set('status', status)
    if (type) params.set('type', type)
    if (date) params.set('date', date)

    const response = await aidboxFetch(`/Invoice?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch invoices: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const invoices = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || invoices.length

    return NextResponse.json({
      success: true,
      data: invoices,
      total,
    })
  } catch (error: any) {
    console.error('Invoices fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const invoice = {
      resourceType: 'Invoice',
      status: 'issued',
      ...body,
    }

    const response = await aidboxFetch('/Invoice', {
      method: 'POST',
      body: JSON.stringify(invoice),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create invoice: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Invoice create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
