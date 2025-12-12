/**
 * HIPAA Data Handler
 * 
 * Provides a unified interface for handling PHI data with:
 * - Automatic encryption/decryption
 * - Audit logging
 * - Data masking
 * - Minimum necessary filtering
 */

import { HIPAA_CONFIG } from './config'
import { auditLog } from './audit'
import { encryption, maskPHI, maskSSN, maskPhone, maskEmail } from './encryption'
import { filterDataByRole } from './phi-middleware'

// =============================================================================
// TYPES
// =============================================================================

export interface DataAccessContext {
  userId: string
  userRole: string
  patientId?: string
  purpose: 'treatment' | 'payment' | 'operations' | 'research' | 'emergency'
}

export interface PHIField {
  name: string
  type: 'ssn' | 'mrn' | 'phone' | 'email' | 'address' | 'dob' | 'clinical' | 'other'
  sensitive: boolean
}

// =============================================================================
// DATA HANDLER SERVICE
// =============================================================================

class DataHandlerService {
  private phiFields: Map<string, PHIField> = new Map([
    ['ssn', { name: 'ssn', type: 'ssn', sensitive: true }],
    ['socialSecurityNumber', { name: 'socialSecurityNumber', type: 'ssn', sensitive: true }],
    ['mrn', { name: 'mrn', type: 'mrn', sensitive: true }],
    ['phone', { name: 'phone', type: 'phone', sensitive: true }],
    ['email', { name: 'email', type: 'email', sensitive: true }],
    ['address', { name: 'address', type: 'address', sensitive: true }],
    ['birthDate', { name: 'birthDate', type: 'dob', sensitive: true }],
    ['diagnosis', { name: 'diagnosis', type: 'clinical', sensitive: true }],
    ['medications', { name: 'medications', type: 'clinical', sensitive: true }],
    ['notes', { name: 'notes', type: 'clinical', sensitive: true }],
  ])

  async prepareForStorage(
    data: Record<string, unknown>,
    context: DataAccessContext
  ): Promise<Record<string, unknown>> {
    await auditLog.logDataChange(
      context.userId,
      'phi_data',
      context.patientId || 'unknown',
      'PHI_CREATE',
      { purpose: context.purpose }
    )

    if (HIPAA_CONFIG.encryption.enabled) {
      return encryption.encryptPHI(data)
    }
    return data
  }

  async prepareForReading(
    data: Record<string, unknown>,
    context: DataAccessContext
  ): Promise<Record<string, unknown>> {
    await auditLog.logPHIAccess(
      context.userId,
      context.patientId || 'unknown',
      'PHI_VIEW',
      'phi_data',
      undefined,
      { purpose: context.purpose }
    )

    let result = data
    if (HIPAA_CONFIG.encryption.enabled) {
      result = await encryption.decryptPHI(data)
    }

    if (HIPAA_CONFIG.data.enforceMinimumNecessary) {
      result = filterDataByRole(result, context.userRole)
    }

    return result
  }

  maskForDisplay(
    data: Record<string, unknown>,
    fieldsToMask?: string[]
  ): Record<string, unknown> {
    if (!HIPAA_CONFIG.data.maskSensitiveData) return data

    const result = { ...data }
    const fields = fieldsToMask || Array.from(this.phiFields.keys())

    for (const field of fields) {
      if (!(field in result) || !result[field]) continue

      const fieldDef = this.phiFields.get(field)
      if (!fieldDef?.sensitive) continue

      const value = String(result[field])

      switch (fieldDef.type) {
        case 'ssn':
          result[field] = maskSSN(value)
          break
        case 'phone':
          result[field] = maskPhone(value)
          break
        case 'email':
          result[field] = maskEmail(value)
          break
        default:
          result[field] = maskPHI(value, 4)
      }
    }

    return result
  }

  async logPrint(context: DataAccessContext, documentType: string): Promise<void> {
    await auditLog.log({
      action: 'PHI_PRINT',
      userId: context.userId,
      patientId: context.patientId,
      resourceType: documentType,
      details: { purpose: context.purpose },
      success: true,
    })
  }
}

export const dataHandler = new DataHandlerService()

export function createDataContext(
  userId: string,
  userRole: string,
  patientId?: string,
  purpose: DataAccessContext['purpose'] = 'treatment'
): DataAccessContext {
  return { userId, userRole, patientId, purpose }
}
