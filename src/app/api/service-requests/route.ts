/**
 * Service Requests API - List and Create
 * FHIR Resource: ServiceRequest (Orders)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const intent = searchParams.get('intent')
    const priority = searchParams.get('priority')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || '-authored'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (status) params.set('status', status)
    if (category) params.set('category', category)
    if (intent) params.set('intent', intent)
    if (priority) params.set('priority', priority)

    const response = await aidboxFetch(`/ServiceRequest?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch service requests: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const requests = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || requests.length

    return NextResponse.json({
      success: true,
      data: requests,
      total,
    })
  } catch (error: any) {
    console.error('ServiceRequest fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch service requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const serviceRequest = {
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      ...body,
    }

    const response = await aidboxFetch('/ServiceRequest', {
      method: 'POST',
      body: JSON.stringify(serviceRequest),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create service request: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('ServiceRequest create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create service request' },
      { status: 500 }
    )
  }
}
