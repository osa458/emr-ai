/**
 * Care Gaps Detection for Clinical Decision Support
 * 
 * Detects preventive care gaps based on patient demographics and history
 */

export interface CareGap {
    id: string
    category: 'screening' | 'immunization' | 'chronic-care' | 'follow-up'
    name: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'overdue'
    dueDate?: string
    lastCompleted?: string
    recommendation: string
    orderCode?: string // For quick ordering
}

export interface CareGapsResult {
    patientId: string
    timestamp: string
    totalGaps: number
    overdueCount: number
    gaps: {
        screenings: CareGap[]
        immunizations: CareGap[]
        chronicCare: CareGap[]
        followUps: CareGap[]
    }
}

interface PatientDemographics {
    age: number
    gender: 'male' | 'female'
    conditions: string[]
    procedures: string[]
    immunizations: string[]
    lastLabDates: Record<string, string>
}

// Screening recommendations based on USPSTF guidelines
const SCREENING_GUIDELINES = [
    {
        name: 'Colorectal Cancer Screening',
        category: 'screening' as const,
        minAge: 45,
        maxAge: 75,
        frequencyYears: 10,
        procedureCodes: ['colonoscopy', 'cologuard', 'fit'],
        recommendation: 'Schedule colonoscopy or alternative screening',
        orderCode: 'COLONOSCOPY'
    },
    {
        name: 'Mammogram',
        category: 'screening' as const,
        gender: 'female' as const,
        minAge: 40,
        maxAge: 74,
        frequencyYears: 2,
        procedureCodes: ['mammogram', 'breast imaging'],
        recommendation: 'Schedule mammography screening',
        orderCode: 'MAMMOGRAM'
    },
    {
        name: 'Lung Cancer Screening',
        category: 'screening' as const,
        minAge: 50,
        maxAge: 80,
        frequencyYears: 1,
        // Requires smoking history - simplified check
        conditionRequired: ['smoking', 'tobacco'],
        procedureCodes: ['ldct', 'low-dose ct chest'],
        recommendation: 'Schedule low-dose CT for lung cancer screening',
        orderCode: 'LDCT_LUNG'
    },
    {
        name: 'Cervical Cancer Screening (Pap)',
        category: 'screening' as const,
        gender: 'female' as const,
        minAge: 21,
        maxAge: 65,
        frequencyYears: 3,
        procedureCodes: ['pap', 'pap smear', 'cervical cytology'],
        recommendation: 'Schedule Pap smear',
        orderCode: 'PAP_SMEAR'
    },
    {
        name: 'Bone Density (DEXA)',
        category: 'screening' as const,
        gender: 'female' as const,
        minAge: 65,
        frequencyYears: 2,
        procedureCodes: ['dexa', 'bone density', 'dxa'],
        recommendation: 'Schedule DEXA scan for osteoporosis screening',
        orderCode: 'DEXA_SCAN'
    },
    {
        name: 'Abdominal Aortic Aneurysm Screening',
        category: 'screening' as const,
        gender: 'male' as const,
        minAge: 65,
        maxAge: 75,
        frequencyYears: -1, // One-time screening
        conditionRequired: ['smoking', 'tobacco'],
        procedureCodes: ['aaa screening', 'abdominal aorta ultrasound'],
        recommendation: 'One-time AAA ultrasound screening',
        orderCode: 'AAA_SCREEN'
    }
]

const IMMUNIZATION_GUIDELINES = [
    {
        name: 'Annual Influenza Vaccine',
        minAge: 0,
        frequencyYears: 1,
        codes: ['flu', 'influenza'],
        recommendation: 'Administer annual flu vaccine',
        orderCode: 'FLU_VACCINE'
    },
    {
        name: 'Pneumococcal Vaccine (PCV15/PCV20)',
        minAge: 65,
        frequencyYears: -1, // One-time with possible booster
        codes: ['pneumococcal', 'pneumovax', 'prevnar', 'pcv'],
        recommendation: 'Administer pneumococcal vaccine series',
        orderCode: 'PNEUMO_VACCINE'
    },
    {
        name: 'Shingles Vaccine (Shingrix)',
        minAge: 50,
        frequencyYears: -1,
        codes: ['shingrix', 'zoster', 'shingles'],
        recommendation: 'Administer Shingrix vaccine (2-dose series)',
        orderCode: 'SHINGRIX'
    },
    {
        name: 'Tdap/Td Booster',
        minAge: 19,
        frequencyYears: 10,
        codes: ['tdap', 'tetanus', 'td'],
        recommendation: 'Administer Tdap or Td booster',
        orderCode: 'TDAP_VACCINE'
    },
    {
        name: 'COVID-19 Vaccine',
        minAge: 0,
        frequencyYears: 1,
        codes: ['covid', 'sars-cov', 'coronavirus vaccine'],
        recommendation: 'Offer updated COVID-19 vaccine',
        orderCode: 'COVID_VACCINE'
    },
    {
        name: 'RSV Vaccine',
        minAge: 60,
        frequencyYears: -1,
        codes: ['rsv', 'respiratory syncytial'],
        recommendation: 'Consider RSV vaccine',
        orderCode: 'RSV_VACCINE'
    }
]

const CHRONIC_CARE_LABS = [
    {
        name: 'HbA1c (Diabetes)',
        condition: ['diabetes', 'dm', 'type 2', 'type 1'],
        labCode: 'hba1c',
        frequencyMonths: 3,
        recommendation: 'Order HbA1c for diabetes monitoring',
        orderCode: 'HBA1C'
    },
    {
        name: 'Lipid Panel',
        minAge: 40,
        labCode: 'lipid',
        frequencyMonths: 12,
        recommendation: 'Order lipid panel for cardiovascular risk',
        orderCode: 'LIPID_PANEL'
    },
    {
        name: 'Comprehensive Metabolic Panel',
        condition: ['ckd', 'kidney', 'diabetes', 'hypertension'],
        labCode: 'cmp',
        frequencyMonths: 6,
        recommendation: 'Order CMP for metabolic monitoring',
        orderCode: 'CMP'
    },
    {
        name: 'TSH (Thyroid)',
        condition: ['hypothyroid', 'hyperthyroid', 'thyroid'],
        labCode: 'tsh',
        frequencyMonths: 12,
        recommendation: 'Order TSH for thyroid monitoring',
        orderCode: 'TSH'
    },
    {
        name: 'eGFR/Creatinine',
        condition: ['ckd', 'kidney disease', 'diabetes'],
        labCode: 'creatinine',
        frequencyMonths: 3,
        recommendation: 'Order creatinine/eGFR for kidney function',
        orderCode: 'BMP'
    }
]

function monthsAgo(months: number): Date {
    const date = new Date()
    date.setMonth(date.getMonth() - months)
    return date
}

function yearsAgo(years: number): Date {
    const date = new Date()
    date.setFullYear(date.getFullYear() - years)
    return date
}

function hasCondition(conditions: string[], keywords: string[]): boolean {
    const conditionText = conditions.join(' ').toLowerCase()
    return keywords.some(kw => conditionText.includes(kw.toLowerCase()))
}

function hasProcedure(procedures: string[], keywords: string[]): boolean {
    const procText = procedures.join(' ').toLowerCase()
    return keywords.some(kw => procText.includes(kw.toLowerCase()))
}

function hasImmunization(immunizations: string[], keywords: string[]): boolean {
    const immText = immunizations.join(' ').toLowerCase()
    return keywords.some(kw => immText.includes(kw.toLowerCase()))
}

/**
 * Check for screening care gaps
 */
export function checkScreeningGaps(demographics: PatientDemographics): CareGap[] {
    const gaps: CareGap[] = []
    const today = new Date()

    for (const screening of SCREENING_GUIDELINES) {
        // Check age eligibility
        if (demographics.age < screening.minAge) continue
        if (screening.maxAge && demographics.age > screening.maxAge) continue

        // Check gender eligibility
        if (screening.gender && demographics.gender !== screening.gender) continue

        // Check condition requirement
        if (screening.conditionRequired && !hasCondition(demographics.conditions, screening.conditionRequired)) {
            continue
        }

        // Check if screening was done
        const wasDone = hasProcedure(demographics.procedures, screening.procedureCodes)

        if (!wasDone) {
            const isOverdue = demographics.age > screening.minAge + 2
            gaps.push({
                id: `screening-${screening.name.toLowerCase().replace(/\s+/g, '-')}`,
                category: 'screening',
                name: screening.name,
                description: `Recommended for ages ${screening.minAge}${screening.maxAge ? `-${screening.maxAge}` : '+'}`,
                priority: isOverdue ? 'overdue' : 'high',
                recommendation: screening.recommendation,
                orderCode: screening.orderCode
            })
        }
    }

    return gaps
}

/**
 * Check for immunization care gaps
 */
export function checkImmunizationGaps(demographics: PatientDemographics): CareGap[] {
    const gaps: CareGap[] = []

    for (const vaccine of IMMUNIZATION_GUIDELINES) {
        // Check age eligibility
        if (demographics.age < vaccine.minAge) continue

        // Check if vaccine was received
        const wasReceived = hasImmunization(demographics.immunizations, vaccine.codes)

        if (!wasReceived) {
            const isAnnual = vaccine.frequencyYears === 1
            gaps.push({
                id: `immunization-${vaccine.name.toLowerCase().replace(/\s+/g, '-')}`,
                category: 'immunization',
                name: vaccine.name,
                description: isAnnual ? 'Annual vaccine' : 'Recommended vaccination',
                priority: isAnnual ? 'high' : 'medium',
                recommendation: vaccine.recommendation,
                orderCode: vaccine.orderCode
            })
        }
    }

    return gaps
}

/**
 * Check for chronic care monitoring gaps
 */
export function checkChronicCareGaps(demographics: PatientDemographics): CareGap[] {
    const gaps: CareGap[] = []
    const today = new Date()

    for (const lab of CHRONIC_CARE_LABS) {
        // Check condition requirement
        if (lab.condition && !hasCondition(demographics.conditions, lab.condition)) {
            continue
        }

        // Check age requirement
        if (lab.minAge && demographics.age < lab.minAge) continue

        // Check if lab was done recently
        const lastLabDate = demographics.lastLabDates[lab.labCode]
        const dueDate = lastLabDate
            ? new Date(new Date(lastLabDate).getTime() + lab.frequencyMonths * 30 * 24 * 60 * 60 * 1000)
            : new Date(0) // Never done

        if (dueDate <= today) {
            const isOverdue = !lastLabDate || dueDate < monthsAgo(1)
            gaps.push({
                id: `chronic-${lab.name.toLowerCase().replace(/\s+/g, '-')}`,
                category: 'chronic-care',
                name: lab.name,
                description: lastLabDate
                    ? `Last: ${new Date(lastLabDate).toLocaleDateString()}`
                    : 'No recent results',
                priority: isOverdue ? 'overdue' : 'medium',
                lastCompleted: lastLabDate,
                dueDate: dueDate.toISOString(),
                recommendation: lab.recommendation,
                orderCode: lab.orderCode
            })
        }
    }

    return gaps
}

/**
 * Calculate all care gaps for a patient
 */
export function calculateCareGaps(
    patientId: string,
    demographics: PatientDemographics
): CareGapsResult {
    const screenings = checkScreeningGaps(demographics)
    const immunizations = checkImmunizationGaps(demographics)
    const chronicCare = checkChronicCareGaps(demographics)

    const allGaps = [...screenings, ...immunizations, ...chronicCare]
    const overdueCount = allGaps.filter(g => g.priority === 'overdue').length

    return {
        patientId,
        timestamp: new Date().toISOString(),
        totalGaps: allGaps.length,
        overdueCount,
        gaps: {
            screenings,
            immunizations,
            chronicCare,
            followUps: [] // Could be populated from encounter follow-up needs
        }
    }
}

/**
 * Get priority styling for UI
 */
export function getGapPriorityColor(priority: CareGap['priority']): string {
    switch (priority) {
        case 'overdue':
            return 'bg-red-100 text-red-800 border-red-300'
        case 'high':
            return 'bg-orange-100 text-orange-800 border-orange-300'
        case 'medium':
            return 'bg-yellow-100 text-yellow-800 border-yellow-300'
        case 'low':
            return 'bg-green-100 text-green-800 border-green-300'
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300'
    }
}
