/**
 * AI Health Companion
 * 
 * Patient-facing AI chat with guardrails for safe responses
 * Designed for BastionGPT integration
 */

export interface HealthCompanionMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export interface HealthCompanionContext {
    patientId: string
    patientName?: string
    age?: number
    conditions?: string[]
    medications?: string[]
    allergies?: string[]
    recentLabs?: { name: string; value: string; interpretation: string }[]
}

export interface SymptomCheckResult {
    urgency: 'emergency' | 'urgent' | 'routine' | 'self-care'
    recommendation: string
    possibleCauses: string[]
    redFlags: string[]
    nextSteps: string[]
    shouldSeekCare: boolean
}

// Guardrails for patient-facing AI
const COMPANION_SYSTEM_PROMPT = `You are a friendly and helpful AI health companion for patients. You have access to the patient's health information to provide personalized guidance.

IMPORTANT RULES - YOU MUST FOLLOW THESE:
1. NEVER diagnose conditions - only suggest when to see a provider
2. ALWAYS recommend emergency care (call 911 or go to ER) for:
   - Chest pain, difficulty breathing, severe bleeding
   - Signs of stroke (face drooping, arm weakness, speech difficulty)
   - Severe allergic reactions, loss of consciousness
   - Thoughts of self-harm or suicide
3. Explain lab results in simple, patient-friendly terms
4. Only reference the patient's own health data
5. Encourage medication adherence and following doctor's orders
6. Be empathetic, supportive, and non-judgmental
7. When uncertain, recommend the patient discuss with their healthcare provider
8. Use simple language appropriate for patients without medical training

You are NOT a replacement for medical professionals. Your role is to:
- Help patients understand their health information
- Provide general wellness guidance
- Encourage healthy behaviors
- Remind patients about preventive care
- Answer basic health questions
- Help prepare questions for doctor visits`

const SYMPTOM_CHECK_PROMPT = `You are helping triage a patient's symptoms. Based on the symptoms described, assess the urgency level and provide guidance.

URGENCY LEVELS:
- emergency: Call 911 or go to ER immediately (life-threatening)
- urgent: See a doctor today or within 24 hours
- routine: Schedule an appointment within a few days
- self-care: Can likely be managed at home with monitoring

Always err on the side of caution. When in doubt, recommend the patient seek care.
Include any red flag symptoms that would require immediate attention.

Respond in JSON format only.`

/**
 * Generate system prompt with patient context
 */
export function buildHealthCompanionPrompt(context: HealthCompanionContext): string {
    let prompt = COMPANION_SYSTEM_PROMPT

    prompt += `\n\nPATIENT CONTEXT:`

    if (context.patientName) {
        prompt += `\n- Name: ${context.patientName}`
    }
    if (context.age) {
        prompt += `\n- Age: ${context.age} years old`
    }
    if (context.conditions && context.conditions.length > 0) {
        prompt += `\n- Medical Conditions: ${context.conditions.join(', ')}`
    }
    if (context.medications && context.medications.length > 0) {
        prompt += `\n- Medications: ${context.medications.join(', ')}`
    }
    if (context.allergies && context.allergies.length > 0) {
        prompt += `\n- Allergies: ${context.allergies.join(', ')}`
    }
    if (context.recentLabs && context.recentLabs.length > 0) {
        prompt += `\n- Recent Labs:`
        for (const lab of context.recentLabs) {
            prompt += `\n  • ${lab.name}: ${lab.value} (${lab.interpretation})`
        }
    }

    return prompt
}

/**
 * Build symptom check prompt
 */
export function buildSymptomCheckPrompt(
    symptoms: string,
    context: HealthCompanionContext
): string {
    let prompt = SYMPTOM_CHECK_PROMPT

    prompt += `\n\nPATIENT CONTEXT:`
    if (context.age) {
        prompt += `\n- Age: ${context.age}`
    }
    if (context.conditions && context.conditions.length > 0) {
        prompt += `\n- Known conditions: ${context.conditions.join(', ')}`
    }

    prompt += `\n\nSYMPTOMS REPORTED:\n${symptoms}`

    prompt += `\n\nRespond with a JSON object containing:
{
  "urgency": "emergency" | "urgent" | "routine" | "self-care",
  "recommendation": "brief recommendation text",
  "possibleCauses": ["potential cause 1", "potential cause 2"],
  "redFlags": ["red flag symptom to watch for"],
  "nextSteps": ["step 1", "step 2"],
  "shouldSeekCare": true/false
}`

    return prompt
}

/**
 * Parse symptom check response
 */
export function parseSymptomCheckResponse(response: string): SymptomCheckResult {
    try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
    } catch {
        // Fall back to conservative recommendation
    }

    return {
        urgency: 'routine',
        recommendation: 'Please discuss these symptoms with your healthcare provider.',
        possibleCauses: [],
        redFlags: ['Worsening symptoms', 'New symptoms'],
        nextSteps: ['Contact your doctor to schedule an appointment'],
        shouldSeekCare: true,
    }
}

/**
 * Check for emergency symptoms in user message
 */
export function detectEmergencySymptoms(message: string): boolean {
    const emergencyKeywords = [
        'chest pain',
        'can\'t breathe',
        'difficulty breathing',
        'heart attack',
        'stroke',
        'face drooping',
        'arm weakness',
        'severe bleeding',
        'unconscious',
        'passing out',
        'seizure',
        'overdose',
        'suicide',
        'kill myself',
        'severe allergic',
        'anaphylaxis',
    ]

    const lowerMessage = message.toLowerCase()
    return emergencyKeywords.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Get emergency response
 */
export function getEmergencyResponse(): string {
    return `🚨 **IMPORTANT: This sounds like it may be a medical emergency.**

If you or someone else is experiencing:
- Chest pain or pressure
- Difficulty breathing
- Severe bleeding
- Loss of consciousness
- Signs of stroke (face drooping, arm weakness, speech difficulty)

**Please call 911 or go to your nearest emergency room immediately.**

If you're having thoughts of harming yourself, please call the 988 Suicide & Crisis Lifeline (call or text 988) or go to your nearest emergency room.

Your safety is the top priority. Please seek help right away.`
}
