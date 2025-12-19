/**
 * Bulk Import Forms API
 * Imports forms from external sources into Aidbox
 */

import { NextRequest, NextResponse } from 'next/server'
import { aidbox, GALLERY_FORM_URLS } from '@/lib/aidbox'

// LOINC Questionnaire definitions - simplified versions for common clinical forms
const LOINC_FORMS: Record<string, any> = {
  'http://loinc.org/q/100898-6': {
    resourceType: 'Questionnaire',
    id: 'lipid-panel',
    url: 'http://loinc.org/q/100898-6',
    title: 'Lipid Panel SerPl',
    status: 'active',
    publisher: 'Regenstrief Institute, Inc.',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'Total Cholesterol', type: 'decimal', code: [{ code: '2093-3', system: 'http://loinc.org' }] },
      { linkId: '2', text: 'HDL Cholesterol', type: 'decimal', code: [{ code: '2085-9', system: 'http://loinc.org' }] },
      { linkId: '3', text: 'LDL Cholesterol', type: 'decimal', code: [{ code: '2089-1', system: 'http://loinc.org' }] },
      { linkId: '4', text: 'Triglycerides', type: 'decimal', code: [{ code: '2571-8', system: 'http://loinc.org' }] },
    ],
  },
  'http://loinc.org/q/100904-2': {
    resourceType: 'Questionnaire',
    id: 'uti-pathogens',
    url: 'http://loinc.org/q/100904-2',
    title: 'UTI Pathogens Panel Urine Culture',
    status: 'active',
    publisher: 'Regenstrief Institute, Inc.',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'Organism Identified', type: 'string' },
      { linkId: '2', text: 'Colony Count', type: 'string' },
      { linkId: '3', text: 'Antibiotic Sensitivity', type: 'text' },
    ],
  },
  'http://loinc.org/q/94499-1': {
    resourceType: 'Questionnaire',
    id: 'resp-viral-panel',
    url: 'http://loinc.org/q/94499-1',
    title: 'Respiratory Viral Pathogen Panel',
    status: 'active',
    publisher: 'Regenstrief Institute, Inc.',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'SARS-CoV-2 RNA', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] },
      { linkId: '2', text: 'Influenza A RNA', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] },
      { linkId: '3', text: 'Influenza B RNA', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] },
      { linkId: '4', text: 'RSV RNA', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Detected' } }, { valueCoding: { code: 'neg', display: 'Not Detected' } }] },
    ],
  },
  'http://loinc.org/q/100821-8': {
    resourceType: 'Questionnaire',
    id: 'polst-form',
    url: 'http://loinc.org/q/100821-8',
    title: 'National POLST Form: A Portable Medical Order',
    status: 'active',
    publisher: 'Regenstrief Institute, Inc.',
    subjectType: ['Patient'],
    item: [
      { linkId: 'A', text: 'Cardiopulmonary Resuscitation (CPR)', type: 'choice', answerOption: [{ valueCoding: { code: 'cpr', display: 'Attempt Resuscitation/CPR' } }, { valueCoding: { code: 'dnar', display: 'Do Not Attempt Resuscitation/DNAR' } }] },
      { linkId: 'B', text: 'Initial Treatment Orders', type: 'choice', answerOption: [{ valueCoding: { code: 'full', display: 'Full Treatment' } }, { valueCoding: { code: 'selective', display: 'Selective Treatment' } }, { valueCoding: { code: 'comfort', display: 'Comfort-focused Treatment' } }] },
      { linkId: 'C', text: 'Additional Orders', type: 'text' },
      { linkId: 'D', text: 'Medically Assisted Nutrition', type: 'choice', answerOption: [{ valueCoding: { code: 'long', display: 'Long-term artificial nutrition' } }, { valueCoding: { code: 'trial', display: 'Trial period of artificial nutrition' } }, { valueCoding: { code: 'none', display: 'No artificial nutrition' } }] },
    ],
  },
  'http://loinc.org/q/100230-2': {
    resourceType: 'Questionnaire',
    id: 'routine-prenatal',
    url: 'http://loinc.org/q/100230-2',
    title: 'Routine Prenatal Panel',
    status: 'active',
    publisher: 'Regenstrief Institute, Inc.',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'Blood Type', type: 'choice', answerOption: [{ valueCoding: { code: 'A', display: 'Type A' } }, { valueCoding: { code: 'B', display: 'Type B' } }, { valueCoding: { code: 'AB', display: 'Type AB' } }, { valueCoding: { code: 'O', display: 'Type O' } }] },
      { linkId: '2', text: 'Rh Factor', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] },
      { linkId: '3', text: 'Antibody Screen', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] },
      { linkId: '4', text: 'Rubella Immunity', type: 'choice', answerOption: [{ valueCoding: { code: 'immune', display: 'Immune' } }, { valueCoding: { code: 'nonimmune', display: 'Non-immune' } }] },
      { linkId: '5', text: 'Hepatitis B Surface Antigen', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] },
      { linkId: '6', text: 'HIV Screen', type: 'choice', answerOption: [{ valueCoding: { code: 'pos', display: 'Positive' } }, { valueCoding: { code: 'neg', display: 'Negative' } }] },
      { linkId: '7', text: 'Syphilis Screen', type: 'choice', answerOption: [{ valueCoding: { code: 'reactive', display: 'Reactive' } }, { valueCoding: { code: 'nonreactive', display: 'Non-reactive' } }] },
    ],
  },
  'http://loinc.org/q/55403-0': {
    resourceType: 'Questionnaire',
    id: 'asthma-tracking',
    url: 'http://loinc.org/q/55403-0',
    title: 'Asthma Tracking Panel',
    status: 'active',
    publisher: 'Regenstrief Institute, Inc.',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'Asthma symptoms frequency (past 4 weeks)', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: '1-2 times' } }, { valueCoding: { code: '2', display: 'Weekly' } }, { valueCoding: { code: '3', display: 'Daily' } }] },
      { linkId: '2', text: 'Night waking due to asthma', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Never' } }, { valueCoding: { code: '1', display: '1-2 times' } }, { valueCoding: { code: '2', display: 'Weekly' } }, { valueCoding: { code: '3', display: 'Most nights' } }] },
      { linkId: '3', text: 'Rescue inhaler use', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'None' } }, { valueCoding: { code: '1', display: '1-2 times/week' } }, { valueCoding: { code: '2', display: 'Daily' } }, { valueCoding: { code: '3', display: 'Multiple times/day' } }] },
      { linkId: '4', text: 'Activity limitation', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'None' } }, { valueCoding: { code: '1', display: 'Mild' } }, { valueCoding: { code: '2', display: 'Moderate' } }, { valueCoding: { code: '3', display: 'Severe' } }] },
      { linkId: '5', text: 'Peak Flow Reading', type: 'decimal' },
    ],
  },
  'http://loinc.org/q/100766-5': {
    resourceType: 'Questionnaire',
    id: 'ces-depression',
    url: 'http://loinc.org/q/100766-5',
    title: 'Center for Epidemiologic Studies Depression Scale (CES-D)',
    status: 'active',
    publisher: 'Regenstrief Institute, Inc.',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'I was bothered by things that usually don\'t bother me', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Rarely (<1 day)' } }, { valueCoding: { code: '1', display: 'Some (1-2 days)' } }, { valueCoding: { code: '2', display: 'Occasionally (3-4 days)' } }, { valueCoding: { code: '3', display: 'Most (5-7 days)' } }] },
      { linkId: '2', text: 'I did not feel like eating; my appetite was poor', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Rarely (<1 day)' } }, { valueCoding: { code: '1', display: 'Some (1-2 days)' } }, { valueCoding: { code: '2', display: 'Occasionally (3-4 days)' } }, { valueCoding: { code: '3', display: 'Most (5-7 days)' } }] },
      { linkId: '3', text: 'I felt that I could not shake off the blues', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Rarely (<1 day)' } }, { valueCoding: { code: '1', display: 'Some (1-2 days)' } }, { valueCoding: { code: '2', display: 'Occasionally (3-4 days)' } }, { valueCoding: { code: '3', display: 'Most (5-7 days)' } }] },
      { linkId: '4', text: 'I felt depressed', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Rarely (<1 day)' } }, { valueCoding: { code: '1', display: 'Some (1-2 days)' } }, { valueCoding: { code: '2', display: 'Occasionally (3-4 days)' } }, { valueCoding: { code: '3', display: 'Most (5-7 days)' } }] },
      { linkId: '5', text: 'I felt hopeful about the future', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Rarely (<1 day)' } }, { valueCoding: { code: '1', display: 'Some (1-2 days)' } }, { valueCoding: { code: '2', display: 'Occasionally (3-4 days)' } }, { valueCoding: { code: '3', display: 'Most (5-7 days)' } }] },
      { linkId: '6', text: 'My sleep was restless', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Rarely (<1 day)' } }, { valueCoding: { code: '1', display: 'Some (1-2 days)' } }, { valueCoding: { code: '2', display: 'Occasionally (3-4 days)' } }, { valueCoding: { code: '3', display: 'Most (5-7 days)' } }] },
    ],
  },
  'http://loinc.org/q/100280-7': {
    resourceType: 'Questionnaire',
    id: 'mindfulness-ffmq',
    url: 'http://loinc.org/q/100280-7',
    title: 'Five Facet Mindfulness Questionnaire Panel',
    status: 'active',
    publisher: 'Regenstrief Institute, Inc.',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'When I take a shower, I stay alert to the sensations of water on my body', type: 'choice', answerOption: [{ valueCoding: { code: '1', display: 'Never true' } }, { valueCoding: { code: '2', display: 'Rarely true' } }, { valueCoding: { code: '3', display: 'Sometimes true' } }, { valueCoding: { code: '4', display: 'Often true' } }, { valueCoding: { code: '5', display: 'Very often true' } }] },
      { linkId: '2', text: 'I watch my feelings without getting lost in them', type: 'choice', answerOption: [{ valueCoding: { code: '1', display: 'Never true' } }, { valueCoding: { code: '2', display: 'Rarely true' } }, { valueCoding: { code: '3', display: 'Sometimes true' } }, { valueCoding: { code: '4', display: 'Often true' } }, { valueCoding: { code: '5', display: 'Very often true' } }] },
    ],
  },
}

// Additional clinical forms
const CLINICAL_FORMS: any[] = [
  {
    resourceType: 'Questionnaire',
    id: 'patient-intake',
    url: 'http://emr-ai.local/questionnaire/patient-intake',
    title: 'Patient Intake Form',
    status: 'active',
    publisher: 'EMR AI',
    subjectType: ['Patient'],
    item: [
      { linkId: 'chief-complaint', text: 'Chief Complaint', type: 'text', required: true },
      { linkId: 'hpi', text: 'History of Present Illness', type: 'text' },
      { linkId: 'allergies', text: 'Known Allergies', type: 'text' },
      { linkId: 'medications', text: 'Current Medications', type: 'text' },
      { linkId: 'pmh', text: 'Past Medical History', type: 'text' },
      { linkId: 'psh', text: 'Past Surgical History', type: 'text' },
      { linkId: 'fh', text: 'Family History', type: 'text' },
      { linkId: 'sh', text: 'Social History', type: 'text' },
    ],
  },
  {
    resourceType: 'Questionnaire',
    id: 'vital-signs',
    url: 'http://emr-ai.local/questionnaire/vital-signs',
    title: 'Vital Signs',
    status: 'active',
    publisher: 'EMR AI',
    subjectType: ['Patient'],
    item: [
      { linkId: 'temp', text: 'Temperature (°F)', type: 'decimal' },
      { linkId: 'hr', text: 'Heart Rate (bpm)', type: 'integer' },
      { linkId: 'bp-sys', text: 'Systolic BP (mmHg)', type: 'integer' },
      { linkId: 'bp-dia', text: 'Diastolic BP (mmHg)', type: 'integer' },
      { linkId: 'rr', text: 'Respiratory Rate', type: 'integer' },
      { linkId: 'spo2', text: 'SpO2 (%)', type: 'integer' },
      { linkId: 'weight', text: 'Weight (kg)', type: 'decimal' },
      { linkId: 'height', text: 'Height (cm)', type: 'decimal' },
      { linkId: 'pain', text: 'Pain Score (0-10)', type: 'integer' },
    ],
  },
  {
    resourceType: 'Questionnaire',
    id: 'discharge-checklist',
    url: 'http://emr-ai.local/questionnaire/discharge-checklist',
    title: 'Discharge Checklist',
    status: 'active',
    publisher: 'EMR AI',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'Patient education completed', type: 'boolean' },
      { linkId: '2', text: 'Discharge medications reviewed', type: 'boolean' },
      { linkId: '3', text: 'Follow-up appointments scheduled', type: 'boolean' },
      { linkId: '4', text: 'Patient understands warning signs', type: 'boolean' },
      { linkId: '5', text: 'Transportation arranged', type: 'boolean' },
      { linkId: '6', text: 'Discharge instructions provided', type: 'boolean' },
      { linkId: 'notes', text: 'Additional Notes', type: 'text' },
    ],
  },
  {
    resourceType: 'Questionnaire',
    id: 'phq9-depression',
    url: 'http://emr-ai.local/questionnaire/phq9',
    title: 'PHQ-9 Depression Screening',
    status: 'active',
    publisher: 'EMR AI',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'Little interest or pleasure in doing things', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '2', text: 'Feeling down, depressed, or hopeless', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '3', text: 'Trouble falling/staying asleep, or sleeping too much', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '4', text: 'Feeling tired or having little energy', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '5', text: 'Poor appetite or overeating', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '6', text: 'Feeling bad about yourself', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '7', text: 'Trouble concentrating on things', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '8', text: 'Moving or speaking slowly, or being fidgety/restless', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '9', text: 'Thoughts of self-harm', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
    ],
  },
  {
    resourceType: 'Questionnaire',
    id: 'gad7-anxiety',
    url: 'http://emr-ai.local/questionnaire/gad7',
    title: 'GAD-7 Anxiety Screening',
    status: 'active',
    publisher: 'EMR AI',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'Feeling nervous, anxious, or on edge', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '2', text: 'Not being able to stop or control worrying', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '3', text: 'Worrying too much about different things', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '4', text: 'Trouble relaxing', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '5', text: 'Being so restless that it\'s hard to sit still', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '6', text: 'Becoming easily annoyed or irritable', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
      { linkId: '7', text: 'Feeling afraid something awful might happen', type: 'choice', answerOption: [{ valueCoding: { code: '0', display: 'Not at all' } }, { valueCoding: { code: '1', display: 'Several days' } }, { valueCoding: { code: '2', display: 'More than half the days' } }, { valueCoding: { code: '3', display: 'Nearly every day' } }] },
    ],
  },
  {
    resourceType: 'Questionnaire',
    id: 'fall-risk',
    url: 'http://emr-ai.local/questionnaire/fall-risk',
    title: 'Fall Risk Assessment',
    status: 'active',
    publisher: 'EMR AI',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'History of falls in past 3 months', type: 'boolean' },
      { linkId: '2', text: 'Secondary diagnosis', type: 'boolean' },
      { linkId: '3', text: 'Uses ambulatory aid', type: 'choice', answerOption: [{ valueCoding: { code: 'none', display: 'None/bed rest/nurse assist' } }, { valueCoding: { code: 'crutch', display: 'Crutches/cane/walker' } }, { valueCoding: { code: 'furniture', display: 'Furniture' } }] },
      { linkId: '4', text: 'IV therapy or heparin lock', type: 'boolean' },
      { linkId: '5', text: 'Gait/transferring impaired', type: 'choice', answerOption: [{ valueCoding: { code: 'normal', display: 'Normal' } }, { valueCoding: { code: 'weak', display: 'Weak' } }, { valueCoding: { code: 'impaired', display: 'Impaired' } }] },
      { linkId: '6', text: 'Mental status', type: 'choice', answerOption: [{ valueCoding: { code: 'oriented', display: 'Oriented to own ability' } }, { valueCoding: { code: 'forgets', display: 'Forgets limitations' } }] },
    ],
  },
  {
    resourceType: 'Questionnaire', 
    id: 'pain-assessment',
    url: 'http://emr-ai.local/questionnaire/pain-assessment',
    title: 'Pain Assessment',
    status: 'active',
    publisher: 'EMR AI',
    subjectType: ['Patient'],
    item: [
      { linkId: '1', text: 'Pain intensity (0-10)', type: 'integer' },
      { linkId: '2', text: 'Pain location', type: 'string' },
      { linkId: '3', text: 'Pain character', type: 'choice', answerOption: [{ valueCoding: { code: 'sharp', display: 'Sharp' } }, { valueCoding: { code: 'dull', display: 'Dull' } }, { valueCoding: { code: 'burning', display: 'Burning' } }, { valueCoding: { code: 'aching', display: 'Aching' } }, { valueCoding: { code: 'stabbing', display: 'Stabbing' } }] },
      { linkId: '4', text: 'Pain duration', type: 'choice', answerOption: [{ valueCoding: { code: 'constant', display: 'Constant' } }, { valueCoding: { code: 'intermittent', display: 'Intermittent' } }, { valueCoding: { code: 'brief', display: 'Brief' } }] },
      { linkId: '5', text: 'What makes it worse', type: 'text' },
      { linkId: '6', text: 'What makes it better', type: 'text' },
      { linkId: '7', text: 'Current pain medications', type: 'text' },
    ],
  },
]

export async function POST(request: NextRequest) {
  try {
    const results = {
      imported: [] as string[],
      failed: [] as { id: string; error: string }[],
      total: 0,
    }

    // Import LOINC forms
    for (const [url, form] of Object.entries(LOINC_FORMS)) {
      try {
        // Use Aidbox SDK
        await aidbox.resource.update('Questionnaire', form.id, form as any)
        results.imported.push(form.title)
      } catch (error: any) {
        results.failed.push({ id: form.id, error: error.message })
      }
    }

    // Import custom clinical forms
    for (const form of CLINICAL_FORMS) {
      try {
        // Use Aidbox SDK
        await aidbox.resource.update('Questionnaire', form.id, form as any)
        results.imported.push(form.title)
      } catch (error: any) {
        results.failed.push({ id: form.id, error: error.message })
      }
    }

    results.total = results.imported.length + results.failed.length

    return NextResponse.json({
      success: true,
      message: `Imported ${results.imported.length} forms`,
      data: results,
    })
  } catch (error: any) {
    console.error('Bulk import failed:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    availableForms: Object.keys(LOINC_FORMS).length + CLINICAL_FORMS.length,
    loincForms: Object.values(LOINC_FORMS).map((f: any) => ({ id: f.id, title: f.title })),
    clinicalForms: CLINICAL_FORMS.map((f: any) => ({ id: f.id, title: f.title })),
  })
}
