/**
 * HEDIS Quality Measures
 * 
 * Healthcare Effectiveness Data and Information Set measures
 * Used for value-based care quality reporting
 */

export interface QualityMeasure {
    id: string
    name: string
    description: string
    category: 'prevention' | 'chronic' | 'behavioral' | 'utilization'
    type: 'process' | 'outcome' | 'intermediate-outcome'
    population: PatientPopulation
    numerator: MeasureCriteria
    denominator: MeasureCriteria
    exclusions?: MeasureCriteria[]
    target: number // Target percentage
}

export interface PatientPopulation {
    ageMin?: number
    ageMax?: number
    gender?: 'male' | 'female'
    conditions?: string[]
    includedPatients?: string[] // For custom cohorts
}

export interface MeasureCriteria {
    description: string
    fhirQuery?: string
    codeCheck?: {
        resourceType: 'Observation' | 'Procedure' | 'Condition' | 'MedicationRequest' | 'Immunization'
        codes: string[]
        lookbackDays?: number
    }
    customCheck?: (patientData: PatientMeasureData) => boolean
}

export interface PatientMeasureData {
    patientId: string
    age: number
    gender: string
    conditions: { code: string; display: string }[]
    observations: { code: string; value?: number; date: string }[]
    procedures: { code: string; date: string }[]
    medications: { code: string; status: string }[]
    immunizations: { code: string; date: string }[]
}

export interface MeasureResult {
    measureId: string
    measureName: string
    numerator: number
    denominator: number
    rate: number
    target: number
    gap: number // denominator - numerator
    trend?: 'improving' | 'declining' | 'stable'
    patients?: {
        met: string[]
        notMet: string[]
        excluded: string[]
    }
}

// HEDIS Measures Definitions
export const HEDIS_MEASURES: QualityMeasure[] = [
    // Diabetes Care
    {
        id: 'cdc-hba1c',
        name: 'Diabetes: HbA1c Control (<8%)',
        description: 'Percentage of diabetic patients with HbA1c < 8%',
        category: 'chronic',
        type: 'intermediate-outcome',
        population: {
            ageMin: 18,
            ageMax: 75,
            conditions: ['Diabetes', 'Type 2 Diabetes', 'Type 1 Diabetes', 'E11', 'E10'],
        },
        numerator: {
            description: 'Patients with HbA1c < 8%',
            codeCheck: {
                resourceType: 'Observation',
                codes: ['4548-4', '17856-6'], // HbA1c LOINC codes
                lookbackDays: 365,
            },
            customCheck: (data) => {
                const hba1c = data.observations.find(o =>
                    ['4548-4', '17856-6'].includes(o.code) && o.value !== undefined
                )
                return hba1c ? hba1c.value! < 8 : false
            },
        },
        denominator: {
            description: 'Patients with diabetes aged 18-75',
        },
        target: 70,
    },

    // Blood Pressure Control
    {
        id: 'cbp',
        name: 'Blood Pressure Control (<140/90)',
        description: 'Percentage of hypertensive patients with controlled BP',
        category: 'chronic',
        type: 'intermediate-outcome',
        population: {
            ageMin: 18,
            ageMax: 85,
            conditions: ['Hypertension', 'Essential Hypertension', 'I10'],
        },
        numerator: {
            description: 'Patients with BP < 140/90 mmHg',
            codeCheck: {
                resourceType: 'Observation',
                codes: ['85354-9'], // BP Panel
                lookbackDays: 365,
            },
        },
        denominator: {
            description: 'Patients with hypertension aged 18-85',
        },
        target: 65,
    },

    // Colorectal Cancer Screening
    {
        id: 'col',
        name: 'Colorectal Cancer Screening',
        description: 'Age-appropriate colorectal cancer screening',
        category: 'prevention',
        type: 'process',
        population: {
            ageMin: 45,
            ageMax: 75,
        },
        numerator: {
            description: 'Patients with colonoscopy in past 10 years or FIT test in past year',
            codeCheck: {
                resourceType: 'Procedure',
                codes: ['73761001', '310634005'], // Colonoscopy SNOMED codes
                lookbackDays: 3650, // 10 years
            },
        },
        denominator: {
            description: 'Patients aged 45-75',
        },
        target: 70,
    },

    // Breast Cancer Screening
    {
        id: 'bcs',
        name: 'Breast Cancer Screening',
        description: 'Women with mammogram in past 2 years',
        category: 'prevention',
        type: 'process',
        population: {
            ageMin: 50,
            ageMax: 74,
            gender: 'female',
        },
        numerator: {
            description: 'Patients with mammogram in past 2 years',
            codeCheck: {
                resourceType: 'Procedure',
                codes: ['241055006', '24623002'], // Mammogram SNOMED
                lookbackDays: 730, // 2 years
            },
        },
        denominator: {
            description: 'Women aged 50-74',
        },
        target: 75,
    },

    // Cervical Cancer Screening
    {
        id: 'ccs',
        name: 'Cervical Cancer Screening',
        description: 'Women with cervical cancer screening',
        category: 'prevention',
        type: 'process',
        population: {
            ageMin: 21,
            ageMax: 64,
            gender: 'female',
        },
        numerator: {
            description: 'Patients with Pap test in past 3 years or HPV test in past 5 years',
            codeCheck: {
                resourceType: 'Procedure',
                codes: ['171149006'], // Pap smear SNOMED
                lookbackDays: 1095, // 3 years
            },
        },
        denominator: {
            description: 'Women aged 21-64',
        },
        target: 80,
    },

    // Flu Vaccination
    {
        id: 'fvo',
        name: 'Flu Vaccination (65+)',
        description: 'Adults 65+ with annual flu vaccination',
        category: 'prevention',
        type: 'process',
        population: {
            ageMin: 65,
        },
        numerator: {
            description: 'Patients with flu vaccine in past year',
            codeCheck: {
                resourceType: 'Immunization',
                codes: ['140', '141', '150', '155'], // Flu vaccine CVX codes
                lookbackDays: 365,
            },
        },
        denominator: {
            description: 'Adults 65+',
        },
        target: 80,
    },

    // Medication Adherence - Statins
    {
        id: 'spc',
        name: 'Statin Therapy for Cardiovascular Disease',
        description: 'CVD patients on statin therapy',
        category: 'chronic',
        type: 'process',
        population: {
            ageMin: 21,
            ageMax: 75,
            conditions: ['Cardiovascular Disease', 'Coronary Artery Disease', 'Atherosclerosis', 'I25'],
        },
        numerator: {
            description: 'Patients currently on statin therapy',
            codeCheck: {
                resourceType: 'MedicationRequest',
                codes: ['statins'], // Would need to map to specific RxNorm codes
                lookbackDays: 365,
            },
        },
        denominator: {
            description: 'CVD patients aged 21-75',
        },
        target: 80,
    },
]

/**
 * Get measure by ID
 */
export function getMeasure(id: string): QualityMeasure | undefined {
    return HEDIS_MEASURES.find(m => m.id === id)
}

/**
 * Get measures by category
 */
export function getMeasuresByCategory(category: QualityMeasure['category']): QualityMeasure[] {
    return HEDIS_MEASURES.filter(m => m.category === category)
}

/**
 * Check if patient is in measure population
 */
export function isInPopulation(patient: PatientMeasureData, population: PatientPopulation): boolean {
    // Age check
    if (population.ageMin && patient.age < population.ageMin) return false
    if (population.ageMax && patient.age > population.ageMax) return false

    // Gender check
    if (population.gender && patient.gender !== population.gender) return false

    // Condition check
    if (population.conditions && population.conditions.length > 0) {
        const hasCondition = patient.conditions.some(c =>
            population.conditions!.some(pc =>
                c.code.includes(pc) || c.display.toLowerCase().includes(pc.toLowerCase())
            )
        )
        if (!hasCondition) return false
    }

    return true
}

/**
 * Check if patient meets numerator criteria
 */
export function meetsNumerator(patient: PatientMeasureData, measure: QualityMeasure): boolean {
    const { numerator } = measure

    // Custom check takes priority
    if (numerator.customCheck) {
        return numerator.customCheck(patient)
    }

    // Code-based check
    if (numerator.codeCheck) {
        const { resourceType, codes, lookbackDays = 365 } = numerator.codeCheck
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - lookbackDays)
        const cutoffStr = cutoffDate.toISOString().split('T')[0]

        switch (resourceType) {
            case 'Observation':
                return patient.observations.some(o =>
                    codes.includes(o.code) && o.date >= cutoffStr
                )
            case 'Procedure':
                return patient.procedures.some(p =>
                    codes.includes(p.code) && p.date >= cutoffStr
                )
            case 'Immunization':
                return patient.immunizations.some(i =>
                    codes.includes(i.code) && i.date >= cutoffStr
                )
            case 'MedicationRequest':
                return patient.medications.some(m =>
                    codes.includes(m.code) && m.status === 'active'
                )
            default:
                return false
        }
    }

    return false
}
