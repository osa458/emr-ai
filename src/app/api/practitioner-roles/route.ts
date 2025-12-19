/**
 * Practitioner Roles API - List
 * FHIR Resource: PractitionerRole
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practitionerId = searchParams.get('practitioner')
    const organizationId = searchParams.get('organization')
    const locationId = searchParams.get('location')
    const role = searchParams.get('role')
    const specialty = searchParams.get('specialty')
    const active = searchParams.get('active')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('PractitionerRole').count(_count)
    if (practitionerId) query = query.where('practitioner', practitionerId as any)
    if (organizationId) query = query.where('organization', organizationId as any)
    if (locationId) query = query.where('location', locationId as any)
    if (role) query = query.where('role', role as any)
    if (specialty) query = query.where('specialty', specialty as any)
    if (active) query = query.where('active', active as any)

    const bundle = await query
    const roles = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || roles.length

    return NextResponse.json({
      success: true,
      data: roles,
      total,
    })
  } catch (error: any) {
    console.error('PractitionerRole fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch practitioner roles' },
      { status: 500 }
    )
  }
}
