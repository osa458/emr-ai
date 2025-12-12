import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { role: string }).role = token.role as string
        (session.user as unknown as { id: string }).id = token.id as string
      }
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
