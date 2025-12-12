/**
 * Summarize System Prompts
 * Prompts for clinical summarization features
 */

export const CLINICAL_SUMMARY_SYSTEM_PROMPT = `You are a clinical documentation assistant helping physicians create accurate, concise patient summaries.

CRITICAL RULES:
1. Only include information present in the provided clinical data.
2. Never fabricate or assume clinical details not explicitly stated.
3. Use professional medical terminology appropriate for physician-to-physician communication.
4. Highlight critical findings and abnormal values prominently.
5. Organize information in standard clinical summary format.
6. Include relevant dates and trends where available.
7. Flag any gaps or missing information that may be clinically important.

SUMMARY STRUCTURE:
- Patient Overview: Demographics, chief complaint, admission context
- Hospital Course: Narrative of events during hospitalization
- Key Findings: Important labs, imaging, procedures organized by significance
- Active Diagnoses: Current problem list with status
- Medications: Current medications with doses and indications
- Pending Items: Outstanding tests, consults, or procedures
- Clinical Status: Current stability assessment

OUTPUT FORMAT:
Return a JSON object matching the provided schema exactly. Ensure all required fields are populated.`

export const HANDOFF_SUMMARY_SYSTEM_PROMPT = `You are a clinical handoff assistant helping create safe, structured patient handoffs for overnight coverage.

CRITICAL RULES:
1. Prioritize patient safety - highlight urgent issues first.
2. Be concise but complete - overnight providers have limited time.
3. Include specific "if-then" contingencies for anticipated problems.
4. Always include code status and allergies.
5. Highlight critical lab values and their trends.
6. Focus on actionable information.
7. Never omit safety-critical details for brevity.

HANDOFF FORMAT (I-PASS structure):
- Illness severity: How sick is the patient?
- Patient summary: One-liner about the patient
- Action list: What needs to be done overnight
- Situation awareness: What to watch for
- Synthesis: Contingency plans

OUTPUT FORMAT:
Return a JSON object with structured handoff information matching the schema.`

export function buildClinicalSummaryUserPrompt(context: {
  patient: any
  encounter: any
  conditions: any[]
  observations: any[]
  medications: any[]
  diagnosticReports: any[]
  procedures: any[]
  notes: any[]
}): string {
  return `Generate a comprehensive clinical summary for this patient:

PATIENT:
- Name: ${context.patient.name?.[0]?.given?.join(' ')} ${context.patient.name?.[0]?.family}
- DOB: ${context.patient.birthDate || 'Unknown'}
- Gender: ${context.patient.gender || 'Unknown'}
- MRN: ${context.patient.identifier?.[0]?.value || 'Unknown'}

CURRENT ENCOUNTER:
- Admission Date: ${context.encounter?.period?.start || 'Unknown'}
- Reason: ${context.encounter?.reasonCode?.[0]?.text || 'Not specified'}
- Location: ${context.encounter?.location?.[0]?.location?.display || 'Unknown'}
- Attending: ${context.encounter?.participant?.[0]?.individual?.display || 'Not specified'}

ACTIVE CONDITIONS:
${context.conditions.map(c => `- ${c.code?.text || c.code?.coding?.[0]?.display || 'Unknown'} (${c.clinicalStatus?.coding?.[0]?.code || 'active'})`).join('\n') || 'None documented'}

RECENT OBSERVATIONS (Vitals/Labs):
${formatObservations(context.observations)}

CURRENT MEDICATIONS:
${context.medications.map(m => `- ${m.medicationCodeableConcept?.text || m.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown'}: ${m.dosageInstruction?.[0]?.text || ''}`).join('\n') || 'None documented'}

DIAGNOSTIC REPORTS:
${context.diagnosticReports.map(r => `- ${r.code?.text || r.code?.coding?.[0]?.display || 'Unknown'} (${r.status}): ${r.conclusion || 'See report'}`).join('\n') || 'None'}

PROCEDURES:
${context.procedures.map(p => `- ${p.code?.text || p.code?.coding?.[0]?.display || 'Unknown'} on ${p.performedDateTime || p.performedPeriod?.start || 'Unknown date'}`).join('\n') || 'None'}

RECENT NOTES:
${context.notes.slice(0, 3).map(n => `- ${n.type?.text || 'Note'} (${n.date || 'Unknown date'})`).join('\n') || 'None'}

Please generate a comprehensive clinical summary based on this data.`
}

export function buildHandoffSummaryUserPrompt(context: {
  patient: any
  encounter: any
  conditions: any[]
  observations: any[]
  medications: any[]
  pendingTests: any[]
  activeTasks: any[]
}): string {
  return `Generate a structured handoff summary for overnight coverage:

PATIENT:
- Name: ${context.patient.name?.[0]?.given?.join(' ')} ${context.patient.name?.[0]?.family}
- Age: ${calculateAge(context.patient.birthDate)}
- Room: ${context.encounter?.location?.[0]?.location?.display || 'Unknown'}
- Primary Team: ${context.encounter?.participant?.[0]?.individual?.display || 'Unknown'}

ADMISSION REASON:
${context.encounter?.reasonCode?.[0]?.text || 'Not specified'}

ACTIVE PROBLEMS:
${context.conditions.map(c => `- ${c.code?.text || c.code?.coding?.[0]?.display}`).join('\n') || 'None'}

RECENT VITALS:
${formatRecentVitals(context.observations)}

CRITICAL LABS:
${formatCriticalLabs(context.observations)}

CURRENT MEDICATIONS:
${context.medications.map(m => `- ${m.medicationCodeableConcept?.text || 'Unknown'}`).join('\n') || 'None'}

PENDING TESTS/CONSULTS:
${context.pendingTests.map(t => `- ${t.code?.text || 'Unknown test'} (${t.status})`).join('\n') || 'None pending'}

ACTIVE TASKS:
${context.activeTasks.map(t => `- ${t.code?.text || t.description || 'Task'} (${t.status})`).join('\n') || 'None'}

Please generate a structured handoff summary suitable for overnight coverage.`
}

function formatObservations(observations: any[]): string {
  const vitals: Record<string, string> = {}
  const labs: Record<string, string> = {}
  
  for (const obs of observations.slice(0, 50)) {
    const name = obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown'
    const value = obs.valueQuantity?.value ?? obs.valueString ?? 'N/A'
    const unit = obs.valueQuantity?.unit || ''
    const category = obs.category?.[0]?.coding?.[0]?.code
    
    if (category === 'vital-signs' && !vitals[name]) {
      vitals[name] = `${value} ${unit}`
    } else if (category === 'laboratory' && !labs[name]) {
      const flag = obs.interpretation?.[0]?.coding?.[0]?.code || ''
      labs[name] = `${value} ${unit} ${flag ? `(${flag})` : ''}`
    }
  }
  
  let result = 'Vitals:\n'
  result += Object.entries(vitals).map(([k, v]) => `  - ${k}: ${v}`).join('\n') || '  None'
  result += '\n\nLabs:\n'
  result += Object.entries(labs).slice(0, 15).map(([k, v]) => `  - ${k}: ${v}`).join('\n') || '  None'
  
  return result
}

function formatRecentVitals(observations: any[]): string {
  const vitals = observations
    .filter(o => o.category?.[0]?.coding?.[0]?.code === 'vital-signs')
    .slice(0, 10)
  
  const latest: Record<string, string> = {}
  for (const v of vitals) {
    const name = v.code?.text || v.code?.coding?.[0]?.display || 'Unknown'
    if (!latest[name]) {
      latest[name] = `${v.valueQuantity?.value ?? 'N/A'} ${v.valueQuantity?.unit || ''}`
    }
  }
  
  return Object.entries(latest).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None available'
}

function formatCriticalLabs(observations: any[]): string {
  const criticalLabs = observations
    .filter(o => {
      const category = o.category?.[0]?.coding?.[0]?.code
      const interpretation = o.interpretation?.[0]?.coding?.[0]?.code
      return category === 'laboratory' && (interpretation === 'H' || interpretation === 'L' || interpretation === 'A')
    })
    .slice(0, 10)
  
  if (criticalLabs.length === 0) return 'No critical values'
  
  return criticalLabs.map(l => {
    const name = l.code?.text || l.code?.coding?.[0]?.display || 'Unknown'
    const value = l.valueQuantity?.value ?? l.valueString ?? 'N/A'
    const unit = l.valueQuantity?.unit || ''
    const flag = l.interpretation?.[0]?.coding?.[0]?.code || ''
    return `- ${name}: ${value} ${unit} (${flag})`
  }).join('\n')
}

function calculateAge(birthDate: string | undefined): string {
  if (!birthDate) return 'Unknown'
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age} years`
}
