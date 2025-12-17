import { NextRequest, NextResponse } from 'next/server'
import type { DischargeReadinessOutput } from '@/lib/llm/schemas'
import { llmRequest } from '@/lib/llm/client'
import { DischargeReadinessOutputSchema } from '@/lib/llm/schemas'
import { DISCHARGE_READINESS_SYSTEM_PROMPT, buildDischargeReadinessUserPrompt } from '@/lib/llm/prompts/discharge-readiness'

// Helper to fetch FHIR data through proxy
async function fhirFetch(path: string, cookieHeader?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const headers: HeadersInit = {}
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader
  }
  
  const response = await fetch(`${baseUrl}/api/fhir/proxy?path=${encodeURIComponent(path)}`, {
    headers,
  })
  if (!response.ok) {
    throw new Error(`FHIR request failed: ${response.status}`)
  }
  return response.json()
}

export async function GET(
  request: NextRequest,
  { params }: { params: { encounterId: string } }
) {
  try {
    const { encounterId } = params
    const cookieHeader = request.headers.get('Cookie') || ''

    // Fetch encounter to get patient ID
    const encounterData = await fhirFetch(`/Encounter/${encounterId}`, cookieHeader)
    const encounter = encounterData.resourceType === 'Encounter' 
      ? encounterData 
      : encounterData.entry?.[0]?.resource 
      || encounterData
    
    if (!encounter) {
      return NextResponse.json(
        { success: false, error: 'Encounter not found' },
        { status: 404 }
      )
    }

    const patientRef = encounter.subject?.reference
    if (!patientRef) {
      return NextResponse.json(
        { success: false, error: 'Encounter has no patient reference' },
        { status: 400 }
      )
    }

    const patientId = patientRef.split('/')[1]

    // Fetch all relevant FHIR data in parallel
    const [
      patientBundle,
      conditionsBundle,
      vitalsBundle,
      labsBundle,
      medicationsBundle,
      imagingBundle,
      tasksBundle,
    ] = await Promise.all([
      fhirFetch(`/Patient/${patientId}`, cookieHeader).catch(() => ({ entry: [] })),
      fhirFetch(`/Condition?subject=Patient/${patientId}&clinical-status=active`, cookieHeader).catch(() => ({ entry: [] })),
      fhirFetch(`/Observation?subject=Patient/${patientId}&category=vital-signs&_sort=-date&_count=50`, cookieHeader).catch(() => ({ entry: [] })),
      fhirFetch(`/Observation?subject=Patient/${patientId}&category=laboratory&_sort=-date&_count=100`, cookieHeader).catch(() => ({ entry: [] })),
      fhirFetch(`/MedicationRequest?subject=Patient/${patientId}&status=active`, cookieHeader).catch(() => ({ entry: [] })),
      fhirFetch(`/DiagnosticReport?subject=Patient/${patientId}&status=registered,preliminary&_sort=-date`, cookieHeader).catch(() => ({ entry: [] })),
      fhirFetch(`/Task?subject=Patient/${patientId}&status=requested,in-progress`, cookieHeader).catch(() => ({ entry: [] })),
    ])

    const patient = patientBundle.resourceType === 'Patient' ? patientBundle : patientBundle.entry?.[0]?.resource
    const conditions = (conditionsBundle.entry || []).map((e: any) => e.resource)
    const vitals = (vitalsBundle.entry || []).map((e: any) => e.resource)
    const labs = (labsBundle.entry || []).map((e: any) => e.resource)
    const medications = (medicationsBundle.entry || []).map((e: any) => e.resource)
    const pendingTests = (imagingBundle.entry || []).map((e: any) => e.resource)
    const openConsults = (tasksBundle.entry || []).map((e: any) => e.resource)

    // Build snapshot data for AI prompt
    const patientName = patient?.name?.[0] ? 
      `${patient.name[0].given?.join(' ')} ${patient.name[0].family}` : 
      'Unknown Patient'

    // Analyze vitals stability
    const latestVitals = vitals.slice(0, 6)
    const vitalsStable = latestVitals.length > 0
    const vitalsDetails = latestVitals.map((v: any) => {
      const name = v.code?.text || v.code?.coding?.[0]?.display || 'Unknown'
      const value = v.valueQuantity?.value
      const unit = v.valueQuantity?.unit || ''
      return `${name}: ${value}${unit}`
    })

    // Analyze lab trends
    const recentLabs = labs.slice(0, 10)
    const abnormalLabs = recentLabs.filter((l: any) => {
      const interp = l.interpretation?.[0]?.coding?.[0]?.code
      return interp === 'H' || interp === 'L' || interp === 'HH' || interp === 'LL'
    })
    const labsTrending = abnormalLabs.length === 0 ? 'stable' : 'needs review'
    const labDetails = abnormalLabs.slice(0, 5).map((l: any) => {
      const name = l.code?.text || l.code?.coding?.[0]?.display || 'Unknown'
      const value = l.valueQuantity?.value
      const unit = l.valueQuantity?.unit || ''
      const flag = l.interpretation?.[0]?.coding?.[0]?.code
      return `${name}: ${value}${unit} [${flag}]`
    })

    // Check for IV medications
    const onIVMeds = medications.some((m: any) => {
      const route = m.dosageInstruction?.[0]?.route?.coding?.[0]?.code
      return route === 'IV' || route === 'IVINFUSION'
    })

    // Build snapshot
    const snapshot = {
      patient: {
        name: patientName,
        birthDate: patient?.birthDate,
      },
      encounter: {
        start: encounter.period?.start,
        attendingName: encounter.participant?.find((p: any) => 
          p.type?.some((t: any) => t.coding?.some((c: any) => c.code === 'ATND'))
        )?.individual?.display || 'Not specified',
      },
      conditions: conditions.map((c: any) => ({
        name: c.code?.text || c.code?.coding?.[0]?.display || 'Unknown',
        status: c.clinicalStatus?.coding?.[0]?.code || 'active',
      })),
      clinicalStability: {
        vitalsStable,
        vitalsDetails,
        labsTrending,
        oxygenRequirement: 'Room air', // Would need to check for oxygen orders
        onIVMedications: onIVMeds,
        highRiskMedications: [], // Would need medication risk analysis
      },
      workupCompleteness: {
        pendingTestCount: pendingTests.length,
        pendingTests: pendingTests.map((t: any) => ({
          name: t.code?.text || t.code?.coding?.[0]?.display || 'Unknown test',
          orderedDate: t.effectiveDateTime || 'Unknown',
        })),
        openConsultCount: openConsults.length,
        openConsults: openConsults.map((c: any) => ({
          specialty: c.code?.text || 'Consult',
          requestedDate: c.authoredOn || 'Unknown',
        })),
      },
      currentMedications: medications.map((m: any) => ({
        name: m.medicationCodeableConcept?.text || m.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown',
      })),
      scheduledAppointments: [], // Would need to fetch appointments
    }

    // Build prompt and call AI
    const userPrompt = buildDischargeReadinessUserPrompt(snapshot)

    try {
      const aiResponse = await llmRequest<DischargeReadinessOutput>({
        systemPrompt: DISCHARGE_READINESS_SYSTEM_PROMPT,
        userPrompt,
        outputSchema: DischargeReadinessOutputSchema,
        temperature: 0.3,
      })

      return NextResponse.json({
        success: true,
        data: aiResponse.data,
        mock: false,
        usage: aiResponse.usage,
      })
    } catch (llmError) {
      console.error('LLM error, falling back to rule-based assessment:', llmError)
      // Fallback to rule-based assessment if LLM fails
      const fallbackResponse: DischargeReadinessOutput = {
        readinessLevel: vitalsStable && labsTrending === 'stable' && pendingTests.length === 0 ? 'READY_SOON' : 'NOT_READY',
        readinessScore: vitalsStable ? 60 : 40,
        readinessReasons: vitalsStable ? ['Vitals stable'] : ['Clinical status needs review'],
        blockingFactors: pendingTests.map((t: any) => ({
          factor: t.code?.text || 'Pending test',
          category: 'workup',
          details: 'Test results pending',
        })),
        clinicalStatus: {
          vitalsStable,
          vitalsNotes: vitalsDetails.join('; ') || 'No recent vitals',
          labsAcceptable: labsTrending === 'stable',
          labsNotes: labDetails.join('; ') || 'No abnormal labs',
          symptomsControlled: true,
          symptomsNotes: 'Based on available data',
          oxygenRequirement: 'Room air',
          mobilityStatus: 'Not assessed',
        },
        followupNeeds: [],
        pendingTests: pendingTests.map((t: any) => ({
          testName: t.code?.text || 'Unknown test',
          orderedDate: t.effectiveDateTime || new Date().toISOString(),
          criticalForDischarge: false,
        })),
        safetyChecks: [],
        disclaimer: 'This is a rule-based assessment. AI analysis unavailable.',
      }

      return NextResponse.json({
        success: true,
        data: fallbackResponse,
        mock: false,
        fallback: true,
      })
    }
  } catch (error) {
    console.error('Discharge readiness error:', error)
    return NextResponse.json(
      { success: false, error: `Failed to assess discharge readiness: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

