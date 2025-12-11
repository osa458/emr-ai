'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  Droplets,
  FlaskConical,
  FileImage,
  Sparkles,
  Check,
  X,
  Edit,
  ChevronDown,
  ChevronRight,
  Receipt,
  Save,
  Clock,
  FileSignature,
  Loader2,
  Stethoscope,
  Plus,
  Eye,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Pill,
  AlertCircle,
  Home,
  ClipboardList,
  Package,
  DollarSign,
  FileText,
  Search,
  Send,
  Heart,
  Syringe,
  Zap,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Beaker,
  ShoppingCart,
} from 'lucide-react'

interface SOAPNoteEditorProps {
  patientId: string
  onSave: (note: { type: string; service: string; content: string; billingCodes?: string[] }, status: 'draft' | 'pended' | 'signed') => void
  onCancel: () => void
}

interface SupportingData {
  type: 'lab' | 'vital' | 'imaging' | 'exam'
  label: string
  value: string
  trend?: string
  flag?: 'H' | 'L' | 'C'
}

interface APRecommendation {
  id: string
  problem: string
  supportingData: SupportingData[]
  recommendations: string[]
  status: 'pending' | 'accepted' | 'edited' | 'denied'
  editedContent?: string
}

interface CustomTextBlock {
  id: string
  afterSection: string
  content: string
}

// Mock vitals with 24h data
const mockVitalsData = {
  latest: { time: 'Now', hr: 78, sbp: 128, dbp: 72, map: 91, temp: 98.4, rr: 16, spo2: 96, fio2: 2 },
  min24h: { hr: 78, sbp: 128, dbp: 72, map: 91, temp: 98.4, rr: 16, spo2: 91 },
  max24h: { hr: 100, sbp: 150, dbp: 92, map: 111, temp: 100.1, rr: 24, spo2: 96 },
}

// Mock labs with 3-day trends
const mockLabsWithTrends: Record<string, Array<{ name: string; value: number | string; unit: string; flag?: string; trend: number[]; dates: string[] }>> = {
  CBC: [
    { name: 'WBC', value: 12.4, unit: 'K/uL', flag: 'H', trend: [14.8, 13.6, 12.4], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'Hgb', value: 11.2, unit: 'g/dL', flag: 'L', trend: [10.4, 10.8, 11.2], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'Hct', value: 33.6, unit: '%', flag: 'L', trend: [31.2, 32.4, 33.6], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'Plt', value: 245, unit: 'K/uL', trend: [210, 228, 245], dates: ['Day 1', 'Day 2', 'Today'] },
  ],
  CMP: [
    { name: 'Na', value: 138, unit: 'mmol/L', trend: [134, 136, 138], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'K', value: 4.2, unit: 'mmol/L', trend: [3.6, 3.9, 4.2], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'Cl', value: 102, unit: 'mmol/L', trend: [98, 100, 102], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'CO2', value: 24, unit: 'mmol/L', trend: [20, 22, 24], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'BUN', value: 28, unit: 'mg/dL', flag: 'H', trend: [38, 33, 28], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'Cr', value: 1.4, unit: 'mg/dL', flag: 'H', trend: [1.8, 1.6, 1.4], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'Glucose', value: 142, unit: 'mg/dL', flag: 'H', trend: [186, 164, 142], dates: ['Day 1', 'Day 2', 'Today'] },
  ],
  Cardiac: [
    { name: 'Troponin', value: 0.08, unit: 'ng/mL', flag: 'H', trend: [0.18, 0.12, 0.08], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'BNP', value: 450, unit: 'pg/mL', flag: 'H', trend: [820, 620, 450], dates: ['Day 1', 'Day 2', 'Today'] },
  ],
  Minerals: [
    { name: 'Mg', value: 2.1, unit: 'mg/dL', trend: [1.8, 1.9, 2.1], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'Phos', value: 3.4, unit: 'mg/dL', trend: [2.8, 3.1, 3.4], dates: ['Day 1', 'Day 2', 'Today'] },
    { name: 'Ca', value: 8.8, unit: 'mg/dL', trend: [8.4, 8.6, 8.8], dates: ['Day 1', 'Day 2', 'Today'] },
  ],
  Cultures: [
    { name: 'Blood Cx', value: 'NGTD Day 3', unit: '', trend: [], dates: [] },
    { name: 'Urine Cx', value: 'No growth', unit: '', trend: [], dates: [] },
  ],
}

const mockImaging = [
  { type: 'CXR', date: 'Today 06:00', finding: 'Improving pulmonary edema, decreased cardiomegaly' },
  { type: 'Echo', date: 'Yesterday', finding: 'EF 35%, moderate MR, no pericardial effusion' },
  { type: 'CT Chest', date: '2 days ago', finding: 'No PE, bilateral small pleural effusions' },
]

const defaultRecommendations: APRecommendation[] = [
  { id: '1', problem: 'Acute on Chronic HFrEF', supportingData: [
    { type: 'lab', label: 'BNP', value: '450', trend: '820→620→450', flag: 'H' },
    { type: 'exam', label: 'JVP', value: '8cm (was 12cm)' },
    { type: 'exam', label: 'Edema', value: '1+ (was 3+)' },
    { type: 'vital', label: 'I/O', value: 'Net -1200mL' },
    { type: 'imaging', label: 'CXR', value: 'Improving pulmonary edema' },
  ], recommendations: ['Continue IV Lasix 40mg BID', 'Uptitrate metoprolol if HR tolerates', 'Daily weights, 2L fluid restriction', 'Repeat BNP tomorrow'], status: 'pending' },
  { id: '2', problem: 'AKI on CKD3 (Cardiorenal)', supportingData: [
    { type: 'lab', label: 'Cr', value: '1.4', trend: '1.8→1.6→1.4', flag: 'H' },
    { type: 'lab', label: 'BUN', value: '28', flag: 'H' },
    { type: 'vital', label: 'UOP', value: '2400mL/24h' },
  ], recommendations: ['Cr improving with diuresis', 'Hold nephrotoxins', 'Renally dose medications'], status: 'pending' },
  { id: '3', problem: 'Type 2 DM', supportingData: [
    { type: 'lab', label: 'Glucose', value: '142', trend: '186→164→142', flag: 'H' },
  ], recommendations: ['Continue sliding scale insulin', 'Diabetic diet', 'Resume metformin if Cr stable'], status: 'pending' },
  { id: '4', problem: 'Hypertension', supportingData: [
    { type: 'vital', label: 'BP', value: '128/72' },
  ], recommendations: ['BP at goal', 'Continue current regimen'], status: 'pending' },
  { id: '5', problem: 'Prophylaxis', supportingData: [], recommendations: ['DVT ppx: Heparin SC TID', 'GI ppx: Famotidine daily'], status: 'pending' },
  { id: '6', problem: 'Disposition', supportingData: [
    { type: 'exam', label: 'PT eval', value: 'Safe for home' },
  ], recommendations: ['Discharge in 1-2 days', 'CHF clinic f/u 1 week'], status: 'pending' },
]

const billingCodes = [
  { code: '99223', desc: 'Hospital admit, high', rvu: 3.86 },
  { code: '99233', desc: 'Subsequent hosp, high', rvu: 2.0 },
  { code: '99232', desc: 'Subsequent hosp, mod', rvu: 1.39 },
  { code: '99231', desc: 'Subsequent hosp, low', rvu: 0.76 },
  { code: '99291', desc: 'Critical care, first 30-74 min', rvu: 4.50 },
  { code: '99292', desc: 'Critical care, each addl 30 min', rvu: 2.25 },
  { code: '99238', desc: 'Hospital discharge day', rvu: 1.28 },
  { code: '99239', desc: 'Hospital discharge day >30 min', rvu: 1.90 },
]

// ICD-10 Diagnoses for CMI
interface Diagnosis {
  code: string
  description: string
  hcc: boolean
  mcc: boolean
  cc: boolean
  suggested: boolean
}

const cmiDiagnoses: Diagnosis[] = [
  { code: 'I50.22', description: 'Chronic systolic (HFrEF) heart failure', hcc: true, mcc: false, cc: true, suggested: true },
  { code: 'I50.32', description: 'Chronic diastolic (HFpEF) heart failure', hcc: true, mcc: false, cc: true, suggested: false },
  { code: 'N18.3', description: 'CKD Stage 3', hcc: true, mcc: false, cc: true, suggested: true },
  { code: 'E11.65', description: 'Type 2 DM with hyperglycemia', hcc: true, mcc: false, cc: true, suggested: true },
  { code: 'E11.22', description: 'Type 2 DM with CKD', hcc: true, mcc: false, cc: true, suggested: true },
  { code: 'I10', description: 'Essential hypertension', hcc: false, mcc: false, cc: false, suggested: false },
  { code: 'E78.5', description: 'Hyperlipidemia', hcc: false, mcc: false, cc: false, suggested: false },
  { code: 'J44.1', description: 'COPD with acute exacerbation', hcc: true, mcc: true, cc: true, suggested: false },
  { code: 'E87.1', description: 'Hyponatremia', hcc: false, mcc: false, cc: true, suggested: false },
  { code: 'D64.9', description: 'Anemia, unspecified', hcc: false, mcc: false, cc: false, suggested: false },
  { code: 'N17.9', description: 'Acute kidney injury', hcc: true, mcc: false, cc: true, suggested: true },
  { code: 'R65.20', description: 'Severe sepsis without septic shock', hcc: true, mcc: true, cc: true, suggested: false },
  { code: 'J96.01', description: 'Acute respiratory failure with hypoxia', hcc: true, mcc: true, cc: true, suggested: false },
  { code: 'I48.91', description: 'Atrial fibrillation', hcc: true, mcc: false, cc: true, suggested: false },
]

// Single orders
interface SingleOrder {
  id: string
  name: string
  category: string
  details?: string
}

const singleOrders: SingleOrder[] = [
  // Labs
  { id: 'cbc', name: 'CBC with Differential', category: 'Labs' },
  { id: 'cmp', name: 'Comprehensive Metabolic Panel', category: 'Labs' },
  { id: 'bmp', name: 'Basic Metabolic Panel', category: 'Labs' },
  { id: 'bnp', name: 'BNP', category: 'Labs' },
  { id: 'troponin', name: 'Troponin', category: 'Labs' },
  { id: 'lactate', name: 'Lactate', category: 'Labs' },
  { id: 'abg', name: 'Arterial Blood Gas', category: 'Labs' },
  { id: 'pt_inr', name: 'PT/INR', category: 'Labs' },
  { id: 'ptt', name: 'PTT', category: 'Labs' },
  { id: 'tsh', name: 'TSH', category: 'Labs' },
  { id: 'lipid', name: 'Lipid Panel', category: 'Labs' },
  { id: 'hba1c', name: 'Hemoglobin A1c', category: 'Labs' },
  { id: 'ua', name: 'Urinalysis', category: 'Labs' },
  { id: 'blood_cx', name: 'Blood Culture x2', category: 'Labs' },
  { id: 'urine_cx', name: 'Urine Culture', category: 'Labs' },
  // Imaging
  { id: 'cxr', name: 'Chest X-Ray', category: 'Imaging' },
  { id: 'ct_chest', name: 'CT Chest', category: 'Imaging' },
  { id: 'ct_abd', name: 'CT Abdomen/Pelvis', category: 'Imaging' },
  { id: 'echo', name: 'Echocardiogram', category: 'Imaging' },
  { id: 'renal_us', name: 'Renal Ultrasound', category: 'Imaging' },
  { id: 'le_doppler', name: 'LE Doppler Ultrasound', category: 'Imaging' },
  // Medications
  { id: 'lasix_iv', name: 'Furosemide 40mg IV', category: 'Medications' },
  { id: 'lasix_po', name: 'Furosemide 40mg PO', category: 'Medications' },
  { id: 'heparin_ppx', name: 'Heparin 5000u SC TID', category: 'Medications' },
  { id: 'tylenol', name: 'Acetaminophen 650mg PO Q6H PRN', category: 'Medications' },
  { id: 'zofran', name: 'Ondansetron 4mg IV Q8H PRN', category: 'Medications' },
  // Consults
  { id: 'cards_consult', name: 'Cardiology Consult', category: 'Consults' },
  { id: 'renal_consult', name: 'Nephrology Consult', category: 'Consults' },
  { id: 'pulm_consult', name: 'Pulmonology Consult', category: 'Consults' },
  { id: 'id_consult', name: 'Infectious Disease Consult', category: 'Consults' },
  { id: 'palliative_consult', name: 'Palliative Care Consult', category: 'Consults' },
  { id: 'pt_consult', name: 'Physical Therapy Consult', category: 'Consults' },
  { id: 'ot_consult', name: 'Occupational Therapy Consult', category: 'Consults' },
  { id: 'sw_consult', name: 'Social Work Consult', category: 'Consults' },
  // Procedures
  { id: 'foley', name: 'Foley Catheter', category: 'Procedures' },
  { id: 'central_line', name: 'Central Line Placement', category: 'Procedures' },
  { id: 'art_line', name: 'Arterial Line', category: 'Procedures' },
  { id: 'paracentesis', name: 'Paracentesis', category: 'Procedures' },
  { id: 'thoracentesis', name: 'Thoracentesis', category: 'Procedures' },
]

// Order Sets
interface OrderSetItem {
  id: string
  name: string
  selected: boolean
  details?: string
}

interface OrderSet {
  id: string
  name: string
  category: string
  description: string
  items: OrderSetItem[]
}

const orderSets: OrderSet[] = [
  {
    id: 'admission',
    name: 'Admission Order Set',
    category: 'General',
    description: 'Standard admission orders',
    items: [
      { id: 'admit', name: 'Admit to Medicine', selected: true },
      { id: 'attending', name: 'Attending: ***', selected: true },
      { id: 'diagnosis', name: 'Diagnosis: ***', selected: true },
      { id: 'condition', name: 'Condition: Stable', selected: true },
      { id: 'code_status', name: 'Code Status: Full Code', selected: true },
      { id: 'allergies', name: 'Allergies: ***', selected: true },
      { id: 'diet', name: 'Diet: Regular', selected: true },
      { id: 'activity', name: 'Activity: Up ad lib', selected: true },
      { id: 'vitals', name: 'Vitals Q4H', selected: true },
      { id: 'telemetry', name: 'Telemetry monitoring', selected: false },
      { id: 'nursing', name: 'Nursing: Daily weights, I/O', selected: true },
      { id: 'dvt_ppx', name: 'DVT ppx: Heparin 5000u SC TID', selected: true },
      { id: 'gi_ppx', name: 'GI ppx: Famotidine 20mg daily', selected: true },
      { id: 'labs_am', name: 'AM Labs: CBC, BMP', selected: true },
      { id: 'iv_fluids', name: 'IV: NS @ 75mL/hr', selected: false },
    ]
  },
  {
    id: 'diabetes',
    name: 'Diabetes Order Set',
    category: 'Endocrine',
    description: 'Comprehensive diabetes management',
    items: [
      { id: 'fs_ac_hs', name: 'Fingerstick glucose AC and HS', selected: true },
      { id: 'diabetic_diet', name: 'Diabetic diet/Carb controlled', selected: true },
      { id: 'sliding_scale', name: 'Insulin sliding scale (Humalog)', selected: true, details: 'BG 150-199: 2u, 200-249: 4u, 250-299: 6u, 300-349: 8u, >350: 10u + call MD' },
      { id: 'basal_insulin', name: 'Lantus (glargine) *** units SC QHS', selected: false, details: 'Long-acting insulin' },
      { id: 'mealtime_insulin', name: 'Humalog *** units SC with meals', selected: false, details: 'Rapid-acting insulin' },
      { id: 'metformin', name: 'Metformin 500mg PO BID', selected: false, details: 'Hold if Cr >1.5 or contrast' },
      { id: 'hypoglycemia', name: 'Hypoglycemia protocol', selected: true, details: 'If BG <70: Give juice/glucose tabs, recheck in 15min' },
      { id: 'hba1c', name: 'Order HbA1c if not done in 3 months', selected: true },
      { id: 'endo_consult', name: 'Endocrine consult', selected: false },
    ]
  },
  {
    id: 'chf',
    name: 'CHF Order Set',
    category: 'Cardiology',
    description: 'Heart failure management',
    items: [
      { id: 'telemetry', name: 'Continuous telemetry', selected: true },
      { id: 'daily_weight', name: 'Daily weights', selected: true },
      { id: 'io', name: 'Strict I/O', selected: true },
      { id: 'fluid_restrict', name: 'Fluid restriction 1.5-2L/day', selected: true },
      { id: 'low_sodium', name: 'Low sodium diet (2g)', selected: true },
      { id: 'lasix_iv', name: 'Furosemide *** mg IV BID', selected: true },
      { id: 'metolazone', name: 'Metolazone 5mg PO daily (PRN)', selected: false, details: 'Give 30min before loop diuretic' },
      { id: 'beta_blocker', name: 'Continue home beta-blocker', selected: true },
      { id: 'ace_arb', name: 'Continue home ACEi/ARB/ARNI', selected: true },
      { id: 'mra', name: 'Spironolactone 25mg daily', selected: false },
      { id: 'bnp', name: 'BNP on admission and PRN', selected: true },
      { id: 'cxr', name: 'CXR daily while diuresing', selected: false },
      { id: 'echo', name: 'Echocardiogram', selected: false },
      { id: 'cards_consult', name: 'Cardiology consult', selected: false },
    ]
  },
  {
    id: 'transfusion',
    name: 'Transfusion Order Set',
    category: 'Hematology',
    description: 'Blood product transfusion',
    items: [
      { id: 'type_screen', name: 'Type and Screen', selected: true },
      { id: 'consent', name: 'Transfusion consent obtained', selected: true },
      { id: 'prbc_1', name: 'Transfuse 1 unit pRBCs', selected: true },
      { id: 'prbc_2', name: 'Transfuse 2 units pRBCs', selected: false },
      { id: 'ffp', name: 'Transfuse FFP *** units', selected: false },
      { id: 'platelets', name: 'Transfuse platelets *** units', selected: false },
      { id: 'premedication', name: 'Premedicate: Tylenol 650mg, Benadryl 25mg', selected: false },
      { id: 'lasix_between', name: 'Furosemide 20mg IV between units', selected: false, details: 'For CHF/volume overload risk' },
      { id: 'post_cbc', name: 'Post-transfusion CBC in 1 hour', selected: true },
      { id: 'transfusion_rxn', name: 'Monitor for transfusion reaction', selected: true },
    ]
  },
  {
    id: 'ventilator',
    name: 'Ventilator Order Set',
    category: 'Critical Care',
    description: 'Mechanical ventilation orders',
    items: [
      { id: 'mode', name: 'Mode: AC/VC', selected: true, details: 'Assist Control / Volume Control' },
      { id: 'tv', name: 'Tidal Volume: 6-8 mL/kg IBW', selected: true },
      { id: 'rr', name: 'Rate: 14-18', selected: true },
      { id: 'fio2', name: 'FiO2: 40% (titrate to SpO2 >92%)', selected: true },
      { id: 'peep', name: 'PEEP: 5 cmH2O', selected: true },
      { id: 'abg', name: 'ABG 30 min after intubation', selected: true },
      { id: 'cxr_post', name: 'CXR post-intubation', selected: true },
      { id: 'sedation', name: 'Sedation: Propofol/Fentanyl', selected: true },
      { id: 'daily_wake', name: 'Daily sedation vacation', selected: true },
      { id: 'sbt', name: 'Daily SBT assessment', selected: true },
      { id: 'hob', name: 'HOB >30 degrees', selected: true },
      { id: 'oral_care', name: 'Oral care with chlorhexidine Q4H', selected: true },
      { id: 'peptic_ulcer', name: 'Stress ulcer prophylaxis', selected: true },
      { id: 'dvt_ppx', name: 'DVT prophylaxis', selected: true },
    ]
  },
  {
    id: 'lvad',
    name: 'LVAD Order Set',
    category: 'Advanced Heart Failure',
    description: 'Left ventricular assist device management',
    items: [
      { id: 'lvad_check', name: 'LVAD parameter check Q4H', selected: true, details: 'Speed, Flow, Power, PI' },
      { id: 'map_goal', name: 'MAP goal 70-80 mmHg', selected: true },
      { id: 'doppler_bp', name: 'Doppler BP Q4H (no cuff BP)', selected: true },
      { id: 'anticoag', name: 'Warfarin - INR goal 2.0-3.0', selected: true },
      { id: 'aspirin', name: 'Aspirin 325mg daily', selected: true },
      { id: 'inr_daily', name: 'INR daily', selected: true },
      { id: 'lft', name: 'LFTs weekly', selected: true },
      { id: 'ldh', name: 'LDH weekly (hemolysis screen)', selected: true },
      { id: 'driveline', name: 'Driveline care daily', selected: true },
      { id: 'vad_team', name: 'VAD coordinator notification', selected: true },
      { id: 'echo', name: 'Echocardiogram', selected: false },
      { id: 'no_nibp', name: 'NO automatic BP cuff', selected: true },
    ]
  },
  {
    id: 'ecmo',
    name: 'ECMO Order Set',
    category: 'Advanced Critical Care',
    description: 'Extracorporeal membrane oxygenation',
    items: [
      { id: 'ecmo_type', name: 'ECMO type: ***VV/VA***', selected: true },
      { id: 'flow', name: 'ECMO flow: *** L/min', selected: true },
      { id: 'sweep', name: 'Sweep: *** L/min', selected: true },
      { id: 'fio2_ecmo', name: 'ECMO FiO2: ***%', selected: true },
      { id: 'anticoag', name: 'Heparin drip - PTT goal 60-80', selected: true },
      { id: 'ptt_q6', name: 'PTT Q6H', selected: true },
      { id: 'fibrinogen', name: 'Fibrinogen daily', selected: true },
      { id: 'hgb_goal', name: 'Hgb goal >8', selected: true },
      { id: 'plt_goal', name: 'Platelet goal >50k', selected: true },
      { id: 'cannula_check', name: 'Cannula site check Q2H', selected: true },
      { id: 'distal_perf', name: 'Distal perfusion check Q1H (if VA)', selected: true },
      { id: 'echo_daily', name: 'Daily echo', selected: false },
      { id: 'ecmo_team', name: 'ECMO team notification', selected: true },
    ]
  },
  {
    id: 'sepsis',
    name: 'Sepsis Order Set',
    category: 'Infectious Disease',
    description: 'Sepsis bundle orders',
    items: [
      { id: 'lactate', name: 'Lactate level STAT', selected: true },
      { id: 'blood_cx', name: 'Blood cultures x2 before antibiotics', selected: true },
      { id: 'urine_cx', name: 'Urine culture', selected: true },
      { id: 'fluid_bolus', name: '30 mL/kg crystalloid bolus', selected: true },
      { id: 'antibiotics', name: 'Broad-spectrum antibiotics within 1 hour', selected: true, details: 'Vancomycin + Zosyn recommended' },
      { id: 'repeat_lactate', name: 'Repeat lactate in 6 hours if elevated', selected: true },
      { id: 'map_goal', name: 'MAP goal >65', selected: true },
      { id: 'pressors', name: 'Norepinephrine if MAP <65 after fluids', selected: false },
      { id: 'procalcitonin', name: 'Procalcitonin', selected: true },
      { id: 'cxr', name: 'Chest X-Ray', selected: true },
      { id: 'ua', name: 'Urinalysis', selected: true },
    ]
  },
]

// DVT Prophylaxis options
const dvtPpxOptions = [
  { id: 'heparin', name: 'Heparin 5000 units SC TID', type: 'pharmacologic' },
  { id: 'lovenox', name: 'Enoxaparin 40mg SC daily', type: 'pharmacologic' },
  { id: 'scds', name: 'SCDs bilateral', type: 'mechanical' },
  { id: 'teds', name: 'TEDs stockings', type: 'mechanical' },
]

const dvtContraindications = [
  { id: 'bleeding', name: 'Active bleeding', selected: false },
  { id: 'plt', name: 'Thrombocytopenia (Plt < 50k)', selected: false },
  { id: 'hit', name: 'History of HIT', selected: false },
  { id: 'coag', name: 'Coagulopathy (INR > 2)', selected: false },
  { id: 'surgery', name: 'Recent surgery/procedure', selected: false },
]

const anticoagulationOptions = [
  { id: 'none', name: 'None' },
  { id: 'warfarin', name: 'Warfarin (therapeutic INR)' },
  { id: 'doac', name: 'DOAC (apixaban, rivaroxaban, etc.)' },
  { id: 'heparin_drip', name: 'Heparin drip (therapeutic PTT)' },
  { id: 'lovenox_tx', name: 'Therapeutic enoxaparin' },
]

// Diet options
const dietOptions = [
  { id: 'regular', name: 'Regular diet' },
  { id: 'cardiac', name: 'Cardiac/Low sodium (2g Na)' },
  { id: 'diabetic', name: 'Diabetic/Carb controlled' },
  { id: 'renal', name: 'Renal diet' },
  { id: 'low_fat', name: 'Low fat/cholesterol' },
  { id: 'clear', name: 'Clear liquids' },
  { id: 'npo', name: 'NPO' },
  { id: 'pureed', name: 'Pureed' },
  { id: 'mechanical_soft', name: 'Mechanical soft' },
  { id: 'thickened', name: 'Thickened liquids' },
]

// Mock PT/OT/CM notes
const mockPTNote = {
  date: 'Today 10:30',
  therapist: 'PT Smith',
  assessment: 'Patient ambulated 150ft with rolling walker, min assist x1. Gait steady, no SOB. Stairs: able to do 4 steps with rail.',
  recommendation: 'Safe for discharge home with rolling walker. Recommend outpatient PT 2x/week.',
  equipment: ['Rolling walker', 'Bedside commode'],
}

const mockOTNote = {
  date: 'Today 09:00', 
  therapist: 'OT Jones',
  assessment: 'Patient independent with ADLs. Mild difficulty with fine motor tasks. UE strength 4/5 bilateral.',
  recommendation: 'Safe for home. Recommend grab bars in bathroom, shower chair.',
  equipment: ['Shower chair', 'Grab bars'],
}

const mockCMNote = {
  date: 'Today 11:00',
  coordinator: 'CM Williams',
  assessment: 'Patient lives with spouse who is able to assist. Has PCP follow-up scheduled. Insurance approved home health.',
  dischargeBarriers: 'None identified',
  plan: 'Discharge to home with home health nursing visits 3x/week for 2 weeks. CHF clinic follow-up.',
  services: ['Home health nursing', 'CHF clinic referral'],
}

// Medical equipment options
const medicalEquipmentOptions = [
  { id: 'walker', name: 'Rolling Walker', category: 'Mobility' },
  { id: 'wheelchair', name: 'Wheelchair', category: 'Mobility' },
  { id: 'cane', name: 'Cane', category: 'Mobility' },
  { id: 'hospital_bed', name: 'Hospital Bed', category: 'Home' },
  { id: 'commode', name: 'Bedside Commode', category: 'Bathroom' },
  { id: 'shower_chair', name: 'Shower Chair', category: 'Bathroom' },
  { id: 'grab_bars', name: 'Grab Bars', category: 'Bathroom' },
  { id: 'oxygen', name: 'Home Oxygen', category: 'Respiratory' },
  { id: 'cpap', name: 'CPAP/BiPAP', category: 'Respiratory' },
  { id: 'nebulizer', name: 'Nebulizer', category: 'Respiratory' },
]

// Mock medications data
interface Medication {
  id: string
  name: string
  dose: string
  route: string
  frequency: string
  category: 'scheduled' | 'iv_drip' | 'prn'
  isHome: boolean
  addedDate: Date
  lastGiven?: Date
}

const mockMedications: Medication[] = [
  // Scheduled medications
  { id: 'm1', name: 'Metoprolol Succinate', dose: '50mg', route: 'PO', frequency: 'Daily', category: 'scheduled', isHome: true, addedDate: new Date('2024-12-07'), lastGiven: new Date('2024-12-10T08:00') },
  { id: 'm2', name: 'Lisinopril', dose: '10mg', route: 'PO', frequency: 'Daily', category: 'scheduled', isHome: true, addedDate: new Date('2024-12-07'), lastGiven: new Date('2024-12-10T08:00') },
  { id: 'm3', name: 'Furosemide', dose: '40mg', route: 'IV', frequency: 'BID', category: 'scheduled', isHome: false, addedDate: new Date('2024-12-08'), lastGiven: new Date('2024-12-10T14:00') },
  { id: 'm4', name: 'Potassium Chloride', dose: '20mEq', route: 'PO', frequency: 'BID', category: 'scheduled', isHome: false, addedDate: new Date('2024-12-08'), lastGiven: new Date('2024-12-10T08:00') },
  { id: 'm5', name: 'Atorvastatin', dose: '40mg', route: 'PO', frequency: 'QHS', category: 'scheduled', isHome: true, addedDate: new Date('2024-12-07'), lastGiven: new Date('2024-12-09T21:00') },
  { id: 'm6', name: 'Aspirin', dose: '81mg', route: 'PO', frequency: 'Daily', category: 'scheduled', isHome: true, addedDate: new Date('2024-12-07'), lastGiven: new Date('2024-12-10T08:00') },
  { id: 'm7', name: 'Famotidine', dose: '20mg', route: 'PO', frequency: 'Daily', category: 'scheduled', isHome: false, addedDate: new Date('2024-12-09'), lastGiven: new Date('2024-12-10T08:00') },
  { id: 'm8', name: 'Heparin', dose: '5000 units', route: 'SC', frequency: 'TID', category: 'scheduled', isHome: false, addedDate: new Date('2024-12-08'), lastGiven: new Date('2024-12-10T12:00') },
  // IV Drips
  { id: 'm9', name: 'Normal Saline', dose: '75mL/hr', route: 'IV', frequency: 'Continuous', category: 'iv_drip', isHome: false, addedDate: new Date('2024-12-10T06:00'), lastGiven: new Date('2024-12-10T06:00') },
  // PRN medications
  { id: 'm10', name: 'Acetaminophen', dose: '650mg', route: 'PO', frequency: 'Q6H PRN pain/fever', category: 'prn', isHome: false, addedDate: new Date('2024-12-08'), lastGiven: new Date('2024-12-10T02:00') },
  { id: 'm11', name: 'Ondansetron', dose: '4mg', route: 'IV', frequency: 'Q8H PRN nausea', category: 'prn', isHome: false, addedDate: new Date('2024-12-08'), lastGiven: undefined },
  { id: 'm12', name: 'Melatonin', dose: '3mg', route: 'PO', frequency: 'QHS PRN insomnia', category: 'prn', isHome: true, addedDate: new Date('2024-12-07'), lastGiven: new Date('2024-12-09T21:00') },
]

// Pre-ready text snippets (..phrase syntax)
const textSnippets: Record<string, string> = {
  'physicalexam': `General: ***general appearance***
HEENT: NCAT, PERRL, EOMI, MMM, oropharynx clear
Neck: Supple, no LAD, no JVD, no thyromegaly
CV: RRR, S1/S2, no murmurs/rubs/gallops
Lungs: CTAB, no wheezes/rales/rhonchi
Abdomen: Soft, NT, ND, +BS, no HSM
Extremities: No edema, 2+ pulses, warm and well perfused
Neuro: A&Ox3, CN II-XII intact, 5/5 strength, sensation intact
Skin: Warm, dry, no rashes`,
  
  'labs': `LABS (3-day trends):
  CBC: WBC ${mockLabsWithTrends.CBC[0].trend.join('→')}, Hgb ${mockLabsWithTrends.CBC[1].trend.join('→')}, Plt ${mockLabsWithTrends.CBC[3].trend.join('→')}
  CMP: Na ${mockLabsWithTrends.CMP[0].trend.join('→')}, K ${mockLabsWithTrends.CMP[1].trend.join('→')}, Cr ${mockLabsWithTrends.CMP[5].trend.join('→')}, Glucose ${mockLabsWithTrends.CMP[6].trend.join('→')}
  Cardiac: BNP ${mockLabsWithTrends.Cardiac[1].trend.join('→')}, Troponin ${mockLabsWithTrends.Cardiac[0].trend.join('→')}`,
  
  'heartfailure': `Heart Failure (HFrEF/HFpEF):
  - EF: ***%*** (***date of echo***)
  - Volume status: ***euvolemic/hypervolemic/hypovolemic***
  - NYHA Class: ***I/II/III/IV***
  - Diuresis: ***current regimen and response***
  - GDMT:
    * Beta-blocker: ***medication and dose***
    * ACEi/ARB/ARNI: ***medication and dose***
    * MRA: ***medication and dose***
    * SGLT2i: ***medication and dose***
  - Daily weights, 2L fluid restriction
  - Low sodium diet
  - Follow-up: ***CHF clinic/cardiology***`,
  
  'copd': `COPD Exacerbation:
  - Severity: ***mild/moderate/severe***
  - O2 requirement: ***current O2 and baseline***
  - Steroids: ***regimen***
  - Bronchodilators: ***regimen***
  - Antibiotics (if indicated): ***regimen***
  - Smoking status: ***current/former/never***
  - PFTs: ***date and results if available***`,
  
  'aki': `Acute Kidney Injury:
  - Baseline Cr: ***value*** Current Cr: ***value***
  - Etiology: ***prerenal/intrinsic/postrenal***
  - UOP: ***mL/24h or mL/kg/hr***
  - FENa/FEUrea: ***value***
  - Nephrotoxins: ***held/none***
  - Contrast: ***date if recent***
  - Renal US: ***pending/results***
  - Renal consulted: ***yes/no***`,
  
  'sepsis': `Sepsis/Infectious Workup:
  - Source: ***suspected source***
  - Cultures: Blood x2 (***pending/results***), Urine (***pending/results***), Sputum (***pending/results***)
  - Antibiotics: ***current regimen, day #***
  - Lactate: ***value*** (trend: ***)
  - Procalcitonin: ***value***
  - MAP: ***value*** (on ***vasopressors if applicable***)
  - Fluid resuscitation: ***30mL/kg given/ongoing***`,

  'diabetes': `Diabetes Management:
  - Type: ***Type 1/Type 2***
  - HbA1c: ***%*** (***date***)
  - Home regimen: ***insulin/oral agents***
  - Current regimen: ***sliding scale/basal-bolus***
  - Glucose range (24h): ***min-max***
  - Diabetic diet
  - Endocrine consulted: ***yes/no***`,

  'dvtppx': `DVT Prophylaxis:
  - Pharmacologic: ***Heparin 5000u SC TID / Enoxaparin 40mg SC daily***
  - Mechanical: ***SCDs / TEDs***
  - Contraindications: ***none / active bleeding / thrombocytopenia***`,

  'ros': `Review of Systems:
Constitutional: ***positive/negative for fever, chills, weight loss***
HEENT: ***positive/negative for headache, vision changes, sore throat***
CV: ***positive/negative for chest pain, palpitations, edema***
Respiratory: ***positive/negative for SOB, cough, wheezing***
GI: ***positive/negative for nausea, vomiting, abdominal pain, diarrhea***
GU: ***positive/negative for dysuria, hematuria, frequency***
MSK: ***positive/negative for joint pain, swelling, weakness***
Neuro: ***positive/negative for headache, dizziness, numbness***
Psych: ***positive/negative for depression, anxiety***
All other systems reviewed and negative`,
}

// Plain text note templates
const plainTextTemplates: Record<string, string> = {
  'hp': `HISTORY AND PHYSICAL

PATIENT: ***Patient Name***
MRN: ***MRN***
DATE: ${new Date().toLocaleDateString()}
ATTENDING: ***Attending Name***

CHIEF COMPLAINT:
***Chief complaint***

HISTORY OF PRESENT ILLNESS:
***Age*** year old ***male/female*** with PMH of ***medical history*** presenting with ***presenting complaint***.

***HPI details - onset, duration, severity, quality, associated symptoms, aggravating/alleviating factors***

REVIEW OF SYSTEMS:
Constitutional: ***
HEENT: ***
CV: ***
Respiratory: ***
GI: ***
GU: ***
MSK: ***
Neuro: ***
Psych: ***
All other systems reviewed and negative unless noted above.

PAST MEDICAL HISTORY:
***List conditions***

PAST SURGICAL HISTORY:
***List surgeries***

FAMILY HISTORY:
***Relevant family history***

SOCIAL HISTORY:
- Smoking: ***current/former/never, pack-years***
- Alcohol: ***use***
- Drugs: ***use***
- Living situation: ***
- Occupation: ***

ALLERGIES:
***NKDA or list allergies with reactions***

HOME MEDICATIONS:
***List home medications***

PHYSICAL EXAMINATION:
Vitals: T ***, HR ***, BP ***/***, RR ***, SpO2 *** on ***
General: ***
HEENT: ***
Neck: ***
CV: ***
Lungs: ***
Abdomen: ***
Extremities: ***
Neuro: ***
Skin: ***

LABS:
***Include relevant labs***

IMAGING:
***Include relevant imaging***

ASSESSMENT AND PLAN:
***Age*** year old ***male/female*** with ***PMH*** admitted for ***diagnosis***.

1. ***Problem 1***
   - ***Plan***

2. ***Problem 2***
   - ***Plan***

3. ***Problem 3***
   - ***Plan***

PROPHYLAXIS:
- DVT: ***
- GI: ***

CODE STATUS: ***Full code / DNR/DNI***
DISPOSITION: ***

_______________________________________________
***Provider Name, Credentials***
`,

  'progress': `PROGRESS NOTE

DATE: ${new Date().toLocaleDateString()}
HOSPITAL DAY #: ***

SUBJECTIVE:
Patient reports ***symptoms/complaints***.
Overnight events: ***

OBJECTIVE:
Vitals: T ***, HR ***, BP ***/***, RR ***, SpO2 *** on ***
I/O (24h): ***mL in / ***mL out, Net ***mL

Physical Exam:
General: ***
CV: ***
Lungs: ***
Abdomen: ***
Extremities: ***

Labs:
***Today's labs***

Imaging:
***Any new imaging***

ASSESSMENT AND PLAN:
***Age*** y/o ***M/F*** with ***PMH*** admitted for *** (HD#***).

1. ***Problem 1***
   - ***Plan***

2. ***Problem 2***
   - ***Plan***

DIET: ***
PROPHYLAXIS: DVT - ***, GI - ***
CODE STATUS: ***
DISPOSITION: ***

_______________________________________________
***Provider Name, Credentials***
`,

  'discharge': `DISCHARGE SUMMARY

PATIENT: ***Patient Name***
MRN: ***MRN***
ADMISSION DATE: ***
DISCHARGE DATE: ${new Date().toLocaleDateString()}
ATTENDING: ***Attending Name***
LENGTH OF STAY: *** days

PRIMARY DIAGNOSIS:
***Primary diagnosis***

SECONDARY DIAGNOSES:
***List secondary diagnoses***

BRIEF HOSPITAL COURSE:
***Age*** year old ***male/female*** with PMH of ***medical history*** who presented with ***presenting complaint***. 

***Summary of hospital course by problem***

PROCEDURES PERFORMED:
***List procedures or "None"***

DISCHARGE CONDITION:
***Stable/Improved***

DISCHARGE MEDICATIONS:
***List all discharge medications with doses, routes, frequencies***

MEDICATIONS CHANGED:
- NEW: ***
- DISCONTINUED: ***
- CHANGED: ***

FOLLOW-UP APPOINTMENTS:
- PCP: ***Provider*** on ***date***
- Specialist: ***Provider*** on ***date***

DISCHARGE INSTRUCTIONS:
1. ***Instructions***
2. Activity: ***
3. Diet: ***
4. Return to ED if: ***warning signs***

PENDING RESULTS AT DISCHARGE:
***List pending labs/studies or "None"***

_______________________________________________
***Provider Name, Credentials***
`,
}

function TrendIcon({ trend }: { trend: number[] }) {
  if (trend.length < 2) return null
  const last = trend[trend.length - 1]
  const prev = trend[trend.length - 2]
  if (last > prev) return <TrendingUp className="h-3 w-3 text-red-500" />
  if (last < prev) return <TrendingDown className="h-3 w-3 text-green-500" />
  return <Minus className="h-3 w-3 text-gray-400" />
}

export function SOAPNoteEditor({ patientId, onSave, onCancel }: SOAPNoteEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showBilling, setShowBilling] = useState(false)
  const [billingCode, setBillingCode] = useState<string>('')
  
  // Custom text blocks
  const [customBlocks, setCustomBlocks] = useState<CustomTextBlock[]>([])
  
  // Snippet suggestion state
  const [snippetSuggestions, setSnippetSuggestions] = useState<string[]>([])
  const [activeSnippetField, setActiveSnippetField] = useState<string | null>(null)
  const [snippetCursorPos, setSnippetCursorPos] = useState<number>(0)
  
  // Refs for text areas to handle F2 navigation
  const textAreaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  
  // Check for *** placeholders in note content
  const hasPlaceholders = useCallback((content: string) => {
    return content.includes('***')
  }, [])
  
  // Find all *** positions in content
  const findPlaceholderPositions = useCallback((content: string): number[] => {
    const positions: number[] = []
    let pos = 0
    while ((pos = content.indexOf('***', pos)) !== -1) {
      positions.push(pos)
      pos += 3
    }
    return positions
  }, [])
  
  // Handle snippet detection and insertion
  const handleTextChange = useCallback((
    value: string, 
    setter: (v: string) => void, 
    fieldId: string,
    cursorPos: number
  ) => {
    // Check for ..snippet pattern
    const beforeCursor = value.slice(0, cursorPos)
    const snippetMatch = beforeCursor.match(/\.\.(\w+)$/)
    
    if (snippetMatch) {
      const searchTerm = snippetMatch[1].toLowerCase()
      const matches = Object.keys(textSnippets).filter(key => 
        key.toLowerCase().startsWith(searchTerm)
      )
      if (matches.length > 0) {
        setSnippetSuggestions(matches)
        setActiveSnippetField(fieldId)
        setSnippetCursorPos(cursorPos)
      } else {
        setSnippetSuggestions([])
      }
    } else {
      setSnippetSuggestions([])
    }
    
    setter(value)
  }, [])
  
  // Insert snippet into text
  const insertSnippet = useCallback((
    snippetKey: string,
    currentValue: string,
    setter: (v: string) => void,
    fieldId: string
  ) => {
    const beforeCursor = currentValue.slice(0, snippetCursorPos)
    const afterCursor = currentValue.slice(snippetCursorPos)
    
    // Find the ..phrase pattern and replace it
    const snippetMatch = beforeCursor.match(/\.\.(\w+)$/)
    if (snippetMatch) {
      const newBeforeCursor = beforeCursor.slice(0, beforeCursor.length - snippetMatch[0].length)
      const snippetContent = textSnippets[snippetKey] || ''
      setter(newBeforeCursor + snippetContent + afterCursor)
    }
    
    setSnippetSuggestions([])
    setActiveSnippetField(null)
  }, [snippetCursorPos])
  
  // Handle F2 key for jumping between placeholders
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        // Find the active textarea
        const activeElement = document.activeElement as HTMLTextAreaElement
        if (activeElement?.tagName === 'TEXTAREA') {
          const content = activeElement.value
          const currentPos = activeElement.selectionStart || 0
          const positions = findPlaceholderPositions(content)
          
          if (positions.length > 0) {
            // Find next placeholder after current position
            let nextPos = positions.find(p => p > currentPos)
            if (nextPos === undefined) {
              nextPos = positions[0] // Wrap around
            }
            
            // Find the end of this placeholder (next ***)
            const endPos = content.indexOf('***', nextPos + 3)
            if (endPos !== -1) {
              activeElement.setSelectionRange(nextPos, endPos + 3)
            } else {
              activeElement.setSelectionRange(nextPos, nextPos + 3)
            }
            activeElement.focus()
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [findPlaceholderPositions])
  
  // Form state
  const [subjective, setSubjective] = useState('Patient reports improved breathing. Slept well overnight. Denies chest pain, palpitations. Leg swelling improved. Good appetite.')
  const [uop, setUop] = useState({ intake: 1200, output: 2400, net: -1200 })
  const [exam, setExam] = useState({
    general: 'Alert, oriented, NAD',
    heent: 'NCAT, PERRL, MMM',
    neck: 'JVP 8cm (improved from 12cm), no LAD',
    cv: 'RRR, S1/S2, 2/6 SEM at LUSB, no rubs/gallops',
    lungs: 'Bibasilar crackles (improved), no wheezes',
    abd: 'Soft, NT, ND, +BS',
    ext: '1+ pitting edema bilateral LE (improved from 3+)',
    neuro: 'A&Ox3, no focal deficits',
  })
  const [selectedLabs, setSelectedLabs] = useState(['CBC', 'CMP', 'Cardiac', 'Minerals'])
  const [selectedImaging, setSelectedImaging] = useState(['CXR', 'Echo'])
  const [recommendations, setRecommendations] = useState<APRecommendation[]>([])
  const [expandedProblems, setExpandedProblems] = useState<Set<string>>(new Set())
  const [editingProblem, setEditingProblem] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  
  // ICU options
  const [hasVent, setHasVent] = useState(false)
  const [ventSettings, setVentSettings] = useState('AC/VC TV 450, RR 14, PEEP 5, FiO2 40%')
  const [hasPump, setHasPump] = useState(false)
  const [pumpSettings, setPumpSettings] = useState('IABP 1:1')
  const [hasSwanGanz, setHasSwanGanz] = useState(false)
  const [swanSettings, setSwanSettings] = useState('CI 2.4, SVR 1200, CVP 12, PAWP 18')
  
  // DVT Prophylaxis state
  const [dvtPpxSelected, setDvtPpxSelected] = useState<string[]>(['heparin'])
  const [dvtContraSelected, setDvtContraSelected] = useState<string[]>([])
  const [currentAnticoag, setCurrentAnticoag] = useState('none')
  
  // Diet state
  const [selectedDiets, setSelectedDiets] = useState<string[]>(['cardiac', 'diabetic'])
  const [fluidRestriction, setFluidRestriction] = useState('2L')
  
  // Disposition state
  const [dispoDestination, setDispoDestination] = useState('home')
  const [includePTNote, setIncludePTNote] = useState(true)
  const [includeOTNote, setIncludeOTNote] = useState(true)
  const [includeCMNote, setIncludeCMNote] = useState(true)
  
  // Medical equipment state
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['walker', 'shower_chair'])
  const [generatedMedicareBlurb, setGeneratedMedicareBlurb] = useState<Record<string, string>>({})
  
  // Inline orders from A/P (orders placed while editing note)
  const [inlineOrders, setInlineOrders] = useState<Array<{ problemId: string; orders: string[] }>>([])
  const [showInlineOrderPicker, setShowInlineOrderPicker] = useState<string | null>(null)
  
  // Electrolyte replete state
  const [selectedRepletes, setSelectedRepletes] = useState<string[]>([])
  
  // CMI / Billing state
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>(['I50.22', 'N18.3', 'E11.65'])
  const [showBillingPanel, setShowBillingPanel] = useState(false)
  
  // Section ordering - default order of sections
  const defaultSectionOrder = ['subjective', 'objective', 'labs', 'medications', 'imaging', 'ap', 'diet', 'dvt', 'disposition', 'equipment', 'cmi']
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultSectionOrder)
  
  // Collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const n = new Set(prev)
      n.has(section) ? n.delete(section) : n.add(section)
      return n
    })
  }
  
  // Inline order helpers (ordering from A/P section)
  const addInlineOrder = (problemId: string, orderName: string) => {
    setInlineOrders(prev => {
      const existing = prev.find(o => o.problemId === problemId)
      if (existing) {
        return prev.map(o => o.problemId === problemId 
          ? { ...o, orders: [...o.orders, orderName] } 
          : o)
      }
      return [...prev, { problemId, orders: [orderName] }]
    })
  }
  
  const removeInlineOrder = (problemId: string, orderName: string) => {
    setInlineOrders(prev => prev.map(o => 
      o.problemId === problemId 
        ? { ...o, orders: o.orders.filter(ord => ord !== orderName) }
        : o
    ).filter(o => o.orders.length > 0))
  }
  
  const getOrdersForProblem = (problemId: string) => {
    return inlineOrders.find(o => o.problemId === problemId)?.orders || []
  }
  
  // Section reordering helpers
  const moveSectionUp = (sectionId: string) => {
    setSectionOrder(prev => {
      const idx = prev.indexOf(sectionId)
      if (idx <= 0) return prev
      const newOrder = [...prev]
      ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
      return newOrder
    })
  }
  
  const moveSectionDown = (sectionId: string) => {
    setSectionOrder(prev => {
      const idx = prev.indexOf(sectionId)
      if (idx === -1 || idx >= prev.length - 1) return prev
      const newOrder = [...prev]
      ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
      return newOrder
    })
  }
  
  // Electrolyte replete helpers
  const electrolyteRepletes = [
    { id: 'k_oral', name: 'KCl 40mEq PO x1', electrolyte: 'K', threshold: 3.5 },
    { id: 'k_iv', name: 'KCl 20mEq IV x1', electrolyte: 'K', threshold: 3.0 },
    { id: 'mg_oral', name: 'MgO 400mg PO x1', electrolyte: 'Mg', threshold: 1.8 },
    { id: 'mg_iv', name: 'MgSO4 2g IV x1', electrolyte: 'Mg', threshold: 1.5 },
    { id: 'phos_oral', name: 'K-Phos 250mg PO x1', electrolyte: 'Phos', threshold: 2.5 },
    { id: 'phos_iv', name: 'NaPhos 15mmol IV x1', electrolyte: 'Phos', threshold: 2.0 },
    { id: 'ca_oral', name: 'CaCO3 1000mg PO x1', electrolyte: 'Ca', threshold: 8.5 },
  ]
  
  // Check for low electrolytes from labs
  const allLabs = Object.values(mockLabsWithTrends).flat()
  const lowElectrolytes = allLabs.filter(lab => {
    const val = typeof lab.value === 'number' ? lab.value : parseFloat(lab.value as string)
    if (isNaN(val)) return false
    if (lab.name === 'K' && val < 3.5) return true
    if (lab.name === 'Mg' && val < 1.8) return true
    if (lab.name === 'Phos' && val < 2.5) return true
    if (lab.name === 'Ca' && val < 8.5) return true
    return false
  })
  
  const toggleReplete = (repleteId: string) => {
    setSelectedRepletes(prev => 
      prev.includes(repleteId) ? prev.filter(r => r !== repleteId) : [...prev, repleteId]
    )
  }
  
  // Section header with reorder buttons
  const renderSectionHeader = (
    sectionId: string, 
    icon: React.ReactNode, 
    title: string, 
    badge?: React.ReactNode
  ) => {
    const idx = sectionOrder.indexOf(sectionId)
    const isFirst = idx === 0
    const isLast = idx === sectionOrder.length - 1
    
    return (
      <div className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200">
        <button onClick={() => toggleSection(sectionId)} className="flex items-center gap-2 flex-1 text-left">
          {collapsedSections.has(sectionId) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {icon}
          <span className="font-medium text-sm">{title}</span>
          {badge}
        </button>
        <div className="flex items-center gap-1 opacity-50 hover:opacity-100">
          <button 
            onClick={(e) => { e.stopPropagation(); moveSectionUp(sectionId); }} 
            disabled={isFirst}
            className={`p-0.5 rounded hover:bg-slate-300 ${isFirst ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="Move section up"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); moveSectionDown(sectionId); }} 
            disabled={isLast}
            className={`p-0.5 rounded hover:bg-slate-300 ${isLast ? 'opacity-30 cursor-not-allowed' : ''}`}
            title="Move section down"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    )
  }
  
  // CMI helpers
  const toggleDiagnosis = (code: string) => {
    setSelectedDiagnoses(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }
  
  const addDiagnosisToNote = (diagnosis: Diagnosis) => {
    // Add diagnosis to recommendations if not already there
    const existingRec = recommendations.find(r => r.problem.includes(diagnosis.code))
    if (!existingRec) {
      const newRec: APRecommendation = {
        id: `dx-${diagnosis.code}`,
        problem: `${diagnosis.description} (${diagnosis.code})`,
        supportingData: [],
        recommendations: ['Document and address as appropriate'],
        status: 'accepted'
      }
      setRecommendations(prev => [...prev, newRec])
      setExpandedProblems(prev => { const n = new Set(prev); n.add(newRec.id); return n })
    }
    if (!selectedDiagnoses.includes(diagnosis.code)) {
      setSelectedDiagnoses(prev => [...prev, diagnosis.code])
    }
  }
  
  const addCustomBlock = (afterSection: string) => {
    setCustomBlocks(prev => [...prev, { id: `block-${Date.now()}`, afterSection, content: '' }])
  }

  const updateCustomBlock = (id: string, content: string) => {
    setCustomBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))
  }

  const removeCustomBlock = (id: string) => {
    setCustomBlocks(prev => prev.filter(b => b.id !== id))
  }

  const handleGenerateAP = async () => {
    setIsGenerating(true)
    await new Promise(r => setTimeout(r, 1500))
    setRecommendations(defaultRecommendations)
    setExpandedProblems(new Set(defaultRecommendations.map(r => r.id)))
    setIsGenerating(false)
  }

  const updateRecStatus = (id: string, status: APRecommendation['status']) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const acceptAll = () => {
    setRecommendations(prev => prev.map(r => ({ ...r, status: 'accepted' })))
  }

  const startEditing = (rec: APRecommendation) => {
    setEditingProblem(rec.id)
    setEditText(rec.editedContent || rec.recommendations.join('\n'))
    setExpandedProblems(prev => { const n = new Set(prev); n.add(rec.id); return n })
  }

  const saveEdit = (id: string) => {
    setRecommendations(prev => prev.map(r => 
      r.id === id ? { ...r, status: 'edited', editedContent: editText, recommendations: editText.split('\n').filter(l => l.trim()) } : r
    ))
    setEditingProblem(null)
    setEditText('')
  }

  const cancelEdit = () => {
    setEditingProblem(null)
    setEditText('')
  }

  // Check if DVT prophylaxis is addressed
  const isDvtAddressed = dvtPpxSelected.length > 0 || currentAnticoag !== 'none' || dvtContraSelected.length > 0
  
  // Generate Medicare justification for equipment
  const generateMedicareBlurb = (equipmentId: string) => {
    const equipment = medicalEquipmentOptions.find(e => e.id === equipmentId)
    if (!equipment) return
    
    const patientConditions = 'heart failure with reduced ejection fraction (EF 35%), chronic kidney disease stage 3, and type 2 diabetes mellitus'
    const functionalStatus = mockPTNote.assessment
    
    const blurbs: Record<string, string> = {
      walker: `Medicare Justification for Rolling Walker:\n\nPatient is a ${patientConditions.includes('heart failure') ? '65+ year old' : ''} individual with ${patientConditions}. Per physical therapy evaluation dated ${mockPTNote.date}, ${functionalStatus} The patient demonstrates impaired balance and mobility requiring assistive device for safe ambulation. Without a rolling walker, patient is at high risk for falls and injury. The rolling walker is medically necessary to enable safe ambulation within the home and community, reducing fall risk and preventing hospital readmission.`,
      
      shower_chair: `Medicare Justification for Shower Chair:\n\nPatient has ${patientConditions} with documented functional limitations including decreased exercise tolerance and lower extremity weakness/edema. Per OT evaluation, patient has difficulty with prolonged standing required for bathing. A shower chair is medically necessary to allow safe bathing while seated, preventing falls in a wet environment and reducing cardiac workload during ADLs.`,
      
      commode: `Medicare Justification for Bedside Commode:\n\nPatient with ${patientConditions} has documented decreased mobility and exercise intolerance. Ambulation to bathroom, particularly at night, poses significant fall risk. A bedside commode is medically necessary to provide safe toileting, especially during nighttime when fall risk is highest, and to reduce cardiac demand associated with ambulation.`,
      
      oxygen: `Medicare Justification for Home Oxygen:\n\nPatient with ${patientConditions} demonstrates hypoxemia with SpO2 < 88% on room air during ambulation. Qualifying blood gas/oximetry results are documented in the medical record. Continuous supplemental oxygen is medically necessary to maintain adequate tissue oxygenation, prevent hypoxia-related complications, and enable safe mobility.`,
      
      hospital_bed: `Medicare Justification for Hospital Bed:\n\nPatient with ${patientConditions} requires elevation of head of bed for management of orthopnea and paroxysmal nocturnal dyspnea associated with heart failure. A hospital bed with adjustable head/foot positioning is medically necessary to optimize respiratory status, reduce pulmonary congestion, and enable safe transfers.`,
    }
    
    const defaultBlurb = `Medicare Justification for ${equipment.name}:\n\nPatient with ${patientConditions} requires ${equipment.name.toLowerCase()} based on functional assessment and medical necessity. This equipment is essential for safe home discharge and to prevent complications/readmission.`
    
    setGeneratedMedicareBlurb(prev => ({
      ...prev,
      [equipmentId]: blurbs[equipmentId] || defaultBlurb
    }))
  }

  const buildNote = () => {
    let content = `SUBJECTIVE:\n${subjective}\n`
    customBlocks.filter(b => b.afterSection === 'subjective').forEach(b => { content += `\n${b.content}\n` })
    
    content += `\nOBJECTIVE:\n`
    content += `Vitals (Latest): HR ${mockVitalsData.latest.hr}, BP ${mockVitalsData.latest.sbp}/${mockVitalsData.latest.dbp} (MAP ${mockVitalsData.latest.map}), T ${mockVitalsData.latest.temp}°F, RR ${mockVitalsData.latest.rr}, SpO2 ${mockVitalsData.latest.spo2}% on ${mockVitalsData.latest.fio2}L NC\n`
    content += `24h Ranges: HR ${mockVitalsData.min24h.hr}-${mockVitalsData.max24h.hr}, SBP ${mockVitalsData.min24h.sbp}-${mockVitalsData.max24h.sbp}, Temp ${mockVitalsData.min24h.temp}-${mockVitalsData.max24h.temp}\n`
    content += `I/O (24h): Intake ${uop.intake}mL, Output ${uop.output}mL, Net ${uop.net}mL\n\n`
    content += `Physical Exam:\n`
    Object.entries(exam).forEach(([k, val]) => { content += `  ${k.charAt(0).toUpperCase() + k.slice(1)}: ${val}\n` })
    if (hasVent) content += `\nVentilator: ${ventSettings}\n`
    if (hasPump) content += `Pump: ${pumpSettings}\n`
    if (hasSwanGanz) content += `Swan-Ganz: ${swanSettings}\n`
    customBlocks.filter(b => b.afterSection === 'objective').forEach(b => { content += `\n${b.content}\n` })
    
    content += `\nLABS (3-day trends):\n`
    selectedLabs.forEach(panel => {
      const labs = mockLabsWithTrends[panel]
      if (labs) {
        content += `  ${panel}: `
        content += labs.map(l => {
          const trendStr = l.trend.length ? ` (${l.trend.join('→')})` : ''
          return `${l.name} ${l.value}${l.flag ? ` [${l.flag}]` : ''}${trendStr}`
        }).join(', ')
        content += '\n'
      }
    })
    customBlocks.filter(b => b.afterSection === 'labs').forEach(b => { content += `\n${b.content}\n` })
    
    content += `\nIMAGING:\n`
    mockImaging.filter(i => selectedImaging.includes(i.type)).forEach(i => {
      content += `  ${i.type} (${i.date}): ${i.finding}\n`
    })
    customBlocks.filter(b => b.afterSection === 'imaging').forEach(b => { content += `\n${b.content}\n` })
    
    content += `\nASSESSMENT & PLAN:\n`
    recommendations.filter(r => r.status === 'accepted' || r.status === 'edited').forEach((r, i) => {
      content += `\n${i + 1}. ${r.problem}\n`
      if (r.supportingData.length > 0) {
        content += `   Data: ${r.supportingData.map(d => `${d.label}: ${d.value}${d.trend ? ` (${d.trend})` : ''}`).join(', ')}\n`
      }
      r.recommendations.forEach(rec => { content += `   - ${rec}\n` })
    })
    customBlocks.filter(b => b.afterSection === 'assessment').forEach(b => { content += `\n${b.content}\n` })
    
    // Diet
    content += `\nDIET:\n`
    const dietNames = selectedDiets.map(d => dietOptions.find(o => o.id === d)?.name).filter(Boolean)
    content += `  ${dietNames.join(', ')}\n`
    if (fluidRestriction) content += `  Fluid restriction: ${fluidRestriction}\n`
    
    // DVT Prophylaxis
    content += `\nPROPHYLAXIS:\n`
    if (currentAnticoag !== 'none') {
      const anticoagName = anticoagulationOptions.find(a => a.id === currentAnticoag)?.name
      content += `  DVT ppx: On therapeutic anticoagulation (${anticoagName})\n`
    } else if (dvtContraSelected.length > 0) {
      const contraNames = dvtContraSelected.map(c => dvtContraindications.find(o => o.id === c)?.name).filter(Boolean)
      content += `  DVT ppx: Pharmacologic contraindicated (${contraNames.join(', ')})\n`
      const mechPpx = dvtPpxSelected.filter(p => dvtPpxOptions.find(o => o.id === p)?.type === 'mechanical')
      if (mechPpx.length > 0) {
        content += `  Mechanical: ${mechPpx.map(p => dvtPpxOptions.find(o => o.id === p)?.name).join(', ')}\n`
      }
    } else {
      const ppxNames = dvtPpxSelected.map(p => dvtPpxOptions.find(o => o.id === p)?.name).filter(Boolean)
      content += `  DVT ppx: ${ppxNames.join(', ')}\n`
    }
    content += `  GI ppx: Famotidine 20mg daily\n`
    
    // Disposition
    content += `\nDISPOSITION:\n`
    content += `  Discharge destination: ${dispoDestination === 'home' ? 'Home' : dispoDestination === 'snf' ? 'SNF' : dispoDestination === 'rehab' ? 'Acute Rehab' : 'LTACH'}\n`
    if (includePTNote) {
      content += `\n  PT (${mockPTNote.date}): ${mockPTNote.recommendation}\n`
    }
    if (includeOTNote) {
      content += `  OT (${mockOTNote.date}): ${mockOTNote.recommendation}\n`
    }
    if (includeCMNote) {
      content += `  CM (${mockCMNote.date}): ${mockCMNote.plan}\n`
    }
    
    // Equipment
    if (selectedEquipment.length > 0) {
      content += `\nDME ORDERED:\n`
      selectedEquipment.forEach(eqId => {
        const eq = medicalEquipmentOptions.find(e => e.id === eqId)
        if (eq) content += `  - ${eq.name}\n`
      })
      // Add Medicare blurbs if generated
      Object.entries(generatedMedicareBlurb).forEach(([eqId, blurb]) => {
        if (selectedEquipment.includes(eqId)) {
          content += `\n${blurb}\n`
        }
      })
    }
    
    return content
  }

  // Check if note can be signed (no *** placeholders)
  const noteContent = buildNote()
  const canSign = !hasPlaceholders(noteContent)
  const placeholderCount = findPlaceholderPositions(noteContent).length / 2 // Each placeholder has start and end ***

  const handleSave = (status: 'draft' | 'pended' | 'signed') => {
    if (status === 'signed' && !canSign) {
      alert(`Cannot sign note: ${Math.floor(placeholderCount)} placeholder(s) (***) still need to be filled in. Use F2 to jump between placeholders.`)
      return
    }
    onSave({ type: 'Progress Note', service: 'Hospitalist', content: noteContent, billingCodes: billingCode ? [billingCode] : undefined }, status)
  }
  
  // Format medication last given time
  const formatLastGiven = (date?: Date) => {
    if (!date) return 'Not given'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours < 1) return `${mins}m ago`
    if (hours < 24) return `${hours}h ${mins}m ago`
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // Sort medications by added date (newest first)
  const sortedMedications = [...mockMedications].sort((a, b) => b.addedDate.getTime() - a.addedDate.getTime())
  const scheduledMeds = sortedMedications.filter(m => m.category === 'scheduled')
  const ivDrips = sortedMedications.filter(m => m.category === 'iv_drip')
  const prnMeds = sortedMedications.filter(m => m.category === 'prn')
  const homeMeds = sortedMedications.filter(m => m.isHome)

  const handleGenerateBilling = () => {
    setShowBilling(true)
    const count = recommendations.filter(r => r.status === 'accepted' || r.status === 'edited').length
    setBillingCode(count >= 5 ? '99233' : count >= 3 ? '99232' : '99231')
  }

  // Render snippet suggestions dropdown
  const renderSnippetSuggestions = (fieldId: string, currentValue: string, setter: (v: string) => void) => {
    if (activeSnippetField !== fieldId || snippetSuggestions.length === 0) return null
    return (
      <div className="absolute z-50 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto w-64">
        <div className="px-2 py-1 text-xs text-muted-foreground bg-slate-50 border-b">
          Available snippets (type ..phrase)
        </div>
        {snippetSuggestions.map(key => (
          <button
            key={key}
            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-b-0"
            onClick={() => insertSnippet(key, currentValue, setter, fieldId)}
          >
            <span className="font-mono text-blue-600">..</span>
            <span className="font-medium">{key}</span>
            <div className="text-xs text-muted-foreground truncate">
              {textSnippets[key]?.slice(0, 50)}...
            </div>
          </button>
        ))}
      </div>
    )
  }

  const renderCustomBlocks = (afterSection: string) => (
    <>
      {customBlocks.filter(b => b.afterSection === afterSection).map(block => (
        <div key={block.id} className="mt-2 relative group">
          <textarea
            className="w-full p-2 border border-dashed border-blue-300 rounded text-sm bg-blue-50/50 min-h-[60px]"
            value={block.content}
            onChange={e => {
              const cursorPos = e.target.selectionStart || 0
              handleTextChange(e.target.value, (v) => updateCustomBlock(block.id, v), `custom-${block.id}`, cursorPos)
            }}
            placeholder="Add additional notes... (type ..phrase for snippets)"
          />
          {renderSnippetSuggestions(`custom-${block.id}`, block.content, (v) => updateCustomBlock(block.id, v))}
          <button onClick={() => removeCustomBlock(block.id)} className="absolute top-1 right-1 p-1 text-red-500 opacity-0 group-hover:opacity-100">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button onClick={() => addCustomBlock(afterSection)} className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
        <Plus className="h-3 w-3" /> Add text block
      </button>
    </>
  )
  
  // State for medication orders
  const [medOrders, setMedOrders] = useState<string[]>([])
  
  const toggleMedOrder = (medId: string, medName: string, medDetails: string) => {
    const orderStr = `${medName} ${medDetails}`
    setMedOrders(prev => 
      prev.includes(orderStr) ? prev.filter(o => o !== orderStr) : [...prev, orderStr]
    )
  }
  
  // Render a single medication row with order button
  const renderMedRow = (med: Medication) => {
    const orderStr = `${med.name} ${med.dose} ${med.route} ${med.frequency}`
    const isOrdered = medOrders.includes(orderStr)
    
    return (
      <div key={med.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 border-b last:border-b-0">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{med.name}</span>
            {med.isHome && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700"><Home className="h-2 w-2 mr-0.5" />Home</Badge>}
            {isOrdered && <Badge variant="default" className="text-[10px] bg-green-600">Ordered</Badge>}
          </div>
          <div className="text-xs text-muted-foreground">
            {med.dose} {med.route} {med.frequency}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Last given:</div>
            <div className={`text-xs font-medium ${med.lastGiven ? 'text-green-600' : 'text-amber-600'}`}>
              {formatLastGiven(med.lastGiven)}
            </div>
          </div>
          <button
            onClick={() => toggleMedOrder(med.id, med.name, `${med.dose} ${med.route} ${med.frequency}`)}
            className={`px-2 py-1 text-xs border rounded ${
              isOrdered 
                ? 'bg-green-100 border-green-400 text-green-800' 
                : 'bg-white hover:bg-blue-50 border-slate-300'
            }`}
            title={isOrdered ? 'Remove order' : 'Order this medication'}
          >
            {isOrdered ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
          </button>
        </div>
      </div>
    )
  }

  if (showPreview) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b px-4 py-2 flex items-center justify-between bg-slate-50">
          <div className="font-medium">Note Preview</div>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
            <Edit className="h-3 w-3 mr-1" /> Back to Edit
          </Button>
        </div>
        {!canSign && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <span><strong>{Math.floor(placeholderCount)} placeholder(s)</strong> (***) need to be filled before signing. Press <kbd className="px-1 py-0.5 bg-amber-200 rounded text-xs">F2</kbd> to jump between them.</span>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm bg-white p-4 border rounded">{noteContent}</pre>
        </div>
        <div className="border-t p-3 flex justify-between bg-slate-50">
          <Button variant="outline" size="sm" onClick={handleGenerateBilling}><Receipt className="h-3 w-3 mr-1" /> Auto-Bill</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSave('draft')}><Save className="h-3 w-3 mr-1" /> Draft</Button>
            <Button variant="outline" size="sm" onClick={() => handleSave('pended')} className="text-yellow-700"><Clock className="h-3 w-3 mr-1" /> Pend</Button>
            <Button size="sm" onClick={() => handleSave('signed')} className={canSign ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"} disabled={!canSign}>
              <FileSignature className="h-3 w-3 mr-1" /> Sign {!canSign && `(${Math.floor(placeholderCount)} ***)`}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-slate-50">
        <div className="font-medium">SOAP Note</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="h-3 w-3 mr-1" /> Preview
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Snippet Help Banner */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            <span><strong>Snippets:</strong> Type <code className="bg-blue-100 px-1 rounded">..</code> followed by a keyword (e.g., <code className="bg-blue-100 px-1 rounded">..physicalexam</code>, <code className="bg-blue-100 px-1 rounded">..labs</code>, <code className="bg-blue-100 px-1 rounded">..heartfailure</code>)</span>
          </div>
          <div className="flex items-center gap-2">
            <span><kbd className="px-1 py-0.5 bg-blue-200 rounded">F2</kbd> = Jump to next <code className="bg-blue-100 px-1 rounded">***</code></span>
          </div>
        </div>

        {/* SUBJECTIVE */}
        <div className="border-b">
          <button onClick={() => toggleSection('subjective')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('subjective') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <Stethoscope className="h-4 w-4" />
            <span className="font-medium text-sm">SUBJECTIVE</span>
          </button>
          {!collapsedSections.has('subjective') && (
            <div className="p-4 relative">
              <textarea
                className="w-full p-3 border rounded text-sm min-h-[100px]"
                value={subjective}
                onChange={e => {
                  const cursorPos = e.target.selectionStart || 0
                  handleTextChange(e.target.value, setSubjective, 'subjective', cursorPos)
                }}
                placeholder="Patient's chief complaint and history... (type ..phrase for snippets)"
              />
              {renderSnippetSuggestions('subjective', subjective, setSubjective)}
              {renderCustomBlocks('subjective')}
            </div>
          )}
        </div>

        {/* OBJECTIVE */}
        <div className="border-b">
          <button onClick={() => toggleSection('objective')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('objective') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <Activity className="h-4 w-4" />
            <span className="font-medium text-sm">OBJECTIVE</span>
          </button>
          {!collapsedSections.has('objective') && (
            <div className="p-4 space-y-4">
              {/* Vitals */}
              <div>
                <div className="text-sm font-medium mb-2">Vitals</div>
                <div className="bg-blue-50 rounded p-3 text-sm">
                  <div className="font-medium mb-2">Latest ({mockVitalsData.latest.time}):</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>HR: <span className="font-mono">{mockVitalsData.latest.hr}</span></div>
                    <div>BP: <span className="font-mono">{mockVitalsData.latest.sbp}/{mockVitalsData.latest.dbp}</span> (MAP {mockVitalsData.latest.map})</div>
                    <div>Temp: <span className="font-mono">{mockVitalsData.latest.temp}°F</span></div>
                    <div>RR: <span className="font-mono">{mockVitalsData.latest.rr}</span></div>
                    <div>SpO2: <span className="font-mono">{mockVitalsData.latest.spo2}%</span> on {mockVitalsData.latest.fio2}L NC</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="font-medium mb-1">24h Min/Max:</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>HR: <span className="font-mono">{mockVitalsData.min24h.hr}-{mockVitalsData.max24h.hr}</span></div>
                      <div>SBP: <span className="font-mono">{mockVitalsData.min24h.sbp}-{mockVitalsData.max24h.sbp}</span></div>
                      <div>Temp: <span className="font-mono">{mockVitalsData.min24h.temp}-{mockVitalsData.max24h.temp}</span></div>
                      <div>RR: <span className="font-mono">{mockVitalsData.min24h.rr}-{mockVitalsData.max24h.rr}</span></div>
                      <div>SpO2: <span className="font-mono">{mockVitalsData.min24h.spo2}-{mockVitalsData.max24h.spo2}%</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* I/O */}
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2"><Droplets className="h-4 w-4" /> I/O (24h)</div>
                <div className="flex gap-4">
                  <div><label className="text-xs text-muted-foreground">Intake (mL)</label>
                    <input type="number" className="w-24 px-2 py-1 border rounded text-sm" value={uop.intake} onChange={e => setUop({...uop, intake: +e.target.value, net: +e.target.value - uop.output})} />
                  </div>
                  <div><label className="text-xs text-muted-foreground">Output (mL)</label>
                    <input type="number" className="w-24 px-2 py-1 border rounded text-sm" value={uop.output} onChange={e => setUop({...uop, output: +e.target.value, net: uop.intake - +e.target.value})} />
                  </div>
                  <div><label className="text-xs text-muted-foreground">Net (mL)</label>
                    <div className={`w-24 px-2 py-1 border rounded text-sm font-medium ${uop.net < 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>{uop.net > 0 ? '+' : ''}{uop.net}</div>
                  </div>
                </div>
              </div>

              {/* Physical Exam */}
              <div>
                <div className="text-sm font-medium mb-2">Physical Exam</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(exam).map(([k, v]) => (
                    <div key={k}>
                      <label className="text-xs text-muted-foreground capitalize">{k}</label>
                      <input className="w-full px-2 py-1 border rounded text-sm" value={v} onChange={e => setExam({...exam, [k]: e.target.value})} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ICU Options */}
              <div className="space-y-2 border-t pt-3">
                <div className="text-xs text-muted-foreground mb-1">ICU Parameters (if applicable)</div>
                <div className="flex items-center gap-2"><Checkbox checked={hasVent} onCheckedChange={(c: boolean) => setHasVent(c)} /><span className="text-sm">Ventilator</span></div>
                {hasVent && <input className="w-full px-2 py-1 border rounded text-sm" value={ventSettings} onChange={e => setVentSettings(e.target.value)} />}
                <div className="flex items-center gap-2"><Checkbox checked={hasPump} onCheckedChange={(c: boolean) => setHasPump(c)} /><span className="text-sm">Mechanical Support</span></div>
                {hasPump && <input className="w-full px-2 py-1 border rounded text-sm" value={pumpSettings} onChange={e => setPumpSettings(e.target.value)} />}
                <div className="flex items-center gap-2"><Checkbox checked={hasSwanGanz} onCheckedChange={(c: boolean) => setHasSwanGanz(c)} /><span className="text-sm">Swan-Ganz</span></div>
                {hasSwanGanz && <input className="w-full px-2 py-1 border rounded text-sm" value={swanSettings} onChange={e => setSwanSettings(e.target.value)} />}
              </div>
              {renderCustomBlocks('objective')}
            </div>
          )}
        </div>

        {/* LABS */}
        <div className="border-b">
          <button onClick={() => toggleSection('labs')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('labs') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <FlaskConical className="h-4 w-4" />
            <span className="font-medium text-sm">LABS (3-Day Trends)</span>
          </button>
          {!collapsedSections.has('labs') && (
            <div className="p-4">
              {Object.entries(mockLabsWithTrends).map(([panel, labs]) => (
                <div key={panel} className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox checked={selectedLabs.includes(panel)} onCheckedChange={(c: boolean) => setSelectedLabs(c ? [...selectedLabs, panel] : selectedLabs.filter(l => l !== panel))} />
                    <span className="font-medium text-sm">{panel}</span>
                  </div>
                  {selectedLabs.includes(panel) && (
                    <div className="ml-6 bg-purple-50 rounded p-2">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="py-1">Lab</th>
                            <th>Day 1</th>
                            <th>Day 2</th>
                            <th>Today</th>
                            <th>Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labs.map((lab, i) => (
                            <tr key={i} className="border-t border-purple-100">
                              <td className="py-1 font-medium">{lab.name}</td>
                              {lab.trend.length > 0 ? (
                                <>
                                  <td className="font-mono">{lab.trend[0]}</td>
                                  <td className="font-mono">{lab.trend[1]}</td>
                                  <td className={`font-mono font-medium ${lab.flag === 'H' ? 'text-red-600' : lab.flag === 'L' ? 'text-blue-600' : ''}`}>
                                    {lab.trend[2]} {lab.flag && <span className="text-[10px]">{lab.flag}</span>}
                                  </td>
                                  <td><TrendIcon trend={lab.trend} /></td>
                                </>
                              ) : (
                                <td colSpan={4} className="font-mono">{lab.value} {lab.unit}</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {/* Electrolyte Replete Section */}
              {lowElectrolytes.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Beaker className="h-4 w-4 text-amber-700" />
                    <span className="font-medium text-sm text-amber-800">Low Electrolytes Detected - Replete?</span>
                  </div>
                  <div className="space-y-2">
                    {lowElectrolytes.map(lab => {
                      const relevantRepletes = electrolyteRepletes.filter(r => r.electrolyte === lab.name)
                      return (
                        <div key={lab.name} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-amber-900 w-20">
                            {lab.name}: <span className="text-red-600">{lab.value}</span> {lab.unit}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {relevantRepletes.map(replete => (
                              <button
                                key={replete.id}
                                onClick={() => toggleReplete(replete.id)}
                                className={`px-2 py-1 text-xs border rounded ${
                                  selectedRepletes.includes(replete.id)
                                    ? 'bg-green-100 border-green-400 text-green-800'
                                    : 'bg-white hover:bg-amber-100 border-amber-300'
                                }`}
                              >
                                {selectedRepletes.includes(replete.id) && <Check className="h-3 w-3 inline mr-1" />}
                                {replete.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {selectedRepletes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-300">
                      <span className="text-xs text-amber-700">
                        ✓ {selectedRepletes.length} replete order(s) will be placed
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {renderCustomBlocks('labs')}
            </div>
          )}
        </div>

        {/* MEDICATIONS - placed under labs */}
        <div className="border-b">
          <button onClick={() => toggleSection('medications')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('medications') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <Pill className="h-4 w-4" />
            <span className="font-medium text-sm">💊 MEDICATIONS</span>
            <Badge variant="outline" className="ml-2 text-[10px]">{mockMedications.length} active</Badge>
            {medOrders.length > 0 && (
              <Badge variant="default" className="ml-1 text-[10px]">{medOrders.length} to order</Badge>
            )}
          </button>
          {!collapsedSections.has('medications') && (
            <div className="p-4 space-y-4">
              <div className="text-xs text-muted-foreground mb-2">
                Medications sorted by date added (newest first). Click <ShoppingCart className="h-3 w-3 inline" /> to order.
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 ml-1"><Home className="h-2 w-2 mr-0.5" />Home</Badge> = home medication
              </div>
              
              {/* Home Medications Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="font-medium text-sm text-blue-800 mb-2 flex items-center gap-2">
                  <Home className="h-4 w-4" /> Home Medications ({homeMeds.length})
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  {homeMeds.map(med => (
                    <div key={med.id}>• {med.name} {med.dose} {med.route} {med.frequency}</div>
                  ))}
                </div>
              </div>
              
              {/* IV Drips */}
              {ivDrips.length > 0 && (
                <div>
                  <div className="font-medium text-sm mb-2 flex items-center gap-2 text-red-700">
                    <Activity className="h-4 w-4" /> IV Drips ({ivDrips.length})
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded divide-y divide-red-100">
                    {ivDrips.map(med => renderMedRow(med))}
                  </div>
                </div>
              )}
              
              {/* Scheduled Medications */}
              <div>
                <div className="font-medium text-sm mb-2 flex items-center gap-2 text-green-700">
                  <Clock className="h-4 w-4" /> Scheduled ({scheduledMeds.length})
                </div>
                <div className="bg-white border rounded divide-y">
                  {scheduledMeds.map(med => renderMedRow(med))}
                </div>
              </div>
              
              {/* PRN Medications */}
              <div>
                <div className="font-medium text-sm mb-2 flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" /> PRN ({prnMeds.length})
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded divide-y divide-amber-100">
                  {prnMeds.map(med => renderMedRow(med))}
                </div>
              </div>
              
              {/* Medication Orders Summary */}
              {medOrders.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="font-medium text-sm text-green-800 mb-2">✓ Medication Orders ({medOrders.length})</div>
                  <div className="text-xs space-y-1">
                    {medOrders.map((order, i) => <div key={i}>• {order}</div>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* IMAGING */}
        <div className="border-b">
          <button onClick={() => toggleSection('imaging')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('imaging') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <FileImage className="h-4 w-4" />
            <span className="font-medium text-sm">IMAGING</span>
          </button>
          {!collapsedSections.has('imaging') && (
            <div className="p-4 space-y-2">
              {mockImaging.map(img => (
                <div key={img.type} className="flex items-start gap-2">
                  <Checkbox checked={selectedImaging.includes(img.type)} onCheckedChange={(c: boolean) => setSelectedImaging(c ? [...selectedImaging, img.type] : selectedImaging.filter(i => i !== img.type))} />
                  <div className="flex-1 bg-amber-50 rounded p-2">
                    <div className="font-medium text-sm">{img.type} <span className="text-muted-foreground font-normal">({img.date})</span></div>
                    <div className="text-xs text-muted-foreground">{img.finding}</div>
                  </div>
                </div>
              ))}
              {renderCustomBlocks('imaging')}
            </div>
          )}
        </div>

        {/* ASSESSMENT & PLAN */}
        <div className="border-b">
          <button onClick={() => toggleSection('assessment')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('assessment') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <Sparkles className="h-4 w-4" />
            <span className="font-medium text-sm">ASSESSMENT & PLAN</span>
          </button>
          {!collapsedSections.has('assessment') && (
            <div className="p-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-6">
                  <Button onClick={handleGenerateAP} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Generate A/P from Data
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={acceptAll}>Accept All</Button>
                  </div>
                  <div className="space-y-2">
                    {recommendations.map(rec => (
                      <div key={rec.id} className={`border rounded p-3 ${rec.status === 'accepted' || rec.status === 'edited' ? 'border-green-300 bg-green-50' : rec.status === 'denied' ? 'border-red-200 bg-red-50 opacity-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <button onClick={() => setExpandedProblems(p => { const n = new Set(p); n.has(rec.id) ? n.delete(rec.id) : n.add(rec.id); return n })} className="flex items-center gap-2 font-medium text-sm">
                            {expandedProblems.has(rec.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {rec.problem}
                            {rec.status === 'edited' && <Badge variant="outline" className="text-[10px] ml-1">Edited</Badge>}
                          </button>
                          <div className="flex gap-1">
                            <Button size="sm" variant={rec.status === 'accepted' || rec.status === 'edited' ? 'default' : 'outline'} className="h-6 px-2 text-xs" onClick={() => updateRecStatus(rec.id, 'accepted')}><Check className="h-3 w-3" /></Button>
                            <Button size="sm" variant={editingProblem === rec.id ? 'default' : 'outline'} className="h-6 px-2 text-xs" onClick={() => startEditing(rec)}><Edit className="h-3 w-3" /></Button>
                            <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-red-600" onClick={() => updateRecStatus(rec.id, 'denied')}><X className="h-3 w-3" /></Button>
                          </div>
                        </div>
                        {expandedProblems.has(rec.id) && (
                          <div className="mt-2">
                            {rec.supportingData.length > 0 && (
                              <div className="mb-2 p-2 bg-slate-50 rounded border border-slate-200">
                                <div className="text-xs font-medium text-slate-500 mb-1">Supporting Data:</div>
                                <div className="flex flex-wrap gap-2">
                                  {rec.supportingData.map((data, i) => (
                                    <span key={i} className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
                                      data.type === 'lab' ? 'bg-purple-100 text-purple-800' :
                                      data.type === 'vital' ? 'bg-blue-100 text-blue-800' :
                                      data.type === 'imaging' ? 'bg-amber-100 text-amber-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      <span className="font-medium">{data.label}:</span>
                                      <span className="ml-1">{data.value}</span>
                                      {data.trend && <span className="ml-1 text-[10px] opacity-75">({data.trend})</span>}
                                      {data.flag && <span className={`ml-1 font-bold ${data.flag === 'H' ? 'text-red-600' : 'text-blue-600'}`}>{data.flag}</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {editingProblem === rec.id ? (
                              <div className="space-y-2">
                                <textarea className="w-full p-2 border rounded text-sm min-h-[80px]" value={editText} onChange={e => setEditText(e.target.value)} />
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                  <Button size="sm" onClick={() => saveEdit(rec.id)}>Save</Button>
                                </div>
                              </div>
                            ) : (
                              <ul className="ml-6 text-sm space-y-1">
                                {rec.recommendations.map((r, i) => <li key={i} className="text-muted-foreground">• {r}</li>)}
                              </ul>
                            )}
                            
                            {/* Inline Orders for this problem */}
                            <div className="mt-3 pt-2 border-t border-dashed">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                  <ShoppingCart className="h-3 w-3" /> Quick Orders
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 text-xs"
                                  onClick={() => setShowInlineOrderPicker(showInlineOrderPicker === rec.id ? null : rec.id)}
                                >
                                  {showInlineOrderPicker === rec.id ? 'Hide' : '+ Add Order'}
                                </Button>
                              </div>
                              
                              {/* Orders already added */}
                              {getOrdersForProblem(rec.id).length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {getOrdersForProblem(rec.id).map((order, i) => (
                                    <Badge key={i} variant="secondary" className="text-[10px] flex items-center gap-1">
                                      {order}
                                      <button onClick={() => removeInlineOrder(rec.id, order)} className="ml-1 hover:text-red-600">
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {/* Order picker */}
                              {showInlineOrderPicker === rec.id && (
                                <div className="bg-slate-50 rounded p-2 space-y-2">
                                  <div className="text-xs text-muted-foreground">Select orders related to {rec.problem}:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {singleOrders.slice(0, 15).map(order => (
                                      <button
                                        key={order.id}
                                        onClick={() => addInlineOrder(rec.id, order.name)}
                                        disabled={getOrdersForProblem(rec.id).includes(order.name)}
                                        className={`px-2 py-1 text-xs border rounded ${
                                          getOrdersForProblem(rec.id).includes(order.name) 
                                            ? 'bg-green-100 border-green-400 text-green-800' 
                                            : 'hover:bg-blue-50 hover:border-blue-300'
                                        }`}
                                      >
                                        {order.name}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex flex-wrap gap-1 pt-1 border-t">
                                    {orderSets.slice(0, 4).map(set => (
                                      <button
                                        key={set.id}
                                        onClick={() => addInlineOrder(rec.id, `[Order Set] ${set.name}`)}
                                        disabled={getOrdersForProblem(rec.id).includes(`[Order Set] ${set.name}`)}
                                        className="px-2 py-1 text-xs border rounded bg-blue-50 border-blue-200 hover:bg-blue-100"
                                      >
                                        📦 {set.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {renderCustomBlocks('assessment')}
            </div>
          )}
        </div>

        {/* DIET */}
        <div className="border-b">
          <button onClick={() => toggleSection('diet')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('diet') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="font-medium text-sm">🍽️ DIET</span>
          </button>
          {!collapsedSections.has('diet') && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {dietOptions.map(diet => (
                  <div key={diet.id} className="flex items-center gap-2">
                    <Checkbox checked={selectedDiets.includes(diet.id)} onCheckedChange={(c: boolean) => setSelectedDiets(c ? [...selectedDiets, diet.id] : selectedDiets.filter(d => d !== diet.id))} />
                    <span className="text-sm">{diet.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-sm">Fluid restriction:</span>
                <Select value={fluidRestriction} onValueChange={setFluidRestriction}>
                  <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1.5L">1.5L</SelectItem>
                    <SelectItem value="2L">2L</SelectItem>
                    <SelectItem value="2.5L">2.5L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* DVT PROPHYLAXIS */}
        <div className="border-b">
          <button onClick={() => toggleSection('dvt')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('dvt') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="font-medium text-sm">💉 DVT PROPHYLAXIS</span>
            {!isDvtAddressed && <Badge variant="destructive" className="ml-2 text-[10px]">⚠️ Review Required</Badge>}
          </button>
          {!collapsedSections.has('dvt') && (
            <div className="p-4 space-y-4">
              {!isDvtAddressed && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                  <strong>Alert:</strong> DVT prophylaxis not addressed. Please select prophylaxis, document contraindications, or confirm therapeutic anticoagulation.
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium mb-2">Current Anticoagulation</div>
                <Select value={currentAnticoag} onValueChange={setCurrentAnticoag}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {anticoagulationOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {currentAnticoag === 'none' && (
                <>
                  <div>
                    <div className="text-sm font-medium mb-2">Prophylaxis</div>
                    <div className="space-y-2">
                      {dvtPpxOptions.map(opt => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <Checkbox 
                            checked={dvtPpxSelected.includes(opt.id)} 
                            onCheckedChange={(c: boolean) => setDvtPpxSelected(c ? [...dvtPpxSelected, opt.id] : dvtPpxSelected.filter(p => p !== opt.id))} 
                          />
                          <span className="text-sm">{opt.name}</span>
                          <Badge variant="outline" className="text-[10px]">{opt.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Contraindications to Pharmacologic Ppx</div>
                    <div className="space-y-2">
                      {dvtContraindications.map(contra => (
                        <div key={contra.id} className="flex items-center gap-2">
                          <Checkbox 
                            checked={dvtContraSelected.includes(contra.id)} 
                            onCheckedChange={(c: boolean) => setDvtContraSelected(c ? [...dvtContraSelected, contra.id] : dvtContraSelected.filter(p => p !== contra.id))} 
                          />
                          <span className="text-sm">{contra.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* DISPOSITION */}
        <div className="border-b">
          <button onClick={() => toggleSection('disposition')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('disposition') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="font-medium text-sm">🏠 DISPOSITION</span>
          </button>
          {!collapsedSections.has('disposition') && (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Discharge Destination</div>
                <Select value={dispoDestination} onValueChange={setDispoDestination}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="home_hh">Home with Home Health</SelectItem>
                    <SelectItem value="snf">Skilled Nursing Facility (SNF)</SelectItem>
                    <SelectItem value="rehab">Acute Rehabilitation</SelectItem>
                    <SelectItem value="ltach">LTACH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* PT Note */}
              <div className="border rounded p-3 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={includePTNote} onCheckedChange={(c: boolean) => setIncludePTNote(c)} />
                    <span className="font-medium text-sm">PT Note ({mockPTNote.date})</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{mockPTNote.therapist}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{mockPTNote.assessment}</div>
                <div className="text-xs font-medium text-blue-800">{mockPTNote.recommendation}</div>
                {mockPTNote.equipment.length > 0 && (
                  <div className="text-xs mt-1">Equipment: {mockPTNote.equipment.join(', ')}</div>
                )}
              </div>
              
              {/* OT Note */}
              <div className="border rounded p-3 bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={includeOTNote} onCheckedChange={(c: boolean) => setIncludeOTNote(c)} />
                    <span className="font-medium text-sm">OT Note ({mockOTNote.date})</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{mockOTNote.therapist}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{mockOTNote.assessment}</div>
                <div className="text-xs font-medium text-green-800">{mockOTNote.recommendation}</div>
                {mockOTNote.equipment.length > 0 && (
                  <div className="text-xs mt-1">Equipment: {mockOTNote.equipment.join(', ')}</div>
                )}
              </div>
              
              {/* CM Note */}
              <div className="border rounded p-3 bg-purple-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={includeCMNote} onCheckedChange={(c: boolean) => setIncludeCMNote(c)} />
                    <span className="font-medium text-sm">Case Management ({mockCMNote.date})</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{mockCMNote.coordinator}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{mockCMNote.assessment}</div>
                <div className="text-xs font-medium text-purple-800">{mockCMNote.plan}</div>
                <div className="text-xs mt-1">Services: {mockCMNote.services.join(', ')}</div>
              </div>
            </div>
          )}
        </div>

        {/* MEDICAL EQUIPMENT */}
        <div className="border-b">
          <button onClick={() => toggleSection('equipment')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('equipment') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="font-medium text-sm">🩼 DME / EQUIPMENT</span>
          </button>
          {!collapsedSections.has('equipment') && (
            <div className="p-4 space-y-4">
              <div className="text-xs text-muted-foreground mb-2">Select equipment needed. Click &quot;Generate Medicare Justification&quot; for each item requiring documentation.</div>
              
              {['Mobility', 'Bathroom', 'Home', 'Respiratory'].map(category => (
                <div key={category}>
                  <div className="text-sm font-medium mb-2">{category}</div>
                  <div className="space-y-2">
                    {medicalEquipmentOptions.filter(e => e.category === category).map(eq => (
                      <div key={eq.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              checked={selectedEquipment.includes(eq.id)} 
                              onCheckedChange={(c: boolean) => setSelectedEquipment(c ? [...selectedEquipment, eq.id] : selectedEquipment.filter(e => e !== eq.id))} 
                            />
                            <span className="text-sm">{eq.name}</span>
                          </div>
                          {selectedEquipment.includes(eq.id) && (
                            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => generateMedicareBlurb(eq.id)}>
                              {generatedMedicareBlurb[eq.id] ? '✓ Regenerate' : 'Generate Medicare Justification'}
                            </Button>
                          )}
                        </div>
                        {generatedMedicareBlurb[eq.id] && selectedEquipment.includes(eq.id) && (
                          <div className="ml-6 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                            <div className="font-medium text-amber-800 mb-1">Medicare Justification:</div>
                            <pre className="whitespace-pre-wrap text-amber-900">{generatedMedicareBlurb[eq.id]}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CMI / DIAGNOSES & BILLING */}
        <div className="border-b">
          <button onClick={() => toggleSection('cmi')} className="w-full px-4 py-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-left">
            {collapsedSections.has('cmi') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <DollarSign className="h-4 w-4" />
            <span className="font-medium text-sm">💰 CMI / DIAGNOSES & BILLING</span>
            {cmiDiagnoses.filter(d => d.suggested && !selectedDiagnoses.includes(d.code)).length > 0 && (
              <Badge variant="destructive" className="ml-2 text-[10px]">
                {cmiDiagnoses.filter(d => d.suggested && !selectedDiagnoses.includes(d.code)).length} suggestions
              </Badge>
            )}
          </button>
          {!collapsedSections.has('cmi') && (
            <div className="p-4 space-y-4">
              {/* Suggested Diagnoses */}
              {cmiDiagnoses.filter(d => d.suggested && !selectedDiagnoses.includes(d.code)).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <div className="font-medium text-sm text-amber-800 mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Suggested Diagnoses (may improve CMI)
                  </div>
                  <div className="space-y-2">
                    {cmiDiagnoses.filter(d => d.suggested && !selectedDiagnoses.includes(d.code)).map(dx => (
                      <div key={dx.code} className="flex items-center justify-between bg-white rounded p-2 border">
                        <div>
                          <div className="text-sm font-medium">{dx.description}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="font-mono">{dx.code}</span>
                            {dx.hcc && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700">HCC</Badge>}
                            {dx.mcc && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700">MCC</Badge>}
                            {dx.cc && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">CC</Badge>}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addDiagnosisToNote(dx)}>
                          <Plus className="h-3 w-3 mr-1" /> Add to Note
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Selected Diagnoses */}
              <div>
                <div className="font-medium text-sm mb-2">Active Diagnoses</div>
                <div className="space-y-1">
                  {cmiDiagnoses.map(dx => (
                    <div key={dx.code} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedDiagnoses.includes(dx.code)}
                        onCheckedChange={() => toggleDiagnosis(dx.code)}
                      />
                      <span className="text-sm flex-1">{dx.description}</span>
                      <span className="text-xs font-mono text-muted-foreground">{dx.code}</span>
                      {dx.hcc && <Badge variant="outline" className="text-[10px]">HCC</Badge>}
                      {dx.mcc && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700">MCC</Badge>}
                      {dx.cc && !dx.mcc && <Badge variant="outline" className="text-[10px]">CC</Badge>}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Billing */}
              <div className="border-t pt-4">
                <div className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> Billing Code
                </div>
                <Select value={billingCode} onValueChange={setBillingCode}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select billing code..." /></SelectTrigger>
                  <SelectContent>
                    {billingCodes.map(b => (
                      <SelectItem key={b.code} value={b.code}>
                        <div className="flex items-center justify-between w-full">
                          <span>{b.code} - {b.desc}</span>
                          <Badge variant="outline" className="ml-2 text-[10px]">RVU: {b.rvu}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={handleGenerateBilling}>
                    <Sparkles className="h-3 w-3 mr-1" /> Auto-Select Based on Note
                  </Button>
                </div>
                {billingCode && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <div className="font-medium text-green-800">Selected: {billingCode}</div>
                    <div className="text-xs text-green-700">
                      {billingCodes.find(b => b.code === billingCode)?.desc} (RVU: {billingCodes.find(b => b.code === billingCode)?.rvu})
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legacy Billing (hidden, replaced by CMI section) */}
        {showBilling && false && (
          <div className="border-b p-4">
            <div className="text-sm font-medium flex items-center gap-2 mb-2"><Receipt className="h-4 w-4" /> Billing Code</div>
            <Select value={billingCode} onValueChange={setBillingCode}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {billingCodes.map(b => <SelectItem key={b.code} value={b.code}>{b.code} - {b.desc} (RVU: {b.rvu})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-3 flex justify-between bg-slate-50">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toggleSection('cmi')}>
            <DollarSign className="h-3 w-3 mr-1" /> Billing
          </Button>
          {inlineOrders.length > 0 && (
            <Badge variant="default" className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              {inlineOrders.reduce((acc, o) => acc + o.orders.length, 0)} orders pending
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleSave('draft')}><Save className="h-3 w-3 mr-1" /> Draft</Button>
          <Button variant="outline" size="sm" onClick={() => handleSave('pended')} className="text-yellow-700"><Clock className="h-3 w-3 mr-1" /> Pend</Button>
          <Button size="sm" onClick={() => handleSave('signed')} className={canSign ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"} disabled={!canSign}>
            <FileSignature className="h-3 w-3 mr-1" /> Sign {!canSign && `(${Math.floor(placeholderCount)} ***)`}
          </Button>
        </div>
      </div>
    </div>
  )
}
