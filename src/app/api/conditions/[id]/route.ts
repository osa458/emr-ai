/**
 * Conditions API - Read, Update, Delete by ID
 * FHIR Resource: Condition
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const response = await aidboxFetch(`/Condition/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Condition not found' },
          { status: 404 }
        )
      }
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch condition: ${error}` },
        { status: response.status }
      )
    }

    const condition = await response.json()
    return NextResponse.json({ success: true, data: condition })
  } catch (error: any) {
    console.error('Condition fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch condition' },
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

    const condition = {
      resourceType: 'Condition',
      id,
      ...body,
    }

    const response = await aidboxFetch(`/Condition/${id}`, {
      method: 'PUT',
      body: JSON.stringify(condition),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to update condition: ${error}` },
        { status: response.status }
      )
    }

    const updated = await response.json()
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Condition update error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update condition' },
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

    const response = await aidboxFetch(`/Condition/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok && response.status !== 204) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to delete condition: ${error}` },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, message: 'Condition deleted' })
  } catch (error: any) {
    console.error('Condition delete error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete condition' },
      { status: 500 }
    )
  }
}
