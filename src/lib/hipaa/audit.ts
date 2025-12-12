/**
 * HIPAA Audit Logging Service
 * 
 * PLUG POINT: Switch audit providers by changing HIPAA_AUDIT_PROVIDER env var
 * Supported: 'console', 'database', 'cloudwatch', 'splunk', 'datadog'
 * 
 * To add a new provider:
 * 1. Create a class implementing AuditProvider interface
 * 2. Add it to the providerFactory
 */

import { HIPAA_CONFIG } from './config'
import prisma from '@/lib/db'

// =============================================================================
// TYPES
// =============================================================================

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'SESSION_TIMEOUT'
  | 'PHI_VIEW'
  | 'PHI_CREATE'
  | 'PHI_UPDATE'
  | 'PHI_DELETE'
  | 'PHI_EXPORT'
  | 'PHI_PRINT'
  | 'PERMISSION_DENIED'
  | 'SENSITIVE_ACTION'
  | 'CONFIG_CHANGE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'PASSWORD_CHANGE'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'EMERGENCY_ACCESS'

export interface AuditEntry {
  id?: string
  timestamp: Date
  action: AuditAction
  userId?: string
  userName?: string
  userRole?: string
  resourceType?: string
  resourceId?: string
  patientId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  success: boolean
  errorMessage?: string
}

// =============================================================================
// AUDIT PROVIDER INTERFACE
// =============================================================================

export interface AuditProvider {
  name: string
  log(entry: AuditEntry): Promise<void>
  query(filters: AuditQueryFilters): Promise<AuditEntry[]>
  getRetentionPolicy(): { days: number }
}

export interface AuditQueryFilters {
  userId?: string
  patientId?: string
  action?: AuditAction | AuditAction[]
  resourceType?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// =============================================================================
// CONSOLE PROVIDER (Development)
// =============================================================================

class ConsoleAuditProvider implements AuditProvider {
  name = 'console'

  async log(entry: AuditEntry): Promise<void> {
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    }
    
    if (entry.success) {
      console.log('[AUDIT]', JSON.stringify(logEntry))
    } else {
      console.warn('[AUDIT:FAILED]', JSON.stringify(logEntry))
    }
  }

  async query(_filters: AuditQueryFilters): Promise<AuditEntry[]> {
    console.warn('[AUDIT] Console provider does not support querying')
    return []
  }

  getRetentionPolicy() {
    return { days: 0 } // Console logs are not retained
  }
}

// =============================================================================
// DATABASE PROVIDER (Production Ready)
// =============================================================================

class DatabaseAuditProvider implements AuditProvider {
  name = 'database'

  async log(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resource: entry.resourceType || 'unknown',
          resourceId: entry.resourceId,
          details: {
            userName: entry.userName,
            userRole: entry.userRole,
            patientId: entry.patientId,
            success: entry.success,
            errorMessage: entry.errorMessage,
            sessionId: entry.sessionId,
            ...entry.details,
          },
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          createdAt: entry.timestamp,
        },
      })
    } catch (error) {
      // Fallback to console if database fails
      console.error('[AUDIT:DB_ERROR]', error)
      console.log('[AUDIT:FALLBACK]', JSON.stringify(entry))
    }
  }

  async query(filters: AuditQueryFilters): Promise<AuditEntry[]> {
    const where: Record<string, unknown> = {}
    
    if (filters.userId) where.userId = filters.userId
    if (filters.resourceType) where.resource = filters.resourceType
    if (filters.action) {
      where.action = Array.isArray(filters.action) 
        ? { in: filters.action }
        : filters.action
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: filters.limit || 100,
      skip: filters.offset || 0,
      orderBy: { createdAt: 'desc' },
    })

    return logs.map(log => ({
      id: log.id,
      timestamp: log.createdAt,
      action: log.action as AuditAction,
      userId: log.userId || undefined,
      resourceType: log.resource,
      resourceId: log.resourceId || undefined,
      details: log.details as Record<string, unknown> || undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      success: (log.details as Record<string, unknown>)?.success as boolean ?? true,
    }))
  }

  getRetentionPolicy() {
    return { days: HIPAA_CONFIG.audit.retentionDays }
  }
}

// =============================================================================
// CLOUDWATCH PROVIDER (AWS - Stub for future)
// =============================================================================

class CloudWatchAuditProvider implements AuditProvider {
  name = 'cloudwatch'

  async log(entry: AuditEntry): Promise<void> {
    // PLUG POINT: Implement AWS CloudWatch Logs integration
    // import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'
    console.log('[AUDIT:CLOUDWATCH] Would log to CloudWatch:', entry.action)
    
    // Fallback to database
    const dbProvider = new DatabaseAuditProvider()
    await dbProvider.log(entry)
  }

  async query(_filters: AuditQueryFilters): Promise<AuditEntry[]> {
    // PLUG POINT: Implement CloudWatch Logs Insights query
    console.warn('[AUDIT:CLOUDWATCH] Query not implemented, using database')
    const dbProvider = new DatabaseAuditProvider()
    return dbProvider.query(_filters)
  }

  getRetentionPolicy() {
    return { days: HIPAA_CONFIG.audit.retentionDays }
  }
}

// =============================================================================
// SPLUNK PROVIDER (Stub for future)
// =============================================================================

class SplunkAuditProvider implements AuditProvider {
  name = 'splunk'

  async log(entry: AuditEntry): Promise<void> {
    // PLUG POINT: Implement Splunk HEC integration
    // const splunkUrl = process.env.SPLUNK_HEC_URL
    // const splunkToken = process.env.SPLUNK_HEC_TOKEN
    console.log('[AUDIT:SPLUNK] Would log to Splunk:', entry.action)
    
    // Fallback to database
    const dbProvider = new DatabaseAuditProvider()
    await dbProvider.log(entry)
  }

  async query(_filters: AuditQueryFilters): Promise<AuditEntry[]> {
    console.warn('[AUDIT:SPLUNK] Query not implemented, using database')
    const dbProvider = new DatabaseAuditProvider()
    return dbProvider.query(_filters)
  }

  getRetentionPolicy() {
    return { days: HIPAA_CONFIG.audit.retentionDays }
  }
}

// =============================================================================
// PROVIDER FACTORY
// =============================================================================

function createAuditProvider(): AuditProvider {
  const providerName = HIPAA_CONFIG.audit.provider

  switch (providerName) {
    case 'console':
      return new ConsoleAuditProvider()
    case 'database':
      return new DatabaseAuditProvider()
    case 'cloudwatch':
      return new CloudWatchAuditProvider()
    case 'splunk':
      return new SplunkAuditProvider()
    default:
      console.warn(`[AUDIT] Unknown provider "${providerName}", using database`)
      return new DatabaseAuditProvider()
  }
}

// =============================================================================
// AUDIT SERVICE
// =============================================================================

class AuditService {
  private provider: AuditProvider
  private enabled: boolean

  constructor() {
    this.enabled = HIPAA_CONFIG.audit.enabled
    this.provider = createAuditProvider()
  }

  async log(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
    if (!this.enabled) return

    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date(),
    }

    await this.provider.log(fullEntry)
  }

  async query(filters: AuditQueryFilters): Promise<AuditEntry[]> {
    return this.provider.query(filters)
  }

  // Convenience methods
  async logPHIAccess(
    userId: string,
    patientId: string,
    action: 'PHI_VIEW' | 'PHI_CREATE' | 'PHI_UPDATE' | 'PHI_DELETE',
    resourceType: string,
    resourceId?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    if (!HIPAA_CONFIG.audit.logPHIAccess) return

    await this.log({
      action,
      userId,
      patientId,
      resourceType,
      resourceId,
      details,
      success: true,
    })
  }

  async logAuth(
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'SESSION_TIMEOUT',
    userId?: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    if (!HIPAA_CONFIG.audit.logAuthEvents) return

    await this.log({
      action,
      userId,
      resourceType: 'auth',
      details,
      success: action !== 'LOGIN_FAILED',
    })
  }

  async logDataChange(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'PHI_CREATE' | 'PHI_UPDATE' | 'PHI_DELETE',
    details?: Record<string, unknown>
  ): Promise<void> {
    if (!HIPAA_CONFIG.audit.logDataChanges) return

    await this.log({
      action,
      userId,
      resourceType,
      resourceId,
      details,
      success: true,
    })
  }

  getProviderName(): string {
    return this.provider.name
  }
}

// Export singleton instance
export const auditLog = new AuditService()

// Export for testing
export { AuditService, createAuditProvider }
