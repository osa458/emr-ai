/**
 * Chart Lookup Functions for Agentic A&P Generator
 * 
 * These functions are called by the AI when it needs additional patient data.
 * All functions fetch from Aidbox FHIR and return structured data with dates.
 */

// Types for chart lookup results
export interface EchoTTEResult {
    id: string
    date: string
    ejectionFraction?: string
    conclusion?: string
    findings: string[]
    wallMotion?: string
    valveFindings?: string
    rvFunction?: string
}

export interface AllergyResult {
    id: string
    allergen: string
    reaction?: string
    severity?: string
    criticality?: string
    recordedDate?: string
    status: string
}

export interface ProcedureResult {
    id: string
    name: string
    code?: string
    date: string
    status: string
    outcome?: string
    performer?: string
}

export interface PriorNoteResult {
    id: string
    type: string
    date: string
    author?: string
    summary?: string
    content?: string
}

export interface EncounterResult {
    id: string
    type: string
    status: string
    admitDate?: string
    dischargeDate?: string
    reason?: string
    location?: string
}

export interface GoalResult {
    id: string
    description: string
    status: string
    category?: string
    startDate?: string
    target?: string
}

// Helper to make authenticated FHIR requests
async function fhirFetch(path: string): Promise<any> {
    const baseUrl = process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL
    const clientId = process.env.AIDBOX_CLIENT_ID || 'basic'
    const clientSecret = process.env.AIDBOX_CLIENT_SECRET || 'secret'
    const auth = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const res = await fetch(`${baseUrl}/fhir${path}`, {
        headers: {
            'Authorization': auth,
            'Accept': 'application/fhir+json',
        },
    })

    if (!res.ok) {
        console.error(`[ChartLookup] FHIR fetch failed: ${path}`, res.status)
        return { entry: [] }
    }
    return res.json()
}

/**
 * Get Echocardiogram/TTE results
 */
export async function getEchoTTE(patientId: string, options?: { dateRange?: { start?: string; end?: string } }): Promise<EchoTTEResult[]> {
    // Echo/TTE are DiagnosticReports with specific codes
    // LOINC codes for Echo: 34552-0 (TTE), 42148-7 (Echo)
    let query = `/DiagnosticReport?patient=${patientId}&_sort=-date&_count=5`

    // Add category or code filter for cardiology/echo
    query += '&category=http://loinc.org|LP29708-2' // Cardiology category

    const bundle = await fhirFetch(query)
    const reports = (bundle.entry || []).map((e: any) => e.resource)

    // Also try Observations for EF values
    const efQuery = `/Observation?patient=${patientId}&code=18043-0,10230-1&_sort=-date&_count=5` // LVEF LOINC codes
    const efBundle = await fhirFetch(efQuery)
    const efObs = (efBundle.entry || []).map((e: any) => e.resource)

    const results: EchoTTEResult[] = reports
        .filter((r: any) => {
            const name = (r.code?.text || r.code?.coding?.[0]?.display || '').toLowerCase()
            return name.includes('echo') || name.includes('tte') || name.includes('transthoracic') || name.includes('cardiac')
        })
        .map((r: any) => {
            // Try to extract EF from conclusion or find matching Observation
            let ef = r.conclusion?.match(/EF\s*[=:]\s*(\d+%?)/i)?.[1]
            if (!ef) {
                ef = r.conclusion?.match(/(\d+)\s*%?\s*ejection/i)?.[1]
                if (ef) ef = ef + '%'
            }

            return {
                id: r.id,
                date: r.effectiveDateTime || r.effectivePeriod?.start || 'Unknown date',
                ejectionFraction: ef || undefined,
                conclusion: r.conclusion,
                findings: r.conclusion ? [r.conclusion] : [],
                wallMotion: r.conclusion?.includes('wall motion') ? r.conclusion : undefined,
            }
        })

    // Add standalone EF observations
    efObs.forEach((obs: any) => {
        const existing = results.find(r => r.date === obs.effectiveDateTime)
        if (!existing && obs.valueQuantity?.value) {
            results.push({
                id: obs.id,
                date: obs.effectiveDateTime || 'Unknown date',
                ejectionFraction: `${obs.valueQuantity.value}%`,
                conclusion: `LVEF ${obs.valueQuantity.value}%`,
                findings: [`LVEF ${obs.valueQuantity.value}%`],
            })
        }
    })

    return results
}

/**
 * Get Allergies with reactions and severity
 */
export async function getAllergies(patientId: string): Promise<AllergyResult[]> {
    const bundle = await fhirFetch(`/AllergyIntolerance?patient=${patientId}&clinical-status=active`)

    return (bundle.entry || []).map((e: any) => {
        const a = e.resource
        return {
            id: a.id,
            allergen: a.code?.text || a.code?.coding?.[0]?.display || 'Unknown allergen',
            reaction: a.reaction?.[0]?.manifestation?.[0]?.text ||
                a.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display,
            severity: a.reaction?.[0]?.severity,
            criticality: a.criticality,
            recordedDate: a.recordedDate,
            status: a.clinicalStatus?.coding?.[0]?.code || 'active',
        }
    })
}

/**
 * Get Procedures/Surgical History
 */
export async function getProcedures(patientId: string, options?: { dateRange?: { start?: string; end?: string }; count?: number }): Promise<ProcedureResult[]> {
    const count = options?.count || 20
    let query = `/Procedure?patient=${patientId}&_sort=-date&_count=${count}`

    if (options?.dateRange?.start) {
        query += `&date=ge${options.dateRange.start}`
    }
    if (options?.dateRange?.end) {
        query += `&date=le${options.dateRange.end}`
    }

    const bundle = await fhirFetch(query)

    return (bundle.entry || []).map((e: any) => {
        const p = e.resource
        return {
            id: p.id,
            name: p.code?.text || p.code?.coding?.[0]?.display || 'Unknown procedure',
            code: p.code?.coding?.[0]?.code,
            date: p.performedDateTime || p.performedPeriod?.start || 'Unknown date',
            status: p.status || 'completed',
            outcome: p.outcome?.text || p.outcome?.coding?.[0]?.display,
            performer: p.performer?.[0]?.actor?.display,
        }
    })
}

/**
 * Get Prior Clinical Notes (H&P, Progress Notes, Discharge Summaries)
 */
export async function getPriorNotes(patientId: string, options?: { noteType?: string; count?: number }): Promise<PriorNoteResult[]> {
    const count = options?.count || 10
    let query = `/DocumentReference?patient=${patientId}&_sort=-date&_count=${count}`

    // Filter by note type if specified
    if (options?.noteType) {
        query += `&type:text=${encodeURIComponent(options.noteType)}`
    }

    const bundle = await fhirFetch(query)

    return (bundle.entry || []).map((e: any) => {
        const d = e.resource
        const content = d.content?.[0]?.attachment?.data
            ? Buffer.from(d.content[0].attachment.data, 'base64').toString('utf-8')
            : undefined

        return {
            id: d.id,
            type: d.type?.text || d.type?.coding?.[0]?.display || 'Clinical Note',
            date: d.date || d.content?.[0]?.attachment?.creation || 'Unknown date',
            author: d.author?.[0]?.display,
            summary: d.description,
            content: content?.substring(0, 2000), // Limit content size
        }
    })
}

/**
 * Get Encounter/Admission History
 */
export async function getEncounters(patientId: string, options?: { count?: number }): Promise<EncounterResult[]> {
    const count = options?.count || 10
    const bundle = await fhirFetch(`/Encounter?patient=${patientId}&_sort=-date&_count=${count}`)

    return (bundle.entry || []).map((e: any) => {
        const enc = e.resource
        return {
            id: enc.id,
            type: enc.class?.display || enc.type?.[0]?.text || enc.type?.[0]?.coding?.[0]?.display || 'Encounter',
            status: enc.status,
            admitDate: enc.period?.start,
            dischargeDate: enc.period?.end,
            reason: enc.reasonCode?.[0]?.text || enc.reasonCode?.[0]?.coding?.[0]?.display,
            location: enc.location?.[0]?.location?.display,
        }
    })
}

/**
 * Get Goals of Care / Advance Directives
 */
export async function getGoalsOfCare(patientId: string): Promise<GoalResult[]> {
    const bundle = await fhirFetch(`/Goal?patient=${patientId}&lifecycle-status=active,accepted`)

    return (bundle.entry || []).map((e: any) => {
        const g = e.resource
        return {
            id: g.id,
            description: g.description?.text || 'Goal',
            status: g.lifecycleStatus || 'active',
            category: g.category?.[0]?.text || g.category?.[0]?.coding?.[0]?.display,
            startDate: g.startDate,
            target: g.target?.[0]?.detailString || g.target?.[0]?.detailQuantity?.value?.toString(),
        }
    })
}

/**
 * Get Labs by Type (specific panel or test)
 */
export async function getLabsByType(patientId: string, labType: string, options?: { count?: number }): Promise<any[]> {
    const count = options?.count || 10

    // Map common lab names to LOINC codes
    const labCodeMap: Record<string, string[]> = {
        'cbc': ['58410-2'], // CBC panel
        'bmp': ['24320-4'], // BMP
        'cmp': ['24323-8'], // CMP
        'troponin': ['6598-7', '49563-0', '89579-7'],
        'bnp': ['42637-9', '33762-6'],
        'lactate': ['2524-7'],
        'procalcitonin': ['75241-0'],
        'inr': ['5902-2', '6301-6'],
        'hba1c': ['4548-4', '17856-6'],
        'tsh': ['3016-3'],
        'creatinine': ['2160-0'],
        'potassium': ['2823-3'],
    }

    const codes = labCodeMap[labType.toLowerCase()] || []
    let query = `/Observation?patient=${patientId}&category=laboratory&_sort=-date&_count=${count}`

    if (codes.length > 0) {
        query += `&code=${codes.join(',')}`
    } else {
        // Search by text if no code mapping
        query += `&code:text=${encodeURIComponent(labType)}`
    }

    const bundle = await fhirFetch(query)

    return (bundle.entry || []).map((e: any) => {
        const o = e.resource
        return {
            id: o.id,
            name: o.code?.text || o.code?.coding?.[0]?.display || 'Unknown',
            value: o.valueQuantity?.value?.toString() || o.valueString || 'N/A',
            unit: o.valueQuantity?.unit || '',
            interpretation: o.interpretation?.[0]?.coding?.[0]?.code || 'N',
            date: o.effectiveDateTime || 'Unknown date',
        }
    })
}

// Export all functions for use in A&P generator
export const chartLookupFunctions = {
    get_echo_tte: getEchoTTE,
    get_allergies: getAllergies,
    get_procedures: getProcedures,
    get_prior_notes: getPriorNotes,
    get_encounters: getEncounters,
    get_goals_of_care: getGoalsOfCare,
    get_labs_by_type: getLabsByType,
}

// OpenAI function definitions for function calling
export const openAIFunctionDefinitions = [
    {
        name: 'get_echo_tte',
        description: 'Get echocardiogram/TTE results including ejection fraction (EF), wall motion, and valve findings. Call this when heart failure is present or EF is needed.',
        parameters: {
            type: 'object',
            properties: {
                patientId: { type: 'string', description: 'Patient ID' },
                dateRange: {
                    type: 'object',
                    properties: {
                        start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                        end: { type: 'string', description: 'End date (YYYY-MM-DD)' },
                    },
                },
            },
            required: ['patientId'],
        },
    },
    {
        name: 'get_allergies',
        description: 'Get patient allergy list with allergen names, reactions, and severity. Call this before recommending any medications.',
        parameters: {
            type: 'object',
            properties: {
                patientId: { type: 'string', description: 'Patient ID' },
            },
            required: ['patientId'],
        },
    },
    {
        name: 'get_procedures',
        description: 'Get surgical and procedural history. Call this when surgical context is needed.',
        parameters: {
            type: 'object',
            properties: {
                patientId: { type: 'string', description: 'Patient ID' },
                count: { type: 'number', description: 'Number of procedures to retrieve' },
            },
            required: ['patientId'],
        },
    },
    {
        name: 'get_prior_notes',
        description: 'Get previous clinical notes (H&P, Progress Notes, Discharge Summaries). Call this to understand prior treatment decisions.',
        parameters: {
            type: 'object',
            properties: {
                patientId: { type: 'string', description: 'Patient ID' },
                noteType: { type: 'string', description: 'Type of note (e.g., "Progress Note", "H&P", "Discharge Summary")' },
                count: { type: 'number', description: 'Number of notes to retrieve' },
            },
            required: ['patientId'],
        },
    },
    {
        name: 'get_encounters',
        description: 'Get admission and encounter history (ED visits, hospitalizations). Call this for hospitalization context.',
        parameters: {
            type: 'object',
            properties: {
                patientId: { type: 'string', description: 'Patient ID' },
                count: { type: 'number', description: 'Number of encounters to retrieve' },
            },
            required: ['patientId'],
        },
    },
    {
        name: 'get_goals_of_care',
        description: 'Get goals of care, advance directives, and code status. Call this for disposition planning.',
        parameters: {
            type: 'object',
            properties: {
                patientId: { type: 'string', description: 'Patient ID' },
            },
            required: ['patientId'],
        },
    },
    {
        name: 'get_labs_by_type',
        description: 'Get specific lab results (CBC, BMP, CMP, Troponin, BNP, Lactate, etc.). Call this when you need specific lab values.',
        parameters: {
            type: 'object',
            properties: {
                patientId: { type: 'string', description: 'Patient ID' },
                labType: { type: 'string', description: 'Lab type (e.g., "troponin", "bnp", "cbc", "cmp")' },
                count: { type: 'number', description: 'Number of results to retrieve' },
            },
            required: ['patientId', 'labType'],
        },
    },
]

/**
 * Execute a chart lookup function by name
 */
export async function executeChartLookup(functionName: string, args: any): Promise<any> {
    const patientId = args.patientId

    switch (functionName) {
        case 'get_echo_tte':
            return getEchoTTE(patientId, { dateRange: args.dateRange })
        case 'get_allergies':
            return getAllergies(patientId)
        case 'get_procedures':
            return getProcedures(patientId, { count: args.count })
        case 'get_prior_notes':
            return getPriorNotes(patientId, { noteType: args.noteType, count: args.count })
        case 'get_encounters':
            return getEncounters(patientId, { count: args.count })
        case 'get_goals_of_care':
            return getGoalsOfCare(patientId)
        case 'get_labs_by_type':
            return getLabsByType(patientId, args.labType, { count: args.count })
        default:
            throw new Error(`Unknown chart lookup function: ${functionName}`)
    }
}
