/**
 * Accounts API - List and Create
 * FHIR Resource: Account (Patient billing account)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Account').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (status) query = query.where('status', status as any)
    if (type) query = query.where('type', type as any)

    const bundle = await query
    const accounts = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || accounts.length

    return NextResponse.json({
      success: true,
      data: accounts,
      total,
    })
  } catch (error: any) {
    console.error('Accounts fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Account', {
      status: 'active',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Account create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create account' },
      { status: 500 }
    )
  }
}
