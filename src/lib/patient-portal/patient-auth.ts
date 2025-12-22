/**
 * Patient Portal Authentication
 * 
 * Handles patient authentication linked to FHIR Patient resources
 */

import type { Patient } from '@medplum/fhirtypes'

export interface PatientSession {
    patientId: string
    mrn: string
    name: string
    email?: string
    phone?: string
    dateOfBirth?: string
    accessToken: string
    expiresAt: Date
    scope: string[]
}

export interface PatientCredentials {
    mrn: string
    dateOfBirth: string
    lastName: string
}

export interface AuthResult {
    success: boolean
    session?: PatientSession
    error?: string
}

/**
 * Verify patient credentials against FHIR Patient resource
 */
export async function verifyPatientCredentials(
    credentials: PatientCredentials,
    fhirBaseUrl: string,
    authHeaders: Record<string, string>
): Promise<{ patient: Patient | null; error?: string }> {
    try {
        // Search for patient by MRN (identifier)
        const searchUrl = `${fhirBaseUrl}/Patient?identifier=${encodeURIComponent(credentials.mrn)}`
        const response = await fetch(searchUrl, { headers: authHeaders })

        if (!response.ok) {
            return { patient: null, error: 'Patient lookup failed' }
        }

        const bundle = await response.json()
        const patients = (bundle.entry || []).map((e: any) => e.resource)

        if (patients.length === 0) {
            return { patient: null, error: 'Patient not found' }
        }

        // Verify date of birth and last name match
        for (const patient of patients) {
            const dobMatch = patient.birthDate === credentials.dateOfBirth
            const lastNameMatch = patient.name?.[0]?.family?.toLowerCase() === credentials.lastName.toLowerCase()

            if (dobMatch && lastNameMatch) {
                return { patient }
            }
        }

        return { patient: null, error: 'Credentials do not match' }
    } catch (error) {
        console.error('Patient verification error:', error)
        return { patient: null, error: 'Verification failed' }
    }
}

/**
 * Create a patient session from verified patient
 */
export function createPatientSession(patient: Patient): PatientSession {
    const name = patient.name?.[0]
    const fullName = name
        ? `${name.given?.join(' ') || ''} ${name.family || ''}`.trim()
        : 'Patient'

    const email = patient.telecom?.find(t => t.system === 'email')?.value
    const phone = patient.telecom?.find(t => t.system === 'phone')?.value
    const mrn = patient.identifier?.find(i =>
        i.type?.coding?.some(c => c.code === 'MR')
    )?.value || patient.id || ''

    // Generate access token (in production, use proper JWT signing)
    const tokenPayload = {
        patientId: patient.id,
        mrn,
        scope: ['patient/*read'],
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    }
    const accessToken = Buffer.from(JSON.stringify(tokenPayload)).toString('base64')

    return {
        patientId: patient.id!,
        mrn,
        name: fullName,
        email,
        phone,
        dateOfBirth: patient.birthDate,
        accessToken,
        expiresAt: new Date(tokenPayload.exp),
        scope: ['patient/*read'],
    }
}

/**
 * Validate patient access token
 */
export function validatePatientToken(token: string): { valid: boolean; patientId?: string; error?: string } {
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString())

        if (decoded.exp < Date.now()) {
            return { valid: false, error: 'Token expired' }
        }

        if (!decoded.patientId) {
            return { valid: false, error: 'Invalid token' }
        }

        return { valid: true, patientId: decoded.patientId }
    } catch {
        return { valid: false, error: 'Invalid token format' }
    }
}

/**
 * Get patient ID from authorization header
 */
export function getPatientIdFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.substring(7)
    const result = validatePatientToken(token)

    return result.valid ? result.patientId || null : null
}
