/**
 * Additional Specialty Orders - Part 2
 * Endocrine, Rheumatology, Nephrology, Hematology, Infectious Disease, Vascular
 */

import type { ClinicalOrder } from './clinical-orders'

// ENDOCRINOLOGY
export const ENDOCRINE_ORDERS: ClinicalOrder[] = [
    // Thyroid
    { id: 'endo-1', code: '3016-3', system: 'LOINC', name: 'TSH', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-2', code: '3026-2', system: 'LOINC', name: 'Free T4', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-3', code: '3053-6', system: 'LOINC', name: 'Free T3', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-4', code: '5385-0', system: 'LOINC', name: 'Thyroglobulin', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    // Diabetes
    { id: 'endo-10', code: '4548-4', system: 'LOINC', name: 'Hemoglobin A1c', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-11', code: '2345-7', system: 'LOINC', name: 'Glucose', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-12', code: '20448-7', system: 'LOINC', name: 'Fasting Insulin', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-13', code: '56490-6', system: 'LOINC', name: 'C-Peptide', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    // Adrenal
    { id: 'endo-20', code: '2143-6', system: 'LOINC', name: 'Cortisol AM', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-21', code: '1668-3', system: 'LOINC', name: 'ACTH', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-22', code: '2731-8', system: 'LOINC', name: 'Aldosterone', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    // Pituitary
    { id: 'endo-30', code: '2243-4', system: 'LOINC', name: 'Growth Hormone', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-31', code: '2986-8', system: 'LOINC', name: 'Prolactin', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-32', code: '15067-2', system: 'LOINC', name: 'FSH', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
    { id: 'endo-33', code: '10501-5', system: 'LOINC', name: 'LH', category: 'Labs', specialty: 'Endocrinology', type: 'lab' },
]

// RHEUMATOLOGY
export const RHEUM_ORDERS: ClinicalOrder[] = [
    { id: 'rheum-1', code: '8061-4', system: 'LOINC', name: 'ANA', category: 'Labs', specialty: 'Rheumatology', type: 'lab' },
    { id: 'rheum-2', code: '5130-0', system: 'LOINC', name: 'Rheumatoid Factor', category: 'Labs', specialty: 'Rheumatology', type: 'lab' },
    { id: 'rheum-3', code: '53027-9', system: 'LOINC', name: 'Anti-CCP', category: 'Labs', specialty: 'Rheumatology', type: 'lab' },
    { id: 'rheum-4', code: '1988-5', system: 'LOINC', name: 'CRP', category: 'Labs', specialty: 'Rheumatology', type: 'lab' },
    { id: 'rheum-5', code: '30341-2', system: 'LOINC', name: 'ESR', category: 'Labs', specialty: 'Rheumatology', type: 'lab' },
    { id: 'rheum-6', code: '14798-3', system: 'LOINC', name: 'Uric Acid', category: 'Labs', specialty: 'Rheumatology', type: 'lab' },
    { id: 'rheum-7', code: '35459-1', system: 'LOINC', name: 'Anti-dsDNA', category: 'Labs', specialty: 'Rheumatology', type: 'lab' },
    { id: 'rheum-8', code: '5244-9', system: 'LOINC', name: 'Complement C3', category: 'Labs', specialty: 'Rheumatology', type: 'lab' },
    { id: 'rheum-9', code: '4485-9', system: 'LOINC', name: 'Complement C4', category: 'Labs', specialty: 'Rheumatology', type: 'lab' },
    { id: 'rheum-10', code: '5298-5', system: 'LOINC', name: 'HLA-B27', category: 'Labs', specialty: 'Rheumatology', type: 'lab' },
]

// NEPHROLOGY
export const NEPHROLOGY_ORDERS: ClinicalOrder[] = [
    { id: 'neph-1', code: '2160-0', system: 'LOINC', name: 'Creatinine', category: 'Labs', specialty: 'Nephrology', type: 'lab' },
    { id: 'neph-2', code: '3094-0', system: 'LOINC', name: 'BUN', category: 'Labs', specialty: 'Nephrology', type: 'lab' },
    { id: 'neph-3', code: '33914-3', system: 'LOINC', name: 'eGFR', category: 'Labs', specialty: 'Nephrology', type: 'lab' },
    { id: 'neph-4', code: '14959-1', system: 'LOINC', name: 'Microalbumin/Creatinine Ratio', category: 'Labs', specialty: 'Nephrology', type: 'lab' },
    { id: 'neph-5', code: '2888-6', system: 'LOINC', name: '24hr Urine Protein', category: 'Labs', specialty: 'Nephrology', type: 'lab' },
    { id: 'neph-6', code: '2164-2', system: 'LOINC', name: '24hr Urine Creatinine', category: 'Labs', specialty: 'Nephrology', type: 'lab' },
    // Urinalysis
    { id: 'neph-10', code: '5811-5', system: 'LOINC', name: 'Urine Specific Gravity', category: 'Labs', specialty: 'Nephrology', type: 'lab' },
    { id: 'neph-11', code: '5803-2', system: 'LOINC', name: 'Urine pH', category: 'Labs', specialty: 'Nephrology', type: 'lab' },
    { id: 'neph-12', code: '5804-0', system: 'LOINC', name: 'Urine Protein', category: 'Labs', specialty: 'Nephrology', type: 'lab' },
    // Imaging
    { id: 'neph-20', code: '76770', system: 'CPT', name: 'Renal Ultrasound', category: 'Imaging', specialty: 'Nephrology', type: 'imaging' },
]

// HEMATOLOGY/ONCOLOGY
export const HEME_ONC_ORDERS: ClinicalOrder[] = [
    // CBC
    { id: 'heme-1', code: '26464-8', system: 'LOINC', name: 'WBC', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    { id: 'heme-2', code: '718-7', system: 'LOINC', name: 'Hemoglobin', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    { id: 'heme-3', code: '777-3', system: 'LOINC', name: 'Platelet Count', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    { id: 'heme-4', code: '4679-7', system: 'LOINC', name: 'Reticulocyte Count', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    // Iron Studies
    { id: 'heme-10', code: '2498-4', system: 'LOINC', name: 'Iron', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    { id: 'heme-11', code: '2502-3', system: 'LOINC', name: 'TIBC', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    { id: 'heme-12', code: '2276-4', system: 'LOINC', name: 'Ferritin', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    // Coagulation
    { id: 'heme-20', code: '5902-2', system: 'LOINC', name: 'PT', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    { id: 'heme-21', code: '6301-6', system: 'LOINC', name: 'INR', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    { id: 'heme-22', code: '3173-2', system: 'LOINC', name: 'PTT', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    { id: 'heme-23', code: '3255-7', system: 'LOINC', name: 'Fibrinogen', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    { id: 'heme-24', code: '48065-7', system: 'LOINC', name: 'D-Dimer', category: 'Labs', specialty: 'Hematology', type: 'lab' },
    // Tumor Markers
    { id: 'heme-30', code: '10508-0', system: 'LOINC', name: 'PSA', category: 'Labs', specialty: 'Oncology', type: 'lab' },
    { id: 'heme-31', code: '2039-6', system: 'LOINC', name: 'CEA', category: 'Labs', specialty: 'Oncology', type: 'lab' },
    { id: 'heme-32', code: '10334-1', system: 'LOINC', name: 'AFP', category: 'Labs', specialty: 'Oncology', type: 'lab' },
    { id: 'heme-33', code: '10230-1', system: 'LOINC', name: 'CA 19-9', category: 'Labs', specialty: 'Oncology', type: 'lab' },
    { id: 'heme-34', code: '10337-4', system: 'LOINC', name: 'CA 125', category: 'Labs', specialty: 'Oncology', type: 'lab' },
]

// INFECTIOUS DISEASE
export const ID_ORDERS: ClinicalOrder[] = [
    // Cultures
    { id: 'id-1', code: '600-7', system: 'LOINC', name: 'Blood Culture', category: 'Labs', specialty: 'Infectious Disease', type: 'lab' },
    { id: 'id-2', code: '630-4', system: 'LOINC', name: 'Urine Culture', category: 'Labs', specialty: 'Infectious Disease', type: 'lab' },
    { id: 'id-3', code: '6462-6', system: 'LOINC', name: 'Sputum Culture', category: 'Labs', specialty: 'Infectious Disease', type: 'lab' },
    { id: 'id-4', code: '43409-2', system: 'LOINC', name: 'Wound Culture', category: 'Labs', specialty: 'Infectious Disease', type: 'lab' },
    // Viral
    { id: 'id-10', code: '94762-2', system: 'LOINC', name: 'COVID-19 PCR', category: 'Labs', specialty: 'Infectious Disease', type: 'lab' },
    { id: 'id-11', code: '5221-7', system: 'LOINC', name: 'Influenza A', category: 'Labs', specialty: 'Infectious Disease', type: 'lab' },
    { id: 'id-12', code: '5225-8', system: 'LOINC', name: 'Influenza B', category: 'Labs', specialty: 'Infectious Disease', type: 'lab' },
    { id: 'id-13', code: '31208-2', system: 'LOINC', name: 'RSV', category: 'Labs', specialty: 'Infectious Disease', type: 'lab' },
    // Inflammatory
    { id: 'id-20', code: '6690-2', system: 'LOINC', name: 'Procalcitonin', category: 'Labs', specialty: 'Infectious Disease', type: 'lab' },
    { id: 'id-21', code: '14804-9', system: 'LOINC', name: 'Lactate', category: 'Labs', specialty: 'Infectious Disease', type: 'lab' },
]

// VASCULAR
export const VASCULAR_ORDERS: ClinicalOrder[] = [
    { id: 'vasc-1', code: '93926', system: 'CPT', name: 'Lower Extremity Arterial Doppler', category: 'Imaging', specialty: 'Vascular', type: 'imaging' },
    { id: 'vasc-2', code: '93970', system: 'CPT', name: 'Lower Extremity Venous Doppler', category: 'Imaging', specialty: 'Vascular', type: 'imaging' },
    { id: 'vasc-3', code: '93922', system: 'CPT', name: 'ABI (Ankle-Brachial Index)', category: 'Procedures', specialty: 'Vascular', type: 'test' },
    { id: 'vasc-4', code: '36221', system: 'CPT', name: 'Aortography', category: 'Procedures', specialty: 'Vascular', type: 'procedure' },
    { id: 'vasc-5', code: '74174', system: 'CPT', name: 'CT Angiography Abdomen', category: 'Imaging', specialty: 'Vascular', type: 'imaging' },
]

export const ADDITIONAL_SPECIALTY_ORDERS: ClinicalOrder[] = [
    ...ENDOCRINE_ORDERS,
    ...RHEUM_ORDERS,
    ...NEPHROLOGY_ORDERS,
    ...HEME_ONC_ORDERS,
    ...ID_ORDERS,
    ...VASCULAR_ORDERS,
]
