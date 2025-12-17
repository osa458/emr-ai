/**
 * Organizations API - List
 * FHIR Resource: Organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const type = searchParams.get('type')
    const identifier = searchParams.get('identifier')
    const active = searchParams.get('active')
    const _count = searchParams.get('_count') || '100'

    const params = new URLSearchParams()
    params.set('_count', _count)
    if (name) params.set('name', name)
    if (type) params.set('type', type)
    if (identifier) params.set('identifier', identifier)
    if (active) params.set('active', active)

    const response = await aidboxFetch(`/Organization?${params.toString()}`)
    
    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { success: false, error: `Failed to fetch organizations: ${error}` },
        { status: response.status }
      )
    }

    const bundle = await response.json()
    const organizations = (bundle.entry || []).map((e: any) => e.resource)
    const total = bundle.total || organizations.length

    return NextResponse.json({
      success: true,
      data: organizations,
      total,
    })
  } catch (error: any) {
    console.error('Organizations fetch error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}
