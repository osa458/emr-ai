/**
 * Tasks API - List and Create
 * FHIR Resource: Task
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const ownerId = searchParams.get('owner')
    const requesterId = searchParams.get('requester')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Task').count(_count)
    if (patientId) query = query.where('patient', patientId as any)
    if (encounterId) query = query.where('encounter', encounterId as any)
    if (ownerId) query = query.where('owner', ownerId as any)
    if (requesterId) query = query.where('requester', requesterId as any)
    if (status) query = query.where('status', status as any)
    if (priority) query = query.where('priority', priority as any)

    const bundle = await query
    const tasks = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || tasks.length

    return NextResponse.json({
      success: true,
      data: tasks,
      total,
    })
  } catch (error: any) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('Task', {
      status: 'requested',
      intent: 'order',
      ...body,
    } as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Task create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create task' },
      { status: 500 }
    )
  }
}
