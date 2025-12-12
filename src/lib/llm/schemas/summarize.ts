/**
 * Summarize Output Schema
 * Defines the structure for clinical summarization responses
 */

import { z } from 'zod'

export const ClinicalSummarySchema = z.object({
  patientOverview: z.object({
    demographics: z.string().describe('Age, gender, relevant social history'),
    chiefComplaint: z.string().describe('Primary reason for admission/visit'),
    admissionDate: z.string().optional(),
    lengthOfStay: z.string().optional(),
  }),
  
  hospitalCourse: z.string().describe('Brief narrative of hospital course'),
  
  keyFindings: z.array(z.object({
    category: z.enum(['diagnosis', 'lab', 'imaging', 'procedure', 'consult']),
    finding: z.string(),
    significance: z.enum(['critical', 'significant', 'routine']),
    date: z.string().optional(),
  })),
  
  activeDiagnoses: z.array(z.object({
    diagnosis: z.string(),
    icd10: z.string().optional(),
    status: z.enum(['active', 'resolving', 'resolved']),
    notes: z.string().optional(),
  })),
  
  currentMedications: z.array(z.object({
    medication: z.string(),
    dose: z.string(),
    frequency: z.string(),
    indication: z.string().optional(),
    isNew: z.boolean().describe('Started during this admission'),
  })),
  
  pendingItems: z.array(z.object({
    item: z.string(),
    type: z.enum(['test', 'consult', 'procedure', 'followup']),
    status: z.string(),
    expectedDate: z.string().optional(),
  })),
  
  clinicalStatus: z.object({
    stability: z.enum(['stable', 'improving', 'worsening', 'critical']),
    oxygenRequirement: z.string(),
    mobilityStatus: z.string(),
    dietStatus: z.string(),
    ivAccess: z.boolean(),
  }),
  
  briefSummary: z.string().describe('2-3 sentence executive summary'),
  
  generatedAt: z.string(),
  disclaimer: z.string(),
})

export type ClinicalSummary = z.infer<typeof ClinicalSummarySchema>

export const HandoffSummarySchema = z.object({
  patient: z.object({
    name: z.string(),
    age: z.string(),
    room: z.string(),
    primaryTeam: z.string().optional(),
  }),
  
  oneLiner: z.string().describe('Brief one-line patient summary'),
  
  activeIssues: z.array(z.object({
    issue: z.string(),
    plan: z.string(),
    overnight: z.string().describe('What to watch for overnight'),
  })),
  
  codeStatus: z.string(),
  allergies: z.array(z.string()),
  
  criticalValues: z.array(z.object({
    lab: z.string(),
    value: z.string(),
    trend: z.enum(['improving', 'stable', 'worsening']),
  })),
  
  anticipatedEvents: z.array(z.string()).describe('Things likely to happen overnight'),
  
  ifThenStatements: z.array(z.object({
    condition: z.string(),
    action: z.string(),
  })).describe('Contingency plans'),
  
  contactInfo: z.object({
    primaryProvider: z.string().optional(),
    consultants: z.array(z.string()),
  }),
  
  generatedAt: z.string(),
})

export type HandoffSummary = z.infer<typeof HandoffSummarySchema>

export const SummarizeOutputSchema = z.object({
  summaryType: z.enum(['clinical', 'handoff', 'discharge', 'brief']),
  clinicalSummary: ClinicalSummarySchema.optional(),
  handoffSummary: HandoffSummarySchema.optional(),
  briefSummary: z.string().optional(),
  disclaimer: z.string(),
})

export type SummarizeOutput = z.infer<typeof SummarizeOutputSchema>
