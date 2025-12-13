/**
 * Forms API Routes
 * Uses pluggable FHIR adapter; falls back to mock if the selected backend fails.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Questionnaire, QuestionnaireResponse } from '@medplum/fhirtypes'
import { getFhirAdapter } from '@/lib/fhir/adapter'
import { transformToFormSummary } from '@/lib/aidbox'

// Lightweight mock questionnaires for offline/demo fallback
const mockQuestionnaires: Questionnaire[] = [
  {
    resourceType: 'Questionnaire',
    id: 'mock-intake',
    status: 'active',
    title: 'Mock Intake',
    item: [
      { linkId: 'name', type: 'string', text: 'Full Name', required: true },
      { linkId: 'dob', type: 'date', text: 'Date of Birth', required: true },
      { linkId: 'gender', type: 'choice', text: 'Gender', answerOption: [
        { valueString: 'Male' }, { valueString: 'Female' }, { valueString: 'Other' }
      ]},
    ],
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('id')
    const fhir = getFhirAdapter()

    if (formId) {
      const form = await fhir.getQuestionnaire(formId)
      return NextResponse.json({ success: true, data: form, provider: fhir.name })
    }

    const forms = await fhir.listQuestionnaires(500)
    const formList = forms.map(transformToFormSummary)

    return NextResponse.json({
      success: true,
      data: formList,
      total: formList.length,
      provider: fhir.name,
    })
  } catch (error: any) {
    console.warn('Forms API falling back to mock data:', error?.message || error)

    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('id')

    if (formId) {
      const form = mockQuestionnaires.find((f) => f.id === formId)
      if (!form) {
        return NextResponse.json(
          { success: false, error: 'Form not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, data: form, mock: true })
    }

    const formList = mockQuestionnaires.map(transformToFormSummary)
    return NextResponse.json({ success: true, data: formList, total: formList.length, mock: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    const fhir = getFhirAdapter()
    const body = await request.json()
    const saved = await fhir.saveQuestionnaireResponse(body as QuestionnaireResponse)
    return NextResponse.json({ success: true, data: saved, provider: fhir.name })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save response' },
      { status: 500 }
    )
  }
}
