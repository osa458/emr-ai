/**
 * Forms API Routes
 * Serves FHIR Questionnaire forms from Aidbox (dynamic fetch)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getQuestionnaires, getQuestionnaire, transformToFormSummary } from '@/lib/aidbox'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('id')

    if (formId) {
      // Fetch single form from Aidbox
      const form = await getQuestionnaire(formId)
      return NextResponse.json({ success: true, data: form })
    }

    // Fetch all forms from Aidbox
    const response = await getQuestionnaires(500)
    const forms = response.entry?.map((e: any) => e.resource) || []

    // Transform to summary format
    const formList = forms.map(transformToFormSummary)

    return NextResponse.json({
      success: true,
      data: formList,
      total: formList.length,
    })
  } catch (error: any) {
    console.error('Error fetching forms:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch forms' },
      { status: 500 }
    )
  }
}
