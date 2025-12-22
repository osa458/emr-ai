/**
 * Comprehensive Clinical Orders Database
 * Organized by specialty with LOINC/HCPCS codes
 */

export interface ClinicalOrder {
    id: string
    code: string
    system: 'LOINC' | 'HCPCS' | 'CPT' | 'SNOMED'
    name: string
    category: string
    specialty: string
    type: 'lab' | 'imaging' | 'procedure' | 'consult' | 'test'
}

// CARDIOLOGY
export const CARDIOLOGY_ORDERS: ClinicalOrder[] = [
    // Labs
    { id: 'card-1', code: '10839-9', system: 'LOINC', name: 'Troponin I', category: 'Labs', specialty: 'Cardiology', type: 'lab' },
    { id: 'card-2', code: '42757-5', system: 'LOINC', name: 'BNP', category: 'Labs', specialty: 'Cardiology', type: 'lab' },
    { id: 'card-3', code: '33762-6', system: 'LOINC', name: 'NT-proBNP', category: 'Labs', specialty: 'Cardiology', type: 'lab' },
    { id: 'card-4', code: '2093-3', system: 'LOINC', name: 'Total Cholesterol', category: 'Labs', specialty: 'Cardiology', type: 'lab' },
    { id: 'card-5', code: '2571-8', system: 'LOINC', name: 'Triglycerides', category: 'Labs', specialty: 'Cardiology', type: 'lab' },
    { id: 'card-6', code: '2085-9', system: 'LOINC', name: 'HDL Cholesterol', category: 'Labs', specialty: 'Cardiology', type: 'lab' },
    { id: 'card-7', code: '2089-1', system: 'LOINC', name: 'LDL Cholesterol', category: 'Labs', specialty: 'Cardiology', type: 'lab' },
    // Imaging/Procedures
    { id: 'card-10', code: '93000', system: 'CPT', name: 'EKG 12-Lead', category: 'Imaging', specialty: 'Cardiology', type: 'test' },
    { id: 'card-11', code: '93306', system: 'CPT', name: 'Echocardiogram TTE', category: 'Imaging', specialty: 'Cardiology', type: 'imaging' },
    { id: 'card-12', code: '93312', system: 'CPT', name: 'Echocardiogram TEE', category: 'Imaging', specialty: 'Cardiology', type: 'imaging' },
    { id: 'card-13', code: '93015', system: 'CPT', name: 'Stress Test', category: 'Procedures', specialty: 'Cardiology', type: 'procedure' },
    { id: 'card-14', code: '93458', system: 'CPT', name: 'Left Heart Catheterization', category: 'Procedures', specialty: 'Cardiology', type: 'procedure' },
    { id: 'card-15', code: '93880', system: 'CPT', name: 'Carotid Doppler', category: 'Imaging', specialty: 'Cardiology', type: 'imaging' },
]

// NEUROLOGY
export const NEUROLOGY_ORDERS: ClinicalOrder[] = [
    { id: 'neuro-1', code: '95816', system: 'CPT', name: 'EEG Routine', category: 'Procedures', specialty: 'Neurology', type: 'test' },
    { id: 'neuro-2', code: '95861', system: 'CPT', name: 'EMG/Nerve Conduction', category: 'Procedures', specialty: 'Neurology', type: 'test' },
    { id: 'neuro-3', code: '62270', system: 'CPT', name: 'Lumbar Puncture', category: 'Procedures', specialty: 'Neurology', type: 'procedure' },
    { id: 'neuro-4', code: '70553', system: 'CPT', name: 'MRI Brain with contrast', category: 'Imaging', specialty: 'Neurology', type: 'imaging' },
    { id: 'neuro-5', code: '72156', system: 'CPT', name: 'MRI Spine with contrast', category: 'Imaging', specialty: 'Neurology', type: 'imaging' },
    { id: 'neuro-6', code: '70496', system: 'CPT', name: 'CT Angiography Head', category: 'Imaging', specialty: 'Neurology', type: 'imaging' },
    // CSF Labs
    { id: 'neuro-10', code: '2343-2', system: 'LOINC', name: 'CSF Glucose', category: 'Labs', specialty: 'Neurology', type: 'lab' },
    { id: 'neuro-11', code: '2880-3', system: 'LOINC', name: 'CSF Protein', category: 'Labs', specialty: 'Neurology', type: 'lab' },
    { id: 'neuro-12', code: '26464-8', system: 'LOINC', name: 'CSF Cell Count', category: 'Labs', specialty: 'Neurology', type: 'lab' },
]

// PULMONOLOGY
export const PULMONOLOGY_ORDERS: ClinicalOrder[] = [
    { id: 'pulm-1', code: '94010', system: 'CPT', name: 'Spirometry/PFTs', category: 'Procedures', specialty: 'Pulmonology', type: 'test' },
    { id: 'pulm-2', code: '94060', system: 'CPT', name: 'PFTs with Bronchodilator', category: 'Procedures', specialty: 'Pulmonology', type: 'test' },
    { id: 'pulm-3', code: '31622', system: 'CPT', name: 'Bronchoscopy', category: 'Procedures', specialty: 'Pulmonology', type: 'procedure' },
    { id: 'pulm-4', code: '71046', system: 'CPT', name: 'Chest X-Ray 2 views', category: 'Imaging', specialty: 'Pulmonology', type: 'imaging' },
    { id: 'pulm-5', code: '71250', system: 'CPT', name: 'CT Chest without contrast', category: 'Imaging', specialty: 'Pulmonology', type: 'imaging' },
    { id: 'pulm-6', code: '71260', system: 'CPT', name: 'CT Chest with contrast', category: 'Imaging', specialty: 'Pulmonology', type: 'imaging' },
    // ABG
    { id: 'pulm-10', code: '2744-1', system: 'LOINC', name: 'pH Arterial', category: 'Labs', specialty: 'Pulmonology', type: 'lab' },
    { id: 'pulm-11', code: '2019-8', system: 'LOINC', name: 'pCO2 Arterial', category: 'Labs', specialty: 'Pulmonology', type: 'lab' },
    { id: 'pulm-12', code: '2703-7', system: 'LOINC', name: 'pO2 Arterial', category: 'Labs', specialty: 'Pulmonology', type: 'lab' },
]

// GASTROENTEROLOGY
export const GI_ORDERS: ClinicalOrder[] = [
    { id: 'gi-1', code: '43239', system: 'CPT', name: 'EGD with biopsy', category: 'Procedures', specialty: 'Gastroenterology', type: 'procedure' },
    { id: 'gi-2', code: '45380', system: 'CPT', name: 'Colonoscopy with biopsy', category: 'Procedures', specialty: 'Gastroenterology', type: 'procedure' },
    { id: 'gi-3', code: '74176', system: 'CPT', name: 'CT Abdomen/Pelvis', category: 'Imaging', specialty: 'Gastroenterology', type: 'imaging' },
    { id: 'gi-4', code: '76700', system: 'CPT', name: 'Abdominal Ultrasound', category: 'Imaging', specialty: 'Gastroenterology', type: 'imaging' },
    // Liver Panel
    { id: 'gi-10', code: '1742-6', system: 'LOINC', name: 'ALT', category: 'Labs', specialty: 'Gastroenterology', type: 'lab' },
    { id: 'gi-11', code: '1920-8', system: 'LOINC', name: 'AST', category: 'Labs', specialty: 'Gastroenterology', type: 'lab' },
    { id: 'gi-12', code: '6768-6', system: 'LOINC', name: 'Alkaline Phosphatase', category: 'Labs', specialty: 'Gastroenterology', type: 'lab' },
    { id: 'gi-13', code: '1975-2', system: 'LOINC', name: 'Total Bilirubin', category: 'Labs', specialty: 'Gastroenterology', type: 'lab' },
    { id: 'gi-14', code: '1751-7', system: 'LOINC', name: 'Albumin', category: 'Labs', specialty: 'Gastroenterology', type: 'lab' },
    { id: 'gi-15', code: '6690-2', system: 'LOINC', name: 'Lipase', category: 'Labs', specialty: 'Gastroenterology', type: 'lab' },
    { id: 'gi-16', code: '1798-8', system: 'LOINC', name: 'Amylase', category: 'Labs', specialty: 'Gastroenterology', type: 'lab' },
]

// Export all orders combined
export const ALL_CLINICAL_ORDERS: ClinicalOrder[] = [
    ...CARDIOLOGY_ORDERS,
    ...NEUROLOGY_ORDERS,
    ...PULMONOLOGY_ORDERS,
    ...GI_ORDERS,
]

// Get orders by specialty
export function getOrdersBySpecialty(specialty: string): ClinicalOrder[] {
    return ALL_CLINICAL_ORDERS.filter(o => o.specialty === specialty)
}

// Search orders
export function searchOrders(query: string): ClinicalOrder[] {
    const q = query.toLowerCase()
    return ALL_CLINICAL_ORDERS.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.code.includes(q) ||
        o.specialty.toLowerCase().includes(q)
    )
}
