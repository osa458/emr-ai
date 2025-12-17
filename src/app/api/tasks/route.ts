/**
 * Tasks API - List and Create
 * FHIR Resource: Task
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const ownerId = searchParams.get('owner')
    const requesterId = searchParams.get('requester')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const _count = searchParams.get('_count') || '100'
    const _sort = searchParams.get('_sort') || '-authored-on'

    const params = new URLSearchParams()
    params.set('_count', _count)
    params.set('_sort', _sort)
    if (patientId) params.set('patient', patientId)
    if (encounterId) params.set('encounter', encounterId)
    if (ownerId) params.set('owner', ownerId)
    if (requesterId) params.set('requester', requesterId)
    if (status) params.set('status', status)
    if (priority) params.set('priority', priority)

    const response = await aidboxFetch(`/Task?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch tasks: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
    
    const task = {
      resourceType: 'Task',
      status: 'requested',
      intent: 'order',
      ...body,
    }

    const response = await aidboxFetch('/Task', {
      method: 'POST',
      body: JSON.stringify(task),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create task: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('Task create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create task' },
      { status: 500 }
    )
  }
}
