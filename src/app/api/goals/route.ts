/**
 * Goals API - List and Create
 * FHIR Resource: Goal
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const lifecycleStatus = searchParams.get('lifecycle-status')
    const category = searchParams.get('category')
    const _count = searchParams.get('_count') || '50'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (patientId) params.set('patient', patientId)
    if (lifecycleStatus) params.set('lifecycle-status', lifecycleStatus)
    if (category) params.set('category', category)

    const response = await aidboxFetch(`/Goal?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch goals: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const goals = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || goals.length

    return NextResponse.json({
      success: true,
      data: goals,
      total,
    })
  } catch (error: any) {
    console.error('Goals fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const goal = {
      resourceType: 'Goal',
      lifecycleStatus: 'active',
      ...body,
    }

    const response = await aidboxFetch('/Goal', {
      method: 'POST',
      body: JSON.stringify(goal),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create goal: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Goal create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create goal' },
      { status: 500 }
    )
  }
}
