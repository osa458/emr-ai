/**
 * Risk Stratification
 * 
 * Stratifies patients into risk cohorts for care management
 */

import type { PatientMeasureData } from './hedis-measures'

export interface RiskCohort {
    id: string
    name: string
    description: string
    riskLevel: 'low' | 'rising' | 'moderate' | 'high' | 'critical'
    patientCount: number
    patients: string[]
    criteria: string[]
    interventions: string[]
    color: string
}

export interface PatientRisk {
    patientId: string
    patientName?: string
    overallRisk: 'low' | 'rising' | 'moderate' | 'high' | 'critical'
    riskScore: number
    riskFactors: RiskFactor[]
    cohorts: string[]
    recommendations: string[]
}

export interface RiskFactor {
    factor: string
    severity: 'low' | 'medium' | 'high'
    weight: number
    value?: string
}

/**
 * Patient complexity factors that contribute to risk
 */
const RISK_FACTORS: Record<string, { weight: number; severity: RiskFactor['severity'] }> = {
    // Chronic conditions
    'diabetes': { weight: 15, severity: 'high' },
    'heart failure': { weight: 20, severity: 'high' },
    'ckd': { weight: 18, severity: 'high' },
    'copd': { weight: 15, severity: 'high' },
    'hypertension': { weight: 10, severity: 'medium' },
    'cancer': { weight: 20, severity: 'high' },

    // Social determinants
    'homeless': { weight: 25, severity: 'high' },
    'food insecurity': { weight: 15, severity: 'medium' },
    'transportation barrier': { weight: 10, severity: 'medium' },

    // Utilization
    'ed visit 30d': { weight: 15, severity: 'high' },
    'hospitalization 30d': { weight: 25, severity: 'high' },
    'readmission': { weight: 30, severity: 'high' },

    // Demographics
    'age 75+': { weight: 10, severity: 'medium' },
    'polypharmacy': { weight: 12, severity: 'medium' },
}

/**
 * Calculate risk score for a patient
 */
export function calculatePatientRisk(patient: PatientMeasureData): PatientRisk {
    const riskFactors: RiskFactor[] = []
    let totalScore = 0

    // Check conditions
    for (const condition of patient.conditions) {
        const conditionLower = condition.display.toLowerCase()

        for (const [factor, config] of Object.entries(RISK_FACTORS)) {
            if (conditionLower.includes(factor.toLowerCase())) {
                riskFactors.push({
                    factor: condition.display,
                    severity: config.severity,
                    weight: config.weight,
                })
                totalScore += config.weight
            }
        }
    }

    // Check age
    if (patient.age >= 75) {
        riskFactors.push({
            factor: 'Age 75 or older',
            severity: 'medium',
            weight: 10,
            value: patient.age.toString(),
        })
        totalScore += 10
    }

    // Check polypharmacy (5+ medications)
    if (patient.medications.length >= 5) {
        riskFactors.push({
            factor: 'Polypharmacy',
            severity: 'medium',
            weight: 12,
            value: `${patient.medications.length} medications`,
        })
        totalScore += 12
    }

    // Determine risk level and cohorts
    const overallRisk = getRiskLevel(totalScore)
    const cohorts = determineCohorts(patient, riskFactors)
    const recommendations = getRecommendations(overallRisk, riskFactors)

    return {
        patientId: patient.patientId,
        overallRisk,
        riskScore: totalScore,
        riskFactors,
        cohorts,
        recommendations,
    }
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): PatientRisk['overallRisk'] {
    if (score >= 80) return 'critical'
    if (score >= 50) return 'high'
    if (score >= 30) return 'moderate'
    if (score >= 15) return 'rising'
    return 'low'
}

/**
 * Determine which cohorts a patient belongs to
 */
function determineCohorts(patient: PatientMeasureData, factors: RiskFactor[]): string[] {
    const cohorts: string[] = []
    const conditionNames = patient.conditions.map(c => c.display.toLowerCase())

    // Diabetes management cohort
    if (conditionNames.some(c => c.includes('diabetes'))) {
        cohorts.push('diabetes-management')
    }

    // Heart failure management cohort
    if (conditionNames.some(c => c.includes('heart failure') || c.includes('chf'))) {
        cohorts.push('heart-failure-management')
    }

    // Chronic kidney disease cohort
    if (conditionNames.some(c => c.includes('kidney') || c.includes('ckd') || c.includes('renal'))) {
        cohorts.push('ckd-management')
    }

    // High utilization cohort
    if (factors.some(f => f.factor.toLowerCase().includes('hospitalization') || f.factor.toLowerCase().includes('readmission'))) {
        cohorts.push('high-utilizer')
    }

    // Complex care cohort (3+ chronic conditions)
    const chronicConditions = conditionNames.filter(c =>
        ['diabetes', 'heart', 'kidney', 'copd', 'hypertension', 'cancer'].some(term => c.includes(term))
    )
    if (chronicConditions.length >= 3) {
        cohorts.push('complex-care')
    }

    // Rising risk cohort
    if (factors.length >= 2 && factors.length < 5) {
        cohorts.push('rising-risk')
    }

    return cohorts
}

/**
 * Get recommendations based on risk level and factors
 */
function getRecommendations(riskLevel: PatientRisk['overallRisk'], factors: RiskFactor[]): string[] {
    const recommendations: string[] = []

    switch (riskLevel) {
        case 'critical':
            recommendations.push('Assign to care management program')
            recommendations.push('Schedule urgent care team review')
            recommendations.push('Consider palliative care consult')
            break
        case 'high':
            recommendations.push('Enroll in disease management program')
            recommendations.push('Schedule follow-up within 7 days')
            recommendations.push('Review medication regimen')
            break
        case 'moderate':
            recommendations.push('Schedule follow-up within 30 days')
            recommendations.push('Ensure care gaps are addressed')
            break
        case 'rising':
            recommendations.push('Monitor for progression')
            recommendations.push('Address modifiable risk factors')
            break
        case 'low':
            recommendations.push('Continue preventive care')
            break
    }

    // Add factor-specific recommendations
    for (const factor of factors) {
        if (factor.factor.toLowerCase().includes('diabetes')) {
            recommendations.push('Ensure HbA1c monitoring every 3 months')
        }
        if (factor.factor.toLowerCase().includes('polypharmacy')) {
            recommendations.push('Conduct medication reconciliation')
        }
    }

    return Array.from(new Set(recommendations)) // Remove duplicates
}

/**
 * Stratify entire population into cohorts
 */
export function stratifyPopulation(patients: PatientMeasureData[]): RiskCohort[] {
    const cohortMap: Map<string, PatientRisk[]> = new Map()

    // Calculate risk for each patient
    for (const patient of patients) {
        const risk = calculatePatientRisk(patient)

        // Add to risk level cohort
        const riskCohortId = `risk-${risk.overallRisk}`
        const existing = cohortMap.get(riskCohortId) || []
        existing.push(risk)
        cohortMap.set(riskCohortId, existing)
    }

    // Define cohort metadata
    const cohortDefinitions: Record<string, Omit<RiskCohort, 'patientCount' | 'patients'>> = {
        'risk-critical': {
            id: 'risk-critical',
            name: 'Critical Risk',
            description: 'Patients requiring immediate intervention',
            riskLevel: 'critical',
            criteria: ['Risk score ≥ 80', 'Multiple high-severity factors'],
            interventions: ['Care management enrollment', 'Team huddle', 'Palliative consult'],
            color: '#dc2626',
        },
        'risk-high': {
            id: 'risk-high',
            name: 'High Risk',
            description: 'Patients with significant health risks',
            riskLevel: 'high',
            criteria: ['Risk score 50-79', 'Major chronic conditions'],
            interventions: ['Disease management', 'Weekly check-ins', 'Medication review'],
            color: '#f97316',
        },
        'risk-moderate': {
            id: 'risk-moderate',
            name: 'Moderate Risk',
            description: 'Patients needing proactive management',
            riskLevel: 'moderate',
            criteria: ['Risk score 30-49', 'Developing health concerns'],
            interventions: ['Monthly outreach', 'Care gap closure', 'Education'],
            color: '#eab308',
        },
        'risk-rising': {
            id: 'risk-rising',
            name: 'Rising Risk',
            description: 'Patients trending toward higher risk',
            riskLevel: 'rising',
            criteria: ['Risk score 15-29', 'Early risk indicators'],
            interventions: ['Quarterly check-ins', 'Lifestyle coaching'],
            color: '#22c55e',
        },
        'risk-low': {
            id: 'risk-low',
            name: 'Low Risk',
            description: 'Generally healthy patients',
            riskLevel: 'low',
            criteria: ['Risk score < 15', 'Minimal health concerns'],
            interventions: ['Annual wellness visit', 'Preventive screenings'],
            color: '#3b82f6',
        },
    }

    // Build cohort results
    const cohorts: RiskCohort[] = []

    Array.from(cohortMap.entries()).forEach(([cohortId, risks]) => {
        const definition = cohortDefinitions[cohortId]
        if (definition) {
            cohorts.push({
                ...definition,
                patientCount: risks.length,
                patients: risks.map((r: PatientRisk) => r.patientId),
            })
        }
    })

    return cohorts.sort((a, b) => {
        const order = ['critical', 'high', 'moderate', 'rising', 'low']
        return order.indexOf(a.riskLevel) - order.indexOf(b.riskLevel)
    })
}
