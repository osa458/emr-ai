import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'

function loadEnvFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename)
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

// Next.js commonly uses .env.local; load it for standalone scripts too.
loadEnvFile('.env.local')

const BASE_URL = (process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL || '').replace(/\/$/, '')
const BOOTSTRAP_CLIENT_ID = process.env.AIDBOX_CLIENT_ID
const BOOTSTRAP_CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET

const OAUTH_CLIENT_ID = process.env.AIDBOX_OAUTH_CLIENT_ID || 'emr-webapp'
const OAUTH_CLIENT_SECRET = process.env.AIDBOX_OAUTH_CLIENT_SECRET || 'change-me'

const NEXTAUTH_URL = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
const REDIRECT_URI = process.env.AIDBOX_OAUTH_REDIRECT_URI || (NEXTAUTH_URL ? `${NEXTAUTH_URL}/api/auth/callback/aidbox` : '')

const SEED_USER_ID = process.env.AIDBOX_SEED_USER_ID || 'exampleuser'
const SEED_USER_EMAIL = process.env.AIDBOX_SEED_USER_EMAIL || 'test@example.com'
const SEED_USER_PASSWORD = process.env.AIDBOX_SEED_USER_PASSWORD || 'ChangeMe123!'

const ADMIN_USER_ID = process.env.AIDBOX_ADMIN_USER_ID || 'osa458'
const ADMIN_USER_EMAIL = process.env.AIDBOX_ADMIN_USER_EMAIL || 'osa458@gmail.com'
const ADMIN_USER_PASSWORD = process.env.AIDBOX_ADMIN_USER_PASSWORD || 'admin123'

function assertEnv() {
  if (!BASE_URL) throw new Error('AIDBOX_BASE_URL is required')
  if (!BOOTSTRAP_CLIENT_ID) throw new Error('AIDBOX_CLIENT_ID is required (bootstrap basic auth client)')
  if (!BOOTSTRAP_CLIENT_SECRET) throw new Error('AIDBOX_CLIENT_SECRET is required (bootstrap basic auth client)')
  if (!REDIRECT_URI) throw new Error('AIDBOX_OAUTH_REDIRECT_URI or NEXTAUTH_URL is required to compute redirect_uri')
}

function authHeaders() {
  const basic = Buffer.from(`${BOOTSTRAP_CLIENT_ID}:${BOOTSTRAP_CLIENT_SECRET}`).toString('base64')
  return {
    Authorization: `Basic ${basic}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

async function putResource(resourceType: string, id: string, body: unknown) {
  const res = await fetch(`${BASE_URL}/${resourceType}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`PUT /${resourceType}/${id} failed: ${res.status} ${text}`)
  }

  return res.json().catch(() => null)
}

async function main() {
  assertEnv()

  const clientBody = {
    resourceType: 'Client',
    id: OAUTH_CLIENT_ID,
    secret: OAUTH_CLIENT_SECRET,
    first_party: true,
    grant_types: ['code'],
    auth: {
      authorization_code: {
        redirect_uri: REDIRECT_URI,
        token_format: 'jwt',
        secret_required: true,
        refresh_token: true,
        access_token_expiration: 3600,
        refresh_token_expiration: 86400,
      },
    },
  }

  await putResource('Client', OAUTH_CLIENT_ID, clientBody)

  const userBody = {
    resourceType: 'User',
    id: SEED_USER_ID,
    email: SEED_USER_EMAIL,
    password: SEED_USER_PASSWORD,
  }

  await putResource('User', SEED_USER_ID, userBody)

  const adminUserBody = {
    resourceType: 'User',
    id: ADMIN_USER_ID,
    email: ADMIN_USER_EMAIL,
    password: ADMIN_USER_PASSWORD,
  }

  await putResource('User', ADMIN_USER_ID, adminUserBody)

  const accessPolicyId = `allow-all-${SEED_USER_ID}`
  const accessPolicyBody = {
    resourceType: 'AccessPolicy',
    id: accessPolicyId,
    engine: 'allow',
    link: [{ resourceType: 'User', id: SEED_USER_ID }],
  }

  await putResource('AccessPolicy', accessPolicyId, accessPolicyBody)

  const adminAccessPolicyId = `allow-all-${ADMIN_USER_ID}`
  const adminAccessPolicyBody = {
    resourceType: 'AccessPolicy',
    id: adminAccessPolicyId,
    engine: 'allow',
    link: [{ resourceType: 'User', id: ADMIN_USER_ID }],
  }

  await putResource('AccessPolicy', adminAccessPolicyId, adminAccessPolicyBody)

  console.log('Aidbox OAuth configured successfully')
  console.log(`OAuth Client: ${OAUTH_CLIENT_ID}`)
  console.log(`Redirect URI: ${REDIRECT_URI}`)
  console.log(`Seed User: ${SEED_USER_EMAIL} (id=${SEED_USER_ID})`)
  console.log(`Admin User: ${ADMIN_USER_EMAIL} (id=${ADMIN_USER_ID})`)
  console.log(`AccessPolicy: ${accessPolicyId}`)
  console.log(`AccessPolicy: ${adminAccessPolicyId}`)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
