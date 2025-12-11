/**
 * Discharge Readiness Prompts
 */

export const DISCHARGE_READINESS_SYSTEM_PROMPT = `You are a discharge planning assistant helping clinical teams assess whether patients are ready for discharge.

CRITICAL RULES:
1. Be CONSERVATIVE. If in doubt, recommend NOT_READY or READY_SOON rather than READY_TODAY.
2. Patient safety is paramount. Never rush discharge if clinical stability is questionable.
3. Distinguish between:
   - Clinical readiness (medical stability)
   - Workup completeness (pending tests/consults)
   - Social/logistical factors (placement, support, transportation)
4. All recommendations require evidence from the provided data.
5. Never generate orders or prescriptions. Only provide recommendations.
6. Flag any safety concerns prominently.

READINESS CRITERIA:
READY_TODAY:
- Vitals stable for 24+ hours
- Labs stable or improving
- No pending critical tests
- Consults completed or have clear follow-up plans
- Discharge disposition confirmed
- Medications reconciled
- Patient/family educated

READY_SOON (likely 1-2 days):
- Most criteria met but 1-2 items pending
- Waiting on non-urgent test results
- Minor clinical issues being finalized

NOT_READY:
- Active clinical instability
- Critical tests pending
- Unresolved acute issues
- Major barriers to safe discharge

OUTPUT FORMAT:
Return JSON with exact schema provided. Ensure all arrays and objects are properly structured.`

export interface DischargeSnapshotData {
  patient: {
    name: string
    birthDate?: string
  }
  encounter: {
    start?: string
    attendingName?: string
  }
  conditions: Array<{ name: string; status: string }>
  clinicalStability: {
    vitalsStable: boolean
    vitalsDetails: string[]
    labsTrending: string
    oxygenRequirement: string
    onIVMedications: boolean
    highRiskMedications: string[]
  }
  workupCompleteness: {
    pendingTestCount: number
    pendingTests: Array<{ name: string; orderedDate: string }>
    openConsultCount: number
    openConsults: Array<{ specialty: string; requestedDate: string }>
  }
  currentMedications: Array<{ name: string }>
  scheduledAppointments: Array<{ type: string; date: string }>
}

export function buildDischargeReadinessUserPrompt(snapshot: DischargeSnapshotData): string {
  const age = snapshot.patient.birthDate ? calculateAge(snapshot.patient.birthDate) : 'Unknown'
  
  const diagnosesText = snapshot.conditions
    .map(c => `- ${c.name} (${c.status})`)
    .join('\n') || 'None documented'

  const pendingTestsText = snapshot.workupCompleteness.pendingTests
    .map(t => `  - ${t.name} (ordered ${t.orderedDate})`)
    .join('\n') || '  None'

  const openConsultsText = snapshot.workupCompleteness.openConsults
    .map(c => `  - ${c.specialty} (requested ${c.requestedDate})`)
    .join('\n') || '  None'

  const medsText = snapshot.currentMedications
    .map(m => `- ${m.name}`)
    .join('\n') || 'None documented'

  const appointmentsText = snapshot.scheduledAppointments
    .map(a => `- ${a.type} on ${a.date}`)
    .join('\n') || 'None scheduled'

  return `Assess discharge readiness for this patient:

PATIENT: ${snapshot.patient.name}
AGE: ${age}
ADMISSION DATE: ${snapshot.encounter.start || 'Unknown'}
ATTENDING: ${snapshot.encounter.attendingName || 'Not specified'}

DIAGNOSES:
${diagnosesText}

CLINICAL STABILITY:
- Vitals Stable: ${snapshot.clinicalStability.vitalsStable}
- Details: ${snapshot.clinicalStability.vitalsDetails.join('; ') || 'None'}
- Labs Trending: ${snapshot.clinicalStability.labsTrending}
- Oxygen: ${snapshot.clinicalStability.oxygenRequirement}
- On IV Meds: ${snapshot.clinicalStability.onIVMedications}
- High-Risk Meds: ${snapshot.clinicalStability.highRiskMedications.join(', ') || 'None'}

WORKUP STATUS:
- Pending Tests (${snapshot.workupCompleteness.pendingTestCount}):
${pendingTestsText}
- Open Consults (${snapshot.workupCompleteness.openConsultCount}):
${openConsultsText}

CURRENT MEDICATIONS:
${medsText}

SCHEDULED FOLLOW-UP APPOINTMENTS:
${appointmentsText}

Please provide a comprehensive discharge readiness assessment.`
}

function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age} years`
}
