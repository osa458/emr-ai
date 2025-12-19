/**
 * Organizations API - List
 * FHIR Resource: Organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const type = searchParams.get('type')
    const identifier = searchParams.get('identifier')
    const active = searchParams.get('active')
    const _count = parseInt(searchParams.get('_count') || '100')

    // Use Aidbox SDK
    let query = aidbox.resource.list('Organization').count(_count)
    if (name) query = query.where('name', name as any)
    if (type) query = query.where('type', type as any)
    if (identifier) query = query.where('identifier', identifier as any)
    if (active) query = query.where('active', active as any)

    const bundle = await query
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
