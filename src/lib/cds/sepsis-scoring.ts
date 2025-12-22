/**
 * Sepsis Scoring Systems for Early Warning
 * 
 * Implements qSOFA, SIRS, and NEWS2 scoring algorithms
 */

export interface VitalsInput {
    heartRate?: number        // bpm
    systolicBP?: number       // mmHg
    diastolicBP?: number      // mmHg
    respiratoryRate?: number  // breaths/min
    temperature?: number      // Fahrenheit
    oxygenSaturation?: number // %
    supplementalO2?: boolean  // on supplemental O2?
    gcsScore?: number         // Glasgow Coma Scale (3-15)
    mentalStatus?: 'alert' | 'confused' | 'drowsy' | 'unresponsive'
}

export interface LabsInput {
    wbc?: number           // 10^3/uL
    lactate?: number       // mmol/L
    paCO2?: number         // mmHg
    bandCount?: number     // %
    glucose?: number       // mg/dL
    creatinine?: number    // mg/dL
    bilirubin?: number     // mg/dL
    platelets?: number     // 10^3/uL
    inr?: number           // ratio
}

export interface ScoreComponent {
    name: string
    value: number | string | boolean | undefined
    points: number
    criteria: string
    met: boolean
}

export interface SepsisScore {
    name: string
    score: number
    maxScore: number
    riskLevel: 'low' | 'moderate' | 'high' | 'critical'
    components: ScoreComponent[]
    recommendation: string
}

export interface SepsisRiskResult {
    patientId: string
    timestamp: string
    overallRisk: 'low' | 'moderate' | 'high' | 'critical'
    scores: {
        qsofa: SepsisScore
        sirs: SepsisScore
        news2: SepsisScore
    }
    recommendations: string[]
}

/**
 * qSOFA (Quick Sequential Organ Failure Assessment)
 * Score: 0-3, >= 2 suggests high mortality risk
 */
export function calculateQSOFA(vitals: VitalsInput): SepsisScore {
    const components: ScoreComponent[] = []
    let score = 0

    // Respiratory Rate >= 22
    const rrMet = (vitals.respiratoryRate ?? 0) >= 22
    if (rrMet) score++
    components.push({
        name: 'Respiratory Rate',
        value: vitals.respiratoryRate,
        points: rrMet ? 1 : 0,
        criteria: '≥ 22 breaths/min',
        met: rrMet
    })

    // Altered Mental Status (GCS < 15 or confused/drowsy/unresponsive)
    const mentalMet = Boolean((vitals.gcsScore !== undefined && vitals.gcsScore < 15) ||
        (vitals.mentalStatus && vitals.mentalStatus !== 'alert'))
    if (mentalMet) score++
    components.push({
        name: 'Altered Mental Status',
        value: vitals.mentalStatus ?? (vitals.gcsScore ? `GCS ${vitals.gcsScore}` : undefined),
        points: mentalMet ? 1 : 0,
        criteria: 'GCS < 15 or not alert',
        met: mentalMet
    })

    // Systolic BP <= 100 mmHg
    const bpMet = (vitals.systolicBP ?? 999) <= 100
    if (bpMet) score++
    components.push({
        name: 'Systolic BP',
        value: vitals.systolicBP,
        points: bpMet ? 1 : 0,
        criteria: '≤ 100 mmHg',
        met: bpMet
    })

    const riskLevel = score >= 2 ? 'high' : score === 1 ? 'moderate' : 'low'
    const recommendation = score >= 2
        ? 'High qSOFA: Consider ICU admission, lactate, blood cultures, broad-spectrum antibiotics'
        : score === 1
            ? 'Monitor closely for clinical deterioration'
            : 'Low qSOFA: Continue standard care'

    return {
        name: 'qSOFA',
        score,
        maxScore: 3,
        riskLevel,
        components,
        recommendation
    }
}

/**
 * SIRS (Systemic Inflammatory Response Syndrome)
 * Score: 0-4, >= 2 criteria = SIRS positive
 */
export function calculateSIRS(vitals: VitalsInput, labs: LabsInput): SepsisScore {
    const components: ScoreComponent[] = []
    let score = 0

    // Temperature > 100.4°F (38°C) or < 96.8°F (36°C)
    const tempF = vitals.temperature ?? 98.6
    const tempMet = tempF > 100.4 || tempF < 96.8
    if (tempMet) score++
    components.push({
        name: 'Temperature',
        value: vitals.temperature ? `${vitals.temperature}°F` : undefined,
        points: tempMet ? 1 : 0,
        criteria: '> 100.4°F or < 96.8°F',
        met: tempMet
    })

    // Heart Rate > 90 bpm
    const hrMet = (vitals.heartRate ?? 0) > 90
    if (hrMet) score++
    components.push({
        name: 'Heart Rate',
        value: vitals.heartRate,
        points: hrMet ? 1 : 0,
        criteria: '> 90 bpm',
        met: hrMet
    })

    // Respiratory Rate > 20 or PaCO2 < 32 mmHg
    const rrMet = (vitals.respiratoryRate ?? 0) > 20 || (labs.paCO2 !== undefined && labs.paCO2 < 32)
    if (rrMet) score++
    components.push({
        name: 'Respiratory Rate/PaCO2',
        value: vitals.respiratoryRate ?? (labs.paCO2 ? `PaCO2: ${labs.paCO2}` : undefined),
        points: rrMet ? 1 : 0,
        criteria: 'RR > 20 or PaCO2 < 32',
        met: rrMet
    })

    // WBC > 12,000 or < 4,000 or > 10% bands
    const wbcMet = (labs.wbc !== undefined && (labs.wbc > 12 || labs.wbc < 4)) ||
        (labs.bandCount !== undefined && labs.bandCount > 10)
    if (wbcMet) score++
    components.push({
        name: 'WBC/Bands',
        value: labs.wbc !== undefined ? `${labs.wbc}K` : undefined,
        points: wbcMet ? 1 : 0,
        criteria: 'WBC > 12K or < 4K or bands > 10%',
        met: wbcMet
    })

    const riskLevel = score >= 3 ? 'high' : score === 2 ? 'moderate' : 'low'
    const recommendation = score >= 2
        ? 'SIRS positive: Search for infection source, consider sepsis workup'
        : 'SIRS negative: Low concern for systemic inflammatory response'

    return {
        name: 'SIRS',
        score,
        maxScore: 4,
        riskLevel,
        components,
        recommendation
    }
}

/**
 * NEWS2 (National Early Warning Score 2)
 * Score: 0-20, Aggregate risk from clinical parameters
 */
export function calculateNEWS2(vitals: VitalsInput): SepsisScore {
    const components: ScoreComponent[] = []
    let score = 0

    // Respiratory Rate scoring
    const rr = vitals.respiratoryRate ?? 16
    let rrPoints = 0
    if (rr <= 8) rrPoints = 3
    else if (rr >= 25) rrPoints = 3
    else if (rr >= 21 && rr <= 24) rrPoints = 2
    else if (rr >= 9 && rr <= 11) rrPoints = 1
    // 12-20 = 0 points
    score += rrPoints
    components.push({
        name: 'Respiratory Rate',
        value: vitals.respiratoryRate,
        points: rrPoints,
        criteria: '≤8 or ≥25 = 3, 21-24 = 2, 9-11 = 1, 12-20 = 0',
        met: rrPoints > 0
    })

    // SpO2 scoring (assuming room air - Scale 1)
    const spo2 = vitals.oxygenSaturation ?? 97
    let spo2Points = 0
    if (spo2 <= 91) spo2Points = 3
    else if (spo2 >= 92 && spo2 <= 93) spo2Points = 2
    else if (spo2 >= 94 && spo2 <= 95) spo2Points = 1
    // >= 96 = 0 points
    score += spo2Points
    components.push({
        name: 'SpO2',
        value: vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : undefined,
        points: spo2Points,
        criteria: '≤91 = 3, 92-93 = 2, 94-95 = 1, ≥96 = 0',
        met: spo2Points > 0
    })

    // Supplemental O2
    const o2Points = vitals.supplementalO2 ? 2 : 0
    score += o2Points
    components.push({
        name: 'Supplemental O2',
        value: vitals.supplementalO2 ? 'Yes' : 'No',
        points: o2Points,
        criteria: 'On O2 = 2',
        met: o2Points > 0
    })

    // Systolic BP scoring
    const sbp = vitals.systolicBP ?? 120
    let sbpPoints = 0
    if (sbp <= 90 || sbp >= 220) sbpPoints = 3
    else if (sbp >= 91 && sbp <= 100) sbpPoints = 2
    else if (sbp >= 101 && sbp <= 110) sbpPoints = 1
    // 111-219 = 0 points
    score += sbpPoints
    components.push({
        name: 'Systolic BP',
        value: vitals.systolicBP,
        points: sbpPoints,
        criteria: '≤90 or ≥220 = 3, 91-100 = 2, 101-110 = 1, 111-219 = 0',
        met: sbpPoints > 0
    })

    // Heart Rate scoring
    const hr = vitals.heartRate ?? 75
    let hrPoints = 0
    if (hr <= 40 || hr >= 131) hrPoints = 3
    else if ((hr >= 41 && hr <= 50) || (hr >= 111 && hr <= 130)) hrPoints = 2
    else if (hr >= 91 && hr <= 110) hrPoints = 1
    // 51-90 = 0 points
    score += hrPoints
    components.push({
        name: 'Heart Rate',
        value: vitals.heartRate,
        points: hrPoints,
        criteria: '≤40 or ≥131 = 3, 41-50 or 111-130 = 2, 91-110 = 1, 51-90 = 0',
        met: hrPoints > 0
    })

    // Temperature scoring (convert to Celsius for NEWS2)
    const tempF = vitals.temperature ?? 98.6
    const tempC = (tempF - 32) * 5 / 9
    let tempPoints = 0
    if (tempC <= 35.0) tempPoints = 3
    else if (tempC >= 39.1) tempPoints = 2
    else if ((tempC >= 35.1 && tempC <= 36.0) || (tempC >= 38.1 && tempC <= 39.0)) tempPoints = 1
    // 36.1-38.0 = 0 points
    score += tempPoints
    components.push({
        name: 'Temperature',
        value: vitals.temperature ? `${vitals.temperature}°F` : undefined,
        points: tempPoints,
        criteria: '≤95°F = 3, ≥102.4°F = 2, abnormal = 1',
        met: tempPoints > 0
    })

    // Consciousness (AVPU)
    let consciousnessPoints = 0
    if (vitals.mentalStatus === 'unresponsive') consciousnessPoints = 3
    else if (vitals.mentalStatus === 'drowsy' || vitals.mentalStatus === 'confused') consciousnessPoints = 3
    if (vitals.gcsScore !== undefined && vitals.gcsScore < 15) consciousnessPoints = 3
    score += consciousnessPoints
    components.push({
        name: 'Consciousness',
        value: vitals.mentalStatus ?? 'alert',
        points: consciousnessPoints,
        criteria: 'Not alert = 3',
        met: consciousnessPoints > 0
    })

    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low'
    let recommendation = ''
    if (score >= 7) {
        riskLevel = 'critical'
        recommendation = 'NEWS2 ≥7: Immediate clinical review, consider critical care'
    } else if (score >= 5) {
        riskLevel = 'high'
        recommendation = 'NEWS2 5-6: Urgent response, increase monitoring frequency'
    } else if (score >= 1) {
        riskLevel = 'moderate'
        recommendation = 'NEWS2 1-4: Increase monitoring, clinical review if any concern'
    } else {
        riskLevel = 'low'
        recommendation = 'NEWS2 0: Minimum 12-hourly monitoring'
    }

    return {
        name: 'NEWS2',
        score,
        maxScore: 20,
        riskLevel,
        components,
        recommendation
    }
}

/**
 * Calculate overall sepsis risk from all scoring systems
 */
export function calculateSepsisRisk(
    patientId: string,
    vitals: VitalsInput,
    labs: LabsInput
): SepsisRiskResult {
    const qsofa = calculateQSOFA(vitals)
    const sirs = calculateSIRS(vitals, labs)
    const news2 = calculateNEWS2(vitals)

    // Determine overall risk (highest of all)
    const risks = [qsofa.riskLevel, sirs.riskLevel, news2.riskLevel]
    const riskOrder = ['critical', 'high', 'moderate', 'low'] as const
    const overallRisk = riskOrder.find(r => risks.includes(r)) || 'low'

    // Aggregate recommendations
    const recommendations: string[] = []
    if (qsofa.score >= 2) {
        recommendations.push('🚨 qSOFA ≥2: High risk of poor outcomes. Consider ICU level care.')
    }
    if (sirs.score >= 2) {
        recommendations.push('⚠️ SIRS positive: Evaluate for infection source.')
    }
    if (news2.score >= 5) {
        recommendations.push('📊 NEWS2 elevated: Increase monitoring frequency.')
    }
    if (overallRisk === 'critical' || overallRisk === 'high') {
        recommendations.push('🩸 Order blood cultures and lactate if not already done.')
        recommendations.push('💊 Consider empiric antibiotics if infection suspected.')
    }
    if (recommendations.length === 0) {
        recommendations.push('✅ No immediate sepsis concerns. Continue standard monitoring.')
    }

    return {
        patientId,
        timestamp: new Date().toISOString(),
        overallRisk,
        scores: { qsofa, sirs, news2 },
        recommendations
    }
}

/**
 * Get risk level color for UI
 */
export function getRiskColor(risk: 'low' | 'moderate' | 'high' | 'critical'): string {
    switch (risk) {
        case 'critical':
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
