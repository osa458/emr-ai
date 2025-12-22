/**
 * Patient AI Chat API
 * POST /api/patient-portal/ai/chat
 * 
 * AI Health Companion chat endpoint with guardrails
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getPatientIdFromHeader } from '@/lib/patient-portal'
import {
    buildHealthCompanionPrompt,
    detectEmergencySymptoms,
    getEmergencyResponse,
    type HealthCompanionContext,
    type HealthCompanionMessage,
} from '@/lib/patient-portal'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

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

interface ChatRequest {
    message: string
    history?: HealthCompanionMessage[]
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const patientId = getPatientIdFromHeader(authHeader)

        if (!patientId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body: ChatRequest = await request.json()
        const { message, history = [] } = body

        if (!message) {
            return NextResponse.json(
                { success: false, error: 'Message is required' },
                { status: 400 }
            )
        }

        // Check for emergency symptoms first
        if (detectEmergencySymptoms(message)) {
            return NextResponse.json({
                success: true,
                message: getEmergencyResponse(),
                isEmergency: true,
            })
        }

        // Build patient context from FHIR
        const context = await buildPatientContext(patientId)

        // Generate system prompt with context
        const systemPrompt = buildHealthCompanionPrompt(context)

        // Build message history
        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt },
        ]

        // Add conversation history
        for (const msg of history.slice(-10)) { // Last 10 messages
            messages.push({
                role: msg.role,
                content: msg.content,
            })
        }

        // Add current message
        messages.push({ role: 'user', content: message })

        // Call OpenAI (or BastionGPT in future)
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages,
            temperature: 0.7,
            max_tokens: 1000,
        })

        const assistantMessage = response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.'

        return NextResponse.json({
            success: true,
            message: assistantMessage,
            isEmergency: false,
        })
    } catch (error) {
        console.error('AI chat error:', error)
        return NextResponse.json(
            { success: false, error: 'Chat failed. Please try again later.' },
            { status: 500 }
        )
    }
}

async function buildPatientContext(patientId: string): Promise<HealthCompanionContext> {
    const [patient, conditionsBundle, medicationsBundle, allergiesBundle, labsBundle] = await Promise.all([
        fhirFetch(`Patient/${patientId}`),
        fhirFetch(`Condition?subject=Patient/${patientId}&clinical-status=active&_count=10`),
        fhirFetch(`MedicationRequest?subject=Patient/${patientId}&status=active&_count=10`),
        fhirFetch(`AllergyIntolerance?patient=Patient/${patientId}&_count=10`),
        fhirFetch(`Observation?subject=Patient/${patientId}&category=laboratory&_count=10&_sort=-date`),
    ])

    const name = patient?.name?.[0]
    const fullName = name
        ? `${name.given?.join(' ') || ''} ${name.family || ''}`.trim()
        : undefined

    const age = patient?.birthDate ? calculateAge(patient.birthDate) : undefined

    return {
        patientId,
        patientName: fullName,
        age,
        conditions: (conditionsBundle?.entry || []).map((e: any) =>
            e.resource?.code?.text || e.resource?.code?.coding?.[0]?.display || 'Unknown'
        ),
        medications: (medicationsBundle?.entry || []).map((e: any) =>
            e.resource?.medicationCodeableConcept?.text || e.resource?.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown'
        ),
        allergies: (allergiesBundle?.entry || []).map((e: any) =>
            e.resource?.code?.text || e.resource?.code?.coding?.[0]?.display || 'Unknown'
        ),
        recentLabs: (labsBundle?.entry || []).slice(0, 5).map((e: any) => ({
            name: e.resource?.code?.text || e.resource?.code?.coding?.[0]?.display || 'Lab',
            value: e.resource?.valueQuantity ? `${e.resource.valueQuantity.value} ${e.resource.valueQuantity.unit || ''}` : 'N/A',
            interpretation: e.resource?.interpretation?.[0]?.text || e.resource?.interpretation?.[0]?.coding?.[0]?.display || 'Normal',
        })),
    }
}

function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
    }
    return age
}
