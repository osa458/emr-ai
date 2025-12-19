/**
 * Invoices API - List and Create
 * FHIR Resource: Invoice
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const date = searchParams.get('date')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Invoice').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (status) query = query.where('status', status as any)
    if (type) query = query.where('type', type as any)
    if (date) query = query.where('date', date as any)

    const bundle = await query
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
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Invoice', {
      status: 'issued',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Invoice create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
