/**
 * Patient chart snapshot API
 * Aggregates patient-centric data via the FHIR adapter.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFhirAdapter } from '@/lib/fhir/adapter'
import { mapChartSnapshot } from '@/lib/fhir/chart-mapper'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('id')
    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId is required' }, { status: 400 })
    }

    const fhir = getFhirAdapter()

    // Fetch resources in parallel
    const [patient, encounters, conditions, vitals, labs, meds, imaging] = await Promise.all([
      fhir.getPatient(patientId),
      fhir.searchPatients({}) // placeholder; adapter should expose encounters later
        .then(() => []), // no encounters method yet
      Promise.resolve([]), // conditions placeholder
      Promise.resolve([]), // vitals placeholder
      Promise.resolve([]), // labs placeholder
      Promise.resolve([]), // meds placeholder
      Promise.resolve([]), // imaging placeholder
    ])

    const snapshot = mapChartSnapshot({
      patient,
      encounters,
      conditions,
      vitals,
      labs,
      meds,
      imaging,
    })

    return NextResponse.json({
      success: true,
      data: snapshot,
      provider: fhir.name,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch patient chart' },
      { status: 500 }
    )
  }
}
