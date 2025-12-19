import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

type AidboxTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  userinfo?: {
    id?: string
    email?: string
    resourceType?: string
    [k: string]: unknown
  }
  [k: string]: unknown
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=')
    const json = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function refreshAidboxAccessToken(refreshToken: string) {
  const baseUrl = process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL
  const clientId = process.env.AIDBOX_OAUTH_CLIENT_ID
  const clientSecret = process.env.AIDBOX_OAUTH_CLIENT_SECRET

  if (!baseUrl || !clientId) {
    throw new Error('Aidbox OAuth env missing: AIDBOX_BASE_URL and AIDBOX_OAUTH_CLIENT_ID are required')
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: clientId,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Aidbox refresh_token failed: ${response.status} ${errorText}`)
  }

  const refreshed: AidboxTokenResponse = await response.json()
  return refreshed
}

// HIPAA Configuration - import dynamically to avoid circular deps
const getHIPAAConfig = async () => {
  try {
    const { HIPAA_CONFIG } = await import('./hipaa/config')
    return HIPAA_CONFIG
  } catch {
    return null
  }
}

// Demo users for local development
const demoUsers = [
  {
    id: '1',
    email: 'physician@demo.com',
    name: 'Dr. Sarah Johnson',
    role: 'physician',
    password: 'demo123',
  },
  {
    id: '2',
    email: 'nurse@demo.com',
    name: 'Nancy Williams, RN',
    role: 'nurse',
    password: 'demo123',
  },
  {
    id: '3',
    email: 'casemanager@demo.com',
    name: 'Carol Smith, LCSW',
    role: 'case_manager',
    password: 'demo123',
  },
  {
    id: '4',
    email: 'admin@demo.com',
    name: 'Admin User',
    role: 'admin',
    password: 'demo123',
  },
]

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'aidbox',
      name: 'Aidbox',
      type: 'oauth',
      clientId: process.env.AIDBOX_OAUTH_CLIENT_ID,
      clientSecret: process.env.AIDBOX_OAUTH_CLIENT_SECRET,
      authorization: {
        url: `${(process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL || '').replace(/\/$/, '')}/auth/authorize`,
        // Aidbox may include `id_token` when `openid` is requested.
        // NextAuth treats this provider as OAuth (not OIDC), so we must avoid `openid` here.
        params: { response_type: 'code', scope: 'profile email' },
      },
      token: {
        url: `${(process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL || '').replace(/\/$/, '')}/auth/token`,
      },
      userinfo: {
        async request({ tokens }: any) {
          const t = tokens as AidboxTokenResponse
          if (t.userinfo && (t.userinfo.id || t.userinfo.email)) {
            return t.userinfo
          }

          const accessToken = (t as any).access_token as string | undefined
          if (accessToken) {
            const payload = decodeJwtPayload(accessToken)
            const sub = payload?.sub as string | undefined
            if (sub) {
              const baseUrl = process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL
              if (baseUrl) {
                const res = await fetch(`${baseUrl.replace(/\/$/, '')}/User/${encodeURIComponent(sub)}`, {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                })
                if (res.ok) {
                  return res.json()
                }
              }
              return { id: sub }
            }
          }

          return { id: 'unknown' }
        },
      },
      profile(profile: any, tokens: any) {
        const tokenResp = tokens as AidboxTokenResponse
        const userinfo = (tokenResp.userinfo || profile) as any
        const id = userinfo?.id || decodeJwtPayload(tokenResp.access_token || '')?.sub || 'unknown'
        const email = userinfo?.email
        const name = userinfo?.name || email || 'Aidbox User'

        return {
          id: String(id),
          name: String(name),
          email: email ? String(email) : undefined,
        }
      },
    } as any,
    CredentialsProvider({
      name: 'Demo Login',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'physician@demo.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = demoUsers.find(
          (u) =>
            u.email === credentials.email && u.password === credentials.password
        )

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role
        token.id = user.id
      }

      if (account?.provider === 'aidbox') {
        const a = account as any as AidboxTokenResponse & { access_token?: string; refresh_token?: string; expires_in?: number }
        if (a.access_token) {
          ;(token as any).aidboxAccessToken = a.access_token
          ;(token as any).aidboxAccessTokenExpires = Date.now() + (a.expires_in ? a.expires_in * 1000 : 3600 * 1000)
        }
        if (a.refresh_token) {
          ;(token as any).aidboxRefreshToken = a.refresh_token
        }
        const userinfo = a.userinfo as any
        if (userinfo?.id) {
          ;(token as any).aidboxUserId = userinfo.id
        } else if (a.access_token) {
          const payload = decodeJwtPayload(a.access_token)
          if (payload?.sub) {
            ;(token as any).aidboxUserId = payload.sub
          }
        }

        const configuredAdminEmails = (process.env.EMR_ADMIN_EMAILS || process.env.EMR_ADMIN_EMAIL || '')
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
        const email = ((user as any)?.email || userinfo?.email) as string | undefined
        const isAdminEmail = !!email && configuredAdminEmails.includes(email.toLowerCase())

        if (!token.role) {
          token.role = isAdminEmail ? 'admin' : 'user'
        }
      }

      if ((token as any).aidboxAccessToken) {
        ;(token as any).fhirAccessToken = (token as any).aidboxAccessToken
      }
      if ((token as any).aidboxUserId) {
        ;(token as any).fhirUserId = (token as any).aidboxUserId
      }

      const expiresAt = (token as any).aidboxAccessTokenExpires as number | undefined
      const refreshToken = (token as any).aidboxRefreshToken as string | undefined
      const accessToken = (token as any).aidboxAccessToken as string | undefined

      if (accessToken && expiresAt && refreshToken && Date.now() >= expiresAt - 30_000) {
        try {
          const refreshed = await refreshAidboxAccessToken(refreshToken)
          if (refreshed.access_token) {
            ;(token as any).aidboxAccessToken = refreshed.access_token
            ;(token as any).aidboxAccessTokenExpires = Date.now() + (refreshed.expires_in ? refreshed.expires_in * 1000 : 3600 * 1000)
          }
          if (refreshed.refresh_token) {
            ;(token as any).aidboxRefreshToken = refreshed.refresh_token
          }
        } catch {
          ;(token as any).aidboxAccessToken = undefined
          ;(token as any).aidboxAccessTokenExpires = undefined
          ;(token as any).aidboxRefreshToken = undefined
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { role: string }).role = token.role as string
        (session.user as unknown as { id: string }).id = token.id as string
        ;(session.user as any).aidboxUserId = (token as any).aidboxUserId
        ;(session.user as any).fhirUserId = (token as any).fhirUserId
      }
      ;(session as any).aidboxAccessToken = (token as any).aidboxAccessToken
      ;(session as any).fhirAccessToken = (token as any).fhirAccessToken
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    // HIPAA: Session timeout (15 minutes default)
    maxAge: parseInt(process.env.HIPAA_SESSION_TIMEOUT || '900'),
  },
  // HIPAA: Secure cookie settings
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
  events: {
    // HIPAA: Audit login events
    async signIn({ user }) {
      try {
        const { auditLog } = await import('./hipaa/audit')
        await auditLog.logAuth('LOGIN', user.id, { email: user.email })
      } catch (e) {
        console.log('[AUTH] Audit log not available:', e)
      }
    },
    async signOut({ token }) {
      try {
        const { auditLog } = await import('./hipaa/audit')
        await auditLog.logAuth('LOGOUT', token?.id as string)
      } catch (e) {
        console.log('[AUTH] Audit log not available:', e)
      }
    },
  },
}

// Role-based access helpers
export type UserRole = 'physician' | 'nurse' | 'case_manager' | 'admin'

export const rolePermissions: Record<UserRole, string[]> = {
  physician: [
    'view_patients',
    'edit_notes',
    'view_ai_assist',
    'use_diagnostic_assist',
    'use_billing_assist',
    'approve_discharge',
    'view_all_data',
  ],
  nurse: [
    'view_patients',
    'edit_vitals',
    'view_ai_assist',
    'view_triage',
    'update_safety_checks',
  ],
  case_manager: [
    'view_patients',
    'view_discharge_planning',
    'schedule_followups',
    'view_ai_assist',
    'coordinate_discharge',
  ],
  admin: [
    'view_patients',
    'view_ai_assist',
    'manage_users',
    'view_audit_logs',
    'configure_system',
  ],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function canAccessFeature(role: UserRole, feature: string): boolean {
  const featurePermissions: Record<string, string> = {
    diagnostic_assist: 'use_diagnostic_assist',
    billing_assist: 'use_billing_assist',
    discharge_approval: 'approve_discharge',
    triage_dashboard: 'view_triage',
    discharge_planning: 'view_discharge_planning',
  }

  const requiredPermission = featurePermissions[feature]
  if (!requiredPermission) return true // Unknown features are accessible

  return hasPermission(role, requiredPermission)
}
