/**
 * Risk Models for Clinical Decision Support
 * 
 * Implements Morse Fall Scale, LACE Score, and Braden Scale
 */

export interface PatientRiskFactors {
    // For Morse Fall Scale
    historyOfFalling?: boolean
    secondaryDiagnosis?: boolean
    ambulatoryAid?: 'none' | 'crutches/cane/walker' | 'furniture'
    ivSalineLock?: boolean
    gaitTransfer?: 'normal/bedrest/wheelchair' | 'weak' | 'impaired'
    mentalStatus?: 'oriented' | 'forgets/overestimates'

    // For LACE Score
    lengthOfStay?: number // days
    acuity?: 'elective' | 'urgent' | 'emergent'
    charlsonScore?: number // Charlson Comorbidity Index 0-33+
    edVisits6Months?: number

    // For Braden Scale
    sensoryPerception?: 1 | 2 | 3 | 4
    moisture?: 1 | 2 | 3 | 4
    activity?: 1 | 2 | 3 | 4
    mobility?: 1 | 2 | 3 | 4
    nutrition?: 1 | 2 | 3 | 4
    frictionShear?: 1 | 2 | 3

    // Patient demographics for AI enhancement
    age?: number
    hasChronicConditions?: string[]
}

export interface RiskScore {
    name: string
    score: number
    maxScore: number
    minScore?: number
    riskLevel: 'low' | 'moderate' | 'high' | 'very-high'
    interpretation: string
    recommendations: string[]
}

export interface RiskScoresResult {
    patientId: string
    timestamp: string
    overallRisk: 'low' | 'moderate' | 'high' | 'very-high'
    scores: {
        fallRisk: RiskScore
        readmissionRisk: RiskScore
        pressureUlcerRisk: RiskScore
    }
    primaryRecommendations: string[]
}

/**
 * Morse Fall Scale
 * Score: 0-125, higher = greater risk
 * 
 * 0-24: No Risk
 * 25-50: Low Risk
 * 51+: High Risk
 */
export function calculateMorseFallRisk(factors: PatientRiskFactors): RiskScore {
    let score = 0
    const recommendations: string[] = []

    // History of falling (current or within 3 months)
    if (factors.historyOfFalling) {
        score += 25
        recommendations.push('Implement fall prevention protocol')
    }

    // Secondary diagnosis (2 or more medical diagnoses)
    if (factors.secondaryDiagnosis) {
        score += 15
    }

    // Ambulatory aid
    if (factors.ambulatoryAid === 'furniture') {
        score += 30
        recommendations.push('Ensure call light within reach at all times')
    } else if (factors.ambulatoryAid === 'crutches/cane/walker') {
        score += 15
        recommendations.push('Ensure assistive device is accessible')
    }

    // IV or saline lock
    if (factors.ivSalineLock) {
        score += 20
    }

    // Gait/transferring
    if (factors.gaitTransfer === 'impaired') {
        score += 20
        recommendations.push('Consider 1:1 sitter or bed alarm')
    } else if (factors.gaitTransfer === 'weak') {
        score += 10
        recommendations.push('Assist with ambulation')
    }

    // Mental status
    if (factors.mentalStatus === 'forgets/overestimates') {
        score += 15
        recommendations.push('Frequent orientation checks')
    }

    // Age-based AI enhancement
    if (factors.age && factors.age >= 65) {
        recommendations.push('Fall risk education for patient and family')
    }
    if (factors.age && factors.age >= 80) {
        recommendations.push('Consider physical therapy evaluation')
    }

    let riskLevel: 'low' | 'moderate' | 'high' | 'very-high' = 'low'
    let interpretation = ''

    if (score >= 51) {
        riskLevel = 'high'
        interpretation = 'High Risk - Standard fall prevention protocol required'
        recommendations.unshift('⚠️ FALL RISK: Initiate fall prevention bundle')
    } else if (score >= 25) {
        riskLevel = 'moderate'
        interpretation = 'Low Risk - Implement standard precautions'
        recommendations.push('Non-skid footwear required')
    } else {
        riskLevel = 'low'
        interpretation = 'No Risk - Good clinical practice'
        if (recommendations.length === 0) {
            recommendations.push('Continue standard safety measures')
        }
    }

    return {
        name: 'Morse Fall Scale',
        score,
        maxScore: 125,
        riskLevel,
        interpretation,
        recommendations
    }
}

/**
 * LACE Score - 30-Day Readmission Risk
 * Score: 0-19
 * 
 * L - Length of stay
 * A - Acuity of admission
 * C - Comorbidities (Charlson)
 * E - ED visits in prior 6 months
 */
export function calculateLACEScore(factors: PatientRiskFactors): RiskScore {
    let score = 0
    const recommendations: string[] = []

    // L - Length of stay (days)
    const los = factors.lengthOfStay ?? 0
    if (los >= 14) score += 7
    else if (los >= 7) score += 5
    else if (los >= 4) score += 4
    else if (los >= 3) score += 3
    else if (los >= 2) score += 2
    else if (los >= 1) score += 1

    // A - Acuity of admission
    if (factors.acuity === 'emergent') {
        score += 3
        recommendations.push('Ensure close outpatient follow-up within 7 days')
    } else if (factors.acuity === 'urgent') {
        score += 2
    }

    // C - Charlson Comorbidity Index
    const charlson = factors.charlsonScore ?? 0
    if (charlson >= 4) {
        score += 5
        recommendations.push('Consider care coordination referral')
    } else if (charlson >= 3) score += 3
    else if (charlson >= 2) score += 2
    else if (charlson >= 1) score += 1

    // E - ED visits in prior 6 months
    const edVisits = factors.edVisits6Months ?? 0
    if (edVisits >= 4) {
        score += 4
        recommendations.push('Address social determinants of health')
    } else if (edVisits >= 3) score += 3
    else if (edVisits >= 2) score += 2
    else if (edVisits >= 1) score += 1

    let riskLevel: 'low' | 'moderate' | 'high' | 'very-high' = 'low'
    let interpretation = ''

    if (score >= 10) {
        riskLevel = 'very-high'
        interpretation = 'Very High Risk of 30-day readmission (>25%)'
        recommendations.unshift('🏥 High readmission risk: Schedule transitional care visit')
    } else if (score >= 7) {
        riskLevel = 'high'
        interpretation = 'High Risk of 30-day readmission (15-25%)'
        recommendations.push('Ensure medication reconciliation complete')
    } else if (score >= 4) {
        riskLevel = 'moderate'
        interpretation = 'Moderate Risk of 30-day readmission (10-15%)'
        recommendations.push('Provide written discharge instructions')
    } else {
        riskLevel = 'low'
        interpretation = 'Low Risk of 30-day readmission (<10%)'
        recommendations.push('Standard discharge planning')
    }

    return {
        name: 'LACE Score',
        score,
        maxScore: 19,
        riskLevel,
        interpretation,
        recommendations
    }
}

/**
 * Braden Scale - Pressure Ulcer Risk
 * Score: 6-23, lower = higher risk
 * 
 * ≤9: Very High Risk
 * 10-12: High Risk
 * 13-14: Moderate Risk
 * 15-18: Mild Risk
 * ≥19: No Risk
 */
export function calculateBradenScore(factors: PatientRiskFactors): RiskScore {
    let score = 0
    const recommendations: string[] = []

    // Sensory Perception (1-4)
    const sensory = factors.sensoryPerception ?? 4
    score += sensory
    if (sensory <= 2) {
        recommendations.push('Assess skin every shift')
    }

    // Moisture (1-4)
    const moisture = factors.moisture ?? 4
    score += moisture
    if (moisture <= 2) {
        recommendations.push('Use moisture barrier and change linens frequently')
    }

    // Activity (1-4)
    const activity = factors.activity ?? 4
    score += activity
    if (activity <= 2) {
        recommendations.push('Consider specialty mattress')
    }

    // Mobility (1-4)
    const mobility = factors.mobility ?? 4
    score += mobility
    if (mobility <= 2) {
        recommendations.push('Reposition every 2 hours')
    }

    // Nutrition (1-4)
    const nutrition = factors.nutrition ?? 4
    score += nutrition
    if (nutrition <= 2) {
        recommendations.push('Consult dietitian for nutritional supplementation')
    }

    // Friction & Shear (1-3)
    const friction = factors.frictionShear ?? 3
    score += friction
    if (friction <= 2) {
        recommendations.push('Use lift sheet; elevate HOB ≤30 degrees')
    }

    let riskLevel: 'low' | 'moderate' | 'high' | 'very-high' = 'low'
    let interpretation = ''

    if (score <= 9) {
        riskLevel = 'very-high'
        interpretation = 'Very High Risk - Intensive preventive care needed'
        recommendations.unshift('🛏️ PRESSURE ULCER RISK: Implement full prevention bundle')
    } else if (score <= 12) {
        riskLevel = 'high'
        interpretation = 'High Risk - Enhanced preventive care'
        recommendations.push('Consider wound care nurse consult')
    } else if (score <= 14) {
        riskLevel = 'moderate'
        interpretation = 'Moderate Risk - Standard preventive care'
    } else if (score <= 18) {
        riskLevel = 'low'
        interpretation = 'Mild Risk - Basic prevention'
        recommendations.push('Encourage ambulation')
    } else {
        riskLevel = 'low'
        interpretation = 'No Risk - Good clinical practice'
        recommendations.push('Continue standard care')
    }

    return {
        name: 'Braden Scale',
        score,
        maxScore: 23,
        minScore: 6,
        riskLevel,
        interpretation,
        recommendations
    }
}

/**
 * Calculate all risk scores for a patient
 */
export function calculateAllRiskScores(
    patientId: string,
    factors: PatientRiskFactors
): RiskScoresResult {
    const fallRisk = calculateMorseFallRisk(factors)
    const readmissionRisk = calculateLACEScore(factors)
    const pressureUlcerRisk = calculateBradenScore(factors)

    // Determine overall risk (highest of all)
    const risks = [fallRisk.riskLevel, readmissionRisk.riskLevel, pressureUlcerRisk.riskLevel]
    const riskOrder = ['very-high', 'high', 'moderate', 'low'] as const
    const overallRisk = riskOrder.find(r => risks.includes(r)) || 'low'

    // Primary recommendations based on highest risks
    const primaryRecommendations: string[] = []

    if (fallRisk.riskLevel === 'high' || fallRisk.riskLevel === 'very-high') {
        primaryRecommendations.push(`⚠️ Fall Risk (Morse ${fallRisk.score}): ${fallRisk.recommendations[0]}`)
    }
    if (readmissionRisk.riskLevel === 'high' || readmissionRisk.riskLevel === 'very-high') {
        primaryRecommendations.push(`🏥 Readmission Risk (LACE ${readmissionRisk.score}): ${readmissionRisk.recommendations[0]}`)
    }
    if (pressureUlcerRisk.riskLevel === 'high' || pressureUlcerRisk.riskLevel === 'very-high') {
        primaryRecommendations.push(`🛏️ Pressure Ulcer Risk (Braden ${pressureUlcerRisk.score}): ${pressureUlcerRisk.recommendations[0]}`)
    }

    if (primaryRecommendations.length === 0) {
        primaryRecommendations.push('✅ No critical risks identified. Continue standard care protocols.')
    }

    return {
        patientId,
        timestamp: new Date().toISOString(),
        overallRisk,
        scores: { fallRisk, readmissionRisk, pressureUlcerRisk },
        primaryRecommendations
    }
}

/**
 * Get risk level styling for UI
 */
export function getRiskLevelColor(risk: 'low' | 'moderate' | 'high' | 'very-high'): string {
    switch (risk) {
        case 'very-high':
            return 'bg-purple-100 text-purple-800 border-purple-300'
        case 'high':
            return 'bg-red-100 text-red-800 border-red-300'
        case 'moderate':
            return 'bg-orange-100 text-orange-800 border-orange-300'
        case 'low':
            return 'bg-green-100 text-green-800 border-green-300'
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300'
    }
}
