/**
 * Quality Metrics Calculator
 * 
 * Calculates quality measure performance across patient population
 */

import type {
    QualityMeasure,
    MeasureResult,
    PatientMeasureData
} from './hedis-measures'
import {
    HEDIS_MEASURES,
    isInPopulation,
    meetsNumerator
} from './hedis-measures'

export interface PopulationMetrics {
    totalPatients: number
    measuresCalculated: number
    measureResults: MeasureResult[]
    overallPerformance: number
    categoryPerformance: Record<string, number>
    timestamp: Date
}

export interface PatientGap {
    patientId: string
    patientName?: string
    measureId: string
    measureName: string
    category: string
    priority: 'high' | 'medium' | 'low'
    dueDate?: string
    recommendation: string
}

/**
 * Calculate a single measure for a population
 */
export function calculateMeasure(
    measure: QualityMeasure,
    patients: PatientMeasureData[]
): MeasureResult {
    const inPopulation: string[] = []
    const met: string[] = []
    const notMet: string[] = []
    const excluded: string[] = []

    for (const patient of patients) {
        // Check if patient is in the measure population
        if (!isInPopulation(patient, measure.population)) {
            continue
        }

        inPopulation.push(patient.patientId)

        // Check exclusions
        if (measure.exclusions) {
            const isExcluded = measure.exclusions.some(exc =>
                exc.customCheck ? exc.customCheck(patient) : false
            )
            if (isExcluded) {
                excluded.push(patient.patientId)
                continue
            }
        }

        // Check if patient meets numerator
        if (meetsNumerator(patient, measure)) {
            met.push(patient.patientId)
        } else {
            notMet.push(patient.patientId)
        }
    }

    const denominator = inPopulation.length - excluded.length
    const numerator = met.length
    const rate = denominator > 0 ? Math.round((numerator / denominator) * 100) : 0

    return {
        measureId: measure.id,
        measureName: measure.name,
        numerator,
        denominator,
        rate,
        target: measure.target,
        gap: denominator - numerator,
        patients: {
            met,
            notMet,
            excluded,
        },
    }
}

/**
 * Calculate all measures for a population
 */
export function calculateAllMeasures(
    patients: PatientMeasureData[],
    measureIds?: string[]
): PopulationMetrics {
    const measures = measureIds
        ? HEDIS_MEASURES.filter(m => measureIds.includes(m.id))
        : HEDIS_MEASURES

    const measureResults = measures.map(measure => calculateMeasure(measure, patients))

    // Calculate overall performance (average of rates vs targets)
    const achievedRates = measureResults
        .filter(r => r.denominator > 0)
        .map(r => Math.min(r.rate / r.target, 1))

    const overallPerformance = achievedRates.length > 0
        ? Math.round((achievedRates.reduce((a, b) => a + b, 0) / achievedRates.length) * 100)
        : 0

    // Calculate by category
    const categoryPerformance: Record<string, number> = {}
    const categories = ['prevention', 'chronic', 'behavioral', 'utilization']

    for (const category of categories) {
        const categoryResults = measureResults.filter(r => {
            const measure = HEDIS_MEASURES.find(m => m.id === r.measureId)
            return measure?.category === category
        })

        if (categoryResults.length > 0) {
            const rates = categoryResults
                .filter(r => r.denominator > 0)
                .map(r => r.rate)

            categoryPerformance[category] = rates.length > 0
                ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
                : 0
        }
    }

    return {
        totalPatients: patients.length,
        measuresCalculated: measureResults.length,
        measureResults,
        overallPerformance,
        categoryPerformance,
        timestamp: new Date(),
    }
}

/**
 * Get care gaps for a specific patient
 */
export function getPatientGaps(
    patient: PatientMeasureData,
    patientName?: string
): PatientGap[] {
    const gaps: PatientGap[] = []

    for (const measure of HEDIS_MEASURES) {
        // Check if patient is in population
        if (!isInPopulation(patient, measure.population)) {
            continue
        }

        // Check if patient meets numerator
        if (!meetsNumerator(patient, measure)) {
            gaps.push({
                patientId: patient.patientId,
                patientName,
                measureId: measure.id,
                measureName: measure.name,
                category: measure.category,
                priority: getPriority(measure),
                recommendation: getRecommendation(measure),
            })
        }
    }

    return gaps
}

/**
 * Get all care gaps across population
 */
export function getPopulationGaps(
    patients: PatientMeasureData[]
): { measureId: string; measureName: string; patientCount: number; patients: string[] }[] {
    const gapsByMeasure: Map<string, string[]> = new Map()

    for (const patient of patients) {
        for (const measure of HEDIS_MEASURES) {
            if (isInPopulation(patient, measure.population) && !meetsNumerator(patient, measure)) {
                const existing = gapsByMeasure.get(measure.id) || []
                existing.push(patient.patientId)
                gapsByMeasure.set(measure.id, existing)
            }
        }
    }

    return Array.from(gapsByMeasure.entries()).map(([measureId, patientIds]) => {
        const measure = HEDIS_MEASURES.find(m => m.id === measureId)!
        return {
            measureId,
            measureName: measure.name,
            patientCount: patientIds.length,
            patients: patientIds,
        }
    }).sort((a, b) => b.patientCount - a.patientCount)
}

/**
 * Get priority based on measure type
 */
function getPriority(measure: QualityMeasure): 'high' | 'medium' | 'low' {
    if (measure.category === 'prevention' && measure.type === 'process') {
        return 'high'
    }
    if (measure.category === 'chronic' && measure.type === 'intermediate-outcome') {
        return 'high'
    }
    return 'medium'
}

/**
 * Get recommendation for a measure gap
 */
function getRecommendation(measure: QualityMeasure): string {
    const recommendations: Record<string, string> = {
        'cdc-hba1c': 'Order HbA1c test and review diabetes management plan',
        'cbp': 'Schedule blood pressure check and review medication adherence',
        'col': 'Schedule colonoscopy or order FIT test',
        'bcs': 'Order mammogram screening',
        'ccs': 'Schedule Pap smear or HPV test',
        'fvo': 'Administer influenza vaccine',
        'spc': 'Initiate statin therapy per guidelines',
    }

    return recommendations[measure.id] || `Complete ${measure.name}`
}

/**
 * Calculate trend from historical data
 */
export function calculateTrend(
    current: number,
    previous: number
): 'improving' | 'declining' | 'stable' {
    const diff = current - previous
    if (diff > 2) return 'improving'
    if (diff < -2) return 'declining'
    return 'stable'
}
