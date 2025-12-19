/**
 * Discharge Snapshot Query Helper
 * Comprehensive data gathering for discharge readiness assessment
 */

import type {
  Patient,
  Encounter,
  Condition,
  Observation,
  MedicationRequest,
  MedicationAdministration,
  Procedure,
  DiagnosticReport,
  Task,
  CarePlan,
  Appointment,
} from '@medplum/fhirtypes'

export interface DischargeSnapshot {
  patient: Patient
  encounter: Encounter
  conditions: Condition[]
  recentVitals: Observation[]
  recentLabs: Observation[]
  labTrends: LabTrend[]
  currentMedications: MedicationRequest[]
  ivMedications: MedicationAdministration[]
  procedures: Procedure[]
  pendingTests: DiagnosticReport[]
  completedTests: DiagnosticReport[]
  openConsults: Task[]
  completedConsults: Task[]
  carePlans: CarePlan[]
  scheduledAppointments: Appointment[]
  clinicalStability: ClinicalStabilityMarkers
  workupCompleteness: WorkupCompleteness
}

export interface LabTrend {
  labName: string
  loincCode: string
  values: Array<{ date: string; value: number; unit: string }>
  trend: 'improving' | 'stable' | 'worsening'
}

export interface ClinicalStabilityMarkers {
  vitalsStable: boolean
  vitalsDetails: string[]
  labsTrending: 'improving' | 'stable' | 'worsening'
  labDetails: string[]
  oxygenRequirement: string
  onIVMedications: boolean
  highRiskMedications: string[]
}

export interface WorkupCompleteness {
  pendingTestCount: number
  pendingTests: Array<{ name: string; orderedDate: string }>
  openConsultCount: number
  openConsults: Array<{ specialty: string; requestedDate: string }>
  allCriticalTestsComplete: boolean
}

/**
 * Fetches comprehensive discharge-related data for a patient encounter
 */
export async function getDischargeSnapshot(
  fhirClient: any,
  encounterId: string
): Promise<DischargeSnapshot> {
  // Get encounter and patient
  const encounter = await fhirClient.encounter.getById(encounterId)
  const patientId = encounter.subject?.reference?.split('/')[1]

  if (!patientId) {
    throw new Error('Encounter has no patient reference')
  }

  // Fetch all data in parallel
  const [
    patient,
    conditions,
    vitals,
    labs,
    medications,
    ivMeds,
    procedures,
    allDiagnosticReports,
    tasks,
    carePlans,
    appointments,
  ] = await Promise.all([
    fhirClient.patient.getById(patientId),
    fhirClient.condition?.getByEncounter?.(encounterId).catch(() => []) || [],
    fhirClient.observation?.getVitals?.(patientId, { _count: 100 }).catch(() => []) || [],
    fhirClient.observation?.getLabs?.(patientId, { _count: 200 }).catch(() => []) || [],
    fhirClient.medicationRequest?.getByEncounter?.(encounterId).catch(() => []) || [],
    fhirClient.medicationAdministration?.getByEncounter?.(encounterId).catch(() => []) || [],
    fhirClient.procedure?.getByEncounter?.(encounterId).catch(() => []) || [],
    fhirClient.diagnosticReport?.getByEncounter?.(encounterId).catch(() => []) || [],
    fhirClient.task?.getByEncounter?.(encounterId).catch(() => []) || [],
    fhirClient.carePlan?.getByEncounter?.(encounterId).catch(() => []) || [],
    fhirClient.appointment?.getByPatient?.(patientId).catch(() => []) || [],
  ])

  // Separate pending vs completed tests
  const pendingTests = (allDiagnosticReports || []).filter(
    (r: DiagnosticReport) => r.status === 'registered' || r.status === 'preliminary'
  )
  const completedTests = (allDiagnosticReports || []).filter(
    (r: DiagnosticReport) => r.status === 'final' || r.status === 'amended'
  )

  // Separate open vs completed consults
  const openConsults = (tasks || []).filter(
    (t: Task) => t.status === 'requested' || t.status === 'in-progress'
  )
  const completedConsults = (tasks || []).filter((t: Task) => t.status === 'completed')

  // Calculate stability markers
  const clinicalStability = calculateClinicalStability(
    vitals || [],
    labs || [],
    ivMeds || [],
    medications || []
  )

  // Calculate workup completeness
  const workupCompleteness = calculateWorkupCompleteness(pendingTests, openConsults)

  // Calculate lab trends
  const labTrends = calculateLabTrends(labs || [])

  return {
    patient,
    encounter,
    conditions: conditions || [],
    recentVitals: (vitals || []).slice(0, 50),
    recentLabs: (labs || []).slice(0, 50),
    labTrends,
    currentMedications: medications || [],
    ivMedications: ivMeds || [],
    procedures: procedures || [],
    pendingTests,
    completedTests,
    openConsults,
    completedConsults,
    carePlans: carePlans || [],
    scheduledAppointments: appointments || [],
    clinicalStability,
    workupCompleteness,
  }
}

function calculateClinicalStability(
  vitals: Observation[],
  labs: Observation[],
  ivMeds: MedicationAdministration[],
  medications: MedicationRequest[]
): ClinicalStabilityMarkers {
  const recentVitals = vitals.slice(0, 12)
  const vitalsDetails: string[] = []
  let vitalsStable = true

  // Check vital signs stability
  const hrValues = recentVitals
    .filter((v) => v.code?.coding?.some((c) => c.code === '8867-4'))
    .map((v) => v.valueQuantity?.value || 0)

  if (hrValues.length > 0) {
    const avgHR = hrValues.reduce((a, b) => a + b, 0) / hrValues.length
    if (avgHR > 100) {
      vitalsDetails.push('Tachycardia present')
      vitalsStable = false
    } else if (avgHR < 60) {
      vitalsDetails.push('Bradycardia present')
    }
  }

  // Check oxygen saturation
  const o2Values = recentVitals
    .filter((v) => v.code?.coding?.some((c) => c.code === '2708-6'))
    .map((v) => v.valueQuantity?.value || 0)

  let oxygenRequirement = 'Room air'
  if (o2Values.length > 0 && o2Values.some((v) => v < 94)) {
    oxygenRequirement = 'Supplemental oxygen'
    vitalsDetails.push('Requires supplemental O2')
  }

  // Check IV medications
  const activeIVMeds = ivMeds.filter((m) => m.status === 'in-progress')
  const onIVMedications = activeIVMeds.length > 0

  // Identify high-risk medications
  const highRiskKeywords = ['anticoagulant', 'insulin', 'opioid', 'vasopressor']
  const highRiskMedications = medications
    .filter((m) => {
      const name = (
        m.medicationCodeableConcept?.text ||
        m.medicationCodeableConcept?.coding?.[0]?.display ||
        ''
      ).toLowerCase()
      return highRiskKeywords.some((kw) => name.includes(kw))
    })
    .map(
      (m) =>
        m.medicationCodeableConcept?.text ||
        m.medicationCodeableConcept?.coding?.[0]?.display ||
        'Unknown'
    )

  // Determine lab trending by checking key labs
  let labsTrending: 'improving' | 'stable' | 'worsening' = 'stable'
  const labDetails: string[] = []
  
  // Check creatinine trend (kidney function)
  const creatinineValues = labs
    .filter((l) => l.code?.coding?.some((c) => c.code === '2160-0'))
    .slice(0, 3)
    .map((l) => l.valueQuantity?.value || 0)
  
  if (creatinineValues.length >= 2) {
    const crChange = creatinineValues[0] - creatinineValues[creatinineValues.length - 1]
    if (crChange > 0.3) {
      labDetails.push(`Creatinine improving: ${creatinineValues[creatinineValues.length - 1]} → ${creatinineValues[0]}`)
    } else if (crChange < -0.3) {
      labDetails.push(`Creatinine worsening: ${creatinineValues[creatinineValues.length - 1]} → ${creatinineValues[0]}`)
      labsTrending = 'worsening'
    }
  }
  
  // Check WBC trend (infection)
  const wbcValues = labs
    .filter((l) => l.code?.coding?.some((c) => c.code === '6690-2'))
    .slice(0, 3)
    .map((l) => l.valueQuantity?.value || 0)
  
  if (wbcValues.length >= 2) {
    const wbcChange = wbcValues[0] - wbcValues[wbcValues.length - 1]
    if (wbcValues[0] > 12 && wbcChange < 0) {
      labDetails.push(`WBC decreasing but still elevated: ${wbcValues[0]}`)
    } else if (wbcValues[0] > 15) {
      labDetails.push(`WBC significantly elevated: ${wbcValues[0]}`)
      labsTrending = 'worsening'
    }
  }
  
  // Check hemoglobin (anemia)
  const hgbValues = labs
    .filter((l) => l.code?.coding?.some((c) => c.code === '718-7'))
    .slice(0, 2)
    .map((l) => l.valueQuantity?.value || 0)
  
  if (hgbValues.length > 0 && hgbValues[0] < 8) {
    labDetails.push(`Hemoglobin critically low: ${hgbValues[0]} g/dL`)
    vitalsStable = false
  }
  
  if (labDetails.length === 0) {
    labDetails.push('Labs stable, no significant trends')
    labsTrending = 'stable'
  } else if (labsTrending !== 'worsening') {
    labsTrending = 'improving'
  }

  if (vitalsStable && vitalsDetails.length === 0) {
    vitalsDetails.push('Vitals within normal limits')
  }

  return {
    vitalsStable,
    vitalsDetails,
    labsTrending,
    labDetails,
    oxygenRequirement,
    onIVMedications,
    highRiskMedications,
  }
}

function calculateWorkupCompleteness(
  pendingTests: DiagnosticReport[],
  openConsults: Task[]
): WorkupCompleteness {
  return {
    pendingTestCount: pendingTests.length,
    pendingTests: pendingTests.map((t) => ({
      name: t.code?.text || t.code?.coding?.[0]?.display || 'Unknown test',
      orderedDate: t.issued || '',
    })),
    openConsultCount: openConsults.length,
    openConsults: openConsults.map((c) => ({
      specialty: c.code?.text || 'Unknown specialty',
      requestedDate: c.authoredOn || '',
    })),
    allCriticalTestsComplete: pendingTests.length === 0,
  }
}

// Labs where DECREASING is improving (e.g., creatinine, WBC, glucose)
const LABS_DECREASING_IS_GOOD = ['2160-0', '6690-2', '2345-7', '1988-5', '1920-8', '2823-3']
// Labs where INCREASING is improving (e.g., hemoglobin, platelets, albumin)
const LABS_INCREASING_IS_GOOD = ['718-7', '777-3', '1751-7']

function calculateLabTrends(labs: Observation[]): LabTrend[] {
  // Group labs by LOINC code
  const labGroups: Record<string, Observation[]> = {}

  labs.forEach((lab) => {
    const name = lab.code?.text || lab.code?.coding?.[0]?.display
    const code = lab.code?.coding?.[0]?.code
    if (name && code) {
      const key = `${code}:${name}`
      if (!labGroups[key]) {
        labGroups[key] = []
      }
      labGroups[key].push(lab)
    }
  })

  // Calculate trends for labs with multiple values
  const trends: LabTrend[] = []

  Object.entries(labGroups).forEach(([key, observations]) => {
    if (observations.length < 2) return

    const [code, name] = key.split(':')
    const values = observations
      .filter((o) => o.valueQuantity?.value !== undefined)
      .map((o) => ({
        date: o.effectiveDateTime || '',
        value: o.valueQuantity?.value || 0,
        unit: o.valueQuantity?.unit || '',
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (values.length < 2) return

    // Calculate trend based on lab type
    const firstValue = values[0].value
    const lastValue = values[values.length - 1].value
    const change = lastValue - firstValue
    const percentChange = firstValue !== 0 ? (change / firstValue) * 100 : 0

    let trend: 'improving' | 'stable' | 'worsening' = 'stable'
    
    if (Math.abs(percentChange) > 10) {
      if (LABS_DECREASING_IS_GOOD.includes(code)) {
        trend = change < 0 ? 'improving' : 'worsening'
      } else if (LABS_INCREASING_IS_GOOD.includes(code)) {
        trend = change > 0 ? 'improving' : 'worsening'
      } else {
        // Default: decreasing is improving
        trend = change < 0 ? 'improving' : 'worsening'
      }
    }

    trends.push({
      labName: name,
      loincCode: code,
      values,
      trend,
    })
  })

  // Sort by importance (worsening first, then improving, then stable)
  const trendOrder = { worsening: 0, improving: 1, stable: 2 }
  trends.sort((a, b) => trendOrder[a.trend] - trendOrder[b.trend])

  return trends.slice(0, 10) // Return top 10 trending labs
}
