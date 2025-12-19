import { NextRequest, NextResponse } from 'next/server'
import { aidboxFetch } from '@/lib/aidbox'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const AIDBOX_BASE_URL = (process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL || '').replace(/\/$/, '')

async function forwardToAidbox(request: NextRequest, path: string) {
  const session = await getServerSession(authOptions)
  const accessToken = ((session as any)?.fhirAccessToken || (session as any)?.aidboxAccessToken) as string | undefined

  const url = AIDBOX_BASE_URL ? `${AIDBOX_BASE_URL}${path}` : path

  if (!accessToken) {
    return aidboxFetch(path, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/fhir+json',
        Accept: request.headers.get('accept') || 'application/fhir+json',
      },
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
    })
  }

  return fetch(url, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': request.headers.get('content-type') || 'application/fhir+json',
      Accept: request.headers.get('accept') || 'application/fhir+json',
    },
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  
  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  try {
    const response = await forwardToAidbox(request, path)
    const data = await response.json().catch(() => null)
    
    if (!response.ok) {
      return NextResponse.json(data ?? { error: 'FHIR request failed' }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('FHIR proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FHIR data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  try {
    const response = await forwardToAidbox(request, path)
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json(data ?? { error: 'FHIR request failed' }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('FHIR proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FHIR data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  try {
    const response = await forwardToAidbox(request, path)
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json(data ?? { error: 'FHIR request failed' }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('FHIR proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FHIR data' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  try {
    const response = await forwardToAidbox(request, path)
    const text = await response.text().catch(() => '')

    if (!response.ok) {
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        data = { error: text || 'FHIR request failed' }
      }
      return NextResponse.json(data, { status: response.status })
    }

    if (!text) {
      return new NextResponse(null, { status: 204 })
    }

    try {
      return NextResponse.json(JSON.parse(text))
    } catch {
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('FHIR proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FHIR data' },
      { status: 500 }
    )
  }
}
