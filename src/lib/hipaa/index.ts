/**
 * HIPAA Compliance Module
 * 
 * This module provides pluggable HIPAA compliance features:
 * 
 * PLUG POINTS (configure via environment variables):
 * - HIPAA_AUDIT_PROVIDER: 'console' | 'database' | 'cloudwatch' | 'splunk'
 * - HIPAA_ENCRYPTION_PROVIDER: 'local' | 'aws-kms' | 'azure-keyvault' | 'hashicorp-vault'
 * - HIPAA_MFA_PROVIDER: 'none' | 'totp' | 'sms' | 'duo' | 'okta'
 * 
 * Usage:
 * ```typescript
 * import { auditLog, encryption, mfaService, dataHandler } from '@/lib/hipaa'
 * 
 * // Log PHI access
 * await auditLog.logPHIAccess(userId, patientId, 'PHI_VIEW', 'patient')
 * 
 * // Encrypt sensitive data
 * const encrypted = await encryption.encrypt(sensitiveData)
 * 
 * // Check MFA requirement
 * if (mfaService.isRequiredForRole(userRole)) {
 *   const challenge = await mfaService.generateChallenge(userId)
 * }
 * 
 * // Handle PHI data with automatic encryption and logging
 * const data = await dataHandler.prepareForReading(rawData, context)
 * ```
 */

// Configuration
export { HIPAA_CONFIG, validateHIPAAConfig } from './config'

// Audit Logging
export { 
  auditLog, 
  AuditService,
  type AuditAction,
  type AuditEntry,
  type AuditProvider,
  type AuditQueryFilters,
} from './audit'

// Encryption
export {
  encryption,
  EncryptionService,
  hashForAudit,
  maskPHI,
  maskSSN,
  maskPhone,
  maskEmail,
  type EncryptedData,
  type EncryptionProvider,
} from './encryption'

// PHI Middleware
export {
  trackPHIAccess,
  withPHITracking,
  isPHIRoute,
  extractPatientId,
  requestEmergencyAccess,
  filterDataByRole,
  PHI_RESOURCES,
  PHI_API_ROUTES,
  ROLE_DATA_ACCESS,
  type PHIAccessContext,
  type EmergencyAccessRequest,
} from './phi-middleware'

// Auth Provider (MFA)
export {
  mfaService,
  MFAService,
  validatePassword,
  checkAccountLocked,
  recordLoginAttempt,
  type MFAChallenge,
  type MFAVerification,
  type MFAProvider,
  type PasswordValidation,
} from './auth-provider'

// Data Handler
export {
  dataHandler,
  createDataContext,
  type DataAccessContext,
  type PHIField,
} from './data-handler'

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize HIPAA compliance module
 * Call this at application startup
 */
export async function initializeHIPAA(): Promise<void> {
  const { validateHIPAAConfig: validate } = await import('./config')
  const { valid, errors } = validate()
  
  if (!valid) {
    console.error('[HIPAA] Configuration errors:', errors)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('HIPAA configuration is invalid for production')
    }
  }

  console.log('[HIPAA] Module initialized')
  console.log('[HIPAA] Audit provider:', process.env.HIPAA_AUDIT_PROVIDER || 'database')
  console.log('[HIPAA] Encryption provider:', process.env.HIPAA_ENCRYPTION_PROVIDER || 'local')
  console.log('[HIPAA] MFA provider:', process.env.HIPAA_MFA_PROVIDER || 'none')
}

// =============================================================================
// COMPLIANCE STATUS
// =============================================================================

export interface ComplianceStatus {
  audit: { enabled: boolean; provider: string }
  encryption: { enabled: boolean; provider: string }
  mfa: { enabled: boolean; provider: string }
  session: { timeout: number; maxAge: number }
  overall: 'compliant' | 'partial' | 'non-compliant'
}

export function getComplianceStatus(): ComplianceStatus {
  const { HIPAA_CONFIG } = require('./config')
  const { auditLog } = require('./audit')
  const { encryption } = require('./encryption')
  const { mfaService } = require('./auth-provider')

  const auditEnabled = HIPAA_CONFIG.audit.enabled
  const encryptionEnabled = HIPAA_CONFIG.encryption.enabled
  const mfaEnabled = mfaService.isEnabled()

  let overall: ComplianceStatus['overall'] = 'non-compliant'
  
  if (auditEnabled && encryptionEnabled && mfaEnabled) {
    overall = 'compliant'
  } else if (auditEnabled || encryptionEnabled) {
    overall = 'partial'
  }

  return {
    audit: { enabled: auditEnabled, provider: auditLog.getProviderName() },
    encryption: { enabled: encryptionEnabled, provider: encryption.getProviderName() },
    mfa: { enabled: mfaEnabled, provider: mfaService.getProviderName() },
    session: { 
      timeout: HIPAA_CONFIG.session.inactivityTimeout,
      maxAge: HIPAA_CONFIG.session.maxAge,
    },
    overall,
  }
}
