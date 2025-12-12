/**
 * HIPAA Encryption Service
 * 
 * PLUG POINT: Switch encryption providers by changing HIPAA_ENCRYPTION_PROVIDER env var
 * Supported: 'local', 'aws-kms', 'azure-keyvault', 'hashicorp-vault'
 * 
 * To add a new provider:
 * 1. Create a class implementing EncryptionProvider interface
 * 2. Add it to the providerFactory
 */

import crypto from 'crypto'
import { HIPAA_CONFIG } from './config'

// =============================================================================
// TYPES
// =============================================================================

export interface EncryptedData {
  ciphertext: string
  iv: string
  tag?: string
  keyId?: string
  algorithm: string
  version: number
}

export interface EncryptionProvider {
  name: string
  encrypt(plaintext: string): Promise<EncryptedData>
  decrypt(encrypted: EncryptedData): Promise<string>
  rotateKey(): Promise<void>
  getKeyInfo(): Promise<{ keyId: string; createdAt: Date; expiresAt?: Date }>
}

// =============================================================================
// LOCAL ENCRYPTION PROVIDER (Development/Simple Production)
// =============================================================================

class LocalEncryptionProvider implements EncryptionProvider {
  name = 'local'
  private algorithm = 'aes-256-gcm'
  private keyVersion = 1

  private getKey(): Buffer {
    const key = process.env.HIPAA_ENCRYPTION_KEY
    if (!key) {
      // Generate a development key (NOT FOR PRODUCTION)
      if (process.env.NODE_ENV === 'production') {
        throw new Error('HIPAA_ENCRYPTION_KEY must be set in production')
      }
      console.warn('[ENCRYPTION] Using development key - NOT FOR PRODUCTION')
      return crypto.scryptSync('dev-key-not-for-production', 'salt', 32)
    }
    return Buffer.from(key, 'hex')
  }

  async encrypt(plaintext: string): Promise<EncryptedData> {
    const iv = crypto.randomBytes(16)
    const key = this.getKey()
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
    ciphertext += cipher.final('hex')
    
    const tag = cipher.getAuthTag()

    return {
      ciphertext,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: this.algorithm,
      version: this.keyVersion,
    }
  }

  async decrypt(encrypted: EncryptedData): Promise<string> {
    const key = this.getKey()
    const iv = Buffer.from(encrypted.iv, 'hex')
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM
    
    if (encrypted.tag) {
      decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'))
    }
    
    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8')
    plaintext += decipher.final('utf8')
    
    return plaintext
  }

  async rotateKey(): Promise<void> {
    // PLUG POINT: Implement key rotation strategy
    console.warn('[ENCRYPTION] Local provider key rotation not implemented')
    console.warn('[ENCRYPTION] For production, use AWS KMS or similar')
  }

  async getKeyInfo(): Promise<{ keyId: string; createdAt: Date; expiresAt?: Date }> {
    return {
      keyId: 'local-key-v' + this.keyVersion,
      createdAt: new Date(),
    }
  }
}

// =============================================================================
// AWS KMS PROVIDER (Production - Stub)
// =============================================================================

class AWSKMSEncryptionProvider implements EncryptionProvider {
  name = 'aws-kms'

  async encrypt(plaintext: string): Promise<EncryptedData> {
    // PLUG POINT: Implement AWS KMS encryption
    // import { KMSClient, EncryptCommand } from '@aws-sdk/client-kms'
    // const client = new KMSClient({ region: process.env.AWS_REGION })
    // const command = new EncryptCommand({
    //   KeyId: process.env.AWS_KMS_KEY_ID,
    //   Plaintext: Buffer.from(plaintext),
    // })
    
    console.warn('[ENCRYPTION:KMS] AWS KMS not implemented, falling back to local')
    const localProvider = new LocalEncryptionProvider()
    return localProvider.encrypt(plaintext)
  }

  async decrypt(encrypted: EncryptedData): Promise<string> {
    // PLUG POINT: Implement AWS KMS decryption
    console.warn('[ENCRYPTION:KMS] AWS KMS not implemented, falling back to local')
    const localProvider = new LocalEncryptionProvider()
    return localProvider.decrypt(encrypted)
  }

  async rotateKey(): Promise<void> {
    // AWS KMS handles key rotation automatically when enabled
    console.log('[ENCRYPTION:KMS] Key rotation managed by AWS KMS')
  }

  async getKeyInfo(): Promise<{ keyId: string; createdAt: Date; expiresAt?: Date }> {
    return {
      keyId: process.env.AWS_KMS_KEY_ID || 'not-configured',
      createdAt: new Date(),
    }
  }
}

// =============================================================================
// AZURE KEY VAULT PROVIDER (Production - Stub)
// =============================================================================

class AzureKeyVaultEncryptionProvider implements EncryptionProvider {
  name = 'azure-keyvault'

  async encrypt(plaintext: string): Promise<EncryptedData> {
    // PLUG POINT: Implement Azure Key Vault encryption
    // import { SecretClient } from '@azure/keyvault-secrets'
    // import { CryptographyClient } from '@azure/keyvault-keys'
    
    console.warn('[ENCRYPTION:AZURE] Azure Key Vault not implemented, falling back to local')
    const localProvider = new LocalEncryptionProvider()
    return localProvider.encrypt(plaintext)
  }

  async decrypt(encrypted: EncryptedData): Promise<string> {
    console.warn('[ENCRYPTION:AZURE] Azure Key Vault not implemented, falling back to local')
    const localProvider = new LocalEncryptionProvider()
    return localProvider.decrypt(encrypted)
  }

  async rotateKey(): Promise<void> {
    console.log('[ENCRYPTION:AZURE] Key rotation managed by Azure Key Vault')
  }

  async getKeyInfo(): Promise<{ keyId: string; createdAt: Date; expiresAt?: Date }> {
    return {
      keyId: process.env.AZURE_KEY_VAULT_KEY_NAME || 'not-configured',
      createdAt: new Date(),
    }
  }
}

// =============================================================================
// HASHICORP VAULT PROVIDER (Production - Stub)
// =============================================================================

class HashiCorpVaultEncryptionProvider implements EncryptionProvider {
  name = 'hashicorp-vault'

  async encrypt(plaintext: string): Promise<EncryptedData> {
    // PLUG POINT: Implement HashiCorp Vault Transit encryption
    // import vault from 'node-vault'
    
    console.warn('[ENCRYPTION:VAULT] HashiCorp Vault not implemented, falling back to local')
    const localProvider = new LocalEncryptionProvider()
    return localProvider.encrypt(plaintext)
  }

  async decrypt(encrypted: EncryptedData): Promise<string> {
    console.warn('[ENCRYPTION:VAULT] HashiCorp Vault not implemented, falling back to local')
    const localProvider = new LocalEncryptionProvider()
    return localProvider.decrypt(encrypted)
  }

  async rotateKey(): Promise<void> {
    console.log('[ENCRYPTION:VAULT] Key rotation managed by HashiCorp Vault')
  }

  async getKeyInfo(): Promise<{ keyId: string; createdAt: Date; expiresAt?: Date }> {
    return {
      keyId: process.env.VAULT_KEY_NAME || 'not-configured',
      createdAt: new Date(),
    }
  }
}

// =============================================================================
// PROVIDER FACTORY
// =============================================================================

function createEncryptionProvider(): EncryptionProvider {
  const providerName = HIPAA_CONFIG.encryption.provider

  switch (providerName) {
    case 'local':
      return new LocalEncryptionProvider()
    case 'aws-kms':
      return new AWSKMSEncryptionProvider()
    case 'azure-keyvault':
      return new AzureKeyVaultEncryptionProvider()
    case 'hashicorp-vault':
      return new HashiCorpVaultEncryptionProvider()
    default:
      console.warn(`[ENCRYPTION] Unknown provider "${providerName}", using local`)
      return new LocalEncryptionProvider()
  }
}

// =============================================================================
// ENCRYPTION SERVICE
// =============================================================================

class EncryptionService {
  private provider: EncryptionProvider
  private enabled: boolean

  constructor() {
    this.enabled = HIPAA_CONFIG.encryption.enabled
    this.provider = createEncryptionProvider()
  }

  async encrypt(plaintext: string): Promise<EncryptedData | string> {
    if (!this.enabled) return plaintext
    return this.provider.encrypt(plaintext)
  }

  async decrypt(data: EncryptedData | string): Promise<string> {
    if (!this.enabled || typeof data === 'string') return data as string
    return this.provider.decrypt(data)
  }

  // Encrypt specific PHI fields in an object
  async encryptPHI(
    data: Record<string, unknown>,
    fieldsToEncrypt?: string[]
  ): Promise<Record<string, unknown>> {
    if (!this.enabled) return data

    const phiFields = fieldsToEncrypt || HIPAA_CONFIG.data.phiFields
    const result: Record<string, unknown> = { ...data }

    for (const field of phiFields) {
      if (field in result && result[field] && typeof result[field] === 'string') {
        result[field] = await this.encrypt(result[field] as string)
      }
    }

    return result
  }

  // Decrypt specific PHI fields in an object
  async decryptPHI(
    data: Record<string, unknown>,
    fieldsToDecrypt?: string[]
  ): Promise<Record<string, unknown>> {
    if (!this.enabled) return data

    const phiFields = fieldsToDecrypt || HIPAA_CONFIG.data.phiFields
    const result: Record<string, unknown> = { ...data }

    for (const field of phiFields) {
      if (field in result && result[field] && typeof result[field] === 'object') {
        const encrypted = result[field] as EncryptedData
        if (encrypted.ciphertext && encrypted.iv) {
          result[field] = await this.decrypt(encrypted)
        }
      }
    }

    return result
  }

  async rotateKey(): Promise<void> {
    return this.provider.rotateKey()
  }

  async getKeyInfo() {
    return this.provider.getKeyInfo()
  }

  getProviderName(): string {
    return this.provider.name
  }

  isEnabled(): boolean {
    return this.enabled
  }
}

// Export singleton instance
export const encryption = new EncryptionService()

// Export for testing
export { EncryptionService, createEncryptionProvider }

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Hash sensitive data for logging (one-way)
export function hashForAudit(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16)
}

// Mask PHI for display
export function maskPHI(value: string, showLast = 4): string {
  if (!value || value.length <= showLast) return '****'
  return '*'.repeat(value.length - showLast) + value.slice(-showLast)
}

// Mask SSN
export function maskSSN(ssn: string): string {
  return `***-**-${ssn.slice(-4)}`
}

// Mask phone number
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `(***) ***-${digits.slice(-4)}`
}

// Mask email
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '****@****'
  return `${local.charAt(0)}***@${domain}`
}
