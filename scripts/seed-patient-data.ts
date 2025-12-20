#!/usr/bin/env npx ts-node
/**
 * FHIR Patient Data Seed Script
 * Creates realistic clinical data for patients based on their demographics
 */

const AIDBOX_URL = 'https://aoadhslfxc.edge.aidbox.app';
const AUTH = 'Basic ' + Buffer.from('emr-api:emr-secret-123').toString('base64');

interface PatientProfile {
  id: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  age: number;
  clinicalProfile: ClinicalProfile;
}

interface ClinicalProfile {
  conditions: ConditionTemplate[];
  riskFactors: string[];
  commonLabs: string[];
  medications: MedicationTemplate[];
}

interface ConditionTemplate {
  code: string;
  system: string;
  display: string;
  category: string;
}

interface MedicationTemplate {
  code: string;
  display: string;
  dose: string;
  unit: string;
  frequency: string;
  route: string;
}

// Calculate age from birthDate
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Generate clinical profile based on age and gender
function generateClinicalProfile(age: number, gender: 'male' | 'female'): ClinicalProfile {
  const profiles: Record<string, ClinicalProfile> = {
    // Elderly with chronic conditions (65+)
    elderlyMale: {
      conditions: [
        { code: '38341003', system: 'http://snomed.info/sct', display: 'Hypertension', category: 'problem-list-item' },
        { code: '44054006', system: 'http://snomed.info/sct', display: 'Type 2 Diabetes Mellitus', category: 'problem-list-item' },
        { code: '84114007', system: 'http://snomed.info/sct', display: 'Heart Failure', category: 'problem-list-item' },
        { code: '13645005', system: 'http://snomed.info/sct', display: 'Chronic Obstructive Pulmonary Disease', category: 'problem-list-item' },
        { code: '709044004', system: 'http://snomed.info/sct', display: 'Chronic Kidney Disease Stage 3', category: 'problem-list-item' },
        { code: '396275006', system: 'http://snomed.info/sct', display: 'Osteoarthritis', category: 'problem-list-item' },
      ],
      riskFactors: ['smoking_history', 'obesity', 'sedentary'],
      commonLabs: ['BMP', 'CBC', 'Lipid Panel', 'HbA1c', 'BNP', 'TSH'],
      medications: [
        { code: '860975', display: 'Lisinopril 10mg', dose: '10', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '311036', display: 'Metformin 500mg', dose: '500', unit: 'mg', frequency: 'BID', route: 'oral' },
        { code: '197361', display: 'Furosemide 40mg', dose: '40', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '866924', display: 'Metoprolol 25mg', dose: '25', unit: 'mg', frequency: 'BID', route: 'oral' },
        { code: '261962', display: 'Atorvastatin 40mg', dose: '40', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '855318', display: 'Aspirin 81mg', dose: '81', unit: 'mg', frequency: 'QD', route: 'oral' },
      ],
    },
    elderlyFemale: {
      conditions: [
        { code: '38341003', system: 'http://snomed.info/sct', display: 'Hypertension', category: 'problem-list-item' },
        { code: '64859006', system: 'http://snomed.info/sct', display: 'Osteoporosis', category: 'problem-list-item' },
        { code: '35489007', system: 'http://snomed.info/sct', display: 'Depression', category: 'problem-list-item' },
        { code: '396275006', system: 'http://snomed.info/sct', display: 'Osteoarthritis', category: 'problem-list-item' },
        { code: '40930008', system: 'http://snomed.info/sct', display: 'Hypothyroidism', category: 'problem-list-item' },
        { code: '195967001', system: 'http://snomed.info/sct', display: 'Asthma', category: 'problem-list-item' },
      ],
      riskFactors: ['postmenopausal', 'family_history_breast_cancer'],
      commonLabs: ['BMP', 'CBC', 'TSH', 'Vitamin D', 'Calcium', 'DEXA'],
      medications: [
        { code: '197884', display: 'Amlodipine 5mg', dose: '5', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '966247', display: 'Alendronate 70mg', dose: '70', unit: 'mg', frequency: 'Weekly', route: 'oral' },
        { code: '312938', display: 'Sertraline 50mg', dose: '50', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '966571', display: 'Levothyroxine 50mcg', dose: '50', unit: 'mcg', frequency: 'QD', route: 'oral' },
        { code: '746763', display: 'Vitamin D3 2000IU', dose: '2000', unit: 'IU', frequency: 'QD', route: 'oral' },
      ],
    },
    // Middle-aged adult (30-64)
    middleAgeMale: {
      conditions: [
        { code: '38341003', system: 'http://snomed.info/sct', display: 'Hypertension', category: 'problem-list-item' },
        { code: '55822004', system: 'http://snomed.info/sct', display: 'Hyperlipidemia', category: 'problem-list-item' },
        { code: '235856003', system: 'http://snomed.info/sct', display: 'Gastroesophageal Reflux Disease', category: 'problem-list-item' },
        { code: '267432004', system: 'http://snomed.info/sct', display: 'Chronic Low Back Pain', category: 'problem-list-item' },
      ],
      riskFactors: ['stress', 'sedentary', 'family_history_cardiac'],
      commonLabs: ['BMP', 'CBC', 'Lipid Panel', 'LFT', 'PSA'],
      medications: [
        { code: '860975', display: 'Lisinopril 10mg', dose: '10', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '261962', display: 'Atorvastatin 20mg', dose: '20', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '757704', display: 'Omeprazole 20mg', dose: '20', unit: 'mg', frequency: 'QD', route: 'oral' },
      ],
    },
    middleAgeFemale: {
      conditions: [
        { code: '195967001', system: 'http://snomed.info/sct', display: 'Asthma', category: 'problem-list-item' },
        { code: '37796009', system: 'http://snomed.info/sct', display: 'Migraine', category: 'problem-list-item' },
        { code: '197480006', system: 'http://snomed.info/sct', display: 'Anxiety Disorder', category: 'problem-list-item' },
        { code: '40930008', system: 'http://snomed.info/sct', display: 'Hypothyroidism', category: 'problem-list-item' },
      ],
      riskFactors: ['stress', 'family_history_thyroid'],
      commonLabs: ['BMP', 'CBC', 'TSH', 'Vitamin B12'],
      medications: [
        { code: '745679', display: 'Albuterol Inhaler', dose: '90', unit: 'mcg', frequency: 'PRN', route: 'inhalation' },
        { code: '312938', display: 'Sertraline 25mg', dose: '25', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '966571', display: 'Levothyroxine 75mcg', dose: '75', unit: 'mcg', frequency: 'QD', route: 'oral' },
        { code: '861007', display: 'Sumatriptan 50mg', dose: '50', unit: 'mg', frequency: 'PRN', route: 'oral' },
      ],
    },
    // Young adult (18-29)
    youngAdultMale: {
      conditions: [
        { code: '195967001', system: 'http://snomed.info/sct', display: 'Asthma', category: 'problem-list-item' },
        { code: '24079001', system: 'http://snomed.info/sct', display: 'Atopic Dermatitis', category: 'problem-list-item' },
        { code: '267432004', system: 'http://snomed.info/sct', display: 'Chronic Low Back Pain', category: 'problem-list-item' },
      ],
      riskFactors: ['allergies', 'sports_injury'],
      commonLabs: ['CBC', 'BMP'],
      medications: [
        { code: '745679', display: 'Albuterol Inhaler', dose: '90', unit: 'mcg', frequency: 'PRN', route: 'inhalation' },
        { code: '197585', display: 'Ibuprofen 400mg', dose: '400', unit: 'mg', frequency: 'PRN', route: 'oral' },
      ],
    },
    youngAdultFemale: {
      conditions: [
        { code: '37796009', system: 'http://snomed.info/sct', display: 'Migraine', category: 'problem-list-item' },
        { code: '197480006', system: 'http://snomed.info/sct', display: 'Anxiety Disorder', category: 'problem-list-item' },
        { code: '14304000', system: 'http://snomed.info/sct', display: 'Iron Deficiency Anemia', category: 'problem-list-item' },
      ],
      riskFactors: ['stress', 'menstrual_irregularity'],
      commonLabs: ['CBC', 'Iron Panel', 'TSH'],
      medications: [
        { code: '312938', display: 'Sertraline 50mg', dose: '50', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '316965', display: 'Ferrous Sulfate 325mg', dose: '325', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '861007', display: 'Sumatriptan 50mg', dose: '50', unit: 'mg', frequency: 'PRN', route: 'oral' },
      ],
    },
    // Pediatric (10-17)
    pediatricMale: {
      conditions: [
        { code: '195967001', system: 'http://snomed.info/sct', display: 'Asthma', category: 'problem-list-item' },
        { code: '406506008', system: 'http://snomed.info/sct', display: 'ADHD', category: 'problem-list-item' },
        { code: '21522001', system: 'http://snomed.info/sct', display: 'Seasonal Allergies', category: 'problem-list-item' },
      ],
      riskFactors: ['allergies', 'family_history_asthma'],
      commonLabs: ['CBC'],
      medications: [
        { code: '745679', display: 'Albuterol Inhaler', dose: '90', unit: 'mcg', frequency: 'PRN', route: 'inhalation' },
        { code: '884173', display: 'Methylphenidate 10mg', dose: '10', unit: 'mg', frequency: 'QD', route: 'oral' },
        { code: '995104', display: 'Cetirizine 10mg', dose: '10', unit: 'mg', frequency: 'QD', route: 'oral' },
      ],
    },
    pediatricFemale: {
      conditions: [
        { code: '24079001', system: 'http://snomed.info/sct', display: 'Atopic Dermatitis', category: 'problem-list-item' },
        { code: '21522001', system: 'http://snomed.info/sct', display: 'Seasonal Allergies', category: 'problem-list-item' },
      ],
      riskFactors: ['allergies', 'eczema'],
      commonLabs: ['CBC'],
      medications: [
        { code: '995104', display: 'Cetirizine 10mg', dose: '10', unit: 'mg', frequency: 'QD', route: 'oral' },
      ],
    },
    // Child (0-9)
    childMale: {
      conditions: [
        { code: '195967001', system: 'http://snomed.info/sct', display: 'Asthma', category: 'problem-list-item' },
        { code: '24079001', system: 'http://snomed.info/sct', display: 'Atopic Dermatitis', category: 'problem-list-item' },
      ],
      riskFactors: ['allergies'],
      commonLabs: ['CBC'],
      medications: [
        { code: '745679', display: 'Albuterol Inhaler', dose: '90', unit: 'mcg', frequency: 'PRN', route: 'inhalation' },
      ],
    },
    childFemale: {
      conditions: [
        { code: '21522001', system: 'http://snomed.info/sct', display: 'Seasonal Allergies', category: 'problem-list-item' },
      ],
      riskFactors: ['allergies'],
      commonLabs: ['CBC'],
      medications: [
        { code: '995104', display: 'Cetirizine 5mg', dose: '5', unit: 'mg', frequency: 'QD', route: 'oral' },
      ],
    },
  };

  // Select profile based on age and gender
  let profileKey: string;
  if (age >= 65) {
    profileKey = gender === 'male' ? 'elderlyMale' : 'elderlyFemale';
  } else if (age >= 30) {
    profileKey = gender === 'male' ? 'middleAgeMale' : 'middleAgeFemale';
  } else if (age >= 18) {
    profileKey = gender === 'male' ? 'youngAdultMale' : 'youngAdultFemale';
  } else if (age >= 10) {
    profileKey = gender === 'male' ? 'pediatricMale' : 'pediatricFemale';
  } else {
    profileKey = gender === 'male' ? 'childMale' : 'childFemale';
  }

  return profiles[profileKey];
}

// Generate random date within range
function randomDate(startDays: number, endDays: number): string {
  const now = new Date();
  const start = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() - endDays * 24 * 60 * 60 * 1000);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString();
}

// Generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Lab result definitions with reference ranges
const labDefinitions: Record<string, { code: string; display: string; unit: string; low: number; high: number; system: string }> = {
  sodium: { code: '2951-2', display: 'Sodium', unit: 'mmol/L', low: 136, high: 145, system: 'http://loinc.org' },
  potassium: { code: '2823-3', display: 'Potassium', unit: 'mmol/L', low: 3.5, high: 5.0, system: 'http://loinc.org' },
  chloride: { code: '2075-0', display: 'Chloride', unit: 'mmol/L', low: 98, high: 106, system: 'http://loinc.org' },
  co2: { code: '2028-9', display: 'CO2', unit: 'mmol/L', low: 22, high: 29, system: 'http://loinc.org' },
  bun: { code: '3094-0', display: 'BUN', unit: 'mg/dL', low: 7, high: 20, system: 'http://loinc.org' },
  creatinine: { code: '2160-0', display: 'Creatinine', unit: 'mg/dL', low: 0.7, high: 1.3, system: 'http://loinc.org' },
  glucose: { code: '2345-7', display: 'Glucose', unit: 'mg/dL', low: 70, high: 100, system: 'http://loinc.org' },
  calcium: { code: '17861-6', display: 'Calcium', unit: 'mg/dL', low: 8.5, high: 10.5, system: 'http://loinc.org' },
  wbc: { code: '6690-2', display: 'WBC', unit: '10*3/uL', low: 4.5, high: 11.0, system: 'http://loinc.org' },
  rbc: { code: '789-8', display: 'RBC', unit: '10*6/uL', low: 4.2, high: 5.9, system: 'http://loinc.org' },
  hemoglobin: { code: '718-7', display: 'Hemoglobin', unit: 'g/dL', low: 12.0, high: 17.5, system: 'http://loinc.org' },
  hematocrit: { code: '4544-3', display: 'Hematocrit', unit: '%', low: 36, high: 50, system: 'http://loinc.org' },
  platelets: { code: '777-3', display: 'Platelets', unit: '10*3/uL', low: 150, high: 400, system: 'http://loinc.org' },
  cholesterol: { code: '2093-3', display: 'Total Cholesterol', unit: 'mg/dL', low: 0, high: 200, system: 'http://loinc.org' },
  ldl: { code: '2089-1', display: 'LDL Cholesterol', unit: 'mg/dL', low: 0, high: 100, system: 'http://loinc.org' },
  hdl: { code: '2085-9', display: 'HDL Cholesterol', unit: 'mg/dL', low: 40, high: 200, system: 'http://loinc.org' },
  triglycerides: { code: '2571-8', display: 'Triglycerides', unit: 'mg/dL', low: 0, high: 150, system: 'http://loinc.org' },
  hba1c: { code: '4548-4', display: 'HbA1c', unit: '%', low: 4.0, high: 5.6, system: 'http://loinc.org' },
  tsh: { code: '3016-3', display: 'TSH', unit: 'mIU/L', low: 0.4, high: 4.0, system: 'http://loinc.org' },
  bnp: { code: '42637-9', display: 'BNP', unit: 'pg/mL', low: 0, high: 100, system: 'http://loinc.org' },
};

// Vital signs definitions
const vitalDefinitions = {
  systolic: { code: '8480-6', display: 'Systolic Blood Pressure', unit: 'mmHg', system: 'http://loinc.org' },
  diastolic: { code: '8462-4', display: 'Diastolic Blood Pressure', unit: 'mmHg', system: 'http://loinc.org' },
  heartRate: { code: '8867-4', display: 'Heart Rate', unit: '/min', system: 'http://loinc.org' },
  temperature: { code: '8310-5', display: 'Body Temperature', unit: 'Cel', system: 'http://loinc.org' },
  respRate: { code: '9279-1', display: 'Respiratory Rate', unit: '/min', system: 'http://loinc.org' },
  oxygenSat: { code: '2708-6', display: 'Oxygen Saturation', unit: '%', system: 'http://loinc.org' },
  weight: { code: '29463-7', display: 'Body Weight', unit: 'kg', system: 'http://loinc.org' },
  height: { code: '8302-2', display: 'Body Height', unit: 'cm', system: 'http://loinc.org' },
};

// Generate lab observation
function createLabObservation(patientId: string, labKey: string, date: string, abnormal: boolean = false): any {
  const lab = labDefinitions[labKey];
  if (!lab) return null;

  const range = lab.high - lab.low;
  let value: number;

  if (abnormal) {
    // Generate abnormal value (either high or low)
    if (Math.random() > 0.5) {
      value = lab.high + (Math.random() * range * 0.3); // High
    } else {
      value = lab.low - (Math.random() * range * 0.3); // Low
    }
  } else {
    // Generate normal value
    value = lab.low + (Math.random() * range);
  }

  const interpretation = value > lab.high ? 'H' : value < lab.low ? 'L' : 'N';

  return {
    resourceType: 'Observation',
    id: generateUUID(),
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'laboratory',
        display: 'Laboratory',
      }],
    }],
    code: {
      coding: [{
        system: lab.system,
        code: lab.code,
        display: lab.display,
      }],
      text: lab.display,
    },
    subject: {
      id: patientId,
      resourceType: 'Patient',
    },
    effectiveDateTime: date,
    valueQuantity: {
      value: Math.round(value * 10) / 10,
      unit: lab.unit,
      system: 'http://unitsofmeasure.org',
      code: lab.unit,
    },
    interpretation: interpretation !== 'N' ? [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
        code: interpretation,
        display: interpretation === 'H' ? 'High' : 'Low',
      }],
    }] : undefined,
    referenceRange: [{
      low: { value: lab.low, unit: lab.unit },
      high: { value: lab.high, unit: lab.unit },
    }],
  };
}

// Generate vital sign observation
function createVitalObservation(patientId: string, vitalKey: string, value: number, date: string): any {
  const vital = vitalDefinitions[vitalKey as keyof typeof vitalDefinitions];
  if (!vital) return null;

  return {
    resourceType: 'Observation',
    id: generateUUID(),
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs',
      }],
    }],
    code: {
      coding: [{
        system: vital.system,
        code: vital.code,
        display: vital.display,
      }],
      text: vital.display,
    },
    subject: {
      id: patientId,
      resourceType: 'Patient',
    },
    effectiveDateTime: date,
    valueQuantity: {
      value: Math.round(value * 10) / 10,
      unit: vital.unit,
      system: 'http://unitsofmeasure.org',
      code: vital.unit,
    },
  };
}

// Generate condition resource
function createCondition(patientId: string, condition: ConditionTemplate, onsetDate: string): any {
  return {
    resourceType: 'Condition',
    id: generateUUID(),
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active',
        display: 'Active',
      }],
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed',
        display: 'Confirmed',
      }],
    },
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-category',
        code: condition.category,
        display: 'Problem List Item',
      }],
    }],
    code: {
      coding: [{
        system: condition.system,
        code: condition.code,
        display: condition.display,
      }],
      text: condition.display,
    },
    subject: {
      id: patientId,
      resourceType: 'Patient',
    },
    onsetDateTime: onsetDate,
    recordedDate: onsetDate,
  };
}

// Generate medication request
function createMedicationRequest(patientId: string, medication: MedicationTemplate, startDate: string): any {
  return {
    resourceType: 'MedicationRequest',
    id: generateUUID(),
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: medication.code,
        display: medication.display,
      }],
      text: medication.display,
    },
    subject: {
      id: patientId,
      resourceType: 'Patient',
    },
    authoredOn: startDate,
    dosageInstruction: [{
      text: `${medication.dose} ${medication.unit} ${medication.frequency}`,
      timing: {
        code: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-GTSAbbreviation',
            code: medication.frequency,
            display: medication.frequency,
          }],
        },
      },
      route: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: medication.route === 'oral' ? '26643006' : medication.route === 'inhalation' ? '422145002' : '26643006',
          display: medication.route.charAt(0).toUpperCase() + medication.route.slice(1),
        }],
      },
      doseAndRate: [{
        doseQuantity: {
          value: parseFloat(medication.dose),
          unit: medication.unit,
          system: 'http://unitsofmeasure.org',
          code: medication.unit,
        },
      }],
    }],
  };
}

// Generate encounter
function createEncounter(patientId: string, date: string, type: string, reason: string): any {
  const encounterTypes: Record<string, { code: string; display: string }> = {
    office: { code: 'AMB', display: 'Ambulatory' },
    emergency: { code: 'EMER', display: 'Emergency' },
    inpatient: { code: 'IMP', display: 'Inpatient' },
    telehealth: { code: 'VR', display: 'Virtual' },
  };

  const encType = encounterTypes[type] || encounterTypes.office;

  return {
    resourceType: 'Encounter',
    id: generateUUID(),
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: encType.code,
      display: encType.display,
    },
    type: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '390906007',
        display: 'Follow-up encounter',
      }],
      text: type.charAt(0).toUpperCase() + type.slice(1) + ' Visit',
    }],
    subject: {
      id: patientId,
      resourceType: 'Patient',
    },
    period: {
      start: date,
      end: date,
    },
    reasonCode: [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: '185345009',
        display: reason,
      }],
      text: reason,
    }],
  };
}

// Generate procedure
function createProcedure(patientId: string, code: string, display: string, date: string): any {
  return {
    resourceType: 'Procedure',
    id: generateUUID(),
    status: 'completed',
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: code,
        display: display,
      }],
      text: display,
    },
    subject: {
      id: patientId,
      resourceType: 'Patient',
    },
    performedDateTime: date,
  };
}

// Generate allergy intolerance
function createAllergyIntolerance(patientId: string, allergen: string, reaction: string, severity: string): any {
  const allergenCodes: Record<string, { code: string; system: string }> = {
    Penicillin: { code: '764146007', system: 'http://snomed.info/sct' },
    Sulfa: { code: '91936005', system: 'http://snomed.info/sct' },
    Aspirin: { code: '387458008', system: 'http://snomed.info/sct' },
    'Peanuts': { code: '762952008', system: 'http://snomed.info/sct' },
    'Latex': { code: '300916003', system: 'http://snomed.info/sct' },
    'Shellfish': { code: '227444000', system: 'http://snomed.info/sct' },
    'Eggs': { code: '102263004', system: 'http://snomed.info/sct' },
  };

  const allergenInfo = allergenCodes[allergen] || { code: '419199007', system: 'http://snomed.info/sct' };

  return {
    resourceType: 'AllergyIntolerance',
    id: generateUUID(),
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
        code: 'active',
        display: 'Active',
      }],
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
        code: 'confirmed',
        display: 'Confirmed',
      }],
    },
    type: 'allergy',
    category: ['medication'],
    criticality: severity === 'severe' ? 'high' : severity === 'moderate' ? 'low' : 'low',
    code: {
      coding: [{
        system: allergenInfo.system,
        code: allergenInfo.code,
        display: allergen,
      }],
      text: allergen,
    },
    patient: {
      id: patientId,
      resourceType: 'Patient',
    },
    reaction: [{
      manifestation: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '271807003',
          display: reaction,
        }],
        text: reaction,
      }],
      severity: severity as 'mild' | 'moderate' | 'severe',
    }],
  };
}

// Generate immunization
function createImmunization(patientId: string, vaccine: string, date: string): any {
  const vaccines: Record<string, { code: string; display: string }> = {
    'Flu': { code: '140', display: 'Influenza, seasonal, injectable, preservative free' },
    'COVID-19': { code: '208', display: 'COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose' },
    'Tdap': { code: '115', display: 'Tdap' },
    'Pneumonia': { code: '133', display: 'Pneumococcal conjugate PCV 13' },
    'Shingles': { code: '187', display: 'Zoster vaccine recombinant' },
    'Hepatitis B': { code: '08', display: 'Hepatitis B, adolescent or pediatric' },
    'MMR': { code: '03', display: 'MMR' },
    'DTaP': { code: '20', display: 'DTaP' },
  };

  const vaccineInfo = vaccines[vaccine] || vaccines['Flu'];

  return {
    resourceType: 'Immunization',
    id: generateUUID(),
    status: 'completed',
    vaccineCode: {
      coding: [{
        system: 'http://hl7.org/fhir/sid/cvx',
        code: vaccineInfo.code,
        display: vaccineInfo.display,
      }],
      text: vaccine,
    },
    patient: {
      id: patientId,
      resourceType: 'Patient',
    },
    occurrenceDateTime: date,
    primarySource: true,
  };
}

// Generate diagnostic report (imaging)
function createDiagnosticReport(patientId: string, type: string, finding: string, date: string): any {
  const imagingTypes: Record<string, { code: string; display: string }> = {
    'Chest X-Ray': { code: '36643-5', display: 'Chest X-Ray' },
    'CT Chest': { code: '30745-4', display: 'CT Chest' },
    'MRI Brain': { code: '24590-2', display: 'MRI Brain' },
    'Echocardiogram': { code: '42148-7', display: 'Echocardiogram' },
    'Abdominal Ultrasound': { code: '17787-3', display: 'Abdominal Ultrasound' },
    'Mammogram': { code: '24605-8', display: 'Mammogram' },
    'Colonoscopy': { code: '28018-4', display: 'Colonoscopy Report' },
    'DEXA Scan': { code: '38269-7', display: 'DEXA Scan' },
  };

  const imgType = imagingTypes[type] || imagingTypes['Chest X-Ray'];

  return {
    resourceType: 'DiagnosticReport',
    id: generateUUID(),
    status: 'final',
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
        code: 'RAD',
        display: 'Radiology',
      }],
    }],
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: imgType.code,
        display: imgType.display,
      }],
      text: type,
    },
    subject: {
      id: patientId,
      resourceType: 'Patient',
    },
    effectiveDateTime: date,
    issued: date,
    conclusion: finding,
  };
}

// Generate care plan
function createCarePlan(patientId: string, title: string, goals: string[], date: string): any {
  return {
    resourceType: 'CarePlan',
    id: generateUUID(),
    status: 'active',
    intent: 'plan',
    title: title,
    subject: {
      id: patientId,
      resourceType: 'Patient',
    },
    period: {
      start: date,
    },
    activity: goals.map(goal => ({
      detail: {
        description: goal,
        status: 'in-progress',
      },
    })),
  };
}

// Note types for clinical documentation
const noteTypes = {
  progress: { code: '11506-3', display: 'Progress note' },
  admission: { code: '34133-9', display: 'Admission evaluation note' },
  discharge: { code: '18842-5', display: 'Discharge summary' },
  consult: { code: '11488-4', display: 'Consultation note' },
  procedure: { code: '28570-0', display: 'Procedure note' },
};

// Generate clinical note (DocumentReference)
function createDocumentReference(
  patientId: string,
  noteType: keyof typeof noteTypes,
  content: string,
  date: string,
  author?: string
): any {
  const type = noteTypes[noteType];

  return {
    resourceType: 'DocumentReference',
    id: generateUUID(),
    status: 'current',
    docStatus: 'final',
    type: {
      coding: [{
        system: 'http://loinc.org',
        code: type.code,
        display: type.display,
      }],
      text: type.display,
    },
    category: [{
      coding: [{
        system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
        code: 'clinical-note',
        display: 'Clinical Note',
      }],
    }],
    subject: {
      id: patientId,
      resourceType: 'Patient',
    },
    date: date,
    author: author ? [{
      display: author,
    }] : undefined,
    content: [{
      attachment: {
        contentType: 'text/plain',
        data: Buffer.from(content).toString('base64'),
      },
    }],
  };
}

// Generate progress note content based on conditions
function generateProgressNoteContent(conditions: ConditionTemplate[], medications: MedicationTemplate[]): string {
  const conditionList = conditions.map(c => c.display).join(', ');
  const medList = medications.slice(0, 3).map(m => `${m.display} ${m.dose}${m.unit} ${m.frequency}`).join('\\n  - ');

  return `PROGRESS NOTE

SUBJECTIVE:
Patient presents for follow-up of ${conditionList}. Reports feeling generally well with current medication regimen. Denies chest pain, shortness of breath, or dizziness. Compliance with medications has been good.

OBJECTIVE:
General: Alert, oriented, no acute distress
Vitals: See flowsheet
Cardiac: Regular rate and rhythm, no murmurs
Lungs: Clear to auscultation bilaterally
Extremities: No edema

ASSESSMENT:
${conditions.map((c, i) => `${i + 1}. ${c.display} - stable on current regimen`).join('\\n')}

PLAN:
  - Continue current medications:
  - ${medList}
  - Labs ordered as appropriate
  - Follow up in 3 months or sooner if symptoms worsen
  - Encouraged lifestyle modifications including diet and exercise`;
}

// Generate admission note content
function generateAdmissionNoteContent(conditions: ConditionTemplate[], reason: string): string {
  return `ADMISSION HISTORY AND PHYSICAL

CHIEF COMPLAINT:
${reason}

HISTORY OF PRESENT ILLNESS:
Patient is a adult with history of ${conditions.map(c => c.display).join(', ')} who presents with ${reason.toLowerCase()}. Patient reports symptoms began approximately 2-3 days ago and have progressively worsened.

PAST MEDICAL HISTORY:
${conditions.map(c => `- ${c.display}`).join('\\n')}

MEDICATIONS:
See medication reconciliation

ALLERGIES:
See allergy list

PHYSICAL EXAMINATION:
General: Alert but appears uncomfortable
Vitals: See flowsheet
HEENT: PERRL, no JVD
Cardiac: Regular rate, no murmurs
Lungs: Decreased breath sounds at bases bilaterally
Abdomen: Soft, non-tender
Extremities: 1+ pitting edema bilateral lower extremities

ASSESSMENT/PLAN:
1. Acute presentation requiring inpatient management
2. Will initiate appropriate workup and treatment
3. Continue home medications as appropriate
4. Consults ordered as needed`;
}

// Generate discharge summary content
function generateDischargeSummaryContent(conditions: ConditionTemplate[], hospital: string, duration: number): string {
  return `DISCHARGE SUMMARY

ADMISSION DATE: ${new Date(Date.now() - duration * 24 * 60 * 60 * 1000).toLocaleDateString()}
DISCHARGE DATE: ${new Date().toLocaleDateString()}
LENGTH OF STAY: ${duration} days

DISCHARGE DIAGNOSES:
${conditions.map((c, i) => `${i + 1}. ${c.display}`).join('\\n')}

HOSPITAL COURSE:
Patient was admitted for management of acute symptoms. Initial workup revealed expected findings consistent with diagnoses. Patient was treated with appropriate medications and showed gradual improvement over the course of hospitalization.

DISCHARGE CONDITION:
Stable, improved from admission

DISCHARGE MEDICATIONS:
See medication list

FOLLOW-UP:
- Primary care: 1-2 weeks
- Specialist follow-up as scheduled
- Return to ED if symptoms worsen

PATIENT EDUCATION PROVIDED:
- Disease management
- Medication instructions
- Warning signs to watch for
- Importance of follow-up`;
}

// Main function to generate all patient data
async function generatePatientData(patient: PatientProfile): Promise<any[]> {
  const resources: any[] = [];
  const profile = patient.clinicalProfile;

  // Generate Conditions
  profile.conditions.forEach((condition, index) => {
    const onsetDate = randomDate(365 * 3, 30); // Onset within last 3 years
    resources.push(createCondition(patient.id, condition, onsetDate));
  });

  // Generate Medications
  profile.medications.forEach(medication => {
    const startDate = randomDate(180, 7); // Started within last 6 months
    resources.push(createMedicationRequest(patient.id, medication, startDate));
  });

  // Generate Lab Results (multiple dates for trending)
  const labDates = [
    randomDate(7, 0),   // Recent
    randomDate(30, 8),  // ~1 month ago
    randomDate(90, 31), // ~3 months ago
    randomDate(180, 91), // ~6 months ago
  ];

  const commonLabs = ['sodium', 'potassium', 'chloride', 'bun', 'creatinine', 'glucose', 'wbc', 'hemoglobin', 'platelets'];

  labDates.forEach((date, dateIndex) => {
    commonLabs.forEach(labKey => {
      // Make some results abnormal for older patients with chronic conditions
      const abnormal = patient.age > 60 && Math.random() < 0.2;
      const obs = createLabObservation(patient.id, labKey, date, abnormal);
      if (obs) resources.push(obs);
    });

    // Add condition-specific labs
    if (profile.commonLabs.includes('HbA1c') && profile.conditions.some(c => c.display.includes('Diabetes'))) {
      const hba1c = createLabObservation(patient.id, 'hba1c', date, true);
      if (hba1c) {
        hba1c.valueQuantity.value = 7.2 + Math.random() * 1.5; // Elevated for diabetic
        resources.push(hba1c);
      }
    }

    if (profile.commonLabs.includes('BNP') && profile.conditions.some(c => c.display.includes('Heart Failure'))) {
      const bnp = createLabObservation(patient.id, 'bnp', date, true);
      if (bnp) {
        bnp.valueQuantity.value = 300 + Math.random() * 500; // Elevated for CHF
        resources.push(bnp);
      }
    }

    if (profile.commonLabs.includes('Lipid Panel')) {
      ['cholesterol', 'ldl', 'hdl', 'triglycerides'].forEach(lab => {
        const obs = createLabObservation(patient.id, lab, date, Math.random() < 0.3);
        if (obs) resources.push(obs);
      });
    }
  });

  // Generate Vital Signs (multiple readings)
  const vitalDates = [
    randomDate(1, 0),   // Today
    randomDate(7, 2),   // This week
    randomDate(30, 8),  // This month
    randomDate(90, 31), // Last quarter
  ];

  vitalDates.forEach(date => {
    // Base vitals
    let systolic = 120 + (patient.age > 60 ? 20 : 0) + (Math.random() * 20 - 10);
    let diastolic = 80 + (patient.age > 60 ? 10 : 0) + (Math.random() * 10 - 5);
    let heartRate = 72 + (Math.random() * 20 - 10);
    let temp = 36.8 + (Math.random() * 0.6 - 0.3);
    let respRate = 16 + (Math.random() * 4 - 2);
    let o2sat = 97 + (Math.random() * 3 - 1);

    // Adjust for conditions
    if (profile.conditions.some(c => c.display.includes('Hypertension'))) {
      systolic += 15;
      diastolic += 8;
    }
    if (profile.conditions.some(c => c.display.includes('Heart Failure'))) {
      o2sat -= 3;
      heartRate += 10;
    }
    if (profile.conditions.some(c => c.display.includes('COPD'))) {
      o2sat -= 4;
      respRate += 4;
    }

    resources.push(createVitalObservation(patient.id, 'systolic', systolic, date));
    resources.push(createVitalObservation(patient.id, 'diastolic', diastolic, date));
    resources.push(createVitalObservation(patient.id, 'heartRate', heartRate, date));
    resources.push(createVitalObservation(patient.id, 'temperature', temp, date));
    resources.push(createVitalObservation(patient.id, 'respRate', respRate, date));
    resources.push(createVitalObservation(patient.id, 'oxygenSat', Math.min(100, o2sat), date));
  });

  // Weight and height (once)
  const baseWeight = patient.gender === 'male' ? 80 : 65;
  const weight = baseWeight + (patient.age > 50 ? 10 : 0) + (Math.random() * 20 - 10);
  const height = patient.gender === 'male' ? 175 : 162;
  resources.push(createVitalObservation(patient.id, 'weight', weight, randomDate(30, 0)));
  resources.push(createVitalObservation(patient.id, 'height', height + (Math.random() * 10 - 5), randomDate(365, 0)));

  // Generate Encounters
  const encounterTypes = ['office', 'office', 'office', 'telehealth'];
  if (patient.age > 60) encounterTypes.push('emergency');

  for (let i = 0; i < 5; i++) {
    const encType = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
    const reason = profile.conditions[Math.floor(Math.random() * profile.conditions.length)]?.display || 'Routine checkup';
    resources.push(createEncounter(patient.id, randomDate(365, i * 60), encType, reason));
  }

  // Generate Allergies (1-2 per patient)
  const allergies = ['Penicillin', 'Sulfa', 'Aspirin', 'Peanuts', 'Latex'];
  const numAllergies = Math.floor(Math.random() * 2) + 1;
  const reactions = ['Rash', 'Hives', 'Anaphylaxis', 'Nausea', 'Swelling'];
  const severities = ['mild', 'moderate', 'severe'];

  for (let i = 0; i < numAllergies; i++) {
    const allergen = allergies[Math.floor(Math.random() * allergies.length)];
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    resources.push(createAllergyIntolerance(patient.id, allergen, reaction, severity));
  }

  // Generate Immunizations
  const vaccines = patient.age >= 65
    ? ['Flu', 'COVID-19', 'Pneumonia', 'Shingles', 'Tdap']
    : patient.age >= 18
      ? ['Flu', 'COVID-19', 'Tdap']
      : ['Flu', 'DTaP', 'MMR', 'Hepatitis B'];

  vaccines.forEach(vaccine => {
    resources.push(createImmunization(patient.id, vaccine, randomDate(365, 30)));
  });

  // Generate Diagnostic Reports (Imaging)
  const imagingStudies = patient.age >= 65
    ? ['Chest X-Ray', 'Echocardiogram', 'DEXA Scan']
    : patient.age >= 40 && patient.gender === 'female'
      ? ['Chest X-Ray', 'Mammogram']
      : ['Chest X-Ray'];

  const findings = {
    'Chest X-Ray': ['No acute findings', 'Mild cardiomegaly', 'Clear lungs bilaterally'],
    'CT Chest': ['No pulmonary embolism', 'Mild emphysematous changes', 'Normal study'],
    'Echocardiogram': ['EF 55%, normal wall motion', 'EF 40%, mild LV dysfunction', 'Moderate mitral regurgitation'],
    'DEXA Scan': ['T-score -1.5, osteopenia', 'Normal bone density', 'T-score -2.8, osteoporosis'],
    'Mammogram': ['BIRADS 1, negative', 'BIRADS 2, benign findings', 'No suspicious findings'],
    'Abdominal Ultrasound': ['Normal liver and gallbladder', 'Hepatic steatosis', 'No abnormalities'],
  };

  imagingStudies.forEach(study => {
    const studyFindings = findings[study as keyof typeof findings] || ['Normal study'];
    const finding = studyFindings[Math.floor(Math.random() * studyFindings.length)];
    resources.push(createDiagnosticReport(patient.id, study, finding, randomDate(180, 30)));
  });

  // Generate Procedures based on conditions
  const procedures: Array<{ code: string; display: string }> = [];
  if (profile.conditions.some(c => c.display.includes('Diabetes'))) {
    procedures.push({ code: '43229009', display: 'Diabetic foot exam' });
    procedures.push({ code: '36048009', display: 'Fundoscopic examination' });
  }
  if (profile.conditions.some(c => c.display.includes('Heart Failure'))) {
    procedures.push({ code: '40701008', display: 'Echocardiography' });
  }
  if (patient.age >= 50) {
    procedures.push({ code: '73761001', display: 'Colonoscopy' });
  }

  procedures.forEach(proc => {
    resources.push(createProcedure(patient.id, proc.code, proc.display, randomDate(365, 30)));
  });

  // Generate Care Plan
  const goals: string[] = [];
  if (profile.conditions.some(c => c.display.includes('Diabetes'))) {
    goals.push('Maintain HbA1c below 7.0%');
    goals.push('Monitor blood glucose daily');
  }
  if (profile.conditions.some(c => c.display.includes('Hypertension'))) {
    goals.push('Maintain BP below 130/80');
    goals.push('Low sodium diet');
  }
  if (profile.conditions.some(c => c.display.includes('Heart Failure'))) {
    goals.push('Daily weight monitoring');
    goals.push('Fluid restriction 2L/day');
    goals.push('Report weight gain >3 lbs in 24 hours');
  }
  goals.push('Regular exercise 30 min/day');
  goals.push('Annual wellness visit');

  if (goals.length > 0) {
    resources.push(createCarePlan(patient.id, 'Primary Care Management Plan', goals, randomDate(90, 0)));
  }

  // Generate Clinical Notes (DocumentReferences)
  const physicians = [
    'Dr. Sarah Anderson, MD',
    'Dr. Michael Chen, MD',
    'Dr. Jennifer Williams, MD',
    'Dr. David Martinez, MD',
    'Dr. Emily Thompson, DO'
  ];

  // Progress notes (2-3 per patient)
  const numProgressNotes = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numProgressNotes; i++) {
    const content = generateProgressNoteContent(profile.conditions, profile.medications);
    const author = physicians[Math.floor(Math.random() * physicians.length)];
    resources.push(createDocumentReference(
      patient.id,
      'progress',
      content,
      randomDate(180, i * 60),
      author
    ));
  }

  // If older patient with chronic conditions, add admission/discharge notes
  if (patient.age > 50 && profile.conditions.length >= 2) {
    const admissionReason = profile.conditions[0]?.display + ' exacerbation' || 'Acute illness';
    const admissionContent = generateAdmissionNoteContent(profile.conditions, admissionReason);
    const dischargeContent = generateDischargeSummaryContent(profile.conditions, 'General Hospital', 4);

    const admissionDate = randomDate(180, 90);
    const admissionAuthor = physicians[Math.floor(Math.random() * physicians.length)];

    resources.push(createDocumentReference(
      patient.id,
      'admission',
      admissionContent,
      admissionDate,
      admissionAuthor
    ));

    resources.push(createDocumentReference(
      patient.id,
      'discharge',
      dischargeContent,
      admissionDate, // Same date context
      admissionAuthor
    ));
  }

  return resources;
}

// POST resources to Aidbox
async function postToAidbox(resources: any[]): Promise<void> {
  const bundle = {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: resources.map(resource => ({
      resource,
      request: {
        method: 'PUT',
        url: `${resource.resourceType}/${resource.id}`,
      },
    })),
  };

  const response = await fetch(AIDBOX_URL, {
    method: 'POST',
    headers: {
      'Authorization': AUTH,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bundle),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to post bundle: ${response.status} - ${error}`);
  }

  console.log(`Successfully posted ${resources.length} resources`);
}

// Main execution
async function main() {
  // Patient list with demographics
  const patients: Array<{ id: string; name: string; birthDate: string; gender: 'male' | 'female' }> = [
    { id: '01a12c22-f97a-2804-90f6-d77b5c68387c', name: 'Preston Yundt', birthDate: '1994-09-19', gender: 'male' },
    { id: '2193c2e7-4d66-74c6-17c5-6d0c1c094fc2', name: 'Creola Franecki', birthDate: '2016-07-01', gender: 'female' },
    { id: '0337ce1a-4012-7e62-99dc-2547d449bef7', name: 'Rhett Bechtelar', birthDate: '1992-12-16', gender: 'male' },
    { id: '5994d754-de6b-5333-884a-073f55fcd358', name: 'Del Luettgen', birthDate: '2019-10-21', gender: 'male' },
    { id: '03c85a2f-23d9-8f25-63f1-580a1bddae72', name: 'Kimbery Strosin', birthDate: '2002-01-13', gender: 'female' },
    { id: '5ab3b247-dc11-35cb-3ed6-8be889f6ccbe', name: 'Robby Koepp', birthDate: '2014-02-04', gender: 'male' },
    { id: '0413360c-f05b-adaf-16de-3c9dfe7170d4', name: 'Heriberto Murazik', birthDate: '1971-11-01', gender: 'male' },
    { id: '625d1b5b-21d6-b1e9-931f-bcb1d02c1b10', name: 'Joleen Stiedemann', birthDate: '2012-09-30', gender: 'female' },
    { id: '04fa9220-931b-6504-1444-5523f8f25710', name: 'Dorthey Eichmann', birthDate: '1957-09-12', gender: 'female' },
    { id: '88cba6af-295e-add7-7a7c-59972c18a866', name: 'Candra Grant', birthDate: '2014-05-30', gender: 'female' },
  ];

  console.log('Starting FHIR data generation for 10 patients...\n');

  for (const patient of patients) {
    const age = calculateAge(patient.birthDate);
    const clinicalProfile = generateClinicalProfile(age, patient.gender);

    const patientProfile: PatientProfile = {
      ...patient,
      age,
      clinicalProfile,
    };

    console.log(`\nGenerating data for ${patient.name} (${age}y ${patient.gender})...`);
    console.log(`  Clinical Profile: ${clinicalProfile.conditions.map(c => c.display).join(', ')}`);

    const resources = await generatePatientData(patientProfile);
    console.log(`  Generated ${resources.length} resources`);

    // Output bundle for manual review or direct posting
    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: resources.map(resource => ({
        resource,
        request: {
          method: 'PUT',
          url: `${resource.resourceType}/${resource.id}`,
        },
      })),
    };

    // Post to Aidbox
    try {
      const response = await fetch(AIDBOX_URL, {
        method: 'POST',
        headers: {
          'Authorization': AUTH,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bundle),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`  Failed to post: ${response.status}`);
      } else {
        console.log(`  ✓ Successfully posted to Aidbox`);
      }
    } catch (error) {
      console.error(`  Error posting to Aidbox:`, error);
    }
  }

  console.log('\n✓ Data generation complete!');
}

main().catch(console.error);
