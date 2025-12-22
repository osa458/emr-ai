/**
 * CDS Drug Interactions API
 * GET /api/cds/drug-interactions?patientId={patientId}
 * 
 * Checks for drug-drug and drug-allergy interactions
 */

import { NextRequest, NextResponse } from 'next/server'
import {
    checkAllInteractions,
    type InteractionCheckResult
} from '@/lib/drug-interactions'

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

        if (!patientId) {
            return NextResponse.json(
                { error: 'patientId is required' },
                { status: 400 }
            )
        }

        // Fetch active medications
        const medsBundle = await fhirFetch(
            `MedicationRequest?subject=Patient/${patientId}&status=active&_count=100`
        )

        const medications: string[] = (medsBundle.entry || []).map((e: any) => {
            const med = e.resource
            return (
                med.medicationCodeableConcept?.text ||
                med.medicationCodeableConcept?.coding?.[0]?.display ||
                ''
            )
        }).filter(Boolean)

        // Fetch allergies
        const allergyBundle = await fhirFetch(
            `AllergyIntolerance?patient=Patient/${patientId}&_count=50`
        )

        const allergies = (allergyBundle.entry || []).map((e: any) => {
            const allergy = e.resource
            return {
                allergen: allergy.code?.text ||
                    allergy.code?.coding?.[0]?.display ||
                    'Unknown',
                severity: allergy.criticality || 'unknown'
            }
        })

        // Check for interactions
        const result: InteractionCheckResult = checkAllInteractions(medications, allergies)

        // Sort interactions by severity (contraindicated first, then major, etc.)
        const severityOrder = { 'contraindicated': 0, 'major': 1, 'moderate': 2, 'minor': 3 }
        result.drugInteractions.sort((a, b) =>
            (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
        )

        return NextResponse.json({
            success: true,
            patientId,
            medicationCount: medications.length,
            allergyCount: allergies.length,
            ...result
        })
    } catch (error) {
        console.error('Drug interaction check failed:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to check drug interactions',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
