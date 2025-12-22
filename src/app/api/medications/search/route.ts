/**
 * Medication Search API
 * GET /api/medications/search
 * 
 * Search for medications by name, NDC, or RxNorm code
 */

import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.AIDBOX_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app'
const CLIENT_ID = process.env.AIDBOX_CLIENT_ID || 'emr-api'
const CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET || 'emr-secret-123'

function authHeaders() {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    return {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/fhir+json',
    }
}

export interface MedicationSearchResult {
    id: string
    ndc: string
    name: string
    manufacturer?: string
    form?: string
    ingredients?: { name: string; strength: string }[]
    rxnorm?: string
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || searchParams.get('query') || ''
        const limit = parseInt(searchParams.get('limit') || '20')
        const ndc = searchParams.get('ndc')
        const rxnorm = searchParams.get('rxnorm')

        if (!query && !ndc && !rxnorm) {
            return NextResponse.json(
                { success: false, error: 'Search query is required' },
                { status: 400 }
            )
        }

        let fhirQuery = ''

        if (ndc) {
            // Search by exact NDC code
            fhirQuery = `Medication?code=${encodeURIComponent('http://hl7.org/fhir/sid/ndc|' + ndc)}&_count=${limit}`
        } else if (rxnorm) {
            // Search by RxNorm code
            fhirQuery = `Medication?code=${encodeURIComponent('http://www.nlm.nih.gov/research/umls/rxnorm|' + rxnorm)}&_count=${limit}`
        } else {
            // Free text search on medication name
            fhirQuery = `Medication?code:text=${encodeURIComponent(query)}&_count=${limit}`
        }

        const response = await fetch(`${BASE_URL}/${fhirQuery}`, { headers: authHeaders() })

        if (!response.ok) {
            const text = await response.text()
            console.error('Medication search failed:', text)
            return NextResponse.json(
                { success: false, error: 'Search failed' },
                { status: response.status }
            )
        }

        const bundle = await response.json()
        const medications: MedicationSearchResult[] = (bundle.entry || []).map((entry: any) => {
            const med = entry.resource

            // Extract NDC code
            const ndcCoding = med.code?.coding?.find((c: any) =>
                c.system === 'http://hl7.org/fhir/sid/ndc'
            )

            // Extract RxNorm code
            const rxnormCoding = med.code?.coding?.find((c: any) =>
                c.system === 'http://www.nlm.nih.gov/research/umls/rxnorm'
            )

            // Extract ingredients
            const ingredients = med.ingredient?.map((ing: any) => ({
                name: ing.itemCodeableConcept?.text || 'Unknown',
                strength: ing.strength?.numerator?.unit || '',
            }))

            return {
                id: med.id,
                ndc: ndcCoding?.code || '',
                name: med.code?.text || ndcCoding?.display || 'Unknown Medication',
                manufacturer: med.manufacturer?.display,
                form: med.form?.text,
                ingredients,
                rxnorm: rxnormCoding?.code,
            }
        })

        return NextResponse.json({
            success: true,
            count: medications.length,
            total: bundle.total || medications.length,
            medications,
        })
    } catch (error) {
        console.error('Medication search error:', error)
        return NextResponse.json(
            { success: false, error: 'Search failed' },
            { status: 500 }
        )
    }
}
