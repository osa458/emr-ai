/**
 * FHIR Utility Functions
 * 
 * Shared utilities for working with FHIR resources.
 * Extracted from multiple components to avoid duplication.
 */

import type { Condition, CodeableConcept, Observation, MedicationRequest } from '@medplum/fhirtypes'

/**
 * Filter out social determinant "findings" that aren't real medical conditions.
 * SDOH findings should not appear as diagnoses.
 */
export function isMedicalCondition(condition: Condition): boolean {
    const code = condition.code?.coding?.[0]?.code || ''
    const display = (condition.code?.text || condition.code?.coding?.[0]?.display || '').toLowerCase()

    // Filter out SDOH "findings" - these are social determinants, not medical diagnoses
    const sdohPatterns = [
        'finding related to',
        'able to',
        'has a',
        'finding of',
        'reports',
        'only received',
        'full-time employment',
        'part-time employment',
        'not in labor force',
        'refugee',
        'graduated high school',
        'stress',
        'social isolation',
        'housing unsatisf',
        'unemploy',
        'limited social',
        'tobacco smoking status',
        'medication reconciliation',
    ]

    // Check if it matches SDOH patterns
    for (const pattern of sdohPatterns) {
        if (display.includes(pattern)) {
            return false
        }
    }

    // Filter out specific non-diagnosis categories
    const categories = condition.category || []
    for (const cat of categories) {
        const catCode = cat.coding?.[0]?.code || ''
        if (catCode === 'health-concern' || catCode === 'social-history') {
            return false
        }
    }

    // ICD-10 codes starting with Z are often social/encounter reasons
    if (code.startsWith('Z') && !code.startsWith('Z87') && !code.startsWith('Z85')) {
        // Z87 = personal history, Z85 = history of malignancy - these are relevant
        return false
    }

    return true
}

/**
 * Format a FHIR date string to a human-readable format.
 */
export function formatFHIRDate(
    dateStr?: string,
    options?: { includeTime?: boolean; relative?: boolean }
): string {
    if (!dateStr) return 'Unknown date'

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Invalid date'

    if (options?.relative) {
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
    }

    const formatOpts: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }

    if (options?.includeTime) {
        formatOpts.hour = 'numeric'
        formatOpts.minute = '2-digit'
    }

    return date.toLocaleDateString('en-US', formatOpts)
}

/**
 * Get display text from a CodeableConcept, with fallbacks.
 */
export function getCodeDisplay(
    codeableConcept?: CodeableConcept,
    fallback = 'Unknown'
): string {
    if (!codeableConcept) return fallback

    return codeableConcept.text ||
        codeableConcept.coding?.[0]?.display ||
        codeableConcept.coding?.[0]?.code ||
        fallback
}

/**
 * Get the code value from a CodeableConcept.
 */
export function getCodeValue(codeableConcept?: CodeableConcept): string | undefined {
    if (!codeableConcept) return undefined
    return codeableConcept.coding?.[0]?.code
}

/**
 * Format a condition for display.
 */
export function formatCondition(condition: Condition): {
    name: string
    status: string
    onset: string
    code: string
} {
    return {
        name: getCodeDisplay(condition.code, 'Unknown Condition'),
        status: condition.clinicalStatus?.coding?.[0]?.code || 'unknown',
        onset: formatFHIRDate(condition.onsetDateTime),
        code: getCodeValue(condition.code) || '',
    }
}

/**
 * Format an observation (lab/vital) for display.
 */
export function formatObservation(obs: Observation): {
    name: string
    value: string
    unit: string
    flag?: 'H' | 'L' | 'C'
    date: string
} {
    const value = obs.valueQuantity?.value
    const unit = obs.valueQuantity?.unit || ''
    const interp = obs.interpretation?.[0]?.coding?.[0]?.code

    let flag: 'H' | 'L' | 'C' | undefined
    if (interp === 'H' || interp === 'HH') flag = 'H'
    else if (interp === 'L' || interp === 'LL') flag = 'L'
    else if (interp === 'A') flag = 'C'

    return {
        name: getCodeDisplay(obs.code, 'Unknown'),
        value: value !== undefined ? String(value) : '--',
        unit,
        flag,
        date: formatFHIRDate(obs.effectiveDateTime || obs.effectivePeriod?.start),
    }
}

/**
 * Format a medication for display.
 */
export function formatMedication(med: MedicationRequest): {
    name: string
    dose: string
    route: string
    frequency: string
    status: string
} {
    const name = med.medicationCodeableConcept?.text ||
        med.medicationCodeableConcept?.coding?.[0]?.display ||
        'Unknown Medication'

    const dosage = med.dosageInstruction?.[0]
    const doseValue = dosage?.doseAndRate?.[0]?.doseQuantity?.value || ''
    const doseUnit = dosage?.doseAndRate?.[0]?.doseQuantity?.unit || ''
    const route = dosage?.route?.text || dosage?.route?.coding?.[0]?.display || ''
    const frequency = dosage?.timing?.code?.text ||
        dosage?.timing?.code?.coding?.[0]?.display ||
        ''

    return {
        name,
        dose: doseValue ? `${doseValue} ${doseUnit}`.trim() : 'Unknown dose',
        route: route || 'Unknown route',
        frequency: frequency || 'Unknown frequency',
        status: med.status || 'unknown',
    }
}

/**
 * Check if a FHIR resource has a "critical" interpretation.
 */
export function isCriticalValue(obs: Observation): boolean {
    const interp = obs.interpretation?.[0]?.coding?.[0]?.code
    return interp === 'HH' || interp === 'LL' || interp === 'A'
}

/**
 * Get reference range from observation, if available.
 */
export function getReferenceRange(obs: Observation): { low?: number; high?: number } | undefined {
    const range = obs.referenceRange?.[0]
    if (!range) return undefined

    return {
        low: range.low?.value,
        high: range.high?.value,
    }
}

/**
 * Parse LOINC code from observation.
 */
export function getLoincCode(obs: Observation): string | undefined {
    const coding = obs.code?.coding?.find(c =>
        c.system?.includes('loinc.org') || c.system?.includes('LOINC')
    )
    return coding?.code
}
