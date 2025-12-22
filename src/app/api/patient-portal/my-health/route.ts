/**
 * Patient My Health API
 * GET /api/patient-portal/my-health
 * 
 * Returns patient's health summary dashboard data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPatientIdFromHeader } from '@/lib/patient-portal'

const BASE_URL = process.env.AIDBOX_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app'
const CLIENT_ID = process.env.AIDBOX_CLIENT_ID || 'emr-api'
const CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET || 'emr-secret-123'

function authHeaders() {
    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    return {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/fhir+json',
    }
}

async function fhirFetch(path: string) {
    const res = await fetch(`${BASE_URL}/${path}`, { headers: authHeaders() })
    if (!res.ok) return null
    return res.json()
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const patientId = getPatientIdFromHeader(authHeader)

        if (!patientId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Fetch patient data in parallel
        const [patient, conditionsBundle, medicationsBundle, allergiesBundle, appointmentsBundle] = await Promise.all([
            fhirFetch(`Patient/${patientId}`),
            fhirFetch(`Condition?subject=Patient/${patientId}&clinical-status=active&_count=20`),
            fhirFetch(`MedicationRequest?subject=Patient/${patientId}&status=active&_count=20`),
            fhirFetch(`AllergyIntolerance?patient=Patient/${patientId}&_count=20`),
            fhirFetch(`Appointment?patient=Patient/${patientId}&status=booked,pending&_count=5`),
        ])

        if (!patient) {
            return NextResponse.json(
                { success: false, error: 'Patient not found' },
                { status: 404 }
            )
        }

        // Format response
        const name = patient.name?.[0]
        const fullName = name
            ? `${name.given?.join(' ') || ''} ${name.family || ''}`.trim()
            : 'Patient'

        const conditions = (conditionsBundle?.entry || []).map((e: any) => ({
            id: e.resource?.id,
            name: e.resource?.code?.text || e.resource?.code?.coding?.[0]?.display || 'Unknown',
            status: e.resource?.clinicalStatus?.coding?.[0]?.code || 'active',
        }))

        const medications = (medicationsBundle?.entry || []).map((e: any) => {
            const med = e.resource
            return {
                id: med?.id,
                name: med?.medicationCodeableConcept?.text || med?.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown',
                dosage: med?.dosageInstruction?.[0]?.text || '',
                status: med?.status,
            }
        })

        const allergies = (allergiesBundle?.entry || []).map((e: any) => ({
            id: e.resource?.id,
            substance: e.resource?.code?.text || e.resource?.code?.coding?.[0]?.display || 'Unknown',
            reaction: e.resource?.reaction?.[0]?.manifestation?.[0]?.text || 'Unknown reaction',
        }))

        const appointments = (appointmentsBundle?.entry || []).map((e: any) => {
            const apt = e.resource
            return {
                id: apt?.id,
                date: apt?.start,
                description: apt?.description || 'Appointment',
                status: apt?.status,
            }
        })

        return NextResponse.json({
            success: true,
            patient: {
                id: patientId,
                name: fullName,
                birthDate: patient.birthDate,
                gender: patient.gender,
            },
            conditions,
            medications,
            allergies,
            appointments,
            summary: {
                conditionCount: conditions.length,
                medicationCount: medications.length,
                allergyCount: allergies.length,
                upcomingAppointments: appointments.length,
            },
        })
    } catch (error) {
        console.error('My health error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch health data' },
            { status: 500 }
        )
    }
}
