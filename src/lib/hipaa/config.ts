/**
 * HIPAA Configuration
 * Central configuration for all HIPAA compliance settings
 * 
 * PLUG POINTS:
 * - Change providers by updating environment variables
 * - Swap implementations by modifying the provider imports
 */

export const HIPAA_CONFIG = {
  // ==========================================================================
  // SESSION SECURITY
  // ==========================================================================
  session: {
    // Session timeout in seconds (HIPAA recommends 15 minutes of inactivity)
    inactivityTimeout: parseInt(process.env.HIPAA_SESSION_TIMEOUT || '900'), // 15 minutes
    
    // Maximum session age (absolute timeout)
    maxAge: parseInt(process.env.HIPAA_SESSION_MAX_AGE || '28800'), // 8 hours
    
    // Require re-authentication for sensitive actions
    sensitiveActionReauth: process.env.HIPAA_SENSITIVE_REAUTH !== 'false',
  },

  // ==========================================================================
  // PASSWORD POLICY
  // ==========================================================================
  password: {
    minLength: parseInt(process.env.HIPAA_PASSWORD_MIN_LENGTH || '12'),
    requireUppercase: process.env.HIPAA_PASSWORD_UPPERCASE !== 'false',
    requireLowercase: process.env.HIPAA_PASSWORD_LOWERCASE !== 'false',
    requireNumber: process.env.HIPAA_PASSWORD_NUMBER !== 'false',
    requireSpecial: process.env.HIPAA_PASSWORD_SPECIAL !== 'false',
    maxAge: parseInt(process.env.HIPAA_PASSWORD_MAX_AGE || '90'), // days
    historyCount: parseInt(process.env.HIPAA_PASSWORD_HISTORY || '12'), // prevent reuse
  },

  // ==========================================================================
  // ACCOUNT LOCKOUT
  // ==========================================================================
  lockout: {
    maxAttempts: parseInt(process.env.HIPAA_LOCKOUT_ATTEMPTS || '5'),
    duration: parseInt(process.env.HIPAA_LOCKOUT_DURATION || '1800'), // 30 minutes
    notifyOnLockout: process.env.HIPAA_LOCKOUT_NOTIFY !== 'false',
  },

  // ==========================================================================
  // MULTI-FACTOR AUTHENTICATION (MFA)
  // PLUG POINT: Set HIPAA_MFA_PROVIDER to switch MFA providers
  // Options: 'none', 'totp', 'sms', 'email', 'duo', 'okta'
  // ==========================================================================
  mfa: {
    enabled: process.env.HIPAA_MFA_ENABLED === 'true',
    provider: process.env.HIPAA_MFA_PROVIDER || 'none',
    requiredForRoles: (process.env.HIPAA_MFA_REQUIRED_ROLES || 'admin,physician').split(','),
  },

  // ==========================================================================
  // AUDIT LOGGING
  // PLUG POINT: Set HIPAA_AUDIT_PROVIDER to switch audit backends
  // Options: 'console', 'database', 'cloudwatch', 'splunk', 'datadog'
  // ==========================================================================
  audit: {
    enabled: process.env.HIPAA_AUDIT_ENABLED !== 'false',
    provider: process.env.HIPAA_AUDIT_PROVIDER || 'database',
    logPHIAccess: process.env.HIPAA_AUDIT_PHI !== 'false',
    logAuthEvents: process.env.HIPAA_AUDIT_AUTH !== 'false',
    logDataChanges: process.env.HIPAA_AUDIT_CHANGES !== 'false',
    retentionDays: parseInt(process.env.HIPAA_AUDIT_RETENTION || '2190'), // 6 years
  },

  // ==========================================================================
  // ENCRYPTION
  // PLUG POINT: Set HIPAA_ENCRYPTION_PROVIDER to switch encryption
  // Options: 'local', 'aws-kms', 'azure-keyvault', 'hashicorp-vault'
  // ==========================================================================
  encryption: {
    enabled: process.env.HIPAA_ENCRYPTION_ENABLED !== 'false',
    provider: process.env.HIPAA_ENCRYPTION_PROVIDER || 'local',
    algorithm: process.env.HIPAA_ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    keyRotationDays: parseInt(process.env.HIPAA_KEY_ROTATION || '90'),
  },

  // ==========================================================================
  // DATA HANDLING
  // ==========================================================================
  data: {
    // Minimum necessary rule - only access required data
    enforceMinimumNecessary: process.env.HIPAA_MINIMUM_NECESSARY !== 'false',
    
    // Data masking for non-clinical displays
    maskSensitiveData: process.env.HIPAA_MASK_DATA !== 'false',
    
    // PHI fields that require special handling
    phiFields: [
      'ssn', 'socialSecurityNumber',
      'mrn', 'medicalRecordNumber',
      'birthDate', 'dateOfBirth', 'dob',
      'address', 'streetAddress',
      'phone', 'phoneNumber',
      'email', 'emailAddress',
      'diagnosis', 'diagnoses',
      'medications', 'prescriptions',
      'notes', 'clinicalNotes',
    ],
  },

  // ==========================================================================
  // BREACH NOTIFICATION
  // ==========================================================================
  breach: {
    notifyWithinHours: 72, // HIPAA requires notification within 72 hours
    notifyEmail: process.env.HIPAA_BREACH_NOTIFY_EMAIL || '',
    autoDetect: process.env.HIPAA_BREACH_AUTODETECT !== 'false',
  },
}

// Environment validation
export function validateHIPAAConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
      errors.push('NEXTAUTH_SECRET must be at least 32 characters in production')
    }
    
    if (HIPAA_CONFIG.mfa.enabled && HIPAA_CONFIG.mfa.provider === 'none') {
      errors.push('MFA is enabled but no provider is configured')
    }
    
    if (!HIPAA_CONFIG.encryption.enabled) {
      errors.push('Encryption should be enabled in production')
    }
  }

  return { valid: errors.length === 0, errors }
}

export default HIPAA_CONFIG
