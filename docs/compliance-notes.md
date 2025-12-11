# EMR AI - Compliance & Security Notes

## ⚠️ Development Only Disclaimer

**This repository is configured for LOCAL DEVELOPMENT with SYNTHETIC DATA only.**

This is a **demonstration project** and is NOT approved for:
- Use with real patient data
- Clinical settings
- Production deployment
- HIPAA-covered environments

---

## Requirements for Production Use

The following are REQUIRED before any production deployment:

### 1. Infrastructure Security

- [ ] Deploy to HIPAA-eligible cloud (AWS, Azure, GCP)
- [ ] Enable encryption at rest for all data stores
- [ ] Enable encryption in transit (TLS 1.2+)
- [ ] Configure private networking (VPC)
- [ ] Set up WAF and DDoS protection
- [ ] Implement proper secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Enable audit logging at infrastructure level
- [ ] Configure automated backups with encryption
- [ ] Implement disaster recovery plan

### 2. Legal & Compliance

- [ ] Sign Business Associate Agreement (BAA) with cloud provider
- [ ] Sign BAA with LLM provider (recommend Azure OpenAI for HIPAA)
- [ ] Complete HIPAA Security Risk Assessment
- [ ] Develop and document Incident Response Plan
- [ ] Establish audit logging and retention policies (minimum 6 years)
- [ ] Create Privacy Impact Assessment
- [ ] Implement breach notification procedures
- [ ] Document data flow and PHI locations

### 3. Authentication & Authorization

- [ ] Implement enterprise SSO (Auth0, Azure AD, Okta)
- [ ] Enable multi-factor authentication (MFA)
- [ ] Role-based access control (RBAC) per user
- [ ] Session timeout (15-30 minutes inactive)
- [ ] Audit logging of all authentication events
- [ ] Password complexity requirements
- [ ] Account lockout after failed attempts

### 4. Application Security

- [ ] Remove all demo/synthetic data
- [ ] Disable development features
- [ ] Enable Content Security Policy (CSP)
- [ ] Implement rate limiting
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Security headers (HSTS, X-Frame-Options, etc.)

### 5. AI-Specific Requirements

- [ ] Clinical validation of AI outputs by medical professionals
- [ ] Bias testing and monitoring across demographics
- [ ] Human-in-the-loop for ALL suggestions (no auto-apply)
- [ ] Clear disclaimers on all AI outputs
- [ ] No auto-writing to patient records
- [ ] AI decision audit trail
- [ ] Model versioning and change control
- [ ] Regular accuracy monitoring

---

## Current Security Implementation

### What IS Implemented (Development)

| Feature | Status | Notes |
|---------|--------|-------|
| NextAuth.js session management | ✅ | Development mode |
| HTTPS in development | ⚠️ | HTTP only in dev |
| Basic role-based access | ✅ | Simulated |
| AI disclaimers | ✅ | On all outputs |
| Audit logging (basic) | ✅ | Console + DB |
| PHI redaction in logs | ✅ | Implemented |
| Telemedicine E2E encryption | ✅ | Via Jitsi |
| Telemedicine recording disabled | ✅ | Config enforced |

### What is NOT Implemented (Required for Production)

| Feature | Status | Notes |
|---------|--------|-------|
| Enterprise SSO | ❌ | Requires Auth0/Azure AD |
| MFA | ❌ | Required for production |
| Encryption at rest | ❌ | Requires cloud config |
| BAA with providers | ❌ | Legal requirement |
| Penetration testing | ❌ | Required before launch |
| Security audit | ❌ | Required before launch |

---

## Data Boundaries

| Data Type | Storage Location | Contains PHI? | Encryption |
|-----------|------------------|---------------|------------|
| Clinical data | Medplum FHIR | YES (synthetic in dev) | At rest (prod) |
| User sessions | PostgreSQL | NO | At rest (prod) |
| Audit logs | PostgreSQL | NO (redacted) | At rest (prod) |
| AI prompts | Memory only | YES (transient) | In transit |
| AI responses | Memory only | YES (transient) | In transit |
| Application logs | Console/CloudWatch | NO (redacted) | At rest (prod) |

---

## PHI Redaction

All logging uses PHI redaction. The redaction utility strips:

- Patient names
- Medical record numbers (MRN)
- Dates of birth
- Social Security numbers
- Addresses
- Phone numbers
- Email addresses
- IP addresses (partially)

### Implementation

```typescript
// src/lib/utils/phi-redaction.ts

export function redactPHI(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/\b\d{10}\b/g, '[PHONE]')
    .replace(/MRN[:\s]*\w+/gi, '[MRN]')
    .replace(/DOB[:\s]*[\d\/\-]+/gi, '[DOB]')
    // ... additional patterns
}
```

---

## Audit Logging

### Events Logged

| Event | Data Captured | PHI Included |
|-------|---------------|--------------|
| User login | User ID, timestamp, IP | No |
| User logout | User ID, timestamp | No |
| Patient view | User ID, Patient ID, timestamp | ID only |
| AI request | User ID, request type, latency | No |
| Data export | User ID, export type, count | No |
| Error | Error type, stack trace (redacted) | No |

### Audit Log Schema

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;  // No PHI
}
```

### Retention

- Development: 30 days
- Production: Minimum 6 years (HIPAA requirement)

---

## Telemedicine Security

### Jitsi Configuration (HIPAA-Compliant)

```typescript
const hipaaConfig = {
  domain: 'meet.jit.si',
  enableLobby: true,           // Waiting room
  enableE2EE: true,            // End-to-end encryption
  disableRecording: true,      // No cloud recording
  disableLocalRecording: true, // No local recording
  requirePassword: true,       // Password protected rooms
  disableChat: false,          // Chat allowed (no file sharing)
  disableFileSharing: true,    // No file uploads
}
```

### Room Security

- Secure random room names (UUID-based)
- Cryptographically random passwords
- Moderator must admit participants (lobby)
- Sessions logged to audit trail

---

## AI Safety Guardrails

### Input Validation

- Maximum input length: 10,000 characters
- No executable code in prompts
- Rate limiting per user
- Content filtering for inappropriate requests

### Output Validation

- Zod schema validation on all AI responses
- Confidence thresholds for suggestions
- Mandatory disclaimers
- No direct database writes from AI

### Human-in-the-Loop

All AI suggestions require explicit human action:
- Diagnoses must be reviewed and approved
- Codes must be physician-attested
- Discharge instructions require review
- No auto-population of medical records

---

## Incident Response

### Development Environment

For security issues in development:
1. Document the issue
2. Fix in code
3. No breach notification required (synthetic data)

### Production Environment (Future)

Required procedures:
1. Detection and initial assessment (< 1 hour)
2. Containment (< 4 hours)
3. Investigation and evidence preservation
4. Notification to affected parties (within 60 days per HIPAA)
5. Remediation
6. Post-incident review

---

## Vendor Compliance

### Current Vendors (Development)

| Vendor | Service | BAA Available | HIPAA Eligible |
|--------|---------|---------------|----------------|
| Medplum | FHIR Server | N/A (self-hosted) | Yes (config) |
| OpenAI | LLM API | Limited | No* |
| Jitsi | Video | Yes | Yes |
| Vercel | Hosting | Yes | Yes |

*For production, use Azure OpenAI Service which offers BAA.

### Recommended Production Stack

| Service | Provider | Notes |
|---------|----------|-------|
| Cloud | AWS/Azure/GCP | With BAA |
| LLM | Azure OpenAI | With BAA |
| FHIR | Medplum Cloud or self-hosted | With BAA |
| Video | Jitsi self-hosted | HIPAA compliant |
| Auth | Auth0/Azure AD | With BAA |

---

## Checklist Before Production

### Security Review

- [ ] Code security audit by third party
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Dependency audit (npm audit)
- [ ] OWASP Top 10 review

### Compliance Review

- [ ] HIPAA Security Risk Assessment
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] BAAs signed with all vendors
- [ ] Employee training documented

### Technical Review

- [ ] Load testing completed
- [ ] Disaster recovery tested
- [ ] Backup restoration tested
- [ ] Monitoring and alerting configured
- [ ] Runbooks documented

---

## Contact

For security concerns or questions about compliance:
- Security: security@your-organization.com
- Privacy: privacy@your-organization.com
- Compliance: compliance@your-organization.com
