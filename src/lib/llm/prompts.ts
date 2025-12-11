// Diagnostic Assist Prompts
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
Return a JSON object with suggestions array, clinicalContext, limitations, and disclaimer.

EVIDENCE QUALITY:
- High confidence: Multiple concordant findings, classic presentation
- Moderate confidence: Some supporting evidence, but incomplete picture
- Low confidence: Limited evidence, should be considered but needs workup`

// Discharge Readiness Prompts
export const DISCHARGE_READINESS_SYSTEM_PROMPT = `You are a discharge planning assistant helping clinical teams assess whether patients are ready for discharge.

CRITICAL RULES:
1. Be CONSERVATIVE. If in doubt, recommend NOT_READY or READY_SOON rather than READY_TODAY.
2. Patient safety is paramount. Never rush discharge if clinical stability is questionable.
3. Distinguish between clinical readiness, workup completeness, and social/logistical factors.
4. All recommendations require evidence from the provided data.
5. Never generate orders or prescriptions. Only provide recommendations.
6. Flag any safety concerns prominently.

READINESS CRITERIA:
READY_TODAY: Vitals stable 24+ hours, labs stable/improving, no pending critical tests, consults completed, disposition confirmed
READY_SOON: Most criteria met but 1-2 items pending
NOT_READY: Active instability, critical tests pending, unresolved acute issues

OUTPUT: Return JSON matching the DischargeReadinessOutput schema exactly.`

// Morning Triage Prompts
export const MORNING_TRIAGE_SYSTEM_PROMPT = `You are an inpatient triage assistant helping physicians prioritize their morning rounds.

CRITICAL RULES:
1. Patient safety is the top priority. Flag deteriorating patients prominently.
2. Be conservative with risk assessments - when in doubt, rate higher risk.
3. Base all assessments on objective data provided.
4. Quick wins should be low-risk, high-value actions only.
5. Never suggest actions that require direct physician orders.

RISK LEVELS:
- Critical: Immediate attention needed, unstable vitals, critical labs
- High: Significant concerns, needs early review
- Moderate: Stable but needs attention today
- Low: Stable, routine care

OUTPUT: Return JSON matching the MorningTriageOutput schema exactly.`

// Discharge Materials Prompts
export const DISCHARGE_MATERIALS_SYSTEM_PROMPT = `You are a patient education specialist creating discharge instructions and handouts.

CRITICAL RULES:
1. Patient-facing materials must be written at a 6th-8th grade reading level.
2. Use simple, clear language. Avoid medical jargon or explain it.
3. Be specific and actionable. Tell patients exactly what to do.
4. Warning signs must be clear - patients should know exactly when to seek care.
5. Never make absolute promises about outcomes. Use conditional language.
6. Medication instructions must be precise and easy to follow.

WRITING GUIDELINES:
- Short sentences (under 20 words)
- Active voice
- Bullet points for lists
- Numbers instead of words for dosages
- Specific times instead of "three times daily"

OUTPUT: Return JSON matching the DischargeMaterialsOutput schema exactly.`

// Helper to build user prompts
export function buildDiagnosticAssistPrompt(
  selectedText: string,
  context: {
    patient: { age?: number; gender?: string }
    conditions: Array<{ display?: string }>
    vitals: Array<{ name?: string; value?: string }>
    labs: Array<{ name?: string; value?: string; flag?: string }>
    medications: Array<{ name?: string }>
  }
): string {
  return `Analyze this clinical text and suggest possible diagnoses:

SELECTED TEXT:
"${selectedText}"

PATIENT: ${context.patient.age || 'Unknown'} year old ${context.patient.gender || 'patient'}

ACTIVE PROBLEMS:
${context.conditions.map((c) => `- ${c.display}`).join('\n') || 'None listed'}

RECENT VITALS:
${context.vitals.map((v) => `- ${v.name}: ${v.value}`).join('\n') || 'None available'}

RECENT LABS:
${context.labs.map((l) => `- ${l.name}: ${l.value} ${l.flag || ''}`).join('\n') || 'None available'}

CURRENT MEDICATIONS:
${context.medications.map((m) => `- ${m.name}`).join('\n') || 'None listed'}

Provide diagnostic suggestions with evidence and rationale.`
}

export function buildDischargeReadinessPrompt(snapshot: {
  patient: { name?: string; age?: number }
  encounter: { admitDate?: string; attending?: string }
  conditions: Array<{ name?: string; status?: string }>
  clinicalStability: {
    vitalsStable: boolean
    labsTrending: string
    oxygenRequirement: string
    onIVMedications: boolean
  }
  workupCompleteness: {
    pendingTestCount: number
    pendingTests: Array<{ name: string }>
    openConsultCount: number
    openConsults: Array<{ specialty: string }>
  }
  medications: Array<{ name?: string }>
  appointments: Array<{ type?: string; date?: string }>
}): string {
  return `Assess discharge readiness for this patient:

PATIENT: ${snapshot.patient.name || 'Unknown'}, ${snapshot.patient.age || 'Unknown'} years old
ADMISSION: ${snapshot.encounter.admitDate || 'Unknown'}
ATTENDING: ${snapshot.encounter.attending || 'Not specified'}

DIAGNOSES:
${snapshot.conditions.map((c) => `- ${c.name} (${c.status || 'active'})`).join('\n')}

CLINICAL STABILITY:
- Vitals Stable: ${snapshot.clinicalStability.vitalsStable}
- Labs Trending: ${snapshot.clinicalStability.labsTrending}
- Oxygen: ${snapshot.clinicalStability.oxygenRequirement}
- On IV Meds: ${snapshot.clinicalStability.onIVMedications}

WORKUP STATUS:
- Pending Tests (${snapshot.workupCompleteness.pendingTestCount}): ${snapshot.workupCompleteness.pendingTests.map((t) => t.name).join(', ') || 'None'}
- Open Consults (${snapshot.workupCompleteness.openConsultCount}): ${snapshot.workupCompleteness.openConsults.map((c) => c.specialty).join(', ') || 'None'}

MEDICATIONS:
${snapshot.medications.map((m) => `- ${m.name}`).join('\n') || 'None listed'}

SCHEDULED APPOINTMENTS:
${snapshot.appointments.map((a) => `- ${a.type} on ${a.date}`).join('\n') || 'None scheduled'}

Provide a comprehensive discharge readiness assessment.`
}

export function buildMorningTriagePrompt(
  patients: Array<{
    id: string
    name: string
    location: string
    diagnoses: string[]
    vitals: Array<{ name: string; value: string; abnormal?: boolean }>
    labs: Array<{ name: string; value: string; flag?: string }>
    medications: string[]
  }>
): string {
  const patientSummaries = patients
    .map(
      (p) => `
PATIENT: ${p.name} (${p.id})
Location: ${p.location}
Diagnoses: ${p.diagnoses.join(', ')}
Vitals: ${p.vitals.map((v) => `${v.name}: ${v.value}${v.abnormal ? ' (!)' : ''}`).join(', ')}
Labs: ${p.labs.map((l) => `${l.name}: ${l.value} ${l.flag || ''}`).join(', ')}
Medications: ${p.medications.join(', ')}`
    )
    .join('\n---\n')

  return `Review these inpatients and prioritize for morning rounds:

${patientSummaries}

For each patient:
1. Assess risk level (critical/high/moderate/low)
2. Identify key risk factors and trends
3. Suggest conservative quick wins
4. Note any overnight changes requiring attention

Prioritize by risk level and provide rationale.`
}
