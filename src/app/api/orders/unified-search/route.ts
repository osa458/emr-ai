/**
 * Unified Order Search API
 * GET /api/orders/unified-search
 * 
 * Searches across ALL order types: medications, labs, imaging, procedures
 * Returns results grouped by category
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchAllOrders, MASTER_ORDER_LIST } from '@/lib/orders'

// Aidbox config for medication search
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

export interface UnifiedOrderResult {
    id: string
    name: string
    category: 'Medications' | 'Labs' | 'Imaging' | 'Procedures' | 'Consults'
    code?: string
    system?: string
    specialty?: string
    details?: string
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''
        const limit = parseInt(searchParams.get('limit') || '20')

        if (!query || query.length < 2) {
            return NextResponse.json({
                success: true,
                message: 'Provide ?q=search with at least 2 characters',
                results: { Medications: [], Labs: [], Imaging: [], Procedures: [], Consults: [] },
            })
        }

        // Search medications from Aidbox (async)
        const medicationsPromise = searchMedications(query, limit)

        // Search clinical orders (sync - from local database)
        const clinicalOrders = searchAllOrders(query, limit * 2)

        // Wait for medication results
        const medications = await medicationsPromise

        // Group clinical orders by category
        const labs: UnifiedOrderResult[] = []
        const imaging: UnifiedOrderResult[] = []
        const procedures: UnifiedOrderResult[] = []
        const consults: UnifiedOrderResult[] = []

        clinicalOrders.forEach(order => {
            const result: UnifiedOrderResult = {
                id: order.id,
                name: order.name,
                category: order.category as any,
                code: order.code,
                system: order.system,
                specialty: order.specialty,
            }

            switch (order.category) {
                case 'Labs':
                    labs.push(result)
                    break
                case 'Imaging':
                    imaging.push(result)
                    break
                case 'Procedures':
                    procedures.push(result)
                    break
                case 'Consults':
                    consults.push(result)
                    break
            }
        })

        // Combine results grouped by category
        const results = {
            Medications: medications.slice(0, limit),
            Labs: labs.slice(0, limit),
            Imaging: imaging.slice(0, limit),
            Procedures: procedures.slice(0, limit),
            Consults: consults.slice(0, limit),
        }

        const totalCount = Object.values(results).reduce((sum, arr) => sum + arr.length, 0)

        return NextResponse.json({
            success: true,
            query,
            totalCount,
            results,
        })
    } catch (error) {
        console.error('Unified search error:', error)
        return NextResponse.json(
            { success: false, error: 'Search failed' },
            { status: 500 }
        )
    }
}

async function searchMedications(query: string, limit: number): Promise<UnifiedOrderResult[]> {
    try {
        const searchUrl = `${BASE_URL}/Medication?_text=${encodeURIComponent(query)}&_count=${limit}`
        const res = await fetch(searchUrl, { headers: authHeaders() })

        if (!res.ok) return []

        const bundle = await res.json()
        const entries = bundle.entry || []

        return entries.map((entry: any) => {
            const med = entry.resource
            const name = med.code?.text || med.code?.coding?.[0]?.display || 'Unknown medication'
            const ndc = med.code?.coding?.find((c: any) => c.system?.includes('ndc'))?.code

            return {
                id: med.id,
                name,
                category: 'Medications' as const,
                code: ndc,
                system: 'NDC',
                details: med.form?.text || med.form?.coding?.[0]?.display,
            }
        })
    } catch (err) {
        console.error('Medication search error:', err)
        return []
    }
}
