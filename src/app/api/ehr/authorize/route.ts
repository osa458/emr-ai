import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { fetchSmartWellKnown } from '@/lib/ehr/smart'

export const runtime = 'nodejs'

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function sha256Base64Url(input: string) {
  const hash = crypto.createHash('sha256').update(input).digest()
  return base64UrlEncode(hash)
}

function randomBase64Url(bytes: number) {
  return base64UrlEncode(crypto.randomBytes(bytes))
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any)?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Missing user id in session' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const connectionId = searchParams.get('connectionId')
  if (!connectionId) {
    return NextResponse.json({ success: false, error: 'Missing query param: connectionId' }, { status: 400 })
  }

  const connection = await prisma.ehrConnection.findUnique({
    where: { id: connectionId },
    include: { tenant: true },
  })

  if (!connection) {
    return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 })
  }

  const issuer = (connection.issuer || connection.fhirBaseUrl).replace(/\/$/, '')
  const smart = await fetchSmartWellKnown(issuer)
  const authorizationEndpoint = smart.authorization_endpoint
  if (!authorizationEndpoint) {
    return NextResponse.json({ success: false, error: 'SMART discovery missing authorization_endpoint' }, { status: 400 })
  }

  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || new URL(request.url).origin
  const redirectUri = `${origin}/api/ehr/callback`

  const codeVerifier = randomBase64Url(32)
  const codeChallenge = sha256Base64Url(codeVerifier)

  const nonce = randomBase64Url(16)
  const state = `${connectionId}.${nonce}`

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: connection.clientId,
    redirect_uri: redirectUri,
    scope:
      connection.scopes ||
      'launch/patient openid fhirUser offline_access patient/*.read user/*.read',
    state,
    aud: connection.fhirBaseUrl,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const url = new URL(authorizationEndpoint)
  url.search = params.toString()

  const res = NextResponse.redirect(url.toString())

  res.cookies.set(`ehr_state_${connectionId}`, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  })

  res.cookies.set(`ehr_verifier_${connectionId}`, codeVerifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  })

  // Tie this auth attempt to the current user.
  res.cookies.set(`ehr_user_${connectionId}`, userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  })

  return res
}
