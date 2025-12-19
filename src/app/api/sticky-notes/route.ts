import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const AIDBOX_BASE_URL = (process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL || '').replace(/\/$/, '')

const PRIVATE_STICKY_NOTE_TAG_SYSTEM = 'https://emr-ai.local/tags'
const PRIVATE_STICKY_NOTE_TAG_CODE = 'private-sticky-note'
const OWNER_EXTENSION_URL = 'http://emmai.local/fhir/StructureDefinition/private-note-owner'

function stickyNoteId(userId: string, patientId: string) {
  return `sticky-${userId}-${patientId}`
}

function toBase64(text: string) {
  return Buffer.from(text, 'utf8').toString('base64')
}

async function aidboxFetchAsUser(
  accessToken: string,
  path: string,
  init: RequestInit = {}
) {
  const url = AIDBOX_BASE_URL ? `${AIDBOX_BASE_URL}${path}` : path

  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json',
      ...(init.headers || {}),
    },
  })
}

async function requireAidboxSession() {
  const session = await getServerSession(authOptions)
  const accessToken = ((session as any)?.fhirAccessToken || (session as any)?.aidboxAccessToken) as string | undefined
  const aidboxUserId = ((session as any)?.user?.fhirUserId || (session as any)?.user?.aidboxUserId) as string | undefined

  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!accessToken || !aidboxUserId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Aidbox OAuth session missing' }, { status: 401 }),
    }
  }

  return { ok: true as const, session, accessToken, aidboxUserId }
}

export async function GET(request: NextRequest) {
  const auth = await requireAidboxSession()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId')
  const patientIdsParam = searchParams.get('patientIds')

  if (!patientId && !patientIdsParam) {
    return NextResponse.json({ error: 'Missing patientId or patientIds parameter' }, { status: 400 })
  }

  const patientIds = patientId
    ? [patientId]
    : patientIdsParam
      ? patientIdsParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []

  try {
    const results = await Promise.all(
      patientIds.map(async (pid) => {
        const id = stickyNoteId(auth.aidboxUserId, pid)
        const res = await aidboxFetchAsUser(auth.accessToken, `/DocumentReference/${encodeURIComponent(id)}`)

        if (res.status === 404) {
          return [pid, ''] as const
        }

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(`Aidbox read failed: ${res.status} ${text}`)
        }

        const doc = await res.json()
        const data = doc?.content?.[0]?.attachment?.data
        let note = ''
        if (typeof data === 'string' && data.length > 0) {
          try {
            note = Buffer.from(data, 'base64').toString('utf8')
          } catch {
            note = data
          }
        }

        return [pid, note] as const
      })
    )

    const notesByPatientId: Record<string, string> = {}
    for (const [pid, note] of results) {
      notesByPatientId[pid] = note
    }

    if (patientId) {
      return NextResponse.json({ success: true, patientId, note: notesByPatientId[patientId] || '' })
    }

    return NextResponse.json({ success: true, notesByPatientId })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch sticky notes' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAidboxSession()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const patientId = body?.patientId as string | undefined
    const note = (body?.note as string | undefined) ?? ''

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 })
    }

    const id = stickyNoteId(auth.aidboxUserId, patientId)

    const docRef = {
      resourceType: 'DocumentReference',
      id,
      status: 'current',
      type: {
        text: 'Private Sticky Note',
        coding: [{ system: 'https://emr-ai.local/codes', code: 'private-sticky-note', display: 'Private Sticky Note' }],
      },
      category: [
        {
          text: 'Private Sticky Note',
          coding: [{ system: 'https://emr-ai.local/codes', code: 'private-sticky-note', display: 'Private Sticky Note' }],
        },
      ],
      subject: { reference: `Patient/${patientId}` },
      date: new Date().toISOString(),
      author: auth.session.user?.name ? [{ display: auth.session.user.name }] : undefined,
      content: [
        {
          attachment: {
            contentType: 'text/plain',
            data: toBase64(note),
          },
        },
      ],
      extension: [
        {
          url: OWNER_EXTENSION_URL,
          valueString: auth.aidboxUserId,
        },
      ],
      meta: {
        tag: [
          {
            system: PRIVATE_STICKY_NOTE_TAG_SYSTEM,
            code: PRIVATE_STICKY_NOTE_TAG_CODE,
            display: 'Private sticky note',
          },
        ],
        security: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
            code: 'R',
            display: 'Restricted',
          },
        ],
      },
    }

    const res = await aidboxFetchAsUser(auth.accessToken, `/DocumentReference/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(docRef),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json(
        { success: false, error: `Aidbox write failed: ${res.status} ${text}` },
        { status: res.status }
      )
    }

    const saved = await res.json().catch(() => null)
    return NextResponse.json({ success: true, data: saved })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save sticky note' },
      { status: 500 }
    )
  }
}
