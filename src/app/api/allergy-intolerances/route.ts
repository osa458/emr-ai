/**
 * Allergy Intolerances API - List and Create
 * FHIR Resource: AllergyIntolerance
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient')
    const clinicalStatus = searchParams.get('clinical-status')
    const category = searchParams.get('category')
    const criticality = searchParams.get('criticality')
    const _count = searchParams.get('_count') || '100'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (patientId) params.set('patient', patientId)
    if (clinicalStatus) params.set('clinical-status', clinicalStatus)
    if (category) params.set('category', category)
    if (criticality) params.set('criticality', criticality)

    const response = await aidboxFetch(`/AllergyIntolerance?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch allergies: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
    
    const allergy = {
      resourceType: 'AllergyIntolerance',
      clinicalStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }]
      },
      verificationStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }]
      },
      ...body,
    }

    const response = await aidboxFetch('/AllergyIntolerance', {
      method: 'POST',
      body: JSON.stringify(allergy),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to create allergy: ${error}` },
        { status: response.status }
      )
    }

    const created = await response.json()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('AllergyIntolerance create error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create allergy' },
      { status: 500 }
    )
  }
}
