/**
 * Seed FHIR server with synthetic patient data for demo
 * Usage: pnpm seed
 */

import { MedplumClient } from '@medplum/core'
import type { Patient, Encounter, Coverage, Organization } from '@medplum/fhirtypes'

// In-memory storage for Node.js environment
class MemoryStorage {
  private data: Record<string, string> = {}
  clear(): void { this.data = {} }
  getString(key: string): string | undefined { return this.data[key] }
  setString(key: string, value: string): void { this.data[key] = value }
  getObject<T>(key: string): T | undefined { 
    const val = this.data[key]
    return val ? JSON.parse(val) : undefined 
  }
  setObject<T>(key: string, value: T): void { 
    this.data[key] = JSON.stringify(value) 
  }
}

const storage = new MemoryStorage()

const medplum = new MedplumClient({
  baseUrl: process.env.MEDPLUM_BASE_URL || 'http://localhost:8103',
  fetch: fetch,
  storage: storage as any,
})

const MEDPLUM_BASE = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103'

async function authenticate() {
  console.log('🔐 Authenticating with Medplum...')
  const email = process.env.MEDPLUM_ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.MEDPLUM_ADMIN_PASSWORD || 'medplum_admin'
  
  try {
    // Step 1: Login with email/password
    console.log('   Logging in...')
    const loginResponse = await fetch(`${MEDPLUM_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        scope: 'openid',
        codeChallengeMethod: 'plain',
        codeChallenge: 'xyz',
      }),
    })
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${await loginResponse.text()}`)
    }
    
    const loginData = await loginResponse.json()
    console.log('   ✅ Login successful')
    
    // Step 2: Exchange code for token
    const tokenResponse = await fetch(`${MEDPLUM_BASE}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: loginData.code,
        code_verifier: 'xyz',
      }),
    })
    
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${await tokenResponse.text()}`)
    }
    
    const tokenData = await tokenResponse.json()
    medplum.setAccessToken(tokenData.access_token)
    console.log('✅ Authenticated successfully')
    console.log(`   Project: ${tokenData.project?.display}`)
    console.log(`   Profile: ${tokenData.profile?.display}`)
    
  } catch (error) {
    console.error('❌ Authentication failed:', error)
    throw error
  }
}

// Insurance plans
const insurancePlans = [
  { name: 'Blue Cross Blue Shield PPO', type: 'PPO', formularyTier: 'preferred' },
  { name: 'Aetna HMO', type: 'HMO', formularyTier: 'standard' },
  { name: 'Medicare Part D', type: 'Medicare', formularyTier: 'medicare' },
  { name: 'United Healthcare', type: 'PPO', formularyTier: 'preferred' },
  { name: 'Cigna Choice', type: 'EPO', formularyTier: 'standard' },
  { name: 'Medicaid', type: 'Medicaid', formularyTier: 'medicaid' },
]

// Local pharmacies
const pharmacies = [
  { name: 'CVS Pharmacy - Main St', address: '123 Main Street', phone: '555-0101', hasDelivery: true },
  { name: 'Walgreens - Oak Ave', address: '456 Oak Avenue', phone: '555-0102', hasDelivery: true },
  { name: 'Hospital Outpatient Pharmacy', address: '789 Medical Center Dr', phone: '555-0103', hasDelivery: false },
  { name: 'Costco Pharmacy', address: '321 Commerce Blvd', phone: '555-0104', hasDelivery: false },
  { name: 'Rite Aid - Pine St', address: '654 Pine Street', phone: '555-0105', hasDelivery: true },
]

// Home medications (pre-admission)
const homeMedicationSets: Record<string, Array<{ name: string; dose: string; frequency: string; rxcui?: string; covered?: boolean }>> = {
  cardiac: [
    { name: 'Lisinopril', dose: '10mg', frequency: 'Daily', rxcui: '314076', covered: true },
    { name: 'Metoprolol Succinate', dose: '50mg', frequency: 'Daily', rxcui: '866924', covered: true },
    { name: 'Aspirin', dose: '81mg', frequency: 'Daily', rxcui: '243670', covered: true },
    { name: 'Atorvastatin', dose: '40mg', frequency: 'Daily', rxcui: '617310', covered: true },
  ],
  respiratory: [
    { name: 'Albuterol Inhaler', dose: '90mcg', frequency: 'PRN', rxcui: '745679', covered: true },
    { name: 'Fluticasone/Salmeterol', dose: '250/50mcg', frequency: 'BID', rxcui: '896188', covered: true },
    { name: 'Tiotropium', dose: '18mcg', frequency: 'Daily', rxcui: '485210', covered: false },
    { name: 'Montelukast', dose: '10mg', frequency: 'Daily', rxcui: '604751', covered: true },
  ],
  diabetes: [
    { name: 'Metformin', dose: '1000mg', frequency: 'BID', rxcui: '861007', covered: true },
    { name: 'Glipizide', dose: '5mg', frequency: 'Daily', rxcui: '310488', covered: true },
    { name: 'Insulin Glargine', dose: '20 units', frequency: 'Daily', rxcui: '847187', covered: true },
    { name: 'Empagliflozin', dose: '10mg', frequency: 'Daily', rxcui: '1545149', covered: false },
  ],
  general: [
    { name: 'Omeprazole', dose: '20mg', frequency: 'Daily', rxcui: '198048', covered: true },
    { name: 'Vitamin D3', dose: '2000 IU', frequency: 'Daily', rxcui: '316903', covered: false },
    { name: 'Amlodipine', dose: '5mg', frequency: 'Daily', rxcui: '308135', covered: true },
  ],
  pain: [
    { name: 'Gabapentin', dose: '300mg', frequency: 'TID', rxcui: '310431', covered: true },
    { name: 'Acetaminophen', dose: '500mg', frequency: 'Q6H PRN', rxcui: '198440', covered: true },
    { name: 'Tramadol', dose: '50mg', frequency: 'Q6H PRN', rxcui: '835603', covered: true },
  ],
}

// Imaging studies with results
const imagingStudies = [
  { name: 'Chest X-Ray', modality: 'XR', bodyPart: 'Chest', findings: 'No acute cardiopulmonary process. Heart size normal. Lungs clear.' },
  { name: 'CT Chest with Contrast', modality: 'CT', bodyPart: 'Chest', findings: 'No pulmonary embolism. Mild bibasilar atelectasis. No consolidation.' },
  { name: 'CT Abdomen/Pelvis', modality: 'CT', bodyPart: 'Abdomen', findings: 'No acute intra-abdominal pathology. Liver, spleen, pancreas unremarkable.' },
  { name: 'MRI Brain', modality: 'MR', bodyPart: 'Head', findings: 'No acute intracranial abnormality. Age-appropriate volume loss.' },
  { name: 'Echocardiogram', modality: 'US', bodyPart: 'Heart', findings: 'LVEF 45-50%. Mild LVH. Grade I diastolic dysfunction. No significant valvular disease.' },
  { name: 'Renal Ultrasound', modality: 'US', bodyPart: 'Kidney', findings: 'Kidneys normal in size bilaterally. No hydronephrosis or stones.' },
  { name: 'Lower Extremity Doppler', modality: 'US', bodyPart: 'Leg', findings: 'No evidence of deep vein thrombosis in bilateral lower extremities.' },
  { name: 'Abdominal X-Ray', modality: 'XR', bodyPart: 'Abdomen', findings: 'Nonobstructive bowel gas pattern. No free air. No radiopaque stones.' },
]

// Sample patients with varying conditions and readiness states
const patients = [
  {
    name: 'Robert Johnson',
    birthDate: '1945-11-30',
    gender: 'male' as const,
    condition: 'Acute Kidney Injury',
    readiness: 'NOT_READY',
    los: 6,
    room: '412',
    homeMeds: ['cardiac', 'diabetes'],
    insurance: 2,
  },
  {
    name: 'Sarah Williams',
    birthDate: '1965-05-10',
    gender: 'female' as const,
    condition: 'COPD Exacerbation',
    readiness: 'READY_SOON',
    los: 5,
    room: '305',
    homeMeds: ['respiratory', 'general'],
    insurance: 0,
  },
  {
    name: 'John Smith',
    birthDate: '1959-03-15',
    gender: 'male' as const,
    condition: 'CHF Exacerbation',
    readiness: 'READY_SOON',
    los: 4,
    room: '218',
    homeMeds: ['cardiac', 'general'],
    insurance: 3,
  },
  {
    name: 'Maria Garcia',
    birthDate: '1972-08-22',
    gender: 'female' as const,
    condition: 'Community Acquired Pneumonia',
    readiness: 'READY_TODAY',
    los: 3,
    room: '422',
    homeMeds: ['general'],
    insurance: 1,
  },
  {
    name: 'Michael Brown',
    birthDate: '1980-01-25',
    gender: 'male' as const,
    condition: 'Cellulitis',
    readiness: 'READY_TODAY',
    los: 2,
    room: '108',
    homeMeds: ['diabetes'],
    insurance: 0,
  },
  {
    name: 'Patricia Davis',
    birthDate: '1952-07-18',
    gender: 'female' as const,
    condition: 'Atrial Fibrillation with RVR',
    readiness: 'READY_SOON',
    los: 3,
    room: '315',
    homeMeds: ['cardiac'],
    insurance: 2,
  },
  {
    name: 'James Wilson',
    birthDate: '1968-12-05',
    gender: 'male' as const,
    condition: 'Diabetic Ketoacidosis',
    readiness: 'NOT_READY',
    los: 4,
    room: '210',
    homeMeds: ['diabetes', 'cardiac'],
    insurance: 4,
  },
  {
    name: 'Jennifer Martinez',
    birthDate: '1975-04-12',
    gender: 'female' as const,
    condition: 'Acute Pancreatitis',
    readiness: 'READY_SOON',
    los: 5,
    room: '405',
    homeMeds: ['general', 'pain'],
    insurance: 1,
  },
  {
    name: 'William Anderson',
    birthDate: '1940-09-28',
    gender: 'male' as const,
    condition: 'Hip Fracture Post-Op',
    readiness: 'NOT_READY',
    los: 7,
    room: '512',
    homeMeds: ['cardiac', 'pain', 'general'],
    insurance: 2,
  },
  {
    name: 'Elizabeth Taylor',
    birthDate: '1958-02-14',
    gender: 'female' as const,
    condition: 'GI Bleed',
    readiness: 'READY_SOON',
    los: 4,
    room: '320',
    homeMeds: ['general', 'cardiac'],
    insurance: 0,
  },
  {
    name: 'David Lee',
    birthDate: '1955-06-20',
    gender: 'male' as const,
    condition: 'Stroke - CVA',
    readiness: 'NOT_READY',
    los: 8,
    room: '610',
    homeMeds: ['cardiac', 'diabetes'],
    insurance: 2,
  },
  {
    name: 'Susan Clark',
    birthDate: '1948-11-03',
    gender: 'female' as const,
    condition: 'Sepsis',
    readiness: 'NOT_READY',
    los: 6,
    room: 'ICU-4',
    homeMeds: ['general', 'pain'],
    insurance: 3,
  },
  {
    name: 'Thomas White',
    birthDate: '1962-09-15',
    gender: 'male' as const,
    condition: 'Acute MI - NSTEMI',
    readiness: 'READY_SOON',
    los: 4,
    room: 'CCU-2',
    homeMeds: ['cardiac', 'diabetes'],
    insurance: 0,
  },
  {
    name: 'Nancy Hall',
    birthDate: '1970-04-28',
    gender: 'female' as const,
    condition: 'Pulmonary Embolism',
    readiness: 'READY_SOON',
    los: 5,
    room: '428',
    homeMeds: ['general'],
    insurance: 4,
  },
  {
    name: 'Christopher Young',
    birthDate: '1985-12-10',
    gender: 'male' as const,
    condition: 'Appendicitis Post-Op',
    readiness: 'READY_TODAY',
    los: 2,
    room: '215',
    homeMeds: ['general'],
    insurance: 1,
  },
  {
    name: 'Dorothy King',
    birthDate: '1938-03-22',
    gender: 'female' as const,
    condition: 'Fall with Rib Fractures',
    readiness: 'READY_SOON',
    los: 4,
    room: '330',
    homeMeds: ['cardiac', 'pain', 'general'],
    insurance: 2,
  },
  {
    name: 'Daniel Wright',
    birthDate: '1957-08-05',
    gender: 'male' as const,
    condition: 'Liver Cirrhosis - Decompensated',
    readiness: 'NOT_READY',
    los: 9,
    room: '508',
    homeMeds: ['general'],
    insurance: 5,
  },
  {
    name: 'Betty Scott',
    birthDate: '1943-01-18',
    gender: 'female' as const,
    condition: 'Urinary Tract Infection',
    readiness: 'READY_TODAY',
    los: 2,
    room: '112',
    homeMeds: ['cardiac', 'general'],
    insurance: 2,
  },
  {
    name: 'Mark Thompson',
    birthDate: '1978-10-30',
    gender: 'male' as const,
    condition: 'Asthma Exacerbation',
    readiness: 'READY_TODAY',
    los: 2,
    room: '225',
    homeMeds: ['respiratory'],
    insurance: 0,
  },
  {
    name: 'Karen Phillips',
    birthDate: '1960-07-12',
    gender: 'female' as const,
    condition: 'Hypertensive Emergency',
    readiness: 'READY_SOON',
    los: 3,
    room: '318',
    homeMeds: ['cardiac', 'diabetes'],
    insurance: 3,
  },
  {
    name: 'Steven Robinson',
    birthDate: '1950-05-25',
    gender: 'male' as const,
    condition: 'Bowel Obstruction',
    readiness: 'NOT_READY',
    los: 6,
    room: '420',
    homeMeds: ['general', 'pain'],
    insurance: 1,
  },
  {
    name: 'Helen Carter',
    birthDate: '1935-12-08',
    gender: 'female' as const,
    condition: 'Syncope - Cardiac',
    readiness: 'READY_SOON',
    los: 3,
    room: '205',
    homeMeds: ['cardiac', 'general'],
    insurance: 2,
  },
  {
    name: 'George Mitchell',
    birthDate: '1968-02-28',
    gender: 'male' as const,
    condition: 'Alcohol Withdrawal',
    readiness: 'READY_SOON',
    los: 4,
    room: '115',
    homeMeds: ['general'],
    insurance: 5,
  },
]

async function seedPatients() {
  console.log('🏥 Seeding FHIR data...')
  console.log('========================')

  for (const patientData of patients) {
    try {
      // Create Patient
      const [firstName, lastName] = patientData.name.split(' ')
      const patient = await medplum.createResource<Patient>({
        resourceType: 'Patient',
        name: [{ given: [firstName], family: lastName }],
        birthDate: patientData.birthDate,
        gender: patientData.gender,
        identifier: [
          {
            type: { coding: [{ code: 'MR' }] },
            value: `MRN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          },
        ],
      })

      console.log(`✅ Created patient: ${patientData.name} (${patient.id})`)

      // Create Encounter
      const admitDate = new Date()
      admitDate.setDate(admitDate.getDate() - patientData.los)

      const encounter = await medplum.createResource<Encounter>({
        resourceType: 'Encounter',
        status: 'in-progress',
        class: { code: 'IMP', display: 'Inpatient' },
        subject: { reference: `Patient/${patient.id}` },
        period: { start: admitDate.toISOString() },
        location: [
          {
            location: {
              display: `Room ${patientData.room}`,
            },
          },
        ],
        reasonCode: [{ text: patientData.condition }],
      })

      // Create Condition
      await medplum.createResource({
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [{ code: 'active', display: 'Active' }],
        },
        code: { text: patientData.condition },
        subject: { reference: `Patient/${patient.id}` },
        encounter: { reference: `Encounter/${encounter.id}` },
      })

      // Create Vitals
      await createVitals(patient.id!, encounter.id!)

      // Create Labs
      await createLabs(patient.id!, encounter.id!, patientData.readiness)

      // Create Medications
      await createMedications(patient.id!, encounter.id!, patientData.condition)

      // Create pending tests for NOT_READY patients
      if (patientData.readiness === 'NOT_READY') {
        await createPendingTests(patient.id!, encounter.id!)
      }

      // Create home medications (pre-admission)
      if (patientData.homeMeds) {
        await createHomeMedications(patient.id!, patientData.homeMeds)
      }

      // Create imaging studies
      await createImagingStudies(patient.id!, encounter.id!, patientData.condition)

      // Create insurance coverage
      if (patientData.insurance !== undefined) {
        await createInsuranceCoverage(patient.id!, patientData.insurance)
      }

      console.log(`   └─ Added clinical data, home meds, imaging, insurance`)
    } catch (error) {
      console.error(`❌ Failed to create ${patientData.name}:`, error)
    }
  }

  console.log('')
  console.log('========================')
  console.log('✅ Seeding complete!')
  console.log(`📊 Created ${patients.length} patients with clinical data`)
}

async function createVitals(patientId: string, encounterId: string) {
  // Time intervals in hours from now: 0, 1, 2, 4, 8, 12, 16, 20, 24, 36, 48
  const hoursAgo = [0, 1, 2, 4, 8, 12, 16, 20, 24, 36, 48]
  
  // Base vital definitions with typical ranges and trends
  const vitalDefs = [
    { code: '8867-4', display: 'Heart Rate', base: 78, variance: 15, unit: '/min', trend: 'improving' },
    { code: '8310-5', display: 'Body Temperature', base: 98.6, variance: 1.5, unit: 'degF', trend: 'stable' },
    { code: '8480-6', display: 'Systolic BP', base: 128, variance: 18, unit: 'mmHg', trend: 'improving' },
    { code: '8462-4', display: 'Diastolic BP', base: 78, variance: 12, unit: 'mmHg', trend: 'stable' },
    { code: '9279-1', display: 'Respiratory Rate', base: 16, variance: 4, unit: '/min', trend: 'improving' },
    { code: '2708-6', display: 'Oxygen Saturation', base: 96, variance: 3, unit: '%', trend: 'improving' },
  ]

  for (const hours of hoursAgo) {
    const timestamp = new Date()
    timestamp.setHours(timestamp.getHours() - hours)
    
    for (const vital of vitalDefs) {
      // Create realistic trend: values were worse earlier, improving over time
      let trendFactor = 0
      if (vital.trend === 'improving') {
        trendFactor = (hours / 48) * vital.variance * 0.5 // Worse in past
      }
      
      const value = vital.base + trendFactor + (Math.random() - 0.5) * vital.variance
      
      await medplum.createResource({
        resourceType: 'Observation',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
        code: {
          coding: [{ system: 'http://loinc.org', code: vital.code }],
          text: vital.display,
        },
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        effectiveDateTime: timestamp.toISOString(),
        valueQuantity: { 
          value: Math.round(value * 10) / 10, 
          unit: vital.unit,
          system: 'http://unitsofmeasure.org',
        },
      })
    }
  }
}

async function createLabs(patientId: string, encounterId: string, readiness: string) {
  const isAbnormal = readiness === 'NOT_READY'
  const now = new Date()

  // Basic metabolic panel labs with reference ranges
  const bmpLabs = [
    { code: '2160-0', display: 'Creatinine', baseNormal: 1.0, baseAbnormal: 2.1, unit: 'mg/dL', refLow: 0.7, refHigh: 1.3 },
    { code: '6299-2', display: 'BUN', baseNormal: 15, baseAbnormal: 35, unit: 'mg/dL', refLow: 7, refHigh: 20 },
    { code: '2951-2', display: 'Sodium', baseNormal: 140, baseAbnormal: 132, unit: 'mmol/L', refLow: 136, refHigh: 145 },
    { code: '2823-3', display: 'Potassium', baseNormal: 4.2, baseAbnormal: 5.5, unit: 'mmol/L', refLow: 3.5, refHigh: 5.0 },
    { code: '2028-9', display: 'CO2', baseNormal: 24, baseAbnormal: 18, unit: 'mmol/L', refLow: 22, refHigh: 29 },
    { code: '2345-7', display: 'Glucose', baseNormal: 100, baseAbnormal: 180, unit: 'mg/dL', refLow: 70, refHigh: 100 },
    { code: '17861-6', display: 'Calcium', baseNormal: 9.2, baseAbnormal: 8.1, unit: 'mg/dL', refLow: 8.5, refHigh: 10.5 },
  ]

  // CBC labs
  const cbcLabs = [
    { code: '6690-2', display: 'WBC', baseNormal: 7.5, baseAbnormal: 14.5, unit: '10*3/uL', refLow: 4.5, refHigh: 11.0 },
    { code: '718-7', display: 'Hemoglobin', baseNormal: 13.5, baseAbnormal: 9.2, unit: 'g/dL', refLow: 12.0, refHigh: 17.5 },
    { code: '4544-3', display: 'Hematocrit', baseNormal: 42, baseAbnormal: 28, unit: '%', refLow: 36, refHigh: 48 },
    { code: '777-3', display: 'Platelets', baseNormal: 250, baseAbnormal: 95, unit: '10*3/uL', refLow: 150, refHigh: 400 },
  ]

  // Liver function tests
  const lftLabs = [
    { code: '1742-6', display: 'ALT', baseNormal: 25, baseAbnormal: 85, unit: 'U/L', refLow: 7, refHigh: 56 },
    { code: '1920-8', display: 'AST', baseNormal: 22, baseAbnormal: 120, unit: 'U/L', refLow: 10, refHigh: 40 },
    { code: '6768-6', display: 'Alk Phos', baseNormal: 70, baseAbnormal: 180, unit: 'U/L', refLow: 44, refHigh: 147 },
    { code: '1975-2', display: 'Total Bilirubin', baseNormal: 0.8, baseAbnormal: 2.5, unit: 'mg/dL', refLow: 0.1, refHigh: 1.2 },
    { code: '2885-2', display: 'Total Protein', baseNormal: 7.0, baseAbnormal: 5.8, unit: 'g/dL', refLow: 6.0, refHigh: 8.3 },
    { code: '1751-7', display: 'Albumin', baseNormal: 4.0, baseAbnormal: 2.8, unit: 'g/dL', refLow: 3.4, refHigh: 5.4 },
  ]

  // Cardiac markers
  const cardiacLabs = [
    { code: '33762-6', display: 'BNP', baseNormal: 80, baseAbnormal: 850, unit: 'pg/mL', refLow: 0, refHigh: 100 },
    { code: '10839-9', display: 'Troponin I', baseNormal: 0.01, baseAbnormal: 0.45, unit: 'ng/mL', refLow: 0, refHigh: 0.04 },
  ]

  // Coagulation
  const coagLabs = [
    { code: '5902-2', display: 'PT', baseNormal: 12, baseAbnormal: 16, unit: 'sec', refLow: 11, refHigh: 13.5 },
    { code: '6301-6', display: 'INR', baseNormal: 1.0, baseAbnormal: 1.8, unit: 'ratio', refLow: 0.9, refHigh: 1.1 },
    { code: '3173-2', display: 'PTT', baseNormal: 30, baseAbnormal: 45, unit: 'sec', refLow: 25, refHigh: 35 },
  ]

  // Inflammatory markers
  const inflammLabs = [
    { code: '1988-5', display: 'CRP', baseNormal: 0.5, baseAbnormal: 12, unit: 'mg/dL', refLow: 0, refHigh: 1 },
    { code: '4537-7', display: 'ESR', baseNormal: 10, baseAbnormal: 65, unit: 'mm/hr', refLow: 0, refHigh: 20 },
    { code: '75241-0', display: 'Procalcitonin', baseNormal: 0.05, baseAbnormal: 2.5, unit: 'ng/mL', refLow: 0, refHigh: 0.1 },
  ]

  // Urinalysis
  const uaLabs = [
    { code: '5811-5', display: 'UA Specific Gravity', baseNormal: 1.015, baseAbnormal: 1.030, unit: 'ratio', refLow: 1.005, refHigh: 1.030 },
    { code: '5803-2', display: 'UA pH', baseNormal: 6.0, baseAbnormal: 5.0, unit: 'pH', refLow: 5.0, refHigh: 8.0 },
  ]

  // Time periods for lab draws (days ago)
  // Pattern: Outpatient (60-45 days ago), gap, then 7 days inpatient, then current 3 days
  const labTimePoints = [
    // Outpatient baseline (2 months ago, weekly)
    { daysAgo: 60, context: 'outpatient', panels: ['bmp', 'cbc'] },
    { daysAgo: 53, context: 'outpatient', panels: ['bmp'] },
    { daysAgo: 45, context: 'outpatient', panels: ['bmp', 'cbc', 'lft'] },
    // Gap of ~1 month...
    // Admission labs (7 days ago)
    { daysAgo: 7, context: 'admission', panels: ['bmp', 'cbc', 'lft', 'cardiac', 'coag', 'inflamm', 'ua'] },
    { daysAgo: 6, context: 'inpatient', panels: ['bmp', 'cbc'] },
    { daysAgo: 5, context: 'inpatient', panels: ['bmp', 'cbc', 'cardiac'] },
    { daysAgo: 4, context: 'inpatient', panels: ['bmp', 'cbc'] },
    { daysAgo: 3, context: 'inpatient', panels: ['bmp', 'cbc', 'lft', 'inflamm'] },
    { daysAgo: 2, context: 'inpatient', panels: ['bmp', 'cbc'] },
    { daysAgo: 1, context: 'inpatient', panels: ['bmp', 'cbc', 'cardiac'] },
    { daysAgo: 0, context: 'inpatient', panels: ['bmp', 'cbc'] },
  ]

  const panelMap: Record<string, typeof bmpLabs> = {
    bmp: bmpLabs,
    cbc: cbcLabs,
    lft: lftLabs,
    cardiac: cardiacLabs,
    coag: coagLabs,
    inflamm: inflammLabs,
    ua: uaLabs,
  }

  // Create labs for each time point
  for (const timePoint of labTimePoints) {
    const labDate = new Date(now)
    labDate.setDate(labDate.getDate() - timePoint.daysAgo)
    // Add some hour variation
    labDate.setHours(5 + Math.floor(Math.random() * 4)) // 5-8 AM draws
    
    for (const panelName of timePoint.panels) {
      const panel = panelMap[panelName]
      if (!panel) continue

      for (const lab of panel) {
        // Outpatient labs are more normal, inpatient shows progression
        let value: number
        if (timePoint.context === 'outpatient') {
          value = lab.baseNormal + (Math.random() - 0.5) * (lab.refHigh - lab.refLow) * 0.3
        } else if (timePoint.context === 'admission') {
          value = isAbnormal ? lab.baseAbnormal : lab.baseNormal + (Math.random() - 0.5) * 0.5
        } else {
          // Inpatient: trend toward normal over time
          const improvementFactor = (7 - timePoint.daysAgo) / 7
          const abnormalDelta = lab.baseAbnormal - lab.baseNormal
          value = isAbnormal 
            ? lab.baseAbnormal - (abnormalDelta * improvementFactor * 0.6) + (Math.random() - 0.5) * 0.3
            : lab.baseNormal + (Math.random() - 0.5) * 0.3
        }

        // Determine if abnormal
        const isHigh = value > lab.refHigh
        const isLow = value < lab.refLow
        const interpretation = isHigh ? 'H' : isLow ? 'L' : 'N'

        await medplum.createResource({
          resourceType: 'Observation',
          status: 'final',
          category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
          code: {
            coding: [{ system: 'http://loinc.org', code: lab.code }],
            text: lab.display,
          },
          subject: { reference: `Patient/${patientId}` },
          encounter: timePoint.context !== 'outpatient' ? { reference: `Encounter/${encounterId}` } : undefined,
          effectiveDateTime: labDate.toISOString(),
          valueQuantity: { 
            value: Math.round(value * 100) / 100, 
            unit: lab.unit,
            system: 'http://unitsofmeasure.org',
          },
          referenceRange: [{
            low: { value: lab.refLow, unit: lab.unit },
            high: { value: lab.refHigh, unit: lab.unit },
          }],
          interpretation: interpretation !== 'N' ? [{ 
            coding: [{ 
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: interpretation,
              display: interpretation === 'H' ? 'High' : 'Low',
            }] 
          }] : undefined,
        })
      }
    }
  }

  // Create microbiology cultures
  await createCultures(patientId, encounterId, isAbnormal)
  
  // Create cytology and special tests
  await createSpecialTests(patientId, encounterId)
}

async function createCultures(patientId: string, encounterId: string, hasPositiveCulture: boolean) {
  const now = new Date()
  
  // Blood cultures
  const bloodCultureDate = new Date(now)
  bloodCultureDate.setDate(bloodCultureDate.getDate() - 6)
  
  await medplum.createResource({
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
    code: {
      coding: [{ system: 'http://loinc.org', code: '600-7' }],
      text: 'Blood Culture',
    },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: bloodCultureDate.toISOString(),
    valueString: hasPositiveCulture ? 'POSITIVE - Staphylococcus aureus (MSSA)' : 'No growth after 5 days',
    interpretation: hasPositiveCulture ? [{
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'POS', display: 'Positive' }]
    }] : [{
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'NEG', display: 'Negative' }]
    }],
  })

  // Urine culture
  const urineCultureDate = new Date(now)
  urineCultureDate.setDate(urineCultureDate.getDate() - 5)
  
  const urineCulturePositive = Math.random() > 0.6
  await medplum.createResource({
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
    code: {
      coding: [{ system: 'http://loinc.org', code: '630-4' }],
      text: 'Urine Culture',
    },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: urineCultureDate.toISOString(),
    valueString: urineCulturePositive 
      ? 'POSITIVE - Escherichia coli >100,000 CFU/mL. Sensitive to: Ciprofloxacin, Nitrofurantoin, TMP-SMX' 
      : 'No significant growth (<10,000 CFU/mL)',
    interpretation: urineCulturePositive ? [{
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'POS', display: 'Positive' }]
    }] : [{
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'NEG', display: 'Negative' }]
    }],
  })

  // Respiratory culture (sputum)
  const sputumCultureDate = new Date(now)
  sputumCultureDate.setDate(sputumCultureDate.getDate() - 4)
  
  await medplum.createResource({
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
    code: {
      coding: [{ system: 'http://loinc.org', code: '624-7' }],
      text: 'Sputum Culture',
    },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: sputumCultureDate.toISOString(),
    valueString: 'Normal respiratory flora. No pathogenic organisms isolated.',
    interpretation: [{
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'NEG', display: 'Negative' }]
    }],
  })

  // C. diff toxin
  const cdiffDate = new Date(now)
  cdiffDate.setDate(cdiffDate.getDate() - 3)
  
  await medplum.createResource({
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
    code: {
      coding: [{ system: 'http://loinc.org', code: '34713-8' }],
      text: 'C. difficile Toxin PCR',
    },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: cdiffDate.toISOString(),
    valueString: 'NOT DETECTED',
    interpretation: [{
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'NEG', display: 'Negative' }]
    }],
  })

  // MRSA nasal screen
  await medplum.createResource({
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
    code: {
      coding: [{ system: 'http://loinc.org', code: '35473-8' }],
      text: 'MRSA Nasal Screen PCR',
    },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: bloodCultureDate.toISOString(),
    valueString: Math.random() > 0.8 ? 'DETECTED' : 'NOT DETECTED',
  })
}

async function createSpecialTests(patientId: string, encounterId: string) {
  const now = new Date()

  // Urinalysis with microscopy
  const uaDate = new Date(now)
  uaDate.setDate(uaDate.getDate() - 6)
  
  const uaComponents = [
    { code: '5767-9', display: 'UA Appearance', value: 'Cloudy' },
    { code: '5778-6', display: 'UA Color', value: 'Yellow' },
    { code: '20505-4', display: 'UA WBC', value: '10-25 /HPF' },
    { code: '5821-4', display: 'UA RBC', value: '0-2 /HPF' },
    { code: '5802-4', display: 'UA Bacteria', value: 'Few' },
    { code: '5794-3', display: 'UA Epithelial Cells', value: 'Few' },
    { code: '5799-2', display: 'UA Leukocyte Esterase', value: 'Positive' },
    { code: '5802-4', display: 'UA Nitrite', value: 'Negative' },
    { code: '5804-0', display: 'UA Protein', value: 'Trace' },
    { code: '5792-7', display: 'UA Glucose', value: 'Negative' },
  ]

  for (const ua of uaComponents) {
    await medplum.createResource({
      resourceType: 'Observation',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
      code: {
        coding: [{ system: 'http://loinc.org', code: ua.code }],
        text: ua.display,
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: uaDate.toISOString(),
      valueString: ua.value,
    })
  }

  // Cytology - Pleural fluid (for some patients)
  if (Math.random() > 0.5) {
    const cytologyDate = new Date(now)
    cytologyDate.setDate(cytologyDate.getDate() - 4)
    
    await medplum.createResource({
      resourceType: 'Observation',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '19080-6' }],
        text: 'Pleural Fluid Cytology',
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: cytologyDate.toISOString(),
      valueString: 'NEGATIVE FOR MALIGNANT CELLS. Reactive mesothelial cells and mixed inflammatory cells present. No atypical cells identified.',
    })
  }

  // Stool studies
  if (Math.random() > 0.6) {
    const stoolDate = new Date(now)
    stoolDate.setDate(stoolDate.getDate() - 2)

    await medplum.createResource({
      resourceType: 'Observation',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '2335-8' }],
        text: 'Fecal Occult Blood',
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: stoolDate.toISOString(),
      valueString: Math.random() > 0.7 ? 'POSITIVE' : 'NEGATIVE',
    })

    // GI pathogen panel
    await medplum.createResource({
      resourceType: 'Observation',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '82197-2' }],
        text: 'GI Pathogen Panel PCR',
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: stoolDate.toISOString(),
      valueString: 'All targets NOT DETECTED: Salmonella, Shigella, Campylobacter, E.coli O157, Norovirus, Rotavirus',
    })
  }

  // Respiratory viral panel
  const rvpDate = new Date(now)
  rvpDate.setDate(rvpDate.getDate() - 6)

  await medplum.createResource({
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
    code: {
      coding: [{ system: 'http://loinc.org', code: '92142-9' }],
      text: 'Respiratory Viral Panel PCR',
    },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: rvpDate.toISOString(),
    valueString: Math.random() > 0.7 
      ? 'DETECTED: Rhinovirus/Enterovirus. NOT DETECTED: Influenza A, Influenza B, RSV, COVID-19, Parainfluenza, Adenovirus, hMPV'
      : 'All targets NOT DETECTED: Influenza A, Influenza B, RSV, COVID-19, Rhinovirus, Parainfluenza, Adenovirus, hMPV',
  })

  // COVID-19 test
  await medplum.createResource({
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
    code: {
      coding: [{ system: 'http://loinc.org', code: '94500-6' }],
      text: 'SARS-CoV-2 RNA PCR',
    },
    subject: { reference: `Patient/${patientId}` },
    encounter: { reference: `Encounter/${encounterId}` },
    effectiveDateTime: rvpDate.toISOString(),
    valueString: 'NOT DETECTED',
    interpretation: [{
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'NEG', display: 'Negative' }]
    }],
  })

  // Thyroid function
  if (Math.random() > 0.5) {
    const thyroidDate = new Date(now)
    thyroidDate.setDate(thyroidDate.getDate() - 5)

    await medplum.createResource({
      resourceType: 'Observation',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '3016-3' }],
        text: 'TSH',
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: thyroidDate.toISOString(),
      valueQuantity: { value: 1.5 + Math.random() * 2, unit: 'mIU/L' },
      referenceRange: [{ low: { value: 0.4, unit: 'mIU/L' }, high: { value: 4.0, unit: 'mIU/L' } }],
    })

    await medplum.createResource({
      resourceType: 'Observation',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '3026-2' }],
        text: 'Free T4',
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: thyroidDate.toISOString(),
      valueQuantity: { value: 1.0 + Math.random() * 0.6, unit: 'ng/dL' },
      referenceRange: [{ low: { value: 0.8, unit: 'ng/dL' }, high: { value: 1.8, unit: 'ng/dL' } }],
    })
  }

  // HbA1c (for diabetics)
  if (Math.random() > 0.4) {
    const a1cDate = new Date(now)
    a1cDate.setDate(a1cDate.getDate() - 5)

    await medplum.createResource({
      resourceType: 'Observation',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }] }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '4548-4' }],
        text: 'Hemoglobin A1c',
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: a1cDate.toISOString(),
      valueQuantity: { value: 6.5 + Math.random() * 3, unit: '%' },
      referenceRange: [{ high: { value: 5.7, unit: '%' }, text: 'Normal: <5.7%, Pre-diabetes: 5.7-6.4%, Diabetes: ≥6.5%' }],
    })
  }
}

async function createMedications(patientId: string, encounterId: string, condition: string) {
  const baseMeds = [
    { name: 'Acetaminophen 650mg', frequency: 'Q6H PRN' },
    { name: 'Omeprazole 40mg', frequency: 'Daily' },
  ]

  // Add condition-specific medications
  const conditionMeds: Record<string, Array<{ name: string; frequency: string }>> = {
    'CHF Exacerbation': [
      { name: 'Furosemide 40mg IV', frequency: 'BID' },
      { name: 'Lisinopril 10mg', frequency: 'Daily' },
      { name: 'Metoprolol 25mg', frequency: 'BID' },
    ],
    'COPD Exacerbation': [
      { name: 'Prednisone 40mg', frequency: 'Daily' },
      { name: 'Albuterol Nebulizer', frequency: 'Q4H' },
      { name: 'Azithromycin 250mg', frequency: 'Daily' },
    ],
    'Community Acquired Pneumonia': [
      { name: 'Ceftriaxone 1g IV', frequency: 'Daily' },
      { name: 'Azithromycin 500mg', frequency: 'Daily' },
    ],
    Cellulitis: [
      { name: 'Vancomycin 1g IV', frequency: 'Q12H' },
      { name: 'Cefazolin 1g IV', frequency: 'Q8H' },
    ],
    'Acute Kidney Injury': [
      { name: 'Normal Saline', frequency: 'Continuous' },
    ],
  }

  const medications = [...baseMeds, ...(conditionMeds[condition] || [])]

  for (const med of medications) {
    await medplum.createResource({
      resourceType: 'MedicationRequest',
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: { text: med.name },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      dosageInstruction: [{ timing: { code: { text: med.frequency } } }],
    })
  }
}

async function createPendingTests(patientId: string, encounterId: string) {
  const pendingTests = [
    { name: 'Echocardiogram', status: 'registered' as const },
    { name: 'CT Abdomen/Pelvis', status: 'preliminary' as const },
  ]

  for (const test of pendingTests) {
    await medplum.createResource({
      resourceType: 'DiagnosticReport',
      status: test.status,
      code: { text: test.name },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
    })
  }
}

async function createHomeMedications(patientId: string, medCategories: string[]) {
  const allMeds: Array<{ name: string; dose: string; frequency: string; rxcui?: string; covered?: boolean }> = []
  
  for (const category of medCategories) {
    const meds = homeMedicationSets[category]
    if (meds) {
      allMeds.push(...meds)
    }
  }

  // Remove duplicates by name
  const uniqueMeds = allMeds.filter((med, index, self) =>
    index === self.findIndex((m) => m.name === med.name)
  )

  for (const med of uniqueMeds) {
    await medplum.createResource({
      resourceType: 'MedicationStatement',
      status: 'active',
      medicationCodeableConcept: {
        text: `${med.name} ${med.dose}`,
        coding: med.rxcui ? [{
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: med.rxcui,
          display: med.name,
        }] : undefined,
      },
      subject: { reference: `Patient/${patientId}` },
      category: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/medication-statement-category',
          code: 'community',
          display: 'Community',
        }],
      },
      dosage: [{
        text: `${med.dose} ${med.frequency}`,
        timing: { code: { text: med.frequency } },
      }],
      note: med.covered === false ? [{ text: 'May not be covered by insurance - prior auth may be required' }] : undefined,
    })
  }
}

async function createImagingStudies(patientId: string, encounterId: string, condition: string) {
  // Select 2-4 relevant imaging studies based on condition
  const conditionImaging: Record<string, string[]> = {
    'CHF Exacerbation': ['Chest X-Ray', 'Echocardiogram'],
    'COPD Exacerbation': ['Chest X-Ray', 'CT Chest with Contrast'],
    'Community Acquired Pneumonia': ['Chest X-Ray'],
    'Cellulitis': ['Lower Extremity Doppler'],
    'Acute Kidney Injury': ['Renal Ultrasound', 'Abdominal X-Ray'],
    'Atrial Fibrillation with RVR': ['Chest X-Ray', 'Echocardiogram'],
    'Diabetic Ketoacidosis': ['Chest X-Ray', 'Abdominal X-Ray'],
    'Acute Pancreatitis': ['CT Abdomen/Pelvis', 'Abdominal X-Ray'],
    'Hip Fracture Post-Op': ['Abdominal X-Ray'],
    'GI Bleed': ['CT Abdomen/Pelvis', 'Abdominal X-Ray'],
    'Stroke - CVA': ['MRI Brain', 'CT Chest with Contrast'],
    'Sepsis': ['Chest X-Ray', 'CT Abdomen/Pelvis'],
    'Acute MI - NSTEMI': ['Chest X-Ray', 'Echocardiogram'],
    'Pulmonary Embolism': ['CT Chest with Contrast', 'Lower Extremity Doppler', 'Chest X-Ray'],
    'Appendicitis Post-Op': ['CT Abdomen/Pelvis'],
    'Fall with Rib Fractures': ['Chest X-Ray', 'CT Chest with Contrast'],
    'Liver Cirrhosis - Decompensated': ['CT Abdomen/Pelvis', 'Abdominal X-Ray'],
    'Urinary Tract Infection': ['Renal Ultrasound'],
    'Asthma Exacerbation': ['Chest X-Ray'],
    'Hypertensive Emergency': ['Chest X-Ray', 'Echocardiogram', 'MRI Brain'],
    'Bowel Obstruction': ['CT Abdomen/Pelvis', 'Abdominal X-Ray'],
    'Syncope - Cardiac': ['Chest X-Ray', 'Echocardiogram'],
    'Alcohol Withdrawal': ['Chest X-Ray', 'CT Abdomen/Pelvis'],
  }

  const selectedNames = conditionImaging[condition] || ['Chest X-Ray']
  const selectedStudies = imagingStudies.filter(s => selectedNames.includes(s.name))

  for (const study of selectedStudies) {
    const studyDate = new Date()
    studyDate.setDate(studyDate.getDate() - Math.floor(Math.random() * 3)) // Within last 3 days

    await medplum.createResource({
      resourceType: 'DiagnosticReport',
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'RAD',
          display: 'Radiology',
        }],
      }],
      code: {
        text: study.name,
        coding: [{
          system: 'http://loinc.org',
          display: study.name,
        }],
      },
      subject: { reference: `Patient/${patientId}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: studyDate.toISOString(),
      conclusion: study.findings,
      conclusionCode: [{
        text: study.modality === 'XR' ? 'No acute findings' :
              study.modality === 'CT' ? 'See detailed report' :
              study.modality === 'US' ? 'Normal study' : 'See report',
      }],
    })
  }
}

async function createInsuranceCoverage(patientId: string, insuranceIndex: number) {
  const plan = insurancePlans[insuranceIndex]
  if (!plan) return

  // Create insurer organization
  const insurer = await medplum.createResource<Organization>({
    resourceType: 'Organization',
    name: plan.name,
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'ins',
        display: 'Insurance Company',
      }],
    }],
    identifier: [{
      system: 'http://example.org/insurers',
      value: plan.name.toLowerCase().replace(/\s+/g, '-'),
    }],
  })

  // Create coverage
  await medplum.createResource<Coverage>({
    resourceType: 'Coverage',
    status: 'active',
    type: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: plan.type === 'Medicare' ? 'RETIRE' :
              plan.type === 'Medicaid' ? 'SUBSIDIZ' : 'EHCPOL',
        display: plan.type,
      }],
    },
    subscriber: { reference: `Patient/${patientId}` },
    beneficiary: { reference: `Patient/${patientId}` },
    payor: [{ reference: `Organization/${insurer.id}` }],
    class: [{
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/coverage-class',
          code: 'plan',
        }],
      },
      value: plan.formularyTier,
      name: `${plan.name} - ${plan.formularyTier} formulary`,
    }],
  })
}

async function seedPharmacies() {
  console.log('🏪 Seeding pharmacies...')
  
  for (const pharmacy of pharmacies) {
    await medplum.createResource<Organization>({
      resourceType: 'Organization',
      name: pharmacy.name,
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/organization-type',
          code: 'prov',
          display: 'Healthcare Provider',
        }],
        text: 'Pharmacy',
      }],
      telecom: [
        { system: 'phone', value: pharmacy.phone },
      ],
      address: [{
        text: pharmacy.address,
        line: [pharmacy.address],
      }],
      extension: pharmacy.hasDelivery ? [{
        url: 'http://example.org/fhir/StructureDefinition/pharmacy-delivery',
        valueBoolean: true,
      }] : undefined,
    })
    console.log(`   ✅ ${pharmacy.name}`)
  }
}

// Run seeding
async function main() {
  try {
    await authenticate()
    await seedPharmacies()
    await seedPatients()
    console.log('')
    console.log('🎉 Seeding complete! FHIR server is ready.')
    console.log('📍 FHIR endpoint: http://localhost:8103/fhir/R4')
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

main()
