/**
 * Accounts API - List and Create
 * FHIR Resource: Account (Patient billing account)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const _count = searchParams.get('_count') || '50'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (patientId) params.set('patient', patientId)
    if (status) params.set('status', status)
    if (type) params.set('type', type)

    const response = await aidboxFetch(`/Account?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch accounts: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
    
    const account = {
      resourceType: 'Account',
      status: 'active',
      ...body,
    }

    const response = await aidboxFetch('/Account', {
      method: 'POST',
      body: JSON.stringify(account),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create account: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Account create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create account' },
      { status: 500 }
    )
  }
}
