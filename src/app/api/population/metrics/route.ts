/**
 * Population Health Metrics API
 * GET /api/population/metrics
 * 
 * Returns quality measure performance across all patients
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateAllMeasures, type PatientMeasureData } from '@/lib/population-health'

const BASE_URL = process.env.AIDBOX_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app'
const CLIENT_ID = process.env.AIDBOX_CLIENT_ID || 'emr-api'
const CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET || 'emr-secret-123'

function authHeaders() {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    return {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/fhir+json',
    }
}

async function fhirFetch(path: string) {
    const res = await fetch(`${BASE_URL}/${path}`, { headers: authHeaders() })
    if (!res.ok) {
        throw new Error(`FHIR fetch failed: ${res.status}`)
    }
    return res.json()
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const measureIds = searchParams.get('measures')?.split(',') || undefined

        // Fetch all patients
        const patientsBundle = await fhirFetch('Patient?_count=1000')
        const patients = (patientsBundle.entry || []).map((e: any) => e.resource)

        // Build patient measure data for each patient
        const patientData: PatientMeasureData[] = await Promise.all(
            patients.map(async (patient: any) => {
                const patientId = patient.id

                // Fetch patient data in parallel
                const [conditionsBundle, observationsBundle, proceduresBundle, medicationsBundle, immunizationsBundle] = await Promise.all([
                    fhirFetch(`Condition?subject=Patient/${patientId}&_count=100`),
                    fhirFetch(`Observation?subject=Patient/${patientId}&_count=100`),
                    fhirFetch(`Procedure?subject=Patient/${patientId}&_count=100`),
                    fhirFetch(`MedicationRequest?subject=Patient/${patientId}&status=active&_count=100`),
                    fhirFetch(`Immunization?patient=Patient/${patientId}&_count=100`),
                ])

                // Calculate age
                const birthDate = patient.birthDate
                const age = birthDate ? calculateAge(birthDate) : 50

                return {
                    patientId,
                    age,
                    gender: patient.gender || 'unknown',
                    conditions: (conditionsBundle.entry || []).map((e: any) => ({
                        code: e.resource?.code?.coding?.[0]?.code || '',
                        display: e.resource?.code?.text || e.resource?.code?.coding?.[0]?.display || '',
                    })),
                    observations: (observationsBundle.entry || []).map((e: any) => ({
                        code: e.resource?.code?.coding?.[0]?.code || '',
                        value: e.resource?.valueQuantity?.value,
                        date: e.resource?.effectiveDateTime || '',
                    })),
                    procedures: (proceduresBundle.entry || []).map((e: any) => ({
                        code: e.resource?.code?.coding?.[0]?.code || '',
                        date: e.resource?.performedDateTime || e.resource?.performedPeriod?.start || '',
                    })),
                    medications: (medicationsBundle.entry || []).map((e: any) => ({
                        code: e.resource?.medicationCodeableConcept?.coding?.[0]?.code || '',
                        status: e.resource?.status || 'unknown',
                    })),
                    immunizations: (immunizationsBundle.entry || []).map((e: any) => ({
                        code: e.resource?.vaccineCode?.coding?.[0]?.code || '',
                        date: e.resource?.occurrenceDateTime || '',
                    })),
                }
            })
        )

        // Calculate metrics
        const metrics = calculateAllMeasures(patientData, measureIds)

        return NextResponse.json({
            success: true,
            ...metrics,
        })
    } catch (error) {
        console.error('Population metrics error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to calculate population metrics',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
    }
    return age
}
