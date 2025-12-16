/**
 * Seed LOINC lab codes to Aidbox as CodeSystem concepts
 * Usage: pnpm tsx scripts/seed-loinc-labs.ts
 */

const BASE_URL = process.env.AIDBOX_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app'
const CLIENT_ID = process.env.AIDBOX_CLIENT_ID || 'emr-api'
const CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET || 'emr-secret-123'

function authHeaders() {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    return {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json',
    }
}

// Common LOINC lab codes
const LOINC_LABS = [
    // CBC
    { code: '26464-8', display: 'WBC', unit: '10*3/uL', category: 'Hematology' },
    { code: '718-7', display: 'Hemoglobin', unit: 'g/dL', category: 'Hematology' },
    { code: '4544-3', display: 'Hematocrit', unit: '%', category: 'Hematology' },
    { code: '777-3', display: 'Platelet', unit: '10*3/uL', category: 'Hematology' },
    // BMP
    { code: '2345-7', display: 'Glucose', unit: 'mg/dL', category: 'Chemistry' },
    { code: '3094-0', display: 'BUN', unit: 'mg/dL', category: 'Chemistry' },
    { code: '2160-0', display: 'Creatinine', unit: 'mg/dL', category: 'Chemistry' },
    { code: '2951-2', display: 'Sodium', unit: 'mEq/L', category: 'Chemistry' },
    { code: '2823-3', display: 'Potassium', unit: 'mEq/L', category: 'Chemistry' },
    { code: '2075-0', display: 'Chloride', unit: 'mEq/L', category: 'Chemistry' },
    { code: '2028-9', display: 'CO2', unit: 'mEq/L', category: 'Chemistry' },
    { code: '17861-6', display: 'Calcium', unit: 'mg/dL', category: 'Chemistry' },
    // LFTs
    { code: '1920-8', display: 'AST', unit: 'U/L', category: 'Chemistry' },
    { code: '1742-6', display: 'ALT', unit: 'U/L', category: 'Chemistry' },
    { code: '1975-2', display: 'Total Bilirubin', unit: 'mg/dL', category: 'Chemistry' },
    { code: '6768-6', display: 'Alkaline Phosphatase', unit: 'U/L', category: 'Chemistry' },
    { code: '1751-7', display: 'Albumin', unit: 'g/dL', category: 'Chemistry' },
    // Lipids
    { code: '2093-3', display: 'Total Cholesterol', unit: 'mg/dL', category: 'Lipid' },
    { code: '2571-8', display: 'Triglycerides', unit: 'mg/dL', category: 'Lipid' },
    { code: '2085-9', display: 'HDL', unit: 'mg/dL', category: 'Lipid' },
    { code: '2089-1', display: 'LDL', unit: 'mg/dL', category: 'Lipid' },
    // Cardiac
    { code: '10839-9', display: 'Troponin I', unit: 'ng/mL', category: 'Cardiac' },
    { code: '42757-5', display: 'BNP', unit: 'pg/mL', category: 'Cardiac' },
    // Coag
    { code: '5902-2', display: 'PT', unit: 'sec', category: 'Coagulation' },
    { code: '6301-6', display: 'INR', unit: 'ratio', category: 'Coagulation' },
    { code: '3173-2', display: 'PTT', unit: 'sec', category: 'Coagulation' },
    // Thyroid
    { code: '3016-3', display: 'TSH', unit: 'mIU/L', category: 'Endocrine' },
    { code: '3026-2', display: 'Free T4', unit: 'ng/dL', category: 'Endocrine' },
    // Other
    { code: '4548-4', display: 'Hemoglobin A1c', unit: '%', category: 'Diabetes' },
    { code: '1988-5', display: 'CRP', unit: 'mg/L', category: 'Inflammatory' },
    { code: '33914-3', display: 'eGFR', unit: 'mL/min/1.73m2', category: 'Renal' },
]

// Lab panels
const LAB_PANELS = [
    { code: '24323-8', display: 'CBC with Differential', category: 'Panel' },
    { code: '24320-4', display: 'Basic Metabolic Panel', category: 'Panel' },
    { code: '24322-0', display: 'Comprehensive Metabolic Panel', category: 'Panel' },
    { code: '24331-1', display: 'Lipid Panel', category: 'Panel' },
    { code: '24348-5', display: 'Thyroid Panel', category: 'Panel' },
    { code: '24356-8', display: 'Cardiac Biomarkers', category: 'Panel' },
]

async function createActivityDefinition(lab: typeof LOINC_LABS[0]): Promise<boolean> {
    const activityDef = {
        resourceType: 'ActivityDefinition',
        id: `lab-${lab.code}`,
        status: 'active',
        name: lab.display.replace(/\s+/g, ''),
        title: lab.display,
        kind: 'ServiceRequest',
        code: {
            coding: [{ system: 'http://loinc.org', code: lab.code, display: lab.display }],
            text: lab.display,
        },
        description: `Order for ${lab.display} (LOINC: ${lab.code})`,
        topic: [{ text: lab.category }],
    }

    try {
        const response = await fetch(`${BASE_URL}/ActivityDefinition/${activityDef.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(activityDef),
        })
        return response.ok
    } catch {
        return false
    }
}

async function main() {
    console.log('Seeding LOINC lab codes to Aidbox...')

    const allLabs = [...LOINC_LABS, ...LAB_PANELS]
    let success = 0
    let failed = 0

    for (const lab of allLabs) {
        const ok = await createActivityDefinition(lab)
        if (ok) {
            success++
            console.log(`✓ ${lab.display} (${lab.code})`)
        } else {
            failed++
            console.log(`✗ ${lab.display}`)
        }
    }

    console.log(`\nComplete: ${success} succeeded, ${failed} failed`)
}

main().catch(console.error)
