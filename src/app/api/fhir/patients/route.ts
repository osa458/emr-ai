/**
 * Proxy FHIR patient requests through the server with Aidbox auth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFhirAdapter } from '@/lib/fhir/adapter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('id')
    const count = searchParams.get('_count') || '50'
    const page = searchParams.get('page') || '1'
    const name = searchParams.get('name')

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
