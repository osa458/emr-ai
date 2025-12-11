/**
 * Diagnostic Assist Output Schema
 * Validates LLM responses for diagnostic suggestions
 */

import { z } from 'zod'

export const DiagnosticEvidenceSchema = z.object({
  type: z.enum(['vital', 'lab', 'symptom', 'history', 'medication', 'imaging']),
  description: z.string(),
  value: z.string().optional(),
  significance: z.enum(['supporting', 'contradicting', 'neutral']).optional(),
})

export const DiagnosticSuggestionSchema = z.object({
  condition: z.string().describe('Name of the suggested condition'),
  icd10Code: z.string().describe('ICD-10 code for the condition'),
  confidence: z.enum(['high', 'moderate', 'low']),
  rationale: z.string().describe('Clinical reasoning for this suggestion'),
  supportingEvidence: z.array(DiagnosticEvidenceSchema),
  differentialConsiderations: z.array(z.string()).describe('Alternative diagnoses to consider'),
  suggestedWorkup: z.array(z.string()).describe('Recommended tests or evaluations'),
})

export const DiagnosticAssistOutputSchema = z.object({
  suggestions: z.array(DiagnosticSuggestionSchema).max(5),
  clinicalContext: z.string().describe('Summary of relevant clinical context'),
  limitations: z.array(z.string()).describe('Limitations of this analysis'),
  disclaimer: z.string().default('This is decision support only. Clinical judgment required.'),
})

export type DiagnosticEvidence = z.infer<typeof DiagnosticEvidenceSchema>
export type DiagnosticSuggestion = z.infer<typeof DiagnosticSuggestionSchema>
export type DiagnosticAssistOutput = z.infer<typeof DiagnosticAssistOutputSchema>

/**
 * Validate and parse diagnostic assist response
 */
export function parseDiagnosticResponse(response: unknown): DiagnosticAssistOutput {
  return DiagnosticAssistOutputSchema.parse(response)
}

/**
 * Safe parse with error handling
 */
export function safeParseDiagnosticResponse(response: unknown): {
  success: boolean
  data?: DiagnosticAssistOutput
  error?: string
} {
  const result = DiagnosticAssistOutputSchema.safeParse(response)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.message }
}
