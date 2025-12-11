/**
 * Billing Assist Output Schema
 * Validates LLM responses for billing optimization
 */

import { z } from 'zod'

export const CodeEvidenceSchema = z.object({
  source: z.string().describe('Where the evidence was found'),
  quote: z.string().describe('Relevant text from documentation'),
})

export const SuggestedCodeSchema = z.object({
  codeType: z.enum(['ICD-10', 'CPT', 'HCPCS']),
  code: z.string(),
  description: z.string(),
  category: z.enum([
    'principal_diagnosis',
    'secondary_diagnosis',
    'cc',
    'mcc',
    'procedure',
    'evaluation_management'
  ]),
  evidence: z.array(CodeEvidenceSchema),
  documentationTip: z.string().optional(),
  complianceNotes: z.string().optional(),
  confidence: z.enum(['high', 'moderate', 'low']).optional(),
})

export const MissingDocumentationSchema = z.object({
  codeAtRisk: z.string().describe('Code that could be captured'),
  whatIsMissing: z.string(),
  suggestedAddition: z.string().describe('What to add to documentation'),
  potentialImpact: z.string().optional(),
})

export const CMIImpactSchema = z.object({
  currentEstimate: z.string(),
  potentialWithSuggestions: z.string(),
  explanation: z.string(),
})

export const BillingAssistOutputSchema = z.object({
  suggestedCodes: z.array(SuggestedCodeSchema),
  missingDocumentation: z.array(MissingDocumentationSchema),
  cmiImpact: CMIImpactSchema.optional(),
  complianceWarnings: z.array(z.string()),
  queryOpportunities: z.array(z.string()).optional(),
  disclaimer: z.string().default('All codes require physician attestation and documentation review.'),
})

export type CodeEvidence = z.infer<typeof CodeEvidenceSchema>
export type SuggestedCode = z.infer<typeof SuggestedCodeSchema>
export type MissingDocumentation = z.infer<typeof MissingDocumentationSchema>
export type CMIImpact = z.infer<typeof CMIImpactSchema>
export type BillingAssistOutput = z.infer<typeof BillingAssistOutputSchema>

/**
 * Validate and parse billing assist response
 */
export function parseBillingResponse(response: unknown): BillingAssistOutput {
  return BillingAssistOutputSchema.parse(response)
}

/**
 * Safe parse with error handling
 */
export function safeParseBillingResponse(response: unknown): {
  success: boolean
  data?: BillingAssistOutput
  error?: string
} {
  const result = BillingAssistOutputSchema.safeParse(response)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error.message }
}
