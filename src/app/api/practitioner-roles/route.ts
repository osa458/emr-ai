/**
 * Practitioner Roles API - List
 * FHIR Resource: PractitionerRole
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const practitionerId = searchParams.get('practitioner')
    const organizationId = searchParams.get('organization')
    const locationId = searchParams.get('location')
    const role = searchParams.get('role')
    const specialty = searchParams.get('specialty')
    const active = searchParams.get('active')
    const _count = searchParams.get('_count') || '100'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (practitionerId) params.set('practitioner', practitionerId)
    if (organizationId) params.set('organization', organizationId)
    if (locationId) params.set('location', locationId)
    if (role) params.set('role', role)
    if (specialty) params.set('specialty', specialty)
    if (active) params.set('active', active)

    const response = await aidboxFetch(`/PractitionerRole?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch practitioner roles: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
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
