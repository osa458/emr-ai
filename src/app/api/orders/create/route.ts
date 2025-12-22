/**
 * Unified Order Creation API
 * POST /api/orders/create
 * 
 * Creates orders of any type: MedicationRequest, ServiceRequest (labs/imaging/procedures)
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

interface OrderRequest {
    patientId: string
    orderType: 'medication' | 'lab' | 'imaging' | 'procedure' | 'consult'
    code: string
    system?: string
    name: string
    // Medication-specific
    dosage?: string
    frequency?: string
    route?: string
    quantity?: number
    refills?: number
    // General
    priority?: 'routine' | 'urgent' | 'stat'
    notes?: string
    encounterId?: string
    practitionerId?: string
}

export async function POST(request: NextRequest) {
    try {
        const body: OrderRequest = await request.json()
        const { patientId, orderType, code, system, name, priority = 'routine' } = body

        if (!patientId || !orderType || !name) {
            return NextResponse.json(
                { success: false, error: 'patientId, orderType, and name are required' },
                { status: 400 }
            )
        }

        let resource: any
        let resourceType: string

        if (orderType === 'medication') {
            // Create MedicationRequest
            resourceType = 'MedicationRequest'
            resource = {
                resourceType: 'MedicationRequest',
                status: 'active',
                intent: 'order',
                priority: priority === 'stat' ? 'stat' : priority === 'urgent' ? 'urgent' : 'routine',
                medicationCodeableConcept: {
                    coding: code ? [{ system: system || 'http://hl7.org/fhir/sid/ndc', code, display: name }] : undefined,
                    text: name,
                },
                subject: { reference: `Patient/${patientId}` },
                authoredOn: new Date().toISOString(),
                dosageInstruction: body.dosage ? [{
                    text: `${body.dosage} ${body.frequency || ''}`.trim(),
                    timing: body.frequency ? { code: { text: body.frequency } } : undefined,
                    route: body.route ? { text: body.route } : undefined,
                    doseAndRate: body.dosage ? [{
                        doseQuantity: { value: parseFloat(body.dosage) || 1, unit: 'dose' }
                    }] : undefined,
                }] : undefined,
                dispenseRequest: body.quantity ? {
                    quantity: { value: body.quantity },
                    numberOfRepeatsAllowed: body.refills,
                } : undefined,
                note: body.notes ? [{ text: body.notes }] : undefined,
            }
            if (body.encounterId) resource.encounter = { reference: `Encounter/${body.encounterId}` }
            if (body.practitionerId) resource.requester = { reference: `Practitioner/${body.practitionerId}` }
        } else {
            // Create ServiceRequest for labs, imaging, procedures, consults
            resourceType = 'ServiceRequest'

            // Determine category based on order type
            const categoryCode = {
                lab: '108252007', // Laboratory procedure
                imaging: '363679005', // Imaging
                procedure: '387713003', // Surgical procedure
                consult: '11429006', // Consultation
            }[orderType] || '108252007'

            const categoryDisplay = {
                lab: 'Laboratory procedure',
                imaging: 'Imaging',
                procedure: 'Surgical procedure',
                consult: 'Consultation',
            }[orderType] || 'Laboratory procedure'

            resource = {
                resourceType: 'ServiceRequest',
                status: 'active',
                intent: 'order',
                priority: priority === 'stat' ? 'stat' : priority === 'urgent' ? 'urgent' : 'routine',
                category: [{
                    coding: [{
                        system: 'http://snomed.info/sct',
                        code: categoryCode,
                        display: categoryDisplay,
                    }],
                }],
                code: {
                    coding: code ? [{
                        system: system === 'CPT' ? 'http://www.ama-assn.org/go/cpt' :
                            system === 'LOINC' ? 'http://loinc.org' :
                                'http://snomed.info/sct',
                        code,
                        display: name,
                    }] : undefined,
                    text: name,
                },
                subject: { reference: `Patient/${patientId}` },
                authoredOn: new Date().toISOString(),
                note: body.notes ? [{ text: body.notes }] : undefined,
            }
            if (body.encounterId) resource.encounter = { reference: `Encounter/${body.encounterId}` }
            if (body.practitionerId) resource.requester = { reference: `Practitioner/${body.practitionerId}` }
        }

        // Create the resource in Aidbox
        const res = await fetch(`${BASE_URL}/${resourceType}`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(resource),
        })

        if (!res.ok) {
            const errorText = await res.text()
            console.error('Order creation failed:', errorText)
            return NextResponse.json(
                { success: false, error: 'Failed to create order', details: errorText },
                { status: res.status }
            )
        }

        const created = await res.json()

        return NextResponse.json({
            success: true,
            resourceType,
            resourceId: created.id,
            order: {
                id: created.id,
                name,
                type: orderType,
                status: 'active',
                createdAt: new Date().toISOString(),
            },
        })
    } catch (error) {
        console.error('Order creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create order' },
            { status: 500 }
        )
    }
}
