import { z } from 'zod'

// Diagnostic Assist Output
export const DiagnosticSuggestionSchema = z.object({
  condition: z.string(),
  icd10Code: z.string(),
  confidence: z.enum(['high', 'moderate', 'low']),
  rationale: z.string(),
  supportingEvidence: z.array(
    z.object({
      type: z.enum(['lab', 'vital', 'imaging', 'note', 'medication', 'procedure']),
      description: z.string(),
      fhirReference: z.string().optional(),
    })
  ),
  differentialConsiderations: z.array(z.string()).optional(),
  suggestedWorkup: z.array(z.string()).optional(),
})

export const DiagnosticAssistOutputSchema = z.object({
  suggestions: z.array(DiagnosticSuggestionSchema),
  clinicalContext: z.string(),
  limitations: z.array(z.string()),
  disclaimer: z.string(),
})

export type DiagnosticAssistOutput = z.infer<typeof DiagnosticAssistOutputSchema>

// Billing Assist Output
export const BillingCodeSuggestionSchema = z.object({
  codeType: z.enum(['ICD-10', 'CPT', 'HCPCS']),
  code: z.string(),
  description: z.string(),
  category: z
    .enum(['principal_diagnosis', 'secondary_diagnosis', 'cc', 'mcc', 'procedure'])
    .optional(),
  evidence: z.array(
    z.object({
      source: z.string(),
      quote: z.string().optional(),
      fhirReference: z.string().optional(),
    })
  ),
  documentationTip: z.string().optional(),
  complianceNotes: z.string().optional(),
})

export const BillingAssistOutputSchema = z.object({
  suggestedCodes: z.array(BillingCodeSuggestionSchema),
  missingDocumentation: z.array(
    z.object({
      codeAtRisk: z.string(),
      whatIsMissing: z.string(),
      suggestedAddition: z.string(),
    })
  ),
  cmiImpact: z
    .object({
      currentEstimate: z.string(),
      potentialWithSuggestions: z.string(),
      explanation: z.string(),
    })
    .optional(),
  complianceWarnings: z.array(z.string()),
  disclaimer: z.string(),
})

export type BillingAssistOutput = z.infer<typeof BillingAssistOutputSchema>

// Morning Triage Output
export const PatientTriageSchema = z.object({
  patientId: z.string(),
  patientName: z.string(),
  location: z.string(),
  riskLevel: z.enum(['critical', 'high', 'moderate', 'low']),
  riskScore: z.number().min(0).max(100),
  priorityRank: z.number(),
  riskFactors: z.array(
    z.object({
      factor: z.string(),
      severity: z.enum(['critical', 'high', 'moderate']),
      details: z.string(),
      trend: z.enum(['worsening', 'stable', 'improving']).optional(),
    })
  ),
  deteriorationRisk: z.object({
    level: z.enum(['high', 'moderate', 'low']),
    indicators: z.array(z.string()),
    timeframe: z.string().optional(),
  }),
  quickWins: z.array(
    z.object({
      action: z.string(),
      rationale: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      timeToComplete: z.string(),
    })
  ),
  keyUpdates: z.array(z.string()),
})

export const MorningTriageOutputSchema = z.object({
  generatedAt: z.string(),
  totalPatients: z.number(),
  criticalCount: z.number(),
  highRiskCount: z.number(),
  patients: z.array(PatientTriageSchema),
  systemAlerts: z.array(
    z.object({
      type: z.enum(['critical_lab', 'vital_alert', 'medication_issue', 'other']),
      message: z.string(),
      patientId: z.string(),
    })
  ),
  disclaimer: z.string(),
})

export type MorningTriageOutput = z.infer<typeof MorningTriageOutputSchema>

// Discharge Readiness Output
export const BlockingFactorSchema = z.object({
  factor: z.string(),
  category: z.enum(['clinical', 'workup', 'social', 'logistical']),
  details: z.string(),
  estimatedResolutionTime: z.string().optional(),
  responsibleParty: z.string().optional(),
})

export const FollowupNeedSchema = z.object({
  specialty: z.string(),
  timeframe: z.enum([
    'within_48_hours',
    'within_1_week',
    'within_2_weeks',
    'within_1_month',
    'prn',
  ]),
  reason: z.string(),
  mode: z.enum(['in_person', 'telehealth', 'either']),
  priority: z.enum(['critical', 'important', 'routine']),
})

export const PendingTestSchema = z.object({
  testName: z.string(),
  orderedDate: z.string(),
  expectedResultDate: z.string().optional(),
  whyItMattersPatient: z.string(),
  whyItMattersClinician: z.string(),
  responsiblePhysicianRole: z.string(),
  criticalForDischarge: z.boolean(),
})

export const SafetyCheckSchema = z.object({
  item: z.string(),
  category: z.enum(['medication', 'equipment', 'education', 'followup', 'social']),
  completed: z.boolean(),
  notes: z.string().optional(),
})

export const DischargeReadinessOutputSchema = z.object({
  readinessLevel: z.enum(['READY_TODAY', 'READY_SOON', 'NOT_READY']),
  readinessScore: z.number().min(0).max(100),
  readinessReasons: z.array(z.string()),
  blockingFactors: z.array(BlockingFactorSchema),
  clinicalStatus: z.object({
    vitalsStable: z.boolean(),
    vitalsNotes: z.string(),
    labsAcceptable: z.boolean(),
    labsNotes: z.string(),
    symptomsControlled: z.boolean(),
    symptomsNotes: z.string(),
    oxygenRequirement: z.string(),
    mobilityStatus: z.string(),
  }),
  followupNeeds: z.array(FollowupNeedSchema),
  pendingTests: z.array(PendingTestSchema),
  safetyChecks: z.array(SafetyCheckSchema),
  estimatedDischargeDate: z.string().optional(),
  dischargeDisposition: z
    .enum([
      'home',
      'home_with_services',
      'skilled_nursing',
      'rehab',
      'long_term_care',
      'hospice',
      'other',
    ])
    .optional(),
  disclaimer: z.string(),
})

export type DischargeReadinessOutput = z.infer<typeof DischargeReadinessOutputSchema>

// Discharge Materials Output
export const DischargeMaterialsOutputSchema = z.object({
  patientInstructions: z.object({
    greeting: z.string(),
    hospitalSummary: z.string(),
    diagnosisExplanations: z.array(
      z.object({
        diagnosisName: z.string(),
        whatItMeans: z.string(),
        whatWeDid: z.string(),
        ongoingCare: z.string(),
      })
    ),
    homeExpectations: z.string(),
    activityRestrictions: z.array(z.string()),
    dietInstructions: z.string().optional(),
    warningSigns: z.object({
      callClinic: z.array(z.string()),
      goToUrgentCare: z.array(z.string()),
      callOrGoToER: z.array(z.string()),
    }),
    pendingTestsExplained: z.array(
      z.object({
        testName: z.string(),
        whatItChecks: z.string(),
        whenToExpectResults: z.string(),
        whoWillContact: z.string(),
      })
    ),
    emergencyContacts: z.object({
      clinicPhone: z.string(),
      afterHoursPhone: z.string(),
      nurseLinePhone: z.string().optional(),
    }),
  }),
  medicationSection: z.object({
    summary: z.string(),
    medications: z.array(
      z.object({
        medicationName: z.string(),
        status: z.enum(['new', 'changed', 'continued', 'stopped']),
        dosage: z.string(),
        frequency: z.string(),
        purpose: z.string(),
        specialInstructions: z.string().optional(),
        sideEffectsToWatch: z.array(z.string()).optional(),
      })
    ),
    generalMedicationTips: z.array(z.string()),
  }),
  followupPlan: z.object({
    summary: z.string(),
    appointments: z.array(
      z.object({
        providerType: z.string(),
        timeframe: z.string(),
        purpose: z.string(),
        whatToExpect: z.string(),
        questionsToAsk: z.array(z.string()).optional(),
      })
    ),
    pendingTestFollowup: z.array(
      z.object({
        testName: z.string(),
        responsibleProvider: z.string(),
        expectedTimeframe: z.string(),
      })
    ),
  }),
  clinicianSummary: z.object({
    briefHospitalCourse: z.string(),
    dischargeDiagnoses: z.array(z.string()),
    keyInterventions: z.array(z.string()),
    pendingItems: z.array(z.string()),
    followupNeeds: z.array(z.string()),
  }),
  readingLevel: z.string(),
  generatedAt: z.string(),
})

export type DischargeMaterialsOutput = z.infer<typeof DischargeMaterialsOutputSchema>

// Re-export individual types for components
export type BlockingFactor = z.infer<typeof BlockingFactorSchema>
export type FollowupNeed = z.infer<typeof FollowupNeedSchema>
export type PendingTest = z.infer<typeof PendingTestSchema>
export type SafetyCheck = z.infer<typeof SafetyCheckSchema>
export type PatientTriage = z.infer<typeof PatientTriageSchema>
