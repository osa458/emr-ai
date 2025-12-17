/**
 * Seed Aidbox with synthetic patient data for demos.
 * Usage: pnpm tsx scripts/seed-aidbox.ts
 *
 * Env:
 *  AIDBOX_BASE_URL=https://your-aidbox-host
 *  AIDBOX_CLIENT_ID=...
 *  AIDBOX_CLIENT_SECRET=...
 */

import type {
  Patient,
  Encounter,
  Condition,
  Observation,
  MedicationRequest,
  DiagnosticReport,
  DocumentReference,
  Procedure,
  Task,
  CarePlan,
  Coverage,
  MedicationStatement,
  Appointment,
  ServiceRequest,
} from '@medplum/fhirtypes'

const BASE_URL = process.env.AIDBOX_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app'
const CLIENT_ID = process.env.AIDBOX_CLIENT_ID || 'emr-api'
const CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET || 'emr-secret-123'

function authHeaders() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  return {
    Authorization: `Basic ${basic}`,
    'Content-Type': 'application/fhir+json',
  }
}

async function fhirCreate<T>(resource: T): Promise<T> {
  const res = await fetch(`${BASE_URL}/${(resource as any).resourceType}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(resource),
  })
  if (!res.ok) {
    throw new Error(`Create ${(resource as any).resourceType} failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

async function seed() {
  console.log('Seeding Aidbox with synthetic patients...')
  for (const patientData of patients) {
    const patient = await fhirCreate<Patient>({
      resourceType: 'Patient',
      name: [{ given: [patientData.first], family: patientData.last }],
      birthDate: patientData.birthDate,
      gender: patientData.gender as Patient['gender'],
      identifier: [{ system: 'MRN', value: patientData.mrn }],
      address: [{ text: patientData.address }],
    })
    console.log(`✓ Patient ${patientData.first} ${patientData.last} (${patient.id})`)

    const encounter = await fhirCreate<Encounter>({
      resourceType: 'Encounter',
      status: 'in-progress',
      class: { code: 'IMP', display: 'Inpatient' },
      subject: { reference: `Patient/${patient.id}` },
      period: { start: patientData.admitDate },
      reasonCode: [{ text: patientData.reason }],
      location: [{ location: { display: patientData.location } }],
    })

    await fhirCreate<Condition>({
      resourceType: 'Condition',
      subject: { reference: `Patient/${patient.id}` },
      encounter: { reference: `Encounter/${encounter.id}` },
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }] },
      code: { text: patientData.reason },
    })

    for (const vital of makeVitals(patientData)) {
      await fhirCreate<Observation>({
        resourceType: 'Observation',
        status: 'final',
        category: [{ coding: [{ code: 'vital-signs' }] }],
        code: { text: vital.name, coding: [{ system: 'http://loinc.org', code: vital.code }] },
        subject: { reference: `Patient/${patient.id}` },
        encounter: { reference: `Encounter/${encounter.id}` },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: { value: vital.value, unit: vital.unit },
      })
    }

    for (const lab of makeLabs(patientData)) {
      await fhirCreate<Observation>({
        resourceType: 'Observation',
        status: 'final',
        category: [{ coding: [{ code: 'laboratory' }] }],
        code: { text: lab.name, coding: [{ system: 'http://loinc.org', code: lab.code }] },
        subject: { reference: `Patient/${patient.id}` },
        encounter: { reference: `Encounter/${encounter.id}` },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity: { value: lab.value, unit: lab.unit },
      })
    }

    for (const med of patientData.meds) {
      await fhirCreate<MedicationRequest>({
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        subject: { reference: `Patient/${patient.id}` },
        encounter: { reference: `Encounter/${encounter.id}` },
        medicationCodeableConcept: { text: med },
        dosageInstruction: [{ text: 'Per hospital protocol' }],
      })
    }

    for (const test of patientData.pendingTests || []) {
      await fhirCreate<DiagnosticReport>({
        resourceType: 'DiagnosticReport',
        status: 'registered',
        subject: { reference: `Patient/${patient.id}` },
        encounter: { reference: `Encounter/${encounter.id}` },
        code: { text: test },
      })
    }

    // Create clinical notes (DocumentReference)
    for (const note of makeNotes(patientData, patient.id!, encounter.id!)) {
      await fhirCreate<DocumentReference>(note)
    }

    // Create PT/OT/ST notes for clinically appropriate patients
    for (const therapyNote of makeTherapyNotes(patientData, patient.id!, encounter.id!)) {
      await fhirCreate<DocumentReference>(therapyNote)
    }

    // Create procedures
    for (const proc of makeProcedures(patientData, patient.id!, encounter.id!)) {
      await fhirCreate<Procedure>(proc)
    }

    // Create tasks
    for (const task of makeTasks(patient.id!, encounter.id!)) {
      await fhirCreate<Task>(task)
    }

    // Create care plan
    await fhirCreate<CarePlan>(makeCarePlan(patientData, patient.id!, encounter.id!))

    // Create coverage (insurance)
    await fhirCreate<Coverage>(makeCoverage(patient.id!))

    // Create home medications
    for (const med of makeHomeMeds(patientData, patient.id!)) {
      await fhirCreate<MedicationStatement>(med)
    }

    // Create appointments
    for (const apt of makeAppointments(patientData, patient.id!)) {
      await fhirCreate<Appointment>(apt)
    }

    // Create service requests (orders)
    for (const order of makeServiceRequests(patientData, patient.id!, encounter.id!)) {
      await fhirCreate<ServiceRequest>(order)
    }
  }
  console.log('Seeding complete.')
}

type PatientSeed = {
  first: string
  last: string
  birthDate: string
  gender: 'male' | 'female'
  mrn: string
  address: string
  location: string
  admitDate: string
  reason: string
  meds: string[]
  pendingTests?: string[]
}

const patients: PatientSeed[] = [
  { first: 'Robert', last: 'Johnson', birthDate: '1945-11-30', gender: 'male', mrn: 'MRN-001', address: '123 Main St', location: 'Room 412', admitDate: isoDaysAgo(6), reason: 'Acute Kidney Injury', meds: ['Lisinopril 10mg', 'Furosemide 40mg'], pendingTests: ['Renal ultrasound'] },
  { first: 'Sarah', last: 'Williams', birthDate: '1965-05-10', gender: 'female', mrn: 'MRN-002', address: '456 Oak Ave', location: 'Room 305', admitDate: isoDaysAgo(5), reason: 'COPD Exacerbation', meds: ['Albuterol neb', 'Prednisone 40mg'], pendingTests: ['CT Chest'] },
  { first: 'John', last: 'Smith', birthDate: '1959-03-15', gender: 'male', mrn: 'MRN-003', address: '789 Pine Rd', location: 'Room 218', admitDate: isoDaysAgo(4), reason: 'CHF Exacerbation', meds: ['Furosemide drip', 'Metoprolol 25mg'], pendingTests: ['Echocardiogram'] },
  { first: 'Maria', last: 'Garcia', birthDate: '1972-08-22', gender: 'female', mrn: 'MRN-004', address: '222 Elm St', location: 'Room 422', admitDate: isoDaysAgo(3), reason: 'Community Acquired Pneumonia', meds: ['Ceftriaxone', 'Azithromycin'] },
  { first: 'Michael', last: 'Brown', birthDate: '1980-01-25', gender: 'male', mrn: 'MRN-005', address: '334 Cedar Ln', location: 'Room 108', admitDate: isoDaysAgo(2), reason: 'Cellulitis', meds: ['Vancomycin'] },
  { first: 'Patricia', last: 'Davis', birthDate: '1978-02-14', gender: 'female', mrn: 'MRN-006', address: '55 Maple Ct', location: 'Room 315', admitDate: isoDaysAgo(5), reason: 'Atrial Fibrillation', meds: ['Eliquis 5mg', 'Metoprolol 50mg'] },
  { first: 'James', last: 'Wilson', birthDate: '1968-07-19', gender: 'male', mrn: 'MRN-007', address: '88 Lake Dr', location: 'Room 210', admitDate: isoDaysAgo(4), reason: 'Diabetic Ketoacidosis', meds: ['Insulin drip', 'Fluids'] },
  { first: 'Jennifer', last: 'Martinez', birthDate: '1974-09-03', gender: 'female', mrn: 'MRN-008', address: '990 Birch Pl', location: 'Room 405', admitDate: isoDaysAgo(3), reason: 'Acute Pancreatitis', meds: ['Fluids', 'Pain control'] },
  { first: 'William', last: 'Anderson', birthDate: '1940-12-12', gender: 'male', mrn: 'MRN-009', address: '12 Oak Cir', location: 'Room 512', admitDate: isoDaysAgo(7), reason: 'Hip Fracture Post-Op', meds: ['Enoxaparin', 'Analgesics'], pendingTests: ['Physical therapy eval'] },
  { first: 'Elizabeth', last: 'Taylor', birthDate: '1957-04-05', gender: 'female', mrn: 'MRN-010', address: '77 Walnut St', location: 'Room 320', admitDate: isoDaysAgo(4), reason: 'GI Bleed', meds: ['PPI infusion'] },
]

function isoDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function makeVitals(p: PatientSeed) {
  return [
    { name: 'Heart Rate', code: '8867-4', value: rand(68, 98), unit: '/min' },
    { name: 'Respiratory Rate', code: '9279-1', value: rand(14, 22), unit: '/min' },
    { name: 'Systolic BP', code: '8480-6', value: rand(110, 140), unit: 'mmHg' },
    { name: 'Diastolic BP', code: '8462-4', value: rand(60, 90), unit: 'mmHg' },
    { name: 'Oxygen Saturation', code: '2708-6', value: rand(93, 100), unit: '%' },
    { name: 'Temperature', code: '8310-5', value: rand(97.5, 100.4), unit: 'F' },
  ]
}

function makeLabs(p: PatientSeed) {
  return [
    { name: 'Creatinine', code: '2160-0', value: rand(0.9, 1.8), unit: 'mg/dL' },
    { name: 'BUN', code: '6299-2', value: rand(12, 35), unit: 'mg/dL' },
    { name: 'Sodium', code: '2951-2', value: rand(134, 142), unit: 'mmol/L' },
    { name: 'Potassium', code: '2823-3', value: rand(3.5, 5.1), unit: 'mmol/L' },
    { name: 'WBC', code: '6690-2', value: rand(6, 14), unit: '10*3/uL' },
    { name: 'Hemoglobin', code: '718-7', value: rand(11, 15), unit: 'g/dL' },
  ]
}

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

// Note type LOINC codes
const NoteTypeCodes: Record<string, { code: string; display: string }> = {
  'Progress Note': { code: '11506-3', display: 'Progress Note' },
  'H&P': { code: '34117-2', display: 'History and Physical' },
  'Consult Note': { code: '11488-4', display: 'Consultation Note' },
  'Nursing Note': { code: '68478-9', display: 'Nursing Note' },
}

function makeNotes(p: PatientSeed, patientId: string, encounterId: string): DocumentReference[] {
  const notes: DocumentReference[] = []

  // H&P from admission
  const hpContent = `HISTORY AND PHYSICAL\n\nChief Complaint: ${p.reason}\n\nHPI: Patient is a ${p.gender} presenting with ${p.reason}.\n\nAssessment/Plan:\n1. ${p.reason}\n   - Continue current management\n   - Monitor closely\n\nDisposition: Admit to medicine service`

  notes.push({
    resourceType: 'DocumentReference',
    status: 'current',
    docStatus: 'final',
    type: {
      coding: [{ system: 'http://loinc.org', code: '34117-2', display: 'History and Physical' }],
      text: 'H&P',
    },
    category: [{ coding: [{ code: 'clinical-note' }], text: 'Clinical Note' }],
    subject: { reference: `Patient/${patientId}` },
    date: p.admitDate,
    author: [{ display: 'Dr. Sarah Johnson' }],
    content: [{
      attachment: {
        contentType: 'text/plain',
        data: Buffer.from(hpContent).toString('base64'),
      }
    }],
    context: { encounter: [{ reference: `Encounter/${encounterId}` }] },
    extension: [
      { url: 'http://emmai.local/fhir/StructureDefinition/note-service', valueString: 'Hospitalist' },
      { url: 'http://emmai.local/fhir/StructureDefinition/note-author-role', valueString: 'Attending Physician' },
    ],
  })

  // Daily progress note
  const progressContent = `PROGRESS NOTE\n\nSubjective: Patient reports feeling better. Slept well overnight.\n\nObjective:\nVitals: Stable\nExam: Unchanged from prior\n\nAssessment/Plan:\n1. ${p.reason} - improving\n   - Continue current management\n   - Reassess for discharge planning`

  notes.push({
    resourceType: 'DocumentReference',
    status: 'current',
    docStatus: 'final',
    type: {
      coding: [{ system: 'http://loinc.org', code: '11506-3', display: 'Progress Note' }],
      text: 'Progress Note',
    },
    category: [{ coding: [{ code: 'clinical-note' }], text: 'Clinical Note' }],
    subject: { reference: `Patient/${patientId}` },
    date: isoDaysAgo(0),
    author: [{ display: 'Dr. Sarah Johnson' }],
    content: [{
      attachment: {
        contentType: 'text/plain',
        data: Buffer.from(progressContent).toString('base64'),
      }
    }],
    context: { encounter: [{ reference: `Encounter/${encounterId}` }] },
    extension: [
      { url: 'http://emmai.local/fhir/StructureDefinition/note-service', valueString: 'Hospitalist' },
      { url: 'http://emmai.local/fhir/StructureDefinition/note-author-role', valueString: 'Attending Physician' },
    ],
  })

  // Nursing note
  const nursingContent = `NURSING ASSESSMENT\n\nPatient resting comfortably. Vitals stable. Pain controlled. Ambulated with assistance. Tolerating diet. Fall precautions in place.`

  notes.push({
    resourceType: 'DocumentReference',
    status: 'current',
    docStatus: 'final',
    type: {
      coding: [{ system: 'http://loinc.org', code: '68478-9', display: 'Nursing Note' }],
      text: 'Nursing Note',
    },
    category: [{ coding: [{ code: 'clinical-note' }], text: 'Clinical Note' }],
    subject: { reference: `Patient/${patientId}` },
    date: isoDaysAgo(0),
    author: [{ display: 'Mary Thompson, RN' }],
    content: [{
      attachment: {
        contentType: 'text/plain',
        data: Buffer.from(nursingContent).toString('base64'),
      }
    }],
    context: { encounter: [{ reference: `Encounter/${encounterId}` }] },
    extension: [
      { url: 'http://emmai.local/fhir/StructureDefinition/note-service', valueString: 'Registered Nurse' },
      { url: 'http://emmai.local/fhir/StructureDefinition/note-author-role', valueString: 'RN' },
    ],
  })

  return notes
}

// Generate PT/OT/ST therapy notes for clinically appropriate patients
function makeTherapyNotes(p: PatientSeed, patientId: string, encounterId: string): DocumentReference[] {
  const notes: DocumentReference[] = []
  const age = new Date().getFullYear() - new Date(p.birthDate).getFullYear()

  // William Anderson - Hip Fracture Post-Op (definitely needs PT/OT)
  if (p.reason.includes('Hip Fracture')) {
    const ptContent = `PHYSICAL THERAPY EVALUATION

Date: ${new Date().toLocaleDateString()}
Therapist: PT Sarah Mitchell, DPT

ASSESSMENT:
Patient is an ${age}-year-old male status post total hip arthroplasty on ${new Date(p.admitDate).toLocaleDateString()}. Patient presents with decreased mobility, impaired balance, and weakness in lower extremities.

FUNCTIONAL STATUS:
- Ambulation: Patient ambulated 50 feet with rolling walker, minimal assist x1
- Gait: Antalgic gait pattern, decreased weight bearing on surgical side
- Balance: Impaired static and dynamic balance, requires assistive device
- Stairs: Able to negotiate 2 steps with rail, minimal assist
- Transfers: Bed to chair with minimal assist, chair to standing with minimal assist
- Strength: Hip flexors 3/5, hip abductors 3/5, quadriceps 3/5 on surgical side

RECOMMENDATIONS:
1. Continue inpatient PT daily focusing on:
   - Progressive ambulation with rolling walker
   - Lower extremity strengthening exercises
   - Balance training
   - Stair negotiation training

2. MEDICAL EQUIPMENT RECOMMENDATIONS:
   - Rolling walker (medically necessary for safe ambulation)
   - Bedside commode (for nighttime safety)
   - Shower chair (for safe bathing)
   - Raised toilet seat (for safe transfers)

3. Discharge planning: Patient will be safe for discharge home with rolling walker and recommended DME. Recommend outpatient PT 2-3x/week for 4-6 weeks.

PROGNOSIS: Good with continued therapy and equipment support.`

    notes.push({
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: 'final',
      type: {
        coding: [{ system: 'http://loinc.org', code: '68656-0', display: 'Therapy Note' }],
        text: 'Physical Therapy Note',
      },
      category: [{ coding: [{ code: 'clinical-note' }], text: 'Clinical Note' }],
      subject: { reference: `Patient/${patientId}` },
      date: isoDaysAgo(1),
      author: [{ display: 'PT Sarah Mitchell, DPT' }],
      content: [{
        attachment: {
          contentType: 'text/plain',
          data: Buffer.from(ptContent).toString('base64'),
        }
      }],
      context: { encounter: [{ reference: `Encounter/${encounterId}` }] },
      extension: [
        { url: 'http://emmai.local/fhir/StructureDefinition/note-service', valueString: 'Physical Therapy' },
        { url: 'http://emmai.local/fhir/StructureDefinition/note-author-role', valueString: 'Physical Therapist' },
      ],
    })

    const otContent = `OCCUPATIONAL THERAPY EVALUATION

Date: ${new Date().toLocaleDateString()}
Therapist: OT Jennifer Martinez, OTR/L

ASSESSMENT:
Patient is an ${age}-year-old male status post hip arthroplasty. Patient requires assistance with ADLs and home safety modifications.

FUNCTIONAL STATUS:
- Upper body strength: 4/5 bilateral
- ADLs: Requires minimal assist with dressing lower body, independent with upper body
- Fine motor: Intact, no deficits noted
- Home safety: Lives in single-story home with 2 steps at entrance

RECOMMENDATIONS:
1. Continue inpatient OT focusing on:
   - Lower body dressing techniques
   - Energy conservation techniques
   - Home safety education

2. MEDICAL EQUIPMENT RECOMMENDATIONS:
   - Shower chair (medically necessary for safe bathing)
   - Grab bars in bathroom (for safety during transfers)
   - Long-handled reacher (for lower body dressing)
   - Sock aid (for independent lower body dressing)

3. Discharge planning: Patient will benefit from home health OT for 2-3 weeks post-discharge.

PROGNOSIS: Good with equipment support and continued therapy.`

    notes.push({
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: 'final',
      type: {
        coding: [{ system: 'http://loinc.org', code: '68656-0', display: 'Therapy Note' }],
        text: 'Occupational Therapy Note',
      },
      category: [{ coding: [{ code: 'clinical-note' }], text: 'Clinical Note' }],
      subject: { reference: `Patient/${patientId}` },
      date: isoDaysAgo(1),
      author: [{ display: 'OT Jennifer Martinez, OTR/L' }],
      content: [{
        attachment: {
          contentType: 'text/plain',
          data: Buffer.from(otContent).toString('base64'),
        }
      }],
      context: { encounter: [{ reference: `Encounter/${encounterId}` }] },
      extension: [
        { url: 'http://emmai.local/fhir/StructureDefinition/note-service', valueString: 'Occupational Therapy' },
        { url: 'http://emmai.local/fhir/StructureDefinition/note-author-role', valueString: 'Occupational Therapist' },
      ],
    })
  }

  // Robert Johnson - AKI, elderly (needs PT/OT for deconditioning)
  if (p.reason.includes('Acute Kidney Injury') && age >= 70) {
    const ptContent = `PHYSICAL THERAPY EVALUATION

Date: ${new Date().toLocaleDateString()}
Therapist: PT Michael Chen, DPT

ASSESSMENT:
Patient is an ${age}-year-old male with acute kidney injury and deconditioning from hospitalization. Patient demonstrates decreased endurance and mobility.

FUNCTIONAL STATUS:
- Ambulation: Patient ambulated 100 feet with rolling walker, standby assist
- Gait: Slow, steady with assistive device
- Balance: Mild impairment, requires assistive device for safety
- Endurance: Decreased, requires rest breaks after 50 feet
- Strength: Lower extremities 4/5, generalized weakness

RECOMMENDATIONS:
1. Continue inpatient PT focusing on:
   - Progressive ambulation and endurance training
   - Lower extremity strengthening
   - Balance exercises

2. MEDICAL EQUIPMENT RECOMMENDATIONS:
   - Rolling walker (medically necessary for safe ambulation and fall prevention)

3. Discharge planning: Patient will be safe for discharge home with rolling walker. Recommend home health PT 2x/week for 2-3 weeks.

PROGNOSIS: Good with continued therapy and equipment support.`

    notes.push({
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: 'final',
      type: {
        coding: [{ system: 'http://loinc.org', code: '68656-0', display: 'Therapy Note' }],
        text: 'Physical Therapy Note',
      },
      category: [{ coding: [{ code: 'clinical-note' }], text: 'Clinical Note' }],
      subject: { reference: `Patient/${patientId}` },
      date: isoDaysAgo(2),
      author: [{ display: 'PT Michael Chen, DPT' }],
      content: [{
        attachment: {
          contentType: 'text/plain',
          data: Buffer.from(ptContent).toString('base64'),
        }
      }],
      context: { encounter: [{ reference: `Encounter/${encounterId}` }] },
      extension: [
        { url: 'http://emmai.local/fhir/StructureDefinition/note-service', valueString: 'Physical Therapy' },
        { url: 'http://emmai.local/fhir/StructureDefinition/note-author-role', valueString: 'Physical Therapist' },
      ],
    })
  }

  // Sarah Williams - COPD (needs PT/OT for pulmonary rehab)
  if (p.reason.includes('COPD')) {
    const ptContent = `PHYSICAL THERAPY EVALUATION - PULMONARY REHABILITATION

Date: ${new Date().toLocaleDateString()}
Therapist: PT David Kim, DPT

ASSESSMENT:
Patient is a ${age}-year-old female with COPD exacerbation. Patient demonstrates decreased exercise tolerance and dyspnea with minimal exertion.

FUNCTIONAL STATUS:
- Ambulation: Patient ambulated 75 feet on room air, SpO2 dropped to 88%, required rest
- Exercise tolerance: Severely limited by dyspnea
- Oxygen requirement: 2L NC at rest, 4L NC with ambulation
- Strength: Upper and lower extremities 4/5
- Breathing pattern: Pursed lip breathing, accessory muscle use

RECOMMENDATIONS:
1. Continue inpatient PT focusing on:
   - Pulmonary rehabilitation exercises
   - Energy conservation techniques
   - Breathing exercises and techniques
   - Progressive ambulation with oxygen

2. MEDICAL EQUIPMENT RECOMMENDATIONS:
   - Home oxygen concentrator (medically necessary - patient requires 2-4L NC)
   - Rolling walker with oxygen holder (for safe ambulation with O2)
   - Pulse oximeter (for home monitoring)

3. Discharge planning: Patient will require home oxygen. Recommend outpatient pulmonary rehabilitation program 2-3x/week.

PROGNOSIS: Good with oxygen support and continued pulmonary rehabilitation.`

    notes.push({
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: 'final',
      type: {
        coding: [{ system: 'http://loinc.org', code: '68656-0', display: 'Therapy Note' }],
        text: 'Physical Therapy Note',
      },
      category: [{ coding: [{ code: 'clinical-note' }], text: 'Clinical Note' }],
      subject: { reference: `Patient/${patientId}` },
      date: isoDaysAgo(2),
      author: [{ display: 'PT David Kim, DPT' }],
      content: [{
        attachment: {
          contentType: 'text/plain',
          data: Buffer.from(ptContent).toString('base64'),
        }
      }],
      context: { encounter: [{ reference: `Encounter/${encounterId}` }] },
      extension: [
        { url: 'http://emmai.local/fhir/StructureDefinition/note-service', valueString: 'Physical Therapy' },
        { url: 'http://emmai.local/fhir/StructureDefinition/note-author-role', valueString: 'Physical Therapist' },
      ],
    })
  }

  // John Smith - CHF (needs PT/OT for cardiac rehab and mobility)
  if (p.reason.includes('CHF')) {
    const ptContent = `PHYSICAL THERAPY EVALUATION - CARDIAC REHABILITATION

Date: ${new Date().toLocaleDateString()}
Therapist: PT Amanda Rodriguez, DPT

ASSESSMENT:
Patient is a ${age}-year-old male with heart failure exacerbation. Patient demonstrates decreased exercise tolerance, lower extremity edema, and generalized weakness.

FUNCTIONAL STATUS:
- Ambulation: Patient ambulated 120 feet with rolling walker, minimal assist
- Gait: Slow, steady, no shortness of breath at rest
- Exercise tolerance: Limited by fatigue, requires rest breaks
- Lower extremity edema: 1+ bilateral, improved from admission
- Strength: Lower extremities 4/5, generalized deconditioning

RECOMMENDATIONS:
1. Continue inpatient PT focusing on:
   - Cardiac rehabilitation exercises
   - Progressive ambulation
   - Lower extremity strengthening
   - Energy conservation techniques

2. MEDICAL EQUIPMENT RECOMMENDATIONS:
   - Rolling walker (medically necessary for safe ambulation and fall prevention)
   - Compression stockings (for edema management)

3. Discharge planning: Patient will be safe for discharge home with rolling walker. Recommend cardiac rehabilitation program 2-3x/week.

PROGNOSIS: Good with continued therapy and equipment support.`

    notes.push({
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: 'final',
      type: {
        coding: [{ system: 'http://loinc.org', code: '68656-0', display: 'Therapy Note' }],
        text: 'Physical Therapy Note',
      },
      category: [{ coding: [{ code: 'clinical-note' }], text: 'Clinical Note' }],
      subject: { reference: `Patient/${patientId}` },
      date: isoDaysAgo(1),
      author: [{ display: 'PT Amanda Rodriguez, DPT' }],
      content: [{
        attachment: {
          contentType: 'text/plain',
          data: Buffer.from(ptContent).toString('base64'),
        }
      }],
      context: { encounter: [{ reference: `Encounter/${encounterId}` }] },
      extension: [
        { url: 'http://emmai.local/fhir/StructureDefinition/note-service', valueString: 'Physical Therapy' },
        { url: 'http://emmai.local/fhir/StructureDefinition/note-author-role', valueString: 'Physical Therapist' },
      ],
    })
  }

  // James Wilson - DKA (could be deconditioned, needs PT)
  if (p.reason.includes('Diabetic Ketoacidosis')) {
    const ptContent = `PHYSICAL THERAPY EVALUATION

Date: ${new Date().toLocaleDateString()}
Therapist: PT Robert Thompson, DPT

ASSESSMENT:
Patient is a ${age}-year-old male with diabetic ketoacidosis, now resolved. Patient demonstrates deconditioning from acute illness and hospitalization.

FUNCTIONAL STATUS:
- Ambulation: Patient ambulated 150 feet independently, steady gait
- Balance: Intact, no assistive device required
- Strength: Lower extremities 4+/5, mild weakness
- Endurance: Decreased from baseline, requires rest breaks

RECOMMENDATIONS:
1. Continue inpatient PT focusing on:
   - Progressive ambulation and endurance training
   - Lower extremity strengthening
   - Return to baseline functional level

2. MEDICAL EQUIPMENT RECOMMENDATIONS:
   - None required at this time. Patient is safe for independent ambulation.

3. Discharge planning: Patient progressing well, may benefit from home exercise program. No DME required.

PROGNOSIS: Excellent, patient should return to baseline function.`

    notes.push({
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: 'final',
      type: {
        coding: [{ system: 'http://loinc.org', code: '68656-0', display: 'Therapy Note' }],
        text: 'Physical Therapy Note',
      },
      category: [{ coding: [{ code: 'clinical-note' }], text: 'Clinical Note' }],
      subject: { reference: `Patient/${patientId}` },
      date: isoDaysAgo(1),
      author: [{ display: 'PT Robert Thompson, DPT' }],
      content: [{
        attachment: {
          contentType: 'text/plain',
          data: Buffer.from(ptContent).toString('base64'),
        }
      }],
      context: { encounter: [{ reference: `Encounter/${encounterId}` }] },
      extension: [
        { url: 'http://emmai.local/fhir/StructureDefinition/note-service', valueString: 'Physical Therapy' },
        { url: 'http://emmai.local/fhir/StructureDefinition/note-author-role', valueString: 'Physical Therapist' },
      ],
    })
  }

  return notes
}

// Generate procedures
function makeProcedures(p: PatientSeed, patientId: string, encounterId: string): Procedure[] {
  const procedures: Procedure[] = []

  // Add an IV placement procedure for all inpatients
  procedures.push({
    resourceType: 'Procedure',
    status: 'completed',
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    code: { text: 'IV Line Placement', coding: [{ system: 'http://snomed.info/sct', code: '392230004', display: 'IV Line Insertion' }] },
    performedDateTime: p.admitDate,
    performer: [{ actor: { display: 'Dr. Michael Chen' } }],
    note: [{ text: 'Peripheral IV placed successfully in left forearm.' }],
  })

  // Add procedure based on reason for admission
  if (p.reason.includes('Hip Fracture')) {
    procedures.push({
      resourceType: 'Procedure',
      status: 'completed',
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      code: { text: 'Hip Replacement Surgery', coding: [{ system: 'http://snomed.info/sct', code: '52734007', display: 'Total Hip Replacement' }] },
      performedDateTime: p.admitDate,
      performer: [{ actor: { display: 'Dr. James Ortho, MD' } }],
      note: [{ text: 'Total hip arthroplasty with prosthesis placement. No complications.' }],
    })
  }

  return procedures
}

// Generate tasks
function makeTasks(patientId: string, encounterId: string): Task[] {
  return [
    {
      resourceType: 'Task',
      status: 'requested',
      intent: 'order',
      priority: 'routine',
      description: 'Obtain AM labs - CBC, BMP',
      for: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      authoredOn: new Date().toISOString(),
      owner: { display: 'Lab Technician' },
      code: { text: 'Lab Draw' },
    },
    {
      resourceType: 'Task',
      status: 'in-progress',
      intent: 'order',
      priority: 'urgent',
      description: 'Physical therapy evaluation',
      for: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      authoredOn: new Date().toISOString(),
      owner: { display: 'PT Department' },
      code: { text: 'Therapy Evaluation' },
    },
    {
      resourceType: 'Task',
      status: 'ready',
      intent: 'order',
      priority: 'routine',
      description: 'Discharge planning assessment',
      for: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      authoredOn: new Date().toISOString(),
      owner: { display: 'Case Manager' },
      code: { text: 'Discharge Planning' },
    },
  ]
}

// Generate care plan
function makeCarePlan(p: PatientSeed, patientId: string, encounterId: string): CarePlan {
  return {
    resourceType: 'CarePlan',
    status: 'active',
    intent: 'plan',
    title: `${p.reason} Treatment Plan`,
    description: `Comprehensive treatment plan for ${p.reason}`,
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    period: { start: p.admitDate },
    category: [{ text: 'Inpatient Care Plan' }],
    goal: [
      { display: 'Stabilize patient condition' },
      { display: 'Manage symptoms effectively' },
      { display: 'Prepare for safe discharge' },
    ],
    activity: [
      { detail: { status: 'in-progress', description: 'Daily physician rounding' } },
      { detail: { status: 'in-progress', description: 'Medication management' } },
      { detail: { status: 'scheduled', description: 'Discharge education' } },
    ],
  }
}

// Generate coverage (insurance)
function makeCoverage(patientId: string): Coverage {
  const insurers = ['Blue Cross Blue Shield', 'Aetna', 'UnitedHealthcare', 'Cigna', 'Medicare']
  const insurer = insurers[Math.floor(Math.random() * insurers.length)]

  return {
    resourceType: 'Coverage',
    status: 'active',
    beneficiary: { reference: `Patient/${patientId}` },
    payor: [{ display: insurer }],
    type: { text: 'Health Insurance', coding: [{ code: 'EHCPOL', display: 'Extended Healthcare' }] },
    subscriberId: `SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    relationship: { text: 'Self', coding: [{ code: 'self' }] },
    period: { start: '2024-01-01' },
    class: [
      { type: { text: 'Group' }, value: 'GRP-12345' },
      { type: { text: 'Plan' }, value: 'Gold PPO' },
    ],
  }
}

// Generate home medications
function makeHomeMeds(p: PatientSeed, patientId: string): MedicationStatement[] {
  const homeMeds = [
    { name: 'Aspirin 81mg', dosage: 'Once daily', category: 'Cardiac' },
    { name: 'Vitamin D 1000 IU', dosage: 'Once daily', category: 'Supplement' },
    { name: 'Atorvastatin 20mg', dosage: 'Once daily at bedtime', category: 'Lipid' },
  ]

  return homeMeds.map(med => ({
    resourceType: 'MedicationStatement' as const,
    status: 'active' as const,
    medicationCodeableConcept: { text: med.name },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: new Date().toISOString(),
    dosage: [{ text: med.dosage }],
    category: { coding: [{ code: 'community', display: 'Home Medication' }], text: med.category },
  }))
}

// Generate appointments
function makeAppointments(p: PatientSeed, patientId: string): Appointment[] {
  // Follow-up appointment in 1 week
  const followUpDate = new Date()
  followUpDate.setDate(followUpDate.getDate() + 7)
  followUpDate.setHours(10, 0, 0, 0)

  const followUpEnd = new Date(followUpDate)
  followUpEnd.setMinutes(followUpEnd.getMinutes() + 30)

  return [
    {
      resourceType: 'Appointment',
      status: 'booked',
      start: followUpDate.toISOString(),
      end: followUpEnd.toISOString(),
      description: `Follow-up - ${p.reason}`,
      serviceType: [{ text: 'Follow-up Visit' }],
      participant: [
        { actor: { reference: `Patient/${patientId}`, display: `${p.first} ${p.last}` }, status: 'accepted' },
        { actor: { display: 'Dr. Sarah Johnson' }, status: 'accepted' }
      ],
    }
  ]
}

// Generate service requests (orders)
function makeServiceRequests(p: PatientSeed, patientId: string, encounterId: string): ServiceRequest[] {
  const orders: ServiceRequest[] = []

  // Lab orders
  orders.push({
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    category: [{ coding: [{ code: 'laboratory', display: 'Laboratory' }], text: 'Laboratory' }],
    code: { text: 'CBC, BMP - AM Labs' },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    requester: { display: 'Dr. Sarah Johnson' },
    authoredOn: new Date().toISOString(),
    priority: 'routine',
  })

  // Imaging if pending tests exist
  if (p.pendingTests && p.pendingTests.length > 0) {
    orders.push({
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      category: [{ coding: [{ code: 'imaging', display: 'Imaging' }], text: 'Imaging' }],
      code: { text: p.pendingTests[0] },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      requester: { display: 'Dr. Sarah Johnson' },
      authoredOn: new Date().toISOString(),
      priority: 'routine',
    })
  }

  // Consult order for complex cases
  if (p.reason.includes('CHF') || p.reason.includes('Heart')) {
    orders.push({
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      category: [{ coding: [{ code: 'consultation', display: 'Consultation' }], text: 'Consultation' }],
      code: { text: 'Cardiology Consult' },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      requester: { display: 'Dr. Sarah Johnson' },
      authoredOn: new Date().toISOString(),
      priority: 'urgent',
      note: [{ text: 'Please evaluate for heart failure management and optimization' }],
    })
  }

  return orders
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
