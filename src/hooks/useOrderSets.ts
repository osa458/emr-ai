/**
 * useOrderSets - Hook to fetch and manage order sets from FHIR ActivityDefinitions
 * 
 * ActivityDefinitions are used to represent order sets in FHIR.
 * Each ActivityDefinition contains:
 *   - name: Display name of the order set
 *   - title: Short title
 *   - description: Clinical description
 *   - topic: Category (e.g., Cardiology, Critical Care)
 *   - relatedArtifact: Links to individual orders within the set
 */

import { useQuery } from '@tanstack/react-query'

// Helper to fetch from FHIR proxy
async function fhirFetch<T>(resourcePath: string): Promise<T> {
    const res = await fetch(`/api/fhir/proxy?path=${encodeURIComponent(resourcePath)}`)
    if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'FHIR request failed')
    }
    return res.json()
}

// Order set item structure
export interface OrderSetItem {
    id: string
    name: string
    selected: boolean
    details?: string
    code?: string
    system?: string
}

// Order set structure
export interface OrderSet {
    id: string
    name: string
    category: string
    description: string
    items: OrderSetItem[]
    version?: string
    status?: string
}

// Single order structure (from PlanDefinition or Catalog)
export interface SingleOrder {
    id: string
    name: string
    category: string
    code?: string
    system?: string
    details?: string
}

// Parse FHIR ActivityDefinition into OrderSet
function parseActivityDefinition(ad: any): OrderSet {
    const items: OrderSetItem[] = []

    // Parse relatedArtifact for order items
    if (ad.relatedArtifact) {
        ad.relatedArtifact.forEach((artifact: any, idx: number) => {
            if (artifact.type === 'composed-of') {
                items.push({
                    id: `${ad.id}-item-${idx}`,
                    name: artifact.display || artifact.label || `Order ${idx + 1}`,
                    selected: true, // Default to selected
                    details: artifact.citation,
                })
            }
        })
    }

    // Fallback: parse action if no relatedArtifact
    if (items.length === 0 && ad.action) {
        ad.action.forEach((action: any, idx: number) => {
            items.push({
                id: action.id || `${ad.id}-action-${idx}`,
                name: action.title || action.description || `Action ${idx + 1}`,
                selected: action.precheckBehavior === 'yes',
                details: action.textEquivalent,
                code: action.code?.[0]?.coding?.[0]?.code,
                system: action.code?.[0]?.coding?.[0]?.system,
            })
        })
    }

    return {
        id: ad.id,
        name: ad.title || ad.name || 'Unnamed Order Set',
        category: ad.topic?.[0]?.text || ad.topic?.[0]?.coding?.[0]?.display || 'General',
        description: ad.description || ad.purpose || '',
        items,
        version: ad.version,
        status: ad.status,
    }
}

/**
 * Hook to fetch order sets from FHIR ActivityDefinitions
 */
export function useOrderSets() {
    return useQuery({
        queryKey: ['fhir', 'ActivityDefinition', 'order-sets'],
        queryFn: async () => {
            const bundle = await fhirFetch<any>('ActivityDefinition?status=active&_count=50')

            if (!bundle.entry || bundle.entry.length === 0) {
                return []
            }

            return bundle.entry
                .map((entry: any) => parseActivityDefinition(entry.resource))
                .filter((os: OrderSet) => os.items.length > 0)
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        refetchOnWindowFocus: false,
    })
}

/**
 * Hook to fetch a single order set by ID
 */
export function useOrderSet(id: string | null) {
    return useQuery({
        queryKey: ['fhir', 'ActivityDefinition', id],
        queryFn: async () => {
            if (!id) return null
            const ad = await fhirFetch<any>(`ActivityDefinition/${id}`)
            return parseActivityDefinition(ad)
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    })
}

// Default fallback order sets when FHIR data is unavailable
export const fallbackOrderSets: OrderSet[] = [
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
            { id: 'code', name: 'Code Status: Full Code', selected: true },
            { id: 'diet', name: 'Diet: Cardiac', selected: true },
            { id: 'activity', name: 'Activity: Up ad lib', selected: true },
            { id: 'nursing', name: 'Nursing: Vitals q4h', selected: true },
            { id: 'ivf', name: 'IVF: Saline lock', selected: true },
            { id: 'dvt', name: 'DVT ppx: Heparin 5000u SC TID', selected: true },
            { id: 'labs', name: 'Labs: CBC, CMP in AM', selected: true },
        ]
    },
    {
        id: 'diabetes',
        name: 'Diabetes Management',
        category: 'Endocrine',
        description: 'Insulin and glucose management',
        items: [
            { id: 'fsbs', name: 'Fingerstick glucose AC and HS', selected: true },
            { id: 'sliding', name: 'Insulin sliding scale (moderate)', selected: true, details: 'Lispro: 150-200: 2u, 201-250: 4u, 251-300: 6u, 301-350: 8u, >350: 10u + call MD' },
            { id: 'basal', name: 'Basal insulin: Glargine *** units qHS', selected: false },
            { id: 'meal', name: 'Mealtime insulin: Lispro *** units AC', selected: false },
            { id: 'hypogly', name: 'Hypoglycemia protocol', selected: true },
            { id: 'a1c', name: 'HbA1c if not done in 3 months', selected: true },
        ]
    },
    {
        id: 'chf',
        name: 'CHF / Heart Failure',
        category: 'Cardiology',
        description: 'Heart failure management orders',
        items: [
            { id: 'weight', name: 'Daily weights', selected: true },
            { id: 'io', name: 'Strict I/O', selected: true },
            { id: 'fluid', name: 'Fluid restriction: 1.5L/day', selected: true },
            { id: 'sodium', name: 'Low sodium diet (<2g)', selected: true },
            { id: 'lasix', name: 'Furosemide 40mg IV BID', selected: true },
            { id: 'bnp', name: 'BNP daily x 3 days', selected: true },
            { id: 'cmp', name: 'BMP daily', selected: true },
            { id: 'tele', name: 'Telemetry', selected: true },
            { id: 'o2', name: 'O2 to maintain SpO2 > 92%', selected: true },
        ]
    },
    {
        id: 'sepsis',
        name: 'Sepsis Bundle',
        category: 'Infectious Disease',
        description: 'Sepsis 3-hour and 6-hour bundles',
        items: [
            { id: 'lactate', name: 'Lactate level STAT', selected: true },
            { id: 'cultures', name: 'Blood cultures x 2 before antibiotics', selected: true },
            { id: 'abx', name: 'Broad-spectrum antibiotics within 1 hour', selected: true, details: 'Vancomycin + Zosyn (or per local antibiogram)' },
            { id: 'fluid', name: '30 mL/kg crystalloid for hypotension or lactate ≥ 4', selected: true },
            { id: 'pressors', name: 'Vasopressors if fluid-refractory hypotension', selected: false, details: 'Norepinephrine first-line' },
            { id: 'repeat_lactate', name: 'Repeat lactate if initial > 2', selected: true },
            { id: 'procalc', name: 'Procalcitonin', selected: true },
        ]
    },
]

// Default single orders catalog  
export const fallbackSingleOrders: SingleOrder[] = [
    // Labs
    { id: 'cbc', name: 'CBC with Differential', category: 'Labs', code: '58410-2', system: 'http://loinc.org' },
    { id: 'cmp', name: 'Comprehensive Metabolic Panel', category: 'Labs', code: '24323-8', system: 'http://loinc.org' },
    { id: 'bmp', name: 'Basic Metabolic Panel', category: 'Labs', code: '51990-0', system: 'http://loinc.org' },
    { id: 'lfts', name: 'Liver Function Tests', category: 'Labs' },
    { id: 'lipid', name: 'Lipid Panel', category: 'Labs', code: '57698-3', system: 'http://loinc.org' },
    { id: 'tsh', name: 'TSH', category: 'Labs', code: '3016-3', system: 'http://loinc.org' },
    { id: 'hba1c', name: 'Hemoglobin A1c', category: 'Labs', code: '4548-4', system: 'http://loinc.org' },
    { id: 'bnp', name: 'BNP', category: 'Labs', code: '30934-4', system: 'http://loinc.org' },
    { id: 'trop', name: 'Troponin', category: 'Labs', code: '10839-9', system: 'http://loinc.org' },
    { id: 'pt_inr', name: 'PT/INR', category: 'Labs', code: '34714-6', system: 'http://loinc.org' },
    { id: 'ua', name: 'Urinalysis', category: 'Labs', code: '24356-8', system: 'http://loinc.org' },
    { id: 'bcx', name: 'Blood Cultures x 2', category: 'Labs' },
    { id: 'abg', name: 'Arterial Blood Gas', category: 'Labs', code: '24336-0', system: 'http://loinc.org' },
    { id: 'lactate', name: 'Lactate', category: 'Labs', code: '2524-7', system: 'http://loinc.org' },
    // Imaging
    { id: 'cxr', name: 'Chest X-Ray', category: 'Imaging' },
    { id: 'ct_head', name: 'CT Head without contrast', category: 'Imaging' },
    { id: 'ct_chest', name: 'CT Chest with contrast', category: 'Imaging' },
    { id: 'echo', name: 'Echocardiogram', category: 'Imaging' },
    // Consults
    { id: 'cards', name: 'Cardiology Consult', category: 'Consults' },
    { id: 'gi', name: 'GI Consult', category: 'Consults' },
    { id: 'id', name: 'Infectious Disease Consult', category: 'Consults' },
    { id: 'palliative', name: 'Palliative Care Consult', category: 'Consults' },
    { id: 'pt', name: 'Physical Therapy', category: 'Consults' },
    { id: 'sw', name: 'Social Work', category: 'Consults' },
]
