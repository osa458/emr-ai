/**
 * Proxy FHIR patient requests through the server with Aidbox auth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFhirAdapter } from '@/lib/fhir/adapter'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const accessToken = ((session as any)?.fhirAccessToken || (session as any)?.aidboxAccessToken) as string | undefined
    const baseUrl = (process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL || '').replace(/\/$/, '')

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('id')
    const count = searchParams.get('_count') || '50'
    const page = searchParams.get('page') || '1'
    const name = searchParams.get('name')

    if (accessToken && baseUrl) {
      const sp = new URLSearchParams()
      sp.set('_count', count)
      sp.set('page', page)
      if (name) sp.set('name', name)

      const path = patientId ? `/Patient/${encodeURIComponent(patientId)}` : `/Patient?${sp.toString()}`
      const res = await fetch(`${baseUrl}${path}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/fhir+json',
        },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: (data as any)?.error || (data as any)?.message || 'Failed to fetch patients' },
          { status: res.status }
        )
      }

      if (patientId) {
        return NextResponse.json({ success: true, data, provider: 'aidbox-oauth' })
      }

      const patients = (data?.entry || []).map((e: any) => e.resource).filter(Boolean)
      const total = data?.total || patients.length
      return NextResponse.json({ success: true, data: patients, provider: 'aidbox-oauth', total })
    }

    const fhir = getFhirAdapter()

    if (patientId) {
      const patient = await fhir.getPatient(patientId)
      return NextResponse.json({ success: true, data: patient, provider: fhir.name })
    }

    const params: Record<string, string> = { _count: count, page }
    if (name) params['name'] = name
    const { patients, total } = await fhir.searchPatients(params)

    return NextResponse.json({
      success: true,
      data: patients,
      provider: fhir.name,
      total,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}
