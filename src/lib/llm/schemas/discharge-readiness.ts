/**
 * Discharge Readiness Output Schema
 * Validates LLM responses for discharge assessment
 */

import { z } from 'zod'

export const BlockingFactorSchema = z.object({
  factor: z.string().describe('Description of the blocking factor'),
  category: z.enum(['clinical', 'workup', 'social', 'logistical']),
  details: z.string(),
  estimatedResolutionTime: z.string(),
  responsibleParty: z.string().optional(),
})

export const ClinicalStatusSchema = z.object({
  vitalsStable: z.boolean(),
  vitalsNotes: z.string(),
  labsAcceptable: z.boolean(),
  labsNotes: z.string(),
  symptomsControlled: z.boolean(),
  symptomsNotes: z.string(),
  oxygenRequirement: z.string(),
  mobilityStatus: z.string(),
  painControlled: z.boolean().optional(),
  painNotes: z.string().optional(),
})

export const FollowupNeedSchema = z.object({
  specialty: z.string(),
  timeframe: z.enum(['within_1_week', 'within_2_weeks', 'within_1_month', 'as_needed']),
  reason: z.string(),
  mode: z.enum(['in_person', 'telemedicine', 'either']),
  priority: z.enum(['critical', 'high', 'routine']),
})

export const PendingTestSchema = z.object({
  testName: z.string(),
  orderedDate: z.string().optional(),
  expectedResultDate: z.string().optional(),
  criticalForDischarge: z.boolean(),
})

export const SafetyCheckSchema = z.object({
  item: z.string(),
  category: z.enum(['medication', 'education', 'equipment', 'safety', 'social']),
  completed: z.boolean(),
  notes: z.string().optional(),
})

export const DischargeReadinessOutputSchema = z.object({
  readinessLevel: z.enum(['READY_TODAY', 'READY_SOON', 'NOT_READY']),
  readinessScore: z.number().min(0).max(100),
  readinessReasons: z.array(z.string()),
  blockingFactors: z.array(BlockingFactorSchema),
  clinicalStatus: ClinicalStatusSchema,
  followupNeeds: z.array(FollowupNeedSchema),
  pendingTests: z.array(PendingTestSchema),
  safetyChecks: z.array(SafetyCheckSchema),
  estimatedDischargeDate: z.string().optional(),
  dischargeDisposition: z.enum([
    'home',
    'home_with_services',
    'skilled_nursing',
    'rehab',
    'ltac',
    'hospice',
    'other'
  ]).optional(),
  disclaimer: z.string().default('Assessment based on available data. Clinical judgment required.'),
})

export type BlockingFactor = z.infer<typeof BlockingFactorSchema>
export type ClinicalStatus = z.infer<typeof ClinicalStatusSchema>
export type FollowupNeed = z.infer<typeof FollowupNeedSchema>
export type PendingTest = z.infer<typeof PendingTestSchema>
export type SafetyCheck = z.infer<typeof SafetyCheckSchema>
export type DischargeReadinessOutput = z.infer<typeof DischargeReadinessOutputSchema>

/**
 * Validate and parse discharge readiness response
 */
export function parseDischargeResponse(response: unknown): DischargeReadinessOutput {
  return DischargeReadinessOutputSchema.parse(response)
}

/**
 * Safe parse with error handling
 */
export function safeParseDischargeResponse(response: unknown): {
  success: boolean
  data?: DischargeReadinessOutput
  error?: string
} {
  const result = DischargeReadinessOutputSchema.safeParse(response)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.message }
}
