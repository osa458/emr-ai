/**
 * Forms API Routes
 * Serves FHIR Questionnaire forms from Aidbox
 */

import { NextRequest, NextResponse } from 'next/server'
import formsData from '@/data/aidbox-forms.json'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('id')

    const forms = (formsData as any).entry?.map((e: any) => e.resource) || []

    if (formId) {
      const form = forms.find((f: any) => f.id === formId)
      if (!form) {
        return NextResponse.json(
          { success: false, error: 'Form not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, data: form })
    }

    // Return list of forms with summary info
    const formList = forms.map((f: any) => ({
      id: f.id,
      title: f.title || f.name || 'Untitled Form',
      status: f.status,
      publisher: f.publisher,
      url: f.url,
      itemCount: countItems(f.item || []),
      lastUpdated: f.meta?.lastUpdated,
    }))

    return NextResponse.json({
      success: true,
      data: formList,
      total: formList.length,
    })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch forms' },
      { status: 500 }
    )
  }
}

function countItems(items: any[]): number {
  let count = 0
  for (const item of items) {
    if (item.type !== 'group' && item.type !== 'display') {
      count++
    }
    if (item.item) {
      count += countItems(item.item)
    }
  }
  return count
}
