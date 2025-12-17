/**
 * Practitioners API - Read and Update by ID
 * FHIR Resource: Practitioner
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const response = await aidboxFetch(`/Practitioner/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Practitioner not found' },
          { status: 404 }
        )
      }
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch practitioner: ${error}` },
        { status: response.status }
      )
    }

    const practitioner = await response.json()
    return NextResponse.json({ success: true, data: practitioner })
  } catch (error: any) {
    console.error('Practitioner fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch practitioner' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const practitioner = {
      resourceType: 'Practitioner',
      id,
      ...body,
    }

    const response = await aidboxFetch(`/Practitioner/${id}`, {
      method: 'PUT',
      body: JSON.stringify(practitioner),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to update practitioner: ${error}` },
        { status: response.status }
      )
    }

    const updated = await response.json()
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Practitioner update error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update practitioner' },
      { status: 500 }
    )
  }
}
