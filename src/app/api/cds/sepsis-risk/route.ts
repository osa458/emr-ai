/**
 * CDS Sepsis Risk API
 * GET /api/cds/sepsis-risk?patientId={patientId}
 * 
 * Calculates qSOFA, SIRS, and NEWS2 scores from patient vitals/labs
 */

import { NextRequest, NextResponse } from 'next/server'
import {
    calculateSepsisRisk,
    type VitalsInput,
    type LabsInput
} from '@/lib/cds/sepsis-scoring'

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

// LOINC codes for vital signs
const LOINC_CODES = {
    heartRate: '8867-4',
    systolicBP: '8480-6',
    diastolicBP: '8462-4',
    respiratoryRate: '9279-1',
    temperature: '8310-5',
    oxygenSaturation: '2708-6',
    // Labs
    wbc: '6690-2',
    lactate: '2524-7',
}

function extractVitalValue(observations: any[], codes: string[]): number | undefined {
    for (const code of codes) {
        const obs = observations.find((o: any) =>
            o.resource?.code?.coding?.some((c: any) => c.code === code)
        )
        if (obs?.resource?.valueQuantity?.value !== undefined) {
            return obs.resource.valueQuantity.value
        }
    }
    return undefined
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const patientId = searchParams.get('patientId')

        if (!patientId) {
            return NextResponse.json(
                { error: 'patientId is required' },
                { status: 400 }
            )
        }

        // Fetch latest vitals (last 24 hours ideally, but get most recent)
        const vitalsBundle = await fhirFetch(
            `Observation?subject=Patient/${patientId}&category=vital-signs&_sort=-date&_count=50`
        )

        // Fetch latest labs
        const labsBundle = await fhirFetch(
            `Observation?subject=Patient/${patientId}&category=laboratory&_sort=-date&_count=50`
        )

        const vitalsObs = vitalsBundle.entry || []
        const labsObs = labsBundle.entry || []

        // Extract vital values
        const vitals: VitalsInput = {
            heartRate: extractVitalValue(vitalsObs, [LOINC_CODES.heartRate, '8867-4']),
            systolicBP: extractVitalValue(vitalsObs, [LOINC_CODES.systolicBP, '8480-6']),
            diastolicBP: extractVitalValue(vitalsObs, [LOINC_CODES.diastolicBP, '8462-4']),
            respiratoryRate: extractVitalValue(vitalsObs, [LOINC_CODES.respiratoryRate, '9279-1']),
            temperature: extractVitalValue(vitalsObs, [LOINC_CODES.temperature, '8310-5']),
            oxygenSaturation: extractVitalValue(vitalsObs, [LOINC_CODES.oxygenSaturation, '2708-6']),
            // Default mental status to alert unless we have GCS data
            mentalStatus: 'alert',
        }

        // Extract lab values
        const labs: LabsInput = {
            wbc: extractVitalValue(labsObs, [LOINC_CODES.wbc, '6690-2']),
            lactate: extractVitalValue(labsObs, [LOINC_CODES.lactate, '2524-7']),
        }

        // Calculate sepsis risk
        const result = calculateSepsisRisk(patientId, vitals, labs)

        return NextResponse.json({
            success: true,
            ...result,
            vitalsUsed: vitals,
            labsUsed: labs,
        })
    } catch (error) {
        console.error('Sepsis risk calculation failed:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to calculate sepsis risk',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
