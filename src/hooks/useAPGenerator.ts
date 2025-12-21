/**
 * useAPGenerator Hook
 * 
 * Manages the two-stage AI A&P generation:
 * 1. Collects FHIR data + in-progress note content
 * 2. Calls the /api/ai/ap-generator endpoint
 * 3. Returns structured recommendations with evidence
 */

'use client'

import { useState, useCallback } from 'react'
import {
    usePatientConditions,
    usePatientLabs,
    usePatientVitals,
    usePatientMedications,
    usePatientImaging,
} from '@/hooks/useFHIRData'
import type { Condition, Observation, MedicationRequest, DiagnosticReport } from '@medplum/fhirtypes'

// =============================================================================
// Types
// =============================================================================

export interface SupportingEvidence {
    type: 'lab' | 'vital' | 'medication' | 'imaging' | 'hpi' | 'exam'
    finding: string
    value?: string
    interpretation?: string
}

export interface Stage1Problem {
    name: string
    icdCode?: string
    status: 'active' | 'resolved' | 'managed'
    supportingEvidence: SupportingEvidence[]
}

export interface Stage1Summary {
    problems: Stage1Problem[]
    clinicalContext: {
        chiefComplaint: string
        hpiSummary?: string
        examFindings?: string
        pertinentNegatives?: string[]
        vitalsSummary?: string
    }
    alerts: string[]
    labSummary: string
    medicationSummary: string
}

export interface APRecommendation {
    id: string
    problem: string
    assessment: string
    plan: string[]
    evidence: string[]
    confidence: 'high' | 'moderate' | 'low'
    status?: 'pending' | 'accepted' | 'edited' | 'denied'
    editedContent?: string
}

export interface UseAPGeneratorOptions {
    patientId: string
    patientName?: string
}

export interface UseAPGeneratorResult {
    stage1Summary: Stage1Summary | null
    recommendations: APRecommendation[]
    isGenerating: boolean
    error: string | null
    generate: (inProgressNote?: {
        subjective?: string
        physicalExam?: string
        ros?: string
    }) => Promise<void>
    updateRecommendation: (id: string, updates: Partial<APRecommendation>) => void
    acceptRecommendation: (id: string) => void
    denyRecommendation: (id: string) => void
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatCondition(condition: Condition): { name: string; code?: string; status: string } {
    return {
        name: condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown condition',
        code: condition.code?.coding?.[0]?.code,
        status: condition.clinicalStatus?.coding?.[0]?.code || 'active',
    }
}

function formatLab(lab: Observation): { name: string; value: string; unit: string; interpretation: string; date?: string } {
    const name = lab.code?.text || lab.code?.coding?.[0]?.display || 'Unknown'
    const value = lab.valueQuantity?.value?.toString() || lab.valueString || 'N/A'
    const unit = lab.valueQuantity?.unit || ''
    const interp = lab.interpretation?.[0]?.coding?.[0]?.code || 'Normal'
    const interpretation = interp === 'H' || interp === 'HH' ? 'High' :
        interp === 'L' || interp === 'LL' ? 'Low' : 'Normal'
    const date = lab.effectiveDateTime ? new Date(lab.effectiveDateTime).toLocaleDateString() : undefined

    return { name, value, unit, interpretation, date }
}

function formatVital(vital: Observation): { name: string; value: string; unit: string } {
    const name = vital.code?.text || vital.code?.coding?.[0]?.display || 'Unknown'
    const value = vital.valueQuantity?.value?.toString() || 'N/A'
    const unit = vital.valueQuantity?.unit || ''

    return { name, value, unit }
}

function formatMedication(med: MedicationRequest): { name: string; dose: string; frequency: string } {
    const name = med.medicationCodeableConcept?.text ||
        med.medicationCodeableConcept?.coding?.[0]?.display ||
        'Unknown medication'
    const dosage = med.dosageInstruction?.[0]
    const dose = dosage?.doseAndRate?.[0]?.doseQuantity?.value
        ? `${dosage.doseAndRate[0].doseQuantity.value}${dosage.doseAndRate[0].doseQuantity.unit || ''}`
        : ''
    const frequency = dosage?.timing?.code?.coding?.[0]?.display ||
        dosage?.timing?.code?.text ||
        ''

    return { name, dose, frequency }
}

function formatImaging(imaging: DiagnosticReport): { type: string; date: string; finding: string } {
    return {
        type: imaging.code?.text || imaging.code?.coding?.[0]?.display || 'Study',
        date: imaging.effectiveDateTime ? new Date(imaging.effectiveDateTime).toLocaleDateString() : 'Recent',
        finding: imaging.conclusion || 'No findings documented',
    }
}

// Filter out social determinant findings
function isMedicalCondition(condition: Condition): boolean {
    const name = condition.code?.text || condition.code?.coding?.[0]?.display || ''
    const excludePatterns = [
        '(finding)', '(situation)', '(social concept)', 'employment', 'education',
        'housing', 'stress', 'lack of', 'Received higher', 'Social isolation',
        'Reports of violence', 'Victim of intimate partner abuse', 'Has a criminal record',
        'Misuses drugs', 'Unhealthy alcohol drinking behavior', 'Limited social contact',
        'Not in labor force', 'Part-time employment', 'Full-time employment',
    ]
    const lowerName = name.toLowerCase()
    return !excludePatterns.some(pattern => lowerName.includes(pattern.toLowerCase()))
}

// =============================================================================
// Hook
// =============================================================================

export function useAPGenerator({ patientId, patientName }: UseAPGeneratorOptions): UseAPGeneratorResult {
    const [stage1Summary, setStage1Summary] = useState<Stage1Summary | null>(null)
    const [recommendations, setRecommendations] = useState<APRecommendation[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch FHIR data
    const { data: conditions = [] } = usePatientConditions(patientId)
    const { data: labs = [] } = usePatientLabs(patientId)
    const { data: vitals = [] } = usePatientVitals(patientId)
    const { inpatientMedications = [] } = usePatientMedications(patientId)
    const { data: imaging = [] } = usePatientImaging(patientId)

    const generate = useCallback(async (inProgressNote?: {
        subjective?: string
        physicalExam?: string
        ros?: string
    }) => {
        setIsGenerating(true)
        setError(null)

        try {
            // Filter and format FHIR data
            const medicalConditions = conditions.filter(isMedicalCondition)

            const requestBody = {
                patientId,
                patientName,
                conditions: medicalConditions.map(formatCondition),
                labs: labs.slice(0, 20).map(formatLab),
                vitals: vitals.slice(0, 10).map(formatVital),
                medications: inpatientMedications.map(formatMedication),
                imaging: imaging.slice(0, 5).map(formatImaging),
                inProgressNote,
            }

            const response = await fetch('/api/ai/ap-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Failed to generate recommendations')
            }

            setStage1Summary(result.stage1Summary || null)

            // Add status to recommendations
            const recsWithStatus = (result.recommendations || []).map((rec: APRecommendation) => ({
                ...rec,
                status: 'pending' as const,
            }))
            setRecommendations(recsWithStatus)

        } catch (err) {
            console.error('[useAPGenerator] Error:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setIsGenerating(false)
        }
    }, [patientId, patientName, conditions, labs, vitals, inpatientMedications, imaging])

    const updateRecommendation = useCallback((id: string, updates: Partial<APRecommendation>) => {
        setRecommendations(prev =>
            prev.map(rec => rec.id === id ? { ...rec, ...updates } : rec)
        )
    }, [])

    const acceptRecommendation = useCallback((id: string) => {
        updateRecommendation(id, { status: 'accepted' })
    }, [updateRecommendation])

    const denyRecommendation = useCallback((id: string) => {
        updateRecommendation(id, { status: 'denied' })
    }, [updateRecommendation])

    return {
        stage1Summary,
        recommendations,
        isGenerating,
        error,
        generate,
        updateRecommendation,
        acceptRecommendation,
        denyRecommendation,
    }
}
