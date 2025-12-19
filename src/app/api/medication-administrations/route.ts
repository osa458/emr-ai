/**
 * Medication Administrations API - List and Create
 * FHIR Resource: MedicationAdministration (MAR)
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const encounterId = searchParams.get('encounter')
    const status = searchParams.get('status')
    const medication = searchParams.get('medication')
    const effectiveTime = searchParams.get('effective-time')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('MedicationAdministration').count(_count)
    if (patientId) query = query.where('subject', `Patient/${patientId}` as any)
    if (encounterId) query = query.where('context', `Encounter/${encounterId}` as any)
    if (status) query = query.where('status', status as any)
    if (medication) query = query.where('medication', medication as any)
    if (effectiveTime) query = query.where('effective-time', effectiveTime as any)

    const bundle = await query
    const administrations = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || administrations.length

    return NextResponse.json({
      success: true,
      data: administrations,
      total,
    })
  } catch (error: any) {
    console.error('MedicationAdministration fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch medication administrations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('MedicationAdministration', {
      status: 'completed',
      ...body,
    } as any)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('MedicationAdministration create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create medication administration' },
      { status: 500 }
    )
  }
}
