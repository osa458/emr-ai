/**
 * Seed FHIR ActivityDefinitions for Order Sets
 * 
 * This script creates ActivityDefinition resources in Aidbox that represent
 * clinical order sets (admission, diabetes, CHF, sepsis, etc.)
 * 
 * Run: npx ts-node scripts/seed-order-sets.ts
 */

const ORDER_SETS = [
    {
        resourceType: 'ActivityDefinition',
        id: 'order-set-admission',
        url: 'http://emr-ai.local/ActivityDefinition/admission-orders',
        name: 'AdmissionOrderSet',
        title: 'Admission Order Set',
        status: 'active',
        description: 'Standard admission orders for medicine service',
        purpose: 'Streamline the admission process with common orders',
        topic: [{ text: 'General', coding: [{ system: 'http://hl7.org/fhir/definition-topic', code: 'treatment', display: 'Treatment' }] }],
        kind: 'ServiceRequest',
        relatedArtifact: [
            { type: 'composed-of', display: 'Admit to Medicine', label: 'admit' },
            { type: 'composed-of', display: 'Attending: ***', label: 'attending' },
            { type: 'composed-of', display: 'Diagnosis: ***', label: 'diagnosis' },
            { type: 'composed-of', display: 'Condition: Stable', label: 'condition' },
            { type: 'composed-of', display: 'Code Status: Full Code', label: 'code' },
            { type: 'composed-of', display: 'Diet: Cardiac', label: 'diet' },
            { type: 'composed-of', display: 'Activity: Up ad lib', label: 'activity' },
            { type: 'composed-of', display: 'Nursing: Vitals q4h', label: 'nursing' },
            { type: 'composed-of', display: 'IVF: Saline lock', label: 'ivf' },
            { type: 'composed-of', display: 'DVT ppx: Heparin 5000u SC TID', label: 'dvt' },
            { type: 'composed-of', display: 'Labs: CBC, CMP in AM', label: 'labs' },
        ],
    },
    {
        resourceType: 'ActivityDefinition',
        id: 'order-set-diabetes',
        url: 'http://emr-ai.local/ActivityDefinition/diabetes-management',
        name: 'DiabetesManagement',
        title: 'Diabetes Management',
        status: 'active',
        description: 'Insulin and glucose management protocol for inpatient diabetes',
        purpose: 'Standardize glucose management and insulin administration',
        topic: [{ text: 'Endocrine', coding: [{ system: 'http://snomed.info/sct', code: '362969004', display: 'Endocrine system' }] }],
        kind: 'ServiceRequest',
        relatedArtifact: [
            { type: 'composed-of', display: 'Fingerstick glucose AC and HS', label: 'fsbs' },
            { type: 'composed-of', display: 'Insulin sliding scale (moderate)', label: 'sliding', citation: 'Lispro: 150-200: 2u, 201-250: 4u, 251-300: 6u, 301-350: 8u, >350: 10u + call MD' },
            { type: 'composed-of', display: 'Basal insulin: Glargine *** units qHS', label: 'basal' },
            { type: 'composed-of', display: 'Mealtime insulin: Lispro *** units AC', label: 'meal' },
            { type: 'composed-of', display: 'Hypoglycemia protocol', label: 'hypogly' },
            { type: 'composed-of', display: 'HbA1c if not done in 3 months', label: 'a1c' },
        ],
    },
    {
        resourceType: 'ActivityDefinition',
        id: 'order-set-chf',
        url: 'http://emr-ai.local/ActivityDefinition/chf-management',
        name: 'CHFManagement',
        title: 'CHF / Heart Failure',
        status: 'active',
        description: 'Heart failure management orders including diuretics and monitoring',
        purpose: 'Optimize fluid management and heart failure treatment',
        topic: [{ text: 'Cardiology', coding: [{ system: 'http://snomed.info/sct', code: '42343007', display: 'Congestive heart failure' }] }],
        kind: 'ServiceRequest',
        relatedArtifact: [
            { type: 'composed-of', display: 'Daily weights', label: 'weight' },
            { type: 'composed-of', display: 'Strict I/O', label: 'io' },
            { type: 'composed-of', display: 'Fluid restriction: 1.5L/day', label: 'fluid' },
            { type: 'composed-of', display: 'Low sodium diet (<2g)', label: 'sodium' },
            { type: 'composed-of', display: 'Furosemide 40mg IV BID', label: 'lasix' },
            { type: 'composed-of', display: 'BNP daily x 3 days', label: 'bnp' },
            { type: 'composed-of', display: 'BMP daily', label: 'cmp' },
            { type: 'composed-of', display: 'Telemetry', label: 'tele' },
            { type: 'composed-of', display: 'O2 to maintain SpO2 > 92%', label: 'o2' },
        ],
    },
    {
        resourceType: 'ActivityDefinition',
        id: 'order-set-sepsis',
        url: 'http://emr-ai.local/ActivityDefinition/sepsis-bundle',
        name: 'SepsisBundle',
        title: 'Sepsis Bundle',
        status: 'active',
        description: 'Sepsis 3-hour and 6-hour bundle elements per Surviving Sepsis Campaign',
        purpose: 'Ensure timely sepsis recognition and treatment',
        topic: [{ text: 'Infectious Disease', coding: [{ system: 'http://snomed.info/sct', code: '91302008', display: 'Sepsis' }] }],
        kind: 'ServiceRequest',
        relatedArtifact: [
            { type: 'composed-of', display: 'Lactate level STAT', label: 'lactate' },
            { type: 'composed-of', display: 'Blood cultures x 2 before antibiotics', label: 'cultures' },
            { type: 'composed-of', display: 'Broad-spectrum antibiotics within 1 hour', label: 'abx', citation: 'Vancomycin + Zosyn (or per local antibiogram)' },
            { type: 'composed-of', display: '30 mL/kg crystalloid for hypotension or lactate ≥ 4', label: 'fluid' },
            { type: 'composed-of', display: 'Vasopressors if fluid-refractory hypotension', label: 'pressors', citation: 'Norepinephrine first-line' },
            { type: 'composed-of', display: 'Repeat lactate if initial > 2', label: 'repeat_lactate' },
            { type: 'composed-of', display: 'Procalcitonin', label: 'procalc' },
        ],
    },
    {
        resourceType: 'ActivityDefinition',
        id: 'order-set-transfusion',
        url: 'http://emr-ai.local/ActivityDefinition/blood-transfusion',
        name: 'BloodTransfusion',
        title: 'Blood Transfusion',
        status: 'active',
        description: 'PRBC transfusion order set with monitoring',
        purpose: 'Standardize blood transfusion orders and monitoring',
        topic: [{ text: 'Hematology', coding: [{ system: 'http://snomed.info/sct', code: '5447007', display: 'Transfusion' }] }],
        kind: 'ServiceRequest',
        relatedArtifact: [
            { type: 'composed-of', display: 'Type and Screen', label: 'type' },
            { type: 'composed-of', display: 'Transfuse 1 unit PRBC', label: 'prbc' },
            { type: 'composed-of', display: 'Premedication: Tylenol 650mg PO', label: 'premeds' },
            { type: 'composed-of', display: 'Furosemide 20mg IV after transfusion', label: 'lasix_post', citation: 'For patients at risk of volume overload' },
            { type: 'composed-of', display: 'Vitals q15min x 4, then q30min x 2', label: 'vitals' },
            { type: 'composed-of', display: 'Post-transfusion Hgb in 1 hour', label: 'post_hgb' },
        ],
    },
    {
        resourceType: 'ActivityDefinition',
        id: 'order-set-ventilator',
        url: 'http://emr-ai.local/ActivityDefinition/ventilator-orders',
        name: 'VentilatorOrders',
        title: 'Ventilator / Intubation',
        status: 'active',
        description: 'Mechanical ventilation initiation orders',
        purpose: 'Standardize ventilator settings and post-intubation care',
        topic: [{ text: 'Critical Care', coding: [{ system: 'http://snomed.info/sct', code: '40617009', display: 'Artificial respiration' }] }],
        kind: 'ServiceRequest',
        relatedArtifact: [
            { type: 'composed-of', display: 'Mode: AC/VC', label: 'mode' },
            { type: 'composed-of', display: 'Tidal Volume: 6-8 mL/kg IBW', label: 'vt' },
            { type: 'composed-of', display: 'Rate: 14', label: 'rr' },
            { type: 'composed-of', display: 'PEEP: 5', label: 'peep' },
            { type: 'composed-of', display: 'FiO2: 100% initially, titrate to SpO2 > 92%', label: 'fio2' },
            { type: 'composed-of', display: 'Sedation: Propofol gtt', label: 'sedation' },
            { type: 'composed-of', display: 'Analgesia: Fentanyl gtt', label: 'analgesia' },
            { type: 'composed-of', display: 'HOB > 30 degrees', label: 'hob' },
            { type: 'composed-of', display: 'ABG in 30 minutes', label: 'abg' },
            { type: 'composed-of', display: 'Portable CXR to confirm ETT placement', label: 'cxr' },
        ],
    },
    {
        resourceType: 'ActivityDefinition',
        id: 'order-set-lvad',
        url: 'http://emr-ai.local/ActivityDefinition/lvad-management',
        name: 'LVADManagement',
        title: 'LVAD Management',
        status: 'active',
        description: 'Left ventricular assist device monitoring and management',
        purpose: 'Standardize LVAD patient care',
        topic: [{ text: 'Critical Care', coding: [{ system: 'http://snomed.info/sct', code: '25049004', display: 'Cardiac assist device' }] }],
        kind: 'ServiceRequest',
        relatedArtifact: [
            { type: 'composed-of', display: 'LVAD parameters q4h: Speed, Flow, PI, Power', label: 'params' },
            { type: 'composed-of', display: 'Driveline site care daily', label: 'driveline' },
            { type: 'composed-of', display: 'Warfarin for INR goal 2-3', label: 'anticoag' },
            { type: 'composed-of', display: 'Aspirin 325mg daily', label: 'aspirin' },
            { type: 'composed-of', display: 'MAP goal 70-80 mmHg', label: 'bp' },
            { type: 'composed-of', display: 'Weekly ramp study/echo', label: 'echo' },
            { type: 'composed-of', display: 'INR, LDH, plasma-free Hgb weekly', label: 'labs' },
        ],
    },
    {
        resourceType: 'ActivityDefinition',
        id: 'order-set-ecmo',
        url: 'http://emr-ai.local/ActivityDefinition/ecmo-management',
        name: 'ECMOManagement',
        title: 'ECMO Management',
        status: 'active',
        description: 'Extracorporeal membrane oxygenation monitoring and management',
        purpose: 'Standardize ECMO patient care and monitoring',
        topic: [{ text: 'Critical Care', coding: [{ system: 'http://snomed.info/sct', code: '233573008', display: 'ECMO' }] }],
        kind: 'ServiceRequest',
        relatedArtifact: [
            { type: 'composed-of', display: 'ECMO parameters q1h: Flow, RPM, Sweep', label: 'params' },
            { type: 'composed-of', display: 'Heparin gtt for PTT 60-80', label: 'anticoag' },
            { type: 'composed-of', display: 'Maintain fibrinogen > 200', label: 'fibrinogen' },
            { type: 'composed-of', display: 'Maintain Hgb > 8', label: 'hgb' },
            { type: 'composed-of', display: 'Maintain platelets > 80k', label: 'platelets' },
            { type: 'composed-of', display: 'Cannula site checks q4h', label: 'cannula' },
            { type: 'composed-of', display: 'Neuro checks q2h', label: 'neuro' },
            { type: 'composed-of', display: 'Daily: CBC, CMP, LDH, fibrinogen, D-dimer', label: 'daily_labs' },
        ],
    },
]

async function seedOrderSets() {
    const AIDBOX_BASE_URL = process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL || 'http://localhost:8888'
    const AIDBOX_CLIENT_ID = process.env.AIDBOX_CLIENT_ID || 'basic'
    const AIDBOX_CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET || 'secret'

    console.log('🏥 Seeding Order Sets as FHIR ActivityDefinitions...')
    console.log(`   Target: ${AIDBOX_BASE_URL}`)

    // Get auth token
    const authHeader = 'Basic ' + Buffer.from(`${AIDBOX_CLIENT_ID}:${AIDBOX_CLIENT_SECRET}`).toString('base64')

    for (const orderSet of ORDER_SETS) {
        try {
            const res = await fetch(`${AIDBOX_BASE_URL}/fhir/ActivityDefinition/${orderSet.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/fhir+json',
                    'Authorization': authHeader,
                },
                body: JSON.stringify(orderSet),
            })

            if (res.ok) {
                console.log(`   ✅ ${orderSet.title}`)
            } else {
                const err = await res.text()
                console.log(`   ❌ ${orderSet.title}: ${err}`)
            }
        } catch (error) {
            console.log(`   ❌ ${orderSet.title}: ${error}`)
        }
    }

    console.log('\n✅ Order set seeding complete!')
}

// Run if executed directly
seedOrderSets().catch(console.error)

export { ORDER_SETS, seedOrderSets }
