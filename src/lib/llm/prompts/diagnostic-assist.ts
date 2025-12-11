/**
 * Diagnostic Assist Prompts
 */

export const DIAGNOSTIC_ASSIST_SYSTEM_PROMPT = `You are a clinical decision support assistant helping physicians analyze patient data to identify potential diagnoses and conditions.

CRITICAL RULES:
1. You are a DECISION SUPPORT tool only. You do not make diagnoses - you suggest possibilities for physician review.
2. Always cite specific evidence from the provided clinical data for every suggestion.
3. Be conservative - if evidence is weak, say so. Prefer "possible" or "consider" language.
4. Never suggest diagnoses without supporting evidence in the data.
5. Always include differential diagnoses and alternative explanations.
6. Flag any critical or urgent findings prominently.
7. Include appropriate caveats and limitations.

OUTPUT FORMAT:
Return a JSON object with the following structure:
{
  "suggestions": [
    {
      "condition": "Condition name",
      "icd10Code": "ICD-10 code",
      "confidence": "high|moderate|low",
      "rationale": "Clinical reasoning",
      "supportingEvidence": [
        {
          "type": "lab|vital|imaging|note|medication|procedure",
          "description": "Description of the evidence"
        }
      ],
      "differentialConsiderations": ["Alternative diagnoses to consider"],
      "suggestedWorkup": ["Additional tests or evaluations if needed"]
    }
  ],
  "clinicalContext": "Summary of relevant clinical context",
  "limitations": ["Limitations of this analysis"],
  "disclaimer": "This is decision support only. Clinical judgment required."
}

EVIDENCE QUALITY:
- High confidence: Multiple concordant findings, classic presentation
- Moderate confidence: Some supporting evidence, but incomplete picture
- Low confidence: Limited evidence, should be considered but needs workup`

export interface DiagnosticContext {
  patient: {
    age: number | null
    gender: string
  }
  encounter: {
    reasonCode?: string
  }
  conditions: Array<{ display: string }>
  recentVitals: Array<{ name: string; value: string }>
  recentLabs: Array<{ name: string; value: string; flag?: string }>
  medications: Array<{ name: string }>
  imagingStudies: Array<{ description: string; conclusion?: string }>
  procedures: Array<{ name: string }>
}

export function buildDiagnosticAssistUserPrompt(
  selectedText: string,
  context: DiagnosticContext
): string {
  const vitalsText = context.recentVitals
    .map(v => `- ${v.name}: ${v.value}`)
    .join('\n') || 'None available'

  const labsText = context.recentLabs
    .map(l => `- ${l.name}: ${l.value}${l.flag ? ` (${l.flag})` : ''}`)
    .join('\n') || 'None available'

  const conditionsText = context.conditions
    .map(c => `- ${c.display}`)
    .join('\n') || 'None documented'

  const medsText = context.medications
    .map(m => `- ${m.name}`)
    .join('\n') || 'None documented'

  const imagingText = context.imagingStudies
    .map(i => `- ${i.description}: ${i.conclusion || 'See report'}`)
    .join('\n') || 'None available'

  const proceduresText = context.procedures
    .map(p => `- ${p.name}`)
    .join('\n') || 'None documented'

  return `The physician has selected the following text from a clinical note and is asking for diagnostic suggestions:

SELECTED TEXT:
"${selectedText}"

PATIENT CONTEXT:
- Age: ${context.patient.age ?? 'Unknown'}
- Sex: ${context.patient.gender || 'Unknown'}
- Chief Complaint: ${context.encounter.reasonCode || 'Not specified'}

ACTIVE PROBLEMS:
${conditionsText}

RECENT VITALS:
${vitalsText}

RECENT LABS:
${labsText}

CURRENT MEDICATIONS:
${medsText}

RECENT IMAGING:
${imagingText}

RECENT PROCEDURES:
${proceduresText}

Please analyze this clinical context and provide diagnostic suggestions based on the selected text and supporting data.`
}
