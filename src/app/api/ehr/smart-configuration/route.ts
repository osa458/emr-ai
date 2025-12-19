import { NextRequest, NextResponse } from 'next/server'
import { fetchSmartWellKnown } from '@/lib/ehr/smart'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const iss = searchParams.get('iss')

    if (!iss) {
      return NextResponse.json({ success: false, error: 'Missing query param: iss' }, { status: 400 })
    }

    const config = await fetchSmartWellKnown(iss)
    return NextResponse.json({ success: true, data: config })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch SMART configuration' }, { status: 500 })
  }
}
