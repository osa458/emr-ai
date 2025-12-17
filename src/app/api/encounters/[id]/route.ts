/**
 * Encounters API - Read, Update, Delete by ID
 * FHIR Resource: Encounter
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const response = await aidboxFetch(`/Encounter/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Encounter not found' },
          { status: 404 }
        )
      }
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch encounter: ${error}` },
        { status: response.status }
      )
    }

    const encounter = await response.json()
    return NextResponse.json({ success: true, data: encounter })
  } catch (error: any) {
    console.error('Encounter fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch encounter' },
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

    const encounter = {
      resourceType: 'Encounter',
      id,
      ...body,
    }

    const response = await aidboxFetch(`/Encounter/${id}`, {
      method: 'PUT',
      body: JSON.stringify(encounter),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to update encounter: ${error}` },
        { status: response.status }
      )
    }

    const updated = await response.json()
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Encounter update error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update encounter' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const response = await aidboxFetch(`/Encounter/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok && response.status !== 204) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to delete encounter: ${error}` },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, message: 'Encounter deleted' })
  } catch (error: any) {
    console.error('Encounter delete error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete encounter' },
      { status: 500 }
    )
  }
}
