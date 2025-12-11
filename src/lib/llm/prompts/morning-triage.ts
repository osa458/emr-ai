/**
 * Morning Triage Prompts
 */

export const MORNING_TRIAGE_SYSTEM_PROMPT = `You are a clinical triage assistant helping physicians prioritize their inpatient list for morning rounds. Your goal is to identify patients who need immediate attention and highlight actionable "quick wins."

CRITICAL RULES:
1. Patient safety is the top priority.
2. Highlight any critical or deteriorating patients prominently.
3. Identify concrete, actionable tasks (quick wins).
4. Consider overnight changes and trends.
5. Be specific about risk factors and time-sensitivity.

RISK LEVELS:
- Critical: Immediate attention required, unstable
- High: Significant concerns, early review needed
- Moderate: Standard monitoring, routine review
- Low: Stable, progressing well

QUICK WIN CRITERIA:
- Can be completed in less than 15 minutes
- Clear clinical benefit
- No complex decision-making required
- Examples: discontinue unnecessary meds, order routine labs, update code status

OUTPUT FORMAT:
Return JSON with the exact schema provided. Prioritize patients by risk level (critical first).`

export interface PatientTriageData {
  patientId: string
  patientName: string
  location: string
  admitDate: string
  diagnosis: string
  recentVitals: Array<{ name: string; value: string; trend?: string }>
  recentLabs: Array<{ name: string; value: string; flag?: string; trend?: string }>
  medications: Array<{ name: string; isNew?: boolean }>
  overnightEvents: string[]
  pendingTests: string[]
  openConsults: string[]
}

export interface MorningSnapshotData {
  generatedAt: string
  patients: PatientTriageData[]
}

export function buildMorningTriageUserPrompt(snapshot: MorningSnapshotData): string {
  const patientsText = snapshot.patients.map((p, idx) => {
    const vitalsText = p.recentVitals
      .map(v => `    - ${v.name}: ${v.value}${v.trend ? ` (${v.trend})` : ''}`)
      .join('\n') || '    None'

    const labsText = p.recentLabs
      .map(l => `    - ${l.name}: ${l.value}${l.flag ? ` [${l.flag}]` : ''}${l.trend ? ` (${l.trend})` : ''}`)
      .join('\n') || '    None'

    const medsText = p.medications
      .map(m => `    - ${m.name}${m.isNew ? ' [NEW]' : ''}`)
      .join('\n') || '    None'

    const eventsText = p.overnightEvents.length > 0
      ? p.overnightEvents.map(e => `    - ${e}`).join('\n')
      : '    None'

    const pendingText = p.pendingTests.length > 0
      ? p.pendingTests.map(t => `    - ${t}`).join('\n')
      : '    None'

    const consultsText = p.openConsults.length > 0
      ? p.openConsults.map(c => `    - ${c}`).join('\n')
      : '    None'

    return `
PATIENT ${idx + 1}: ${p.patientName}
  Location: ${p.location}
  Admitted: ${p.admitDate}
  Primary Diagnosis: ${p.diagnosis}
  
  Recent Vitals:
${vitalsText}
  
  Recent Labs:
${labsText}
  
  Current Medications:
${medsText}
  
  Overnight Events:
${eventsText}
  
  Pending Tests:
${pendingText}
  
  Open Consults:
${consultsText}`
  }).join('\n\n---\n')

  return `Please prioritize and assess risk for the following ${snapshot.patients.length} inpatients:

Generated At: ${snapshot.generatedAt}

${patientsText}

For each patient, provide:
1. Risk level (critical/high/moderate/low)
2. Risk score (0-100)
3. Key risk factors
4. Deterioration risk assessment
5. Quick wins (actionable tasks)
6. Key overnight updates to be aware of

Prioritize patients from highest to lowest risk.`
}
