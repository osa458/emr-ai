/**
 * Patient Portal Authentication API
 * POST /api/patient-portal/auth
 * 
 * Authenticates patients using MRN, DOB, and last name
 */

import { NextRequest, NextResponse } from 'next/server'
import {
    verifyPatientCredentials,
    createPatientSession,
    type PatientCredentials
} from '@/lib/patient-portal'

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

export async function POST(request: NextRequest) {
    try {
        const body: PatientCredentials = await request.json()
        const { mrn, dateOfBirth, lastName } = body

        if (!mrn || !dateOfBirth || !lastName) {
            return NextResponse.json(
                { success: false, error: 'MRN, date of birth, and last name are required' },
                { status: 400 }
            )
        }

        // Verify credentials against FHIR
        const { patient, error } = await verifyPatientCredentials(
            { mrn, dateOfBirth, lastName },
            BASE_URL,
            authHeaders()
        )

        if (!patient) {
            return NextResponse.json(
                { success: false, error: error || 'Authentication failed' },
                { status: 401 }
            )
        }

        // Create session
        const session = createPatientSession(patient)

        return NextResponse.json({
            success: true,
            session: {
                patientId: session.patientId,
                name: session.name,
                accessToken: session.accessToken,
                expiresAt: session.expiresAt.toISOString(),
            },
        })
    } catch (error) {
        console.error('Patient auth error:', error)
        return NextResponse.json(
            { success: false, error: 'Authentication failed' },
            { status: 500 }
        )
    }
}
