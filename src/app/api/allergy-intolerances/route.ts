/**
 * Allergy Intolerances API - List and Create
 * FHIR Resource: AllergyIntolerance
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const clinicalStatus = searchParams.get('clinical-status')
    const category = searchParams.get('category')
    const criticality = searchParams.get('criticality')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('AllergyIntolerance').count(_count)
    if (patientId) query = query.where('patient', `Patient/${patientId}` as any)
    if (clinicalStatus) query = query.where('clinical-status', clinicalStatus as any)
    if (category) query = query.where('category', category as any)
    if (criticality) query = query.where('criticality', criticality as any)

    const bundle = await query
    const allergies = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || allergies.length

    return NextResponse.json({
      success: true,
      data: allergies,
      total,
    })
  } catch (error: any) {
    console.error('AllergyIntolerance fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch allergies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Aidbox SDK
    const created = await aidbox.resource.create('AllergyIntolerance', {
      clinicalStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }]
      },
      verificationStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }]
      },
      ...body,
    } as any)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('AllergyIntolerance create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create allergy' },
      { status: 500 }
    )
  }
}
