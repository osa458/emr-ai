import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { fetchSmartWellKnown } from '@/lib/ehr/smart'

export const runtime = 'nodejs'

type SmartTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
  id_token?: string
  patient?: string
  encounter?: string
  [k: string]: unknown
}

function clearCookie(res: NextResponse, name: string) {
  res.cookies.set(name, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const userId = (session.user as any)?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Missing user id in session' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const origin = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || new URL(request.url).origin
  const redirectUri = `${origin}/api/ehr/callback`

  if (error) {
    const url = new URL('/admin/ehr', origin)
    url.searchParams.set('error', error)
    if (errorDescription) url.searchParams.set('error_description', errorDescription)
    return NextResponse.redirect(url)
  }

  if (!code || !state) {
    return NextResponse.json({ success: false, error: 'Missing code/state from SMART callback' }, { status: 400 })
  }

  const [connectionId] = state.split('.')
  if (!connectionId) {
    return NextResponse.json({ success: false, error: 'Invalid state' }, { status: 400 })
  }

  const cookieState = request.cookies.get(`ehr_state_${connectionId}`)?.value
  const cookieVerifier = request.cookies.get(`ehr_verifier_${connectionId}`)?.value
  const cookieUserId = request.cookies.get(`ehr_user_${connectionId}`)?.value

  if (!cookieState || cookieState !== state) {
    return NextResponse.json({ success: false, error: 'Invalid or missing state cookie' }, { status: 400 })
  }

  if (!cookieVerifier) {
    return NextResponse.json({ success: false, error: 'Missing PKCE verifier cookie' }, { status: 400 })
  }

  if (cookieUserId && cookieUserId !== userId) {
    return NextResponse.json({ success: false, error: 'SMART callback user mismatch' }, { status: 400 })
  }

  const connection = await prisma.ehrConnection.findUnique({ where: { id: connectionId } })
  if (!connection) {
    return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 })
  }

  const issuer = (connection.issuer || connection.fhirBaseUrl).replace(/\/$/, '')
  const smart = await fetchSmartWellKnown(issuer)
  const tokenEndpoint = smart.token_endpoint
  if (!tokenEndpoint) {
    return NextResponse.json({ success: false, error: 'SMART discovery missing token_endpoint' }, { status: 400 })
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: connection.clientId,
    code_verifier: cookieVerifier,
  })

  if (connection.clientSecret) {
    body.set('client_secret', connection.clientSecret)
  }

  const tokenRes = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })

  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => '')
    return NextResponse.json(
      { success: false, error: `Token exchange failed: ${tokenRes.status} ${text}` },
      { status: 400 }
    )
  }

  const tokens = (await tokenRes.json()) as SmartTokenResponse
  if (!tokens.access_token) {
    return NextResponse.json({ success: false, error: 'Token exchange succeeded but access_token missing' }, { status: 400 })
  }

  const expiresAt =
    typeof tokens.expires_in === 'number' ? new Date(Date.now() + tokens.expires_in * 1000) : null

  await prisma.ehrUserToken.upsert({
    where: {
      ehrConnectionId_userId: {
        ehrConnectionId: connectionId,
        userId,
      },
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt,
      tokenType: tokens.token_type || null,
      scope: tokens.scope || null,
      idToken: tokens.id_token || null,
    },
    create: {
      ehrConnectionId: connectionId,
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt,
      tokenType: tokens.token_type || null,
      scope: tokens.scope || null,
      idToken: tokens.id_token || null,
    },
  })

  const url = new URL('/admin/ehr', origin)
  url.searchParams.set('connected', '1')
  url.searchParams.set('connectionId', connectionId)

  const res = NextResponse.redirect(url)
  clearCookie(res, `ehr_state_${connectionId}`)
  clearCookie(res, `ehr_verifier_${connectionId}`)
  clearCookie(res, `ehr_user_${connectionId}`)
  return res
}
