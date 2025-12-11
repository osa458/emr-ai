/**
 * Audit Logging System
 * Tracks all significant user actions for compliance and security
 */

export interface AuditEvent {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  action: AuditAction
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export type AuditAction =
  | 'login'
  | 'logout'
  | 'view_patient'
  | 'view_patient_chart'
  | 'edit_note'
  | 'create_note'
  | 'sign_note'
  | 'view_ai_assist'
  | 'use_diagnostic_assist'
  | 'use_billing_assist'
  | 'generate_discharge_instructions'
  | 'view_discharge_readiness'
  | 'view_triage'
  | 'approve_discharge'
  | 'schedule_appointment'
  | 'export_data'
  | 'print_document'

// In-memory store for demo (would use database in production)
const auditLog: AuditEvent[] = []

export function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
  const auditEvent: AuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...event,
  }

  auditLog.push(auditEvent)

  // In production, would persist to database
  console.log('[AUDIT]', JSON.stringify(auditEvent))
}

export function getAuditLog(filters?: {
  userId?: string
  action?: AuditAction
  resource?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}): AuditEvent[] {
  let filtered = [...auditLog]

  if (filters?.userId) {
    filtered = filtered.filter((e) => e.userId === filters.userId)
  }
  if (filters?.action) {
    filtered = filtered.filter((e) => e.action === filters.action)
  }
  if (filters?.resource) {
    filtered = filtered.filter((e) => e.resource === filters.resource)
  }
  if (filters?.startDate) {
    filtered = filtered.filter((e) => new Date(e.timestamp) >= filters.startDate!)
  }
  if (filters?.endDate) {
    filtered = filtered.filter((e) => new Date(e.timestamp) <= filters.endDate!)
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit)
  }

  return filtered
}

// Helper for API routes
export function createAuditMiddleware(action: AuditAction, resource: string) {
  return async (
    userId: string,
    userName: string,
    userRole: string,
    resourceId?: string,
    details?: Record<string, unknown>
  ) => {
    logAuditEvent({
      userId,
      userName,
      userRole,
      action,
      resource,
      resourceId,
      details,
    })
  }
}

// Track AI interactions specifically
export function logAIInteraction(
  userId: string,
  userName: string,
  userRole: string,
  interactionType: 'diagnostic' | 'billing' | 'discharge' | 'triage',
  patientId?: string,
  encounterId?: string,
  inputSummary?: string,
  outputSummary?: string
): void {
  const actionMap: Record<string, AuditAction> = {
    diagnostic: 'use_diagnostic_assist',
    billing: 'use_billing_assist',
    discharge: 'generate_discharge_instructions',
    triage: 'view_triage',
  }

  logAuditEvent({
    userId,
    userName,
    userRole,
    action: actionMap[interactionType],
    resource: 'ai_interaction',
    resourceId: encounterId || patientId,
    details: {
      interactionType,
      patientId,
      encounterId,
      inputSummary,
      outputSummary,
    },
  })
}
