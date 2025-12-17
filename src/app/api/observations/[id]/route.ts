/**
 * Observations API - Read, Update by ID
 * FHIR Resource: Observation
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const response = await aidboxFetch(`/Observation/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Observation not found' },
          { status: 404 }
        )
      }
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch observation: ${error}` },
        { status: response.status }
      )
    }

    const observation = await response.json()
    return NextResponse.json({ success: true, data: observation })
  } catch (error: any) {
    console.error('Observation fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch observation' },
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

    const observation = {
      resourceType: 'Observation',
      id,
      ...body,
    }

    const response = await aidboxFetch(`/Observation/${id}`, {
      method: 'PUT',
      body: JSON.stringify(observation),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to update observation: ${error}` },
        { status: response.status }
      )
    }

    const updated = await response.json()
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Observation update error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update observation' },
      { status: 500 }
    )
  }
}
