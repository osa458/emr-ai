/**
 * Population Risk Cohorts API
 * GET /api/population/risk-cohorts
 * 
 * Returns risk stratification cohorts for all patients
 */

import { NextRequest, NextResponse } from 'next/server'
import { stratifyPopulation, calculatePatientRisk, type PatientMeasureData } from '@/lib/population-health'

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
        const patientId = searchParams.get('patientId')

        // If specific patient requested, return their risk
        if (patientId) {
            const patientData = await getPatientData(patientId)
            const risk = calculatePatientRisk(patientData)
            return NextResponse.json({ success: true, risk })
        }

        // Otherwise, stratify entire population
        const patientsBundle = await fhirFetch('Patient?_count=1000')
        const patients = (patientsBundle.entry || []).map((e: any) => e.resource)

        // Build patient data
        const patientData: PatientMeasureData[] = await Promise.all(
            patients.map((patient: any) => getPatientData(patient.id))
        )

        // Stratify population
        const cohorts = stratifyPopulation(patientData)

        // Get summary stats
        const totalPatients = patientData.length
        const highRiskCount = cohorts
            .filter(c => ['high', 'critical'].includes(c.riskLevel))
            .reduce((sum, c) => sum + c.patientCount, 0)

        return NextResponse.json({
            success: true,
            cohorts,
            summary: {
                totalPatients,
                highRiskCount,
                highRiskPercentage: Math.round((highRiskCount / totalPatients) * 100),
            },
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Risk cohorts error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to calculate risk cohorts',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

async function getPatientData(patientId: string): Promise<PatientMeasureData> {
    const [patient, conditionsBundle, medicationsBundle] = await Promise.all([
        fhirFetch(`Patient/${patientId}`),
        fhirFetch(`Condition?subject=Patient/${patientId}&_count=100`),
        fhirFetch(`MedicationRequest?subject=Patient/${patientId}&status=active&_count=100`),
    ])

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
        observations: [],
        procedures: [],
        medications: (medicationsBundle.entry || []).map((e: any) => ({
            code: e.resource?.medicationCodeableConcept?.coding?.[0]?.code || '',
            status: e.resource?.status || 'unknown',
        })),
        immunizations: [],
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
