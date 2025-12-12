/**
 * PHI Access Middleware
 * 
 * Tracks all access to Protected Health Information (PHI)
 * Integrates with audit logging for HIPAA compliance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { auditLog, AuditAction } from './audit'
import { HIPAA_CONFIG } from './config'

// =============================================================================
// TYPES
// =============================================================================

export interface PHIAccessContext {
  userId: string
  userName?: string
  userRole?: string
  patientId?: string
  resourceType: string
  resourceId?: string
  action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'print'
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

// =============================================================================
// PHI RESOURCE DEFINITIONS
// =============================================================================

// Resources that contain PHI
export const PHI_RESOURCES = [
  'patient',
  'patients',
  'encounter',
  'encounters',
  'observation',
  'observations',
  'condition',
  'conditions',
  'medication',
  'medications',
  'procedure',
  'procedures',
  'diagnostic-report',
  'diagnostic-reports',
  'allergy',
  'allergies',
  'immunization',
  'immunizations',
  'note',
  'notes',
  'clinical-note',
  'document',
  'documents',
]

// API routes that access PHI
export const PHI_API_ROUTES = [
  '/api/patients',
  '/api/encounters',
  '/api/observations',
  '/api/conditions',
  '/api/medications',
  '/api/procedures',
  '/api/diagnostic-reports',
  '/api/allergies',
  '/api/immunizations',
  '/api/notes',
  '/api/documents',
  '/api/ai/diagnostic-assist',
  '/api/ai/billing-assist',
  '/api/ai/discharge-materials',
]

// =============================================================================
// PHI ACCESS TRACKING
// =============================================================================

export async function trackPHIAccess(context: PHIAccessContext): Promise<void> {
  if (!HIPAA_CONFIG.audit.logPHIAccess) return

  const actionMap: Record<string, AuditAction> = {
    view: 'PHI_VIEW',
    create: 'PHI_CREATE',
    update: 'PHI_UPDATE',
    delete: 'PHI_DELETE',
    export: 'PHI_EXPORT',
    print: 'PHI_PRINT',
  }

  await auditLog.log({
    action: actionMap[context.action],
    userId: context.userId,
    userName: context.userName,
    userRole: context.userRole,
    patientId: context.patientId,
    resourceType: context.resourceType,
    resourceId: context.resourceId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    sessionId: context.sessionId,
    success: true,
  })
}

// =============================================================================
// MIDDLEWARE HELPERS
// =============================================================================

export function isPHIRoute(pathname: string): boolean {
  return PHI_API_ROUTES.some(route => pathname.startsWith(route))
}

export function extractPatientId(pathname: string, body?: unknown): string | undefined {
  // Extract from URL path like /api/patients/[id]
  const pathMatch = pathname.match(/\/patients\/([^\/]+)/)
  if (pathMatch) return pathMatch[1]

  // Extract from query params or body
  if (body && typeof body === 'object' && 'patientId' in body) {
    return (body as { patientId: string }).patientId
  }

  return undefined
}

export function getActionFromMethod(method: string): PHIAccessContext['action'] {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'view'
    case 'POST':
      return 'create'
    case 'PUT':
    case 'PATCH':
      return 'update'
    case 'DELETE':
      return 'delete'
    default:
      return 'view'
  }
}

export function getResourceTypeFromPath(pathname: string): string {
  // Extract resource type from API path
  const match = pathname.match(/\/api\/([^\/]+)/)
  return match ? match[1] : 'unknown'
}

// =============================================================================
// API ROUTE WRAPPER
// =============================================================================

type APIHandler = (req: NextRequest, context?: unknown) => Promise<NextResponse>

export function withPHITracking(handler: APIHandler): APIHandler {
  return async (req: NextRequest, context?: unknown) => {
    const token = await getToken({ req })
    
    if (!token) {
      // Unauthenticated access attempt
      await auditLog.log({
        action: 'PERMISSION_DENIED',
        resourceType: getResourceTypeFromPath(req.nextUrl.pathname),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
        success: false,
        errorMessage: 'Unauthenticated PHI access attempt',
      })
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Track the PHI access
    const phiContext: PHIAccessContext = {
      userId: token.id as string,
      userName: token.name as string,
      userRole: token.role as string,
      resourceType: getResourceTypeFromPath(req.nextUrl.pathname),
      action: getActionFromMethod(req.method),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      sessionId: token.jti as string,
    }

    // Try to extract patient ID from URL
    phiContext.patientId = extractPatientId(req.nextUrl.pathname)

    // Log the access
    await trackPHIAccess(phiContext)

    // Execute the actual handler
    try {
      const response = await handler(req, context)
      return response
    } catch (error) {
      // Log failed access
      await auditLog.log({
        action: 'PHI_VIEW',
        userId: phiContext.userId,
        resourceType: phiContext.resourceType,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }
}

// =============================================================================
// BREAK THE GLASS (Emergency Access)
// =============================================================================

export interface EmergencyAccessRequest {
  userId: string
  patientId: string
  reason: string
  supervisorId?: string
}

export async function requestEmergencyAccess(request: EmergencyAccessRequest): Promise<boolean> {
  // Log emergency access request
  await auditLog.log({
    action: 'EMERGENCY_ACCESS',
    userId: request.userId,
    patientId: request.patientId,
    resourceType: 'emergency_access',
    details: {
      reason: request.reason,
      supervisorId: request.supervisorId,
      requestedAt: new Date().toISOString(),
    },
    success: true,
  })

  // In production, this would:
  // 1. Send notification to compliance officer
  // 2. Require supervisor approval
  // 3. Set time-limited access
  // 4. Create detailed audit trail

  console.warn('[PHI:EMERGENCY] Emergency access requested', {
    userId: request.userId,
    patientId: request.patientId,
    reason: request.reason,
  })

  return true // For demo, always grant. In production, require approval workflow.
}

// =============================================================================
// MINIMUM NECESSARY RULE
// =============================================================================

// Define what fields each role can access
export const ROLE_DATA_ACCESS: Record<string, string[]> = {
  physician: ['*'], // Full access
  nurse: [
    'name', 'mrn', 'birthDate', 'gender',
    'vitals', 'medications', 'allergies',
    'currentAdmission', 'orders',
  ],
  case_manager: [
    'name', 'mrn', 'birthDate',
    'admitDate', 'expectedDischargeDate',
    'socialHistory', 'insuranceInfo',
    'dischargeNeeds',
  ],
  admin: ['name', 'mrn', 'accountStatus'], // Limited clinical access
}

export function filterDataByRole(
  data: Record<string, unknown>,
  role: string
): Record<string, unknown> {
  if (!HIPAA_CONFIG.data.enforceMinimumNecessary) return data

  const allowedFields = ROLE_DATA_ACCESS[role]
  if (!allowedFields || allowedFields.includes('*')) return data

  const filtered: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in data) {
      filtered[field] = data[field]
    }
  }

  return filtered
}
