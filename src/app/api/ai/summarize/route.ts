/**
 * AI Summarize API Route
 * Generates clinical summaries and handoff notes
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { llmRequest, mockLLMRequest } from '@/lib/llm/client'
import { 
  SummarizeOutputSchema,
  ClinicalSummarySchema,
  HandoffSummarySchema,
} from '@/lib/llm/schemas/summarize'
import {
  CLINICAL_SUMMARY_SYSTEM_PROMPT,
  HANDOFF_SUMMARY_SYSTEM_PROMPT,
  buildClinicalSummaryUserPrompt,
  buildHandoffSummaryUserPrompt,
} from '@/lib/llm/prompts/summarize'

const RequestSchema = z.object({
  encounterId: z.string(),
  summaryType: z.enum(['clinical', 'handoff', 'brief']).default('clinical'),
  patientContext: z.object({
    patient: z.any(),
    encounter: z.any(),
    conditions: z.array(z.any()).optional(),
    observations: z.array(z.any()).optional(),
    medications: z.array(z.any()).optional(),
    diagnosticReports: z.array(z.any()).optional(),
    procedures: z.array(z.any()).optional(),
    notes: z.array(z.any()).optional(),
    pendingTests: z.array(z.any()).optional(),
    activeTasks: z.array(z.any()).optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { encounterId, summaryType, patientContext } = RequestSchema.parse(body)

    // Use provided context or fetch from FHIR (mock for now)
    const context = patientContext || getMockContext(encounterId)

    let systemPrompt: string
    let userPrompt: string
    let outputSchema: z.ZodSchema

    if (summaryType === 'handoff') {
      systemPrompt = HANDOFF_SUMMARY_SYSTEM_PROMPT
      userPrompt = buildHandoffSummaryUserPrompt({
        patient: context.patient,
        encounter: context.encounter,
        conditions: context.conditions || [],
        observations: context.observations || [],
        medications: context.medications || [],
        pendingTests: context.pendingTests || [],
        activeTasks: context.activeTasks || [],
      })
      outputSchema = HandoffSummarySchema
    } else {
      systemPrompt = CLINICAL_SUMMARY_SYSTEM_PROMPT
      userPrompt = buildClinicalSummaryUserPrompt({
        patient: context.patient,
        encounter: context.encounter,
        conditions: context.conditions || [],
        observations: context.observations || [],
        medications: context.medications || [],
        diagnosticReports: context.diagnosticReports || [],
        procedures: context.procedures || [],
        notes: context.notes || [],
      })
      outputSchema = ClinicalSummarySchema
    }

    // Use mock in development if no API key
    const useMock = !process.env.OPENAI_API_KEY || process.env.USE_MOCK_LLM === 'true'

    let response
    if (useMock) {
      response = await mockLLMRequest({
        systemPrompt,
        userPrompt,
        outputSchema,
        mockResponse: getMockSummaryResponse(summaryType, context),
      })
    } else {
      response = await llmRequest({
        systemPrompt,
        userPrompt,
        outputSchema,
        maxTokens: 4000,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        summaryType,
        ...(summaryType === 'handoff' 
          ? { handoffSummary: response.data }
          : { clinicalSummary: response.data }
        ),
        disclaimer: 'AI-generated summary for clinical decision support. Verify all information before use.',
      },
      usage: response.usage,
      latencyMs: response.latencyMs,
    })

  } catch (error) {
    console.error('Summarize API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate summary' 
      },
      { status: 500 }
    )
  }
}

function getMockContext(encounterId: string) {
  return {
    patient: {
      name: [{ given: ['John'], family: 'Smith' }],
      birthDate: '1958-03-15',
      gender: 'male',
      identifier: [{ value: 'MRN-12345' }],
    },
    encounter: {
      id: encounterId,
      period: { start: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      reasonCode: [{ text: 'CHF Exacerbation' }],
      location: [{ location: { display: 'Room 412' } }],
      participant: [{ individual: { display: 'Dr. Sarah Johnson' } }],
    },
    conditions: [
      { code: { text: 'Congestive Heart Failure' }, clinicalStatus: { coding: [{ code: 'active' }] } },
      { code: { text: 'Type 2 Diabetes Mellitus' }, clinicalStatus: { coding: [{ code: 'active' }] } },
      { code: { text: 'Hypertension' }, clinicalStatus: { coding: [{ code: 'active' }] } },
    ],
    observations: [
      { code: { text: 'Blood Pressure' }, valueQuantity: { value: 138, unit: 'mmHg' }, category: [{ coding: [{ code: 'vital-signs' }] }] },
      { code: { text: 'Heart Rate' }, valueQuantity: { value: 82, unit: '/min' }, category: [{ coding: [{ code: 'vital-signs' }] }] },
      { code: { text: 'BNP' }, valueQuantity: { value: 450, unit: 'pg/mL' }, interpretation: [{ coding: [{ code: 'H' }] }], category: [{ coding: [{ code: 'laboratory' }] }] },
      { code: { text: 'Creatinine' }, valueQuantity: { value: 1.4, unit: 'mg/dL' }, category: [{ coding: [{ code: 'laboratory' }] }] },
    ],
    medications: [
      { medicationCodeableConcept: { text: 'Furosemide 40mg' }, dosageInstruction: [{ text: 'Once daily' }] },
      { medicationCodeableConcept: { text: 'Lisinopril 10mg' }, dosageInstruction: [{ text: 'Once daily' }] },
      { medicationCodeableConcept: { text: 'Metoprolol 25mg' }, dosageInstruction: [{ text: 'Twice daily' }] },
    ],
    diagnosticReports: [
      { code: { text: 'Chest X-Ray' }, status: 'final', conclusion: 'Mild pulmonary edema, improved from prior' },
      { code: { text: 'Echocardiogram' }, status: 'final', conclusion: 'EF 35%, moderate LV dysfunction' },
    ],
    procedures: [],
    notes: [],
    pendingTests: [],
    activeTasks: [],
  }
}

function getMockSummaryResponse(summaryType: string, context: any) {
  const patientName = `${context.patient.name?.[0]?.given?.join(' ')} ${context.patient.name?.[0]?.family}`
  
  if (summaryType === 'handoff') {
    return {
      patient: {
        name: patientName,
        age: '66 years',
        room: context.encounter?.location?.[0]?.location?.display || 'Unknown',
        primaryTeam: context.encounter?.participant?.[0]?.individual?.display || 'Medicine',
      },
      oneLiner: '66M with CHF exacerbation, admitted 4 days ago, improving on diuresis',
      activeIssues: [
        {
          issue: 'CHF Exacerbation',
          plan: 'Continue IV Lasix, strict I/Os, daily weights, goal negative 1-2L',
          overnight: 'Watch for respiratory distress, check O2 sats if symptomatic',
        },
        {
          issue: 'AKI (Cr 1.4, baseline 1.0)',
          plan: 'Hold ACE-I, monitor creatinine with diuresis',
          overnight: 'If urine output drops significantly, may need to reduce diuretic dose',
        },
      ],
      codeStatus: 'Full Code',
      allergies: ['Penicillin (rash)'],
      criticalValues: [
        { lab: 'BNP', value: '450 pg/mL', trend: 'improving' },
        { lab: 'Creatinine', value: '1.4 mg/dL', trend: 'stable' },
      ],
      anticipatedEvents: [
        'May need additional diuretic dose if inadequate urine output',
        'Possible transition to oral diuretics tomorrow if stable',
      ],
      ifThenStatements: [
        { condition: 'If O2 sat < 92% on room air', action: 'Start 2L NC, obtain ABG, page team' },
        { condition: 'If chest pain or new arrhythmia', action: 'Obtain ECG, page team immediately' },
        { condition: 'If urine output < 30mL/hr x 4 hours', action: 'Bolus 250mL NS, page team' },
      ],
      contactInfo: {
        primaryProvider: 'Dr. Sarah Johnson (pager 1234)',
        consultants: ['Cardiology - Dr. Chen (pager 5678)'],
      },
      generatedAt: new Date().toISOString(),
    }
  }

  return {
    patientOverview: {
      demographics: '66-year-old male with history of CHF, DM2, HTN',
      chiefComplaint: 'CHF exacerbation with dyspnea and lower extremity edema',
      admissionDate: context.encounter?.period?.start,
      lengthOfStay: '4 days',
    },
    hospitalCourse: 'Patient admitted with acute decompensated heart failure. Started on IV diuretics with good response. BNP trending down from 850 to 450. Creatinine stable at 1.4. Transitioned to oral medications. Echocardiogram showed EF 35%, consistent with prior. Patient is near euvolemic and ready for discharge planning.',
    keyFindings: [
      { category: 'imaging', finding: 'Chest X-Ray: Mild pulmonary edema, improved', significance: 'significant', date: new Date().toISOString() },
      { category: 'imaging', finding: 'Echo: EF 35%, moderate LV dysfunction', significance: 'significant' },
      { category: 'lab', finding: 'BNP 450 (down from 850)', significance: 'significant' },
      { category: 'lab', finding: 'Creatinine 1.4 (baseline 1.0)', significance: 'routine' },
    ],
    activeDiagnoses: [
      { diagnosis: 'Acute Decompensated Heart Failure', icd10: 'I50.31', status: 'resolving' },
      { diagnosis: 'Type 2 Diabetes Mellitus', icd10: 'E11.9', status: 'active' },
      { diagnosis: 'Essential Hypertension', icd10: 'I10', status: 'active' },
      { diagnosis: 'Acute Kidney Injury', icd10: 'N17.9', status: 'resolving', notes: 'Likely cardiorenal, improving with diuresis' },
    ],
    currentMedications: [
      { medication: 'Furosemide', dose: '40mg', frequency: 'daily', indication: 'CHF', isNew: false },
      { medication: 'Lisinopril', dose: '10mg', frequency: 'daily', indication: 'CHF/HTN', isNew: false },
      { medication: 'Metoprolol Succinate', dose: '25mg', frequency: 'daily', indication: 'CHF/Rate control', isNew: false },
      { medication: 'Metformin', dose: '500mg', frequency: 'twice daily', indication: 'DM2', isNew: false },
    ],
    pendingItems: [
      { item: 'Cardiology follow-up', type: 'followup', status: 'To be scheduled', expectedDate: 'Within 1 week' },
      { item: 'Repeat BMP', type: 'test', status: 'Ordered', expectedDate: 'Tomorrow AM' },
    ],
    clinicalStatus: {
      stability: 'improving',
      oxygenRequirement: 'Room air',
      mobilityStatus: 'Ambulatory with assistance',
      dietStatus: 'Cardiac diet, 2g sodium restriction',
      ivAccess: false,
    },
    briefSummary: '66M with CHF exacerbation responding well to diuresis. BNP down-trending, near euvolemic. Plan for discharge tomorrow pending morning labs and cardiology follow-up scheduling.',
    generatedAt: new Date().toISOString(),
    disclaimer: 'AI-generated summary for clinical decision support. Verify all information before use.',
  }
}
