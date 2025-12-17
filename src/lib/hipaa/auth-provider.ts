/**
 * HIPAA Auth Provider Abstraction
 * 
 * PLUG POINT: Switch MFA providers by changing HIPAA_MFA_PROVIDER env var
 * Supported: 'none', 'totp', 'sms', 'email', 'duo', 'okta'
 * 
 * To add a new MFA provider:
 * 1. Create a class implementing MFAProvider interface
 * 2. Add it to the providerFactory
 */

import { HIPAA_CONFIG } from './config'
import { auditLog } from './audit'

// =============================================================================
// TYPES
// =============================================================================

export interface MFAChallenge {
  challengeId: string
  method: 'totp' | 'sms' | 'email' | 'push'
  expiresAt: Date
  destination?: string // masked phone/email
}

export interface MFAVerification {
  challengeId: string
  code: string
}

export interface MFAProvider {
  name: string
  isEnabled(): boolean
  generateChallenge(userId: string, method?: string): Promise<MFAChallenge>
  verifyChallenge(verification: MFAVerification): Promise<boolean>
  enrollUser(userId: string, method: string): Promise<{ secret?: string; qrCode?: string }>
  unenrollUser(userId: string): Promise<void>
}

export interface PasswordValidation {
  valid: boolean
  errors: string[]
}

// =============================================================================
// PASSWORD VALIDATION
// =============================================================================

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  const config = HIPAA_CONFIG.password

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters`)
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (config.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (config.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'letmein']
  if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
    errors.push('Password contains a common pattern')
  }

  return { valid: errors.length === 0, errors }
}

// =============================================================================
// ACCOUNT LOCKOUT
// =============================================================================

// In-memory store for demo (use Redis/database in production)
const loginAttempts: Map<string, { count: number; lockedUntil?: Date }> = new Map()

export function checkAccountLocked(email: string): { locked: boolean; remainingTime?: number } {
  const attempts = loginAttempts.get(email)
  
  if (!attempts?.lockedUntil) {
    return { locked: false }
  }

  if (new Date() > attempts.lockedUntil) {
    // Lockout expired
    loginAttempts.delete(email)
    return { locked: false }
  }

  const remainingTime = Math.ceil((attempts.lockedUntil.getTime() - Date.now()) / 1000)
  return { locked: true, remainingTime }
}

export async function recordLoginAttempt(email: string, success: boolean): Promise<void> {
  if (success) {
    loginAttempts.delete(email)
    return
  }

  const attempts = loginAttempts.get(email) || { count: 0 }
  attempts.count++

  if (attempts.count >= HIPAA_CONFIG.lockout.maxAttempts) {
    attempts.lockedUntil = new Date(Date.now() + HIPAA_CONFIG.lockout.duration * 1000)
    
    await auditLog.log({
      action: 'LOGIN_FAILED',
      details: {
        email,
        reason: 'Account locked due to too many failed attempts',
        lockedUntil: attempts.lockedUntil.toISOString(),
      },
      success: false,
    })

    // PLUG POINT: Send lockout notification
    if (HIPAA_CONFIG.lockout.notifyOnLockout) {
      console.warn(`[AUTH] Account locked: ${email}`)
      // In production: send email/SMS notification
    }
  }

  loginAttempts.set(email, attempts)
}

// =============================================================================
// MFA PROVIDERS
// =============================================================================

// No MFA Provider (Development)
class NoMFAProvider implements MFAProvider {
  name = 'none'

  isEnabled(): boolean {
    return false
  }

  async generateChallenge(): Promise<MFAChallenge> {
    throw new Error('MFA is not enabled')
  }

  async verifyChallenge(): Promise<boolean> {
    return true // No verification needed
  }

  async enrollUser(): Promise<{ secret?: string; qrCode?: string }> {
    throw new Error('MFA is not enabled')
  }

  async unenrollUser(): Promise<void> {
    // No-op
  }
}

// TOTP Provider (Google Authenticator compatible)
class TOTPMFAProvider implements MFAProvider {
  name = 'totp'

  isEnabled(): boolean {
    return HIPAA_CONFIG.mfa.enabled
  }

  async generateChallenge(userId: string): Promise<MFAChallenge> {
    // PLUG POINT: Implement TOTP challenge
    // import { authenticator } from 'otplib'
    
    console.log('[MFA:TOTP] Would generate TOTP challenge for', userId)
    
    return {
      challengeId: `totp-${Date.now()}`,
      method: 'totp',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    }
  }

  async verifyChallenge(verification: MFAVerification): Promise<boolean> {
    // PLUG POINT: Implement TOTP verification
    // import { authenticator } from 'otplib'
    // return authenticator.verify({ token: verification.code, secret: userSecret })
    
    console.log('[MFA:TOTP] Would verify TOTP code', verification.challengeId)
    return verification.code === '123456' // Demo: accept any 6-digit code
  }

  async enrollUser(userId: string): Promise<{ secret?: string; qrCode?: string }> {
    // PLUG POINT: Generate TOTP secret and QR code
    // import { authenticator } from 'otplib'
    // const secret = authenticator.generateSecret()
    // const otpauth = authenticator.keyuri(userId, 'EMR-AI', secret)
    
    console.log('[MFA:TOTP] Would enroll user', userId)
    
    return {
      secret: 'DEMO_SECRET_NOT_REAL',
      qrCode: 'data:image/png;base64,demo',
    }
  }

  async unenrollUser(userId: string): Promise<void> {
    console.log('[MFA:TOTP] Would unenroll user', userId)
  }
}

// SMS MFA Provider
class SMSMFAProvider implements MFAProvider {
  name = 'sms'

  isEnabled(): boolean {
    return HIPAA_CONFIG.mfa.enabled
  }

  async generateChallenge(userId: string): Promise<MFAChallenge> {
    // PLUG POINT: Implement SMS sending (Twilio, AWS SNS, etc.)
    // import twilio from 'twilio'
    
    const code = Math.random().toString().slice(2, 8)
    console.log('[MFA:SMS] Would send code', code, 'to user', userId)
    
    return {
      challengeId: `sms-${Date.now()}`,
      method: 'sms',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      destination: '***-***-1234',
    }
  }

  async verifyChallenge(verification: MFAVerification): Promise<boolean> {
    // PLUG POINT: Verify SMS code from cache/database
    console.log('[MFA:SMS] Would verify SMS code', verification.challengeId)
    return verification.code.length === 6
  }

  async enrollUser(userId: string, _method: string): Promise<{ secret?: string }> {
    console.log('[MFA:SMS] Would register phone for user', userId)
    return {}
  }

  async unenrollUser(userId: string): Promise<void> {
    console.log('[MFA:SMS] Would remove phone for user', userId)
  }
}

// Duo Security Provider (Stub)
class DuoMFAProvider implements MFAProvider {
  name = 'duo'

  isEnabled(): boolean {
    return HIPAA_CONFIG.mfa.enabled && !!process.env.DUO_INTEGRATION_KEY
  }

  async generateChallenge(userId: string): Promise<MFAChallenge> {
    // PLUG POINT: Implement Duo Web SDK
    // import DuoWeb from 'duo_web'
    
    console.log('[MFA:DUO] Would initiate Duo push for', userId)
    
    return {
      challengeId: `duo-${Date.now()}`,
      method: 'push',
      expiresAt: new Date(Date.now() + 60 * 1000),
    }
  }

  async verifyChallenge(verification: MFAVerification): Promise<boolean> {
    // PLUG POINT: Verify Duo response
    console.log('[MFA:DUO] Would verify Duo response', verification.challengeId)
    return true
  }

  async enrollUser(userId: string): Promise<{ secret?: string }> {
    console.log('[MFA:DUO] Would enroll user in Duo', userId)
    return {}
  }

  async unenrollUser(userId: string): Promise<void> {
    console.log('[MFA:DUO] Would unenroll user from Duo', userId)
  }
}

// =============================================================================
// PROVIDER FACTORY
// =============================================================================

function createMFAProvider(): MFAProvider {
  if (!HIPAA_CONFIG.mfa.enabled) {
    return new NoMFAProvider()
  }

  switch (HIPAA_CONFIG.mfa.provider) {
    case 'totp':
      return new TOTPMFAProvider()
    case 'sms':
      return new SMSMFAProvider()
    case 'duo':
      return new DuoMFAProvider()
    case 'none':
    default:
      return new NoMFAProvider()
  }
}

// =============================================================================
// MFA SERVICE
// =============================================================================

class MFAService {
  private provider: MFAProvider

  constructor() {
    this.provider = createMFAProvider()
  }

  isEnabled(): boolean {
    return this.provider.isEnabled()
  }

  isRequiredForRole(role: string): boolean {
    return HIPAA_CONFIG.mfa.requiredForRoles.includes(role)
  }

  async generateChallenge(userId: string): Promise<MFAChallenge> {
    const challenge = await this.provider.generateChallenge(userId)
    
    await auditLog.log({
      action: 'SENSITIVE_ACTION',
      userId,
      resourceType: 'mfa',
      details: { action: 'challenge_generated', method: challenge.method },
      success: true,
    })

    return challenge
  }

  async verifyChallenge(userId: string, verification: MFAVerification): Promise<boolean> {
    const success = await this.provider.verifyChallenge(verification)
    
    await auditLog.log({
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      userId,
      resourceType: 'mfa',
      details: { action: 'challenge_verified', success },
      success,
    })

    return success
  }

  async enrollUser(userId: string, method: string): Promise<{ secret?: string; qrCode?: string }> {
    const result = await this.provider.enrollUser(userId, method)
    
    await auditLog.log({
      action: 'MFA_ENABLED',
      userId,
      resourceType: 'mfa',
      details: { method },
      success: true,
    })

    return result
  }

  async unenrollUser(userId: string): Promise<void> {
    await this.provider.unenrollUser(userId)
    
    await auditLog.log({
      action: 'MFA_DISABLED',
      userId,
      resourceType: 'mfa',
      success: true,
    })
  }

  getProviderName(): string {
    return this.provider.name
  }
}

// Export singleton instance
export const mfaService = new MFAService()

// Export for testing
export { MFAService, createMFAProvider }
