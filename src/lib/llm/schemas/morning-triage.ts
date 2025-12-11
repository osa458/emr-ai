/**
 * Morning Triage Output Schema
 * Validates LLM responses for patient prioritization
 */

import { z } from 'zod'

export const RiskFactorSchema = z.object({
  factor: z.string().describe('Description of the risk factor'),
  severity: z.enum(['critical', 'high', 'moderate', 'low']),
  details: z.string().describe('Specific details and values'),
  trend: z.enum(['worsening', 'stable', 'improving']).optional(),
})

export const DeteriorationRiskSchema = z.object({
  level: z.enum(['high', 'moderate', 'low']),
  indicators: z.array(z.string()),
  timeframe: z.string().describe('Expected timeframe for potential deterioration'),
})

export const QuickWinSchema = z.object({
  action: z.string().describe('Specific action to take'),
  rationale: z.string().describe('Clinical reasoning'),
  priority: z.enum(['high', 'medium', 'low']),
  timeToComplete: z.string().describe('Estimated time to complete'),
})

export const TriagePatientSchema = z.object({
  patientId: z.string(),
  patientName: z.string(),
  location: z.string(),
  riskLevel: z.enum(['critical', 'high', 'moderate', 'low']),
  riskScore: z.number().min(0).max(100),
  priorityRank: z.number().int().positive(),
  riskFactors: z.array(RiskFactorSchema),
  deteriorationRisk: DeteriorationRiskSchema.optional(),
  quickWins: z.array(QuickWinSchema),
  keyUpdates: z.array(z.string()).describe('Important overnight changes'),
})

export const SystemAlertSchema = z.object({
  type: z.enum(['critical_lab', 'vital_change', 'medication', 'fall_risk', 'other']),
  message: z.string(),
  patientId: z.string(),
  severity: z.enum(['critical', 'warning', 'info']).optional(),
})

export const MorningTriageOutputSchema = z.object({
  generatedAt: z.string().datetime(),
  totalPatients: z.number().int(),
  criticalCount: z.number().int(),
  highRiskCount: z.number().int(),
  patients: z.array(TriagePatientSchema),
  systemAlerts: z.array(SystemAlertSchema),
  disclaimer: z.string().default('AI-generated prioritization. Verify with clinical assessment.'),
})

export type RiskFactor = z.infer<typeof RiskFactorSchema>
export type DeteriorationRisk = z.infer<typeof DeteriorationRiskSchema>
export type QuickWin = z.infer<typeof QuickWinSchema>
export type TriagePatient = z.infer<typeof TriagePatientSchema>
export type SystemAlert = z.infer<typeof SystemAlertSchema>
export type MorningTriageOutput = z.infer<typeof MorningTriageOutputSchema>

/**
 * Validate and parse morning triage response
 */
export function parseTriageResponse(response: unknown): MorningTriageOutput {
  return MorningTriageOutputSchema.parse(response)
}

/**
 * Safe parse with error handling
 */
export function safeParseTriageResponse(response: unknown): {
  success: boolean
  data?: MorningTriageOutput
  error?: string
} {
  const result = MorningTriageOutputSchema.safeParse(response)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.message }
}
