/**
 * Goals API - List and Create
 * FHIR Resource: Goal
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const lifecycleStatus = searchParams.get('lifecycle-status')
    const category = searchParams.get('category')
    const _count = parseInt(searchParams.get('_count') || '50')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Goal').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (lifecycleStatus) query = query.where('lifecycle-status', lifecycleStatus as any)
    if (category) query = query.where('category', category as any)

    const bundle = await query
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
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Goal', {
      lifecycleStatus: 'active',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Goal create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create goal' },
      { status: 500 }
    )
  }
}
