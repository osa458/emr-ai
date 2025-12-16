/**
 * Common LOINC lab codes for clinical use
 * These are the most commonly ordered laboratory tests
 */

export const COMMON_LOINC_LABS = [
    // Complete Blood Count (CBC)
    { code: '26464-8', display: 'White blood cell count', unit: '10*3/uL', category: 'Hematology' },
    { code: '26453-1', display: 'Red blood cell count', unit: '10*6/uL', category: 'Hematology' },
    { code: '718-7', display: 'Hemoglobin', unit: 'g/dL', category: 'Hematology' },
    { code: '4544-3', display: 'Hematocrit', unit: '%', category: 'Hematology' },
    { code: '777-3', display: 'Platelet count', unit: '10*3/uL', category: 'Hematology' },
    { code: '787-2', display: 'MCV', unit: 'fL', category: 'Hematology' },
    { code: '785-6', display: 'MCH', unit: 'pg', category: 'Hematology' },
    { code: '786-4', display: 'MCHC', unit: 'g/dL', category: 'Hematology' },

    // Basic Metabolic Panel (BMP)
    { code: '2345-7', display: 'Glucose', unit: 'mg/dL', category: 'Chemistry' },
    { code: '3094-0', display: 'BUN', unit: 'mg/dL', category: 'Chemistry' },
    { code: '2160-0', display: 'Creatinine', unit: 'mg/dL', category: 'Chemistry' },
    { code: '2951-2', display: 'Sodium', unit: 'mEq/L', category: 'Chemistry' },
    { code: '2823-3', display: 'Potassium', unit: 'mEq/L', category: 'Chemistry' },
    { code: '2075-0', display: 'Chloride', unit: 'mEq/L', category: 'Chemistry' },
    { code: '2028-9', display: 'CO2', unit: 'mEq/L', category: 'Chemistry' },
    { code: '17861-6', display: 'Calcium', unit: 'mg/dL', category: 'Chemistry' },

    // Comprehensive Metabolic Panel additions
    { code: '1751-7', display: 'Albumin', unit: 'g/dL', category: 'Chemistry' },
    { code: '2885-2', display: 'Total Protein', unit: 'g/dL', category: 'Chemistry' },
    { code: '1975-2', display: 'Total Bilirubin', unit: 'mg/dL', category: 'Chemistry' },
    { code: '6768-6', display: 'Alkaline Phosphatase', unit: 'U/L', category: 'Chemistry' },
    { code: '1920-8', display: 'AST', unit: 'U/L', category: 'Chemistry' },
    { code: '1742-6', display: 'ALT', unit: 'U/L', category: 'Chemistry' },

    // Lipid Panel
    { code: '2093-3', display: 'Total Cholesterol', unit: 'mg/dL', category: 'Lipid' },
    { code: '2571-8', display: 'Triglycerides', unit: 'mg/dL', category: 'Lipid' },
    { code: '2085-9', display: 'HDL Cholesterol', unit: 'mg/dL', category: 'Lipid' },
    { code: '2089-1', display: 'LDL Cholesterol', unit: 'mg/dL', category: 'Lipid' },

    // Thyroid Panel
    { code: '3016-3', display: 'TSH', unit: 'mIU/L', category: 'Endocrine' },
    { code: '3026-2', display: 'Free T4', unit: 'ng/dL', category: 'Endocrine' },
    { code: '3053-6', display: 'Free T3', unit: 'pg/mL', category: 'Endocrine' },

    // Coagulation
    { code: '5902-2', display: 'PT', unit: 'seconds', category: 'Coagulation' },
    { code: '6301-6', display: 'INR', unit: 'ratio', category: 'Coagulation' },
    { code: '3173-2', display: 'PTT', unit: 'seconds', category: 'Coagulation' },

    // Cardiac
    { code: '10839-9', display: 'Troponin I', unit: 'ng/mL', category: 'Cardiac' },
    { code: '30522-7', display: 'Troponin T', unit: 'ng/mL', category: 'Cardiac' },
    { code: '42757-5', display: 'BNP', unit: 'pg/mL', category: 'Cardiac' },
    { code: '33762-6', display: 'NT-proBNP', unit: 'pg/mL', category: 'Cardiac' },

    // Inflammatory
    { code: '1988-5', display: 'CRP', unit: 'mg/L', category: 'Inflammatory' },
    { code: '30341-2', display: 'ESR', unit: 'mm/hr', category: 'Inflammatory' },
    { code: '6690-2', display: 'Procalcitonin', unit: 'ng/mL', category: 'Inflammatory' },

    // Diabetes
    { code: '4548-4', display: 'Hemoglobin A1c', unit: '%', category: 'Diabetes' },

    // Urinalysis
    { code: '5811-5', display: 'Urine Specific Gravity', unit: 'ratio', category: 'Urinalysis' },
    { code: '5803-2', display: 'Urine pH', unit: 'pH', category: 'Urinalysis' },
    { code: '5804-0', display: 'Urine Protein', unit: 'mg/dL', category: 'Urinalysis' },
    { code: '5792-7', display: 'Urine Glucose', unit: 'mg/dL', category: 'Urinalysis' },

    // Renal
    { code: '33914-3', display: 'eGFR', unit: 'mL/min/1.73m2', category: 'Renal' },
    { code: '2106-3', display: 'Urea Nitrogen [Ratio]', unit: 'ratio', category: 'Renal' },

    // Electrolytes
    { code: '2532-0', display: 'Magnesium', unit: 'mg/dL', category: 'Chemistry' },
    { code: '2777-1', display: 'Phosphorus', unit: 'mg/dL', category: 'Chemistry' },
    { code: '14627-4', display: 'Bicarbonate', unit: 'mEq/L', category: 'Chemistry' },

    // Blood Gas
    { code: '2744-1', display: 'pH arterial', unit: 'pH', category: 'Blood Gas' },
    { code: '2019-8', display: 'pCO2 arterial', unit: 'mmHg', category: 'Blood Gas' },
    { code: '2703-7', display: 'pO2 arterial', unit: 'mmHg', category: 'Blood Gas' },

    // Infectious
    { code: '94762-2', display: 'COVID-19 PCR', unit: 'result', category: 'Infectious' },
    { code: '5221-7', display: 'Influenza A', unit: 'result', category: 'Infectious' },
    { code: '5225-8', display: 'Influenza B', unit: 'result', category: 'Infectious' },
]

// Lab panels for ordering
export const LAB_PANELS = [
    { code: '24323-8', display: 'Complete Blood Count (CBC) with Differential', tests: ['26464-8', '26453-1', '718-7', '4544-3', '777-3'] },
    { code: '24320-4', display: 'Basic Metabolic Panel (BMP)', tests: ['2345-7', '3094-0', '2160-0', '2951-2', '2823-3', '2075-0', '2028-9', '17861-6'] },
    { code: '24322-0', display: 'Comprehensive Metabolic Panel (CMP)', tests: ['2345-7', '3094-0', '2160-0', '2951-2', '2823-3', '2075-0', '2028-9', '17861-6', '1751-7', '2885-2', '1975-2', '6768-6', '1920-8', '1742-6'] },
    { code: '24331-1', display: 'Lipid Panel', tests: ['2093-3', '2571-8', '2085-9', '2089-1'] },
    { code: '24348-5', display: 'Thyroid Panel', tests: ['3016-3', '3026-2', '3053-6'] },
    { code: '24325-3', display: 'Coagulation Panel', tests: ['5902-2', '6301-6', '3173-2'] },
    { code: '24356-8', display: 'Cardiac Biomarkers', tests: ['10839-9', '42757-5'] },
    { code: '24357-6', display: 'Urinalysis', tests: ['5811-5', '5803-2', '5804-0', '5792-7'] },
]
