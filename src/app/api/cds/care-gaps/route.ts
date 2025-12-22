/**
 * CDS Care Gaps API
 * GET /api/cds/care-gaps?patientId={patientId}
 * 
 * Identifies preventive care gaps based on patient demographics and history
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateCareGaps } from '@/lib/cds/care-gaps'

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

        // Fetch patient demographics
        const patient = await fhirFetch(`Patient/${patientId}`)
        const birthDate = patient.birthDate
        const age = birthDate ? calculateAge(birthDate) : 50
        const gender = patient.gender === 'female' ? 'female' : 'male'

        // Fetch conditions
        const conditionsBundle = await fhirFetch(
            `Condition?subject=Patient/${patientId}&_count=100`
        )
        const conditions = (conditionsBundle.entry || []).map((e: any) =>
            e.resource?.code?.text || e.resource?.code?.coding?.[0]?.display || ''
        ).filter(Boolean)

        // Fetch procedures
        const proceduresBundle = await fhirFetch(
            `Procedure?subject=Patient/${patientId}&_count=100`
        )
        const procedures = (proceduresBundle.entry || []).map((e: any) =>
            e.resource?.code?.text || e.resource?.code?.coding?.[0]?.display || ''
        ).filter(Boolean)

        // Fetch immunizations
        const immunizationsBundle = await fhirFetch(
            `Immunization?patient=Patient/${patientId}&_count=100`
        )
        const immunizations = (immunizationsBundle.entry || []).map((e: any) =>
            e.resource?.vaccineCode?.text || e.resource?.vaccineCode?.coding?.[0]?.display || ''
        ).filter(Boolean)

        // Fetch recent labs for monitoring gaps
        const labsBundle = await fhirFetch(
            `Observation?subject=Patient/${patientId}&category=laboratory&_sort=-date&_count=100`
        )

        const lastLabDates: Record<string, string> = {}
        for (const entry of labsBundle.entry || []) {
            const lab = entry.resource
            const labName = (lab?.code?.text || lab?.code?.coding?.[0]?.display || '').toLowerCase()
            const labDate = lab?.effectiveDateTime

            if (!labDate) continue

            // Map lab names to our codes
            if (labName.includes('hba1c') || labName.includes('hemoglobin a1c')) {
                if (!lastLabDates['hba1c'] || labDate > lastLabDates['hba1c']) {
                    lastLabDates['hba1c'] = labDate
                }
            }
            if (labName.includes('lipid') || labName.includes('cholesterol')) {
                if (!lastLabDates['lipid'] || labDate > lastLabDates['lipid']) {
                    lastLabDates['lipid'] = labDate
                }
            }
            if (labName.includes('creatinine') || labName.includes('egfr')) {
                if (!lastLabDates['creatinine'] || labDate > lastLabDates['creatinine']) {
                    lastLabDates['creatinine'] = labDate
                }
            }
            if (labName.includes('tsh') || labName.includes('thyroid')) {
                if (!lastLabDates['tsh'] || labDate > lastLabDates['tsh']) {
                    lastLabDates['tsh'] = labDate
                }
            }
            if (labName.includes('cmp') || labName.includes('metabolic')) {
                if (!lastLabDates['cmp'] || labDate > lastLabDates['cmp']) {
                    lastLabDates['cmp'] = labDate
                }
            }
        }

        // Calculate care gaps
        const result = calculateCareGaps(patientId, {
            age,
            gender,
            conditions,
            procedures,
            immunizations,
            lastLabDates
        })

        return NextResponse.json({
            success: true,
            ...result,
        })
    } catch (error) {
        console.error('Care gap calculation failed:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to calculate care gaps',
                details: error instanceof Error ? error.message : 'Unknown error'
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
