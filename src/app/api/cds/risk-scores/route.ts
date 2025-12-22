/**
 * CDS Risk Scores API
 * GET /api/cds/risk-scores?patientId={patientId}
 * 
 * Calculates Fall Risk, Readmission Risk, and Pressure Ulcer Risk
 */

import { NextRequest, NextResponse } from 'next/server'
import {
    calculateAllRiskScores,
    type PatientRiskFactors
} from '@/lib/cds/risk-models'

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
        const age = birthDate ? calculateAge(birthDate) : undefined

        // Fetch current encounter for LOS
        const encounterBundle = await fhirFetch(
            `Encounter?subject=Patient/${patientId}&status=in-progress&_sort=-date&_count=1`
        )
        const currentEncounter = encounterBundle.entry?.[0]?.resource
        const admitDate = currentEncounter?.period?.start
        const lengthOfStay = admitDate ? calculateLOS(admitDate) : 0

        // Fetch conditions for Charlson comorbidity estimation
        const conditionsBundle = await fhirFetch(
            `Condition?subject=Patient/${patientId}&clinical-status=active&_count=50`
        )
        const conditions = (conditionsBundle.entry || []).map((e: any) =>
            e.resource?.code?.text || e.resource?.code?.coding?.[0]?.display || ''
        )

        // Estimate Charlson score based on conditions (simplified)
        const charlsonScore = estimateCharlsonScore(conditions)

        // Fetch recent ED visits (approximated by urgent encounters)
        const edVisitsBundle = await fhirFetch(
            `Encounter?subject=Patient/${patientId}&class=EMER&_count=10`
        )
        const edVisits6Months = (edVisitsBundle.entry || []).filter((e: any) => {
            const encounterDate = new Date(e.resource?.period?.start)
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
            return encounterDate >= sixMonthsAgo
        }).length

        // Build risk factors from FHIR data
        // In production, these would come from nursing assessments (QuestionnaireResponse)
        // For now, we'll infer from available data with reasonable defaults
        const factors: PatientRiskFactors = {
            // Demographics
            age,
            hasChronicConditions: conditions,

            // LACE Score factors
            lengthOfStay,
            acuity: currentEncounter?.class?.code === 'EMER' ? 'emergent' :
                currentEncounter?.priority?.coding?.[0]?.code === 'urgent' ? 'urgent' : 'elective',
            charlsonScore,
            edVisits6Months,

            // Morse Fall Scale - inferred from conditions (simplified)
            historyOfFalling: conditions.some((c: string) =>
                c.toLowerCase().includes('fall') || c.toLowerCase().includes('fracture')
            ),
            secondaryDiagnosis: conditions.length >= 2,
            ambulatoryAid: inferAmbulatoryAid(conditions, age),
            ivSalineLock: true, // Assume inpatients have IV
            gaitTransfer: inferGaitStatus(conditions, age),
            mentalStatus: inferMentalStatus(conditions),

            // Braden Scale - use defaults indicating moderate risk for assessment
            sensoryPerception: 3,
            moisture: 3,
            activity: inferActivityLevel(conditions),
            mobility: inferMobilityLevel(conditions, age),
            nutrition: 3,
            frictionShear: 2,
        }

        // Calculate all risk scores
        const result = calculateAllRiskScores(patientId, factors)

        return NextResponse.json({
            success: true,
            ...result,
            factorsUsed: factors,
        })
    } catch (error) {
        console.error('Risk score calculation failed:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to calculate risk scores',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// Helper functions
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

function calculateLOS(admitDate: string): number {
    const admit = new Date(admitDate)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - admit.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function estimateCharlsonScore(conditions: string[]): number {
    let score = 0
    const conditionText = conditions.join(' ').toLowerCase()

    // Simplified Charlson scoring based on condition keywords
    if (conditionText.includes('myocardial infarction') || conditionText.includes('mi')) score += 1
    if (conditionText.includes('heart failure') || conditionText.includes('chf')) score += 1
    if (conditionText.includes('peripheral vascular')) score += 1
    if (conditionText.includes('cerebrovascular') || conditionText.includes('stroke')) score += 1
    if (conditionText.includes('dementia')) score += 1
    if (conditionText.includes('copd') || conditionText.includes('chronic pulmonary')) score += 1
    if (conditionText.includes('diabetes')) score += 1
    if (conditionText.includes('renal') || conditionText.includes('kidney')) score += 2
    if (conditionText.includes('liver') || conditionText.includes('cirrhosis')) score += 3
    if (conditionText.includes('cancer') || conditionText.includes('malignancy')) score += 2
    if (conditionText.includes('aids') || conditionText.includes('hiv')) score += 6

    return score
}

function inferAmbulatoryAid(conditions: string[], age?: number): 'none' | 'crutches/cane/walker' | 'furniture' {
    const conditionText = conditions.join(' ').toLowerCase()
    if (conditionText.includes('hip fracture') || conditionText.includes('stroke')) {
        return 'crutches/cane/walker'
    }
    if (age && age >= 80) return 'crutches/cane/walker'
    if (age && age >= 70) return 'crutches/cane/walker'
    return 'none'
}

function inferGaitStatus(conditions: string[], age?: number): 'normal/bedrest/wheelchair' | 'weak' | 'impaired' {
    const conditionText = conditions.join(' ').toLowerCase()
    if (conditionText.includes('hip fracture') || conditionText.includes('stroke')) {
        return 'impaired'
    }
    if (age && age >= 75) return 'weak'
    return 'normal/bedrest/wheelchair'
}

function inferMentalStatus(conditions: string[]): 'oriented' | 'forgets/overestimates' {
    const conditionText = conditions.join(' ').toLowerCase()
    if (conditionText.includes('dementia') || conditionText.includes('delirium') || conditionText.includes('confusion')) {
        return 'forgets/overestimates'
    }
    return 'oriented'
}

function inferActivityLevel(conditions: string[]): 1 | 2 | 3 | 4 {
    const conditionText = conditions.join(' ').toLowerCase()
    if (conditionText.includes('hip fracture') || conditionText.includes('post-op')) {
        return 2 // Chairfast
    }
    return 3 // Walks occasionally
}

function inferMobilityLevel(conditions: string[], age?: number): 1 | 2 | 3 | 4 {
    const conditionText = conditions.join(' ').toLowerCase()
    if (conditionText.includes('paralysis') || conditionText.includes('stroke')) {
        return 2 // Very limited
    }
    if (conditionText.includes('hip fracture') || (age && age >= 80)) {
        return 3 // Slightly limited
    }
    return 4 // No limitations
}
