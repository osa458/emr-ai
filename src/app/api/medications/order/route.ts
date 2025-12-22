/**
 * Medication Order API
 * POST /api/medications/order
 * 
 * Creates a MedicationRequest for a patient
 */

import { NextRequest, NextResponse } from 'next/server'
import type { MedicationRequest } from '@medplum/fhirtypes'

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
    medicationId: string
    medicationName: string
    dosage: string
    frequency: string
    route?: string
    quantity?: number
    refills?: number
    instructions?: string
    encounterId?: string
    practitionerId?: string
}

export async function POST(request: NextRequest) {
    try {
        const body: OrderRequest = await request.json()
        const {
            patientId,
            medicationId,
            medicationName,
            dosage,
            frequency,
            route = 'oral',
            quantity = 30,
            refills = 0,
            instructions,
            encounterId,
            practitionerId,
        } = body

        if (!patientId || !medicationId || !medicationName || !dosage || !frequency) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: patientId, medicationId, medicationName, dosage, frequency' },
                { status: 400 }
            )
        }

        // Build FHIR MedicationRequest
        const medicationRequest: MedicationRequest = {
            resourceType: 'MedicationRequest',
            status: 'active',
            intent: 'order',
            medicationReference: {
                reference: `Medication/${medicationId}`,
                display: medicationName,
            },
            subject: {
                reference: `Patient/${patientId}`,
            },
            authoredOn: new Date().toISOString(),
            dosageInstruction: [
                {
                    text: `${dosage} ${frequency}`,
                    timing: {
                        code: {
                            text: frequency,
                        },
                    },
                    route: {
                        text: route,
                    },
                    doseAndRate: [
                        {
                            doseQuantity: {
                                value: parseFloat(dosage.replace(/[^0-9.]/g, '')) || 1,
                                unit: dosage,
                            },
                        },
                    ],
                },
            ],
            dispenseRequest: {
                quantity: {
                    value: quantity,
                    unit: 'tablets',
                },
                numberOfRepeatsAllowed: refills,
            },
        }

        // Add encounter reference if provided
        if (encounterId) {
            medicationRequest.encounter = {
                reference: `Encounter/${encounterId}`,
            }
        }

        // Add practitioner reference if provided
        if (practitionerId) {
            medicationRequest.requester = {
                reference: `Practitioner/${practitionerId}`,
            }
        }

        // Add patient instructions if provided
        if (instructions) {
            if (medicationRequest.dosageInstruction?.[0]) {
                medicationRequest.dosageInstruction[0].patientInstruction = instructions
            }
        }

        // Create the medication request in FHIR
        const response = await fetch(`${BASE_URL}/MedicationRequest`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(medicationRequest),
        })

        if (!response.ok) {
            const text = await response.text()
            console.error('Medication order failed:', text)
            return NextResponse.json(
                { success: false, error: 'Failed to create medication order' },
                { status: response.status }
            )
        }

        const created = await response.json()

        return NextResponse.json({
            success: true,
            medicationRequestId: created.id,
            message: `${medicationName} ordered successfully`,
        })
    } catch (error) {
        console.error('Medication order error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create medication order' },
            { status: 500 }
        )
    }
}
