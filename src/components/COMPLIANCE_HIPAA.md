# HIPAA Compliance Guide (Pluggable Demo)

This project includes a pluggable HIPAA module under `src/lib/hipaa/`. Use this guide to enable/disable compliance pieces while developing.

## Components
- `config.ts` — central settings (session, passwords, lockout, MFA, audit, encryption)
- `audit.ts` — audit logging providers: `console`, `database` (default), `cloudwatch`, `splunk`
- `encryption.ts` — encryption providers: `local`, `aws-kms`, `azure-keyvault`, `hashicorp-vault`
- `phi-middleware.ts` — PHI access tracking, minimum-necessary filtering, emergency access stub
- `auth-provider.ts` — MFA abstraction (totp/sms/duo stubs), password policy, lockout
- `data-handler.ts` — unified PHI handling: auto-encrypt, mask, and audit
- `index.ts` — exports + `initializeHIPAA` and `getComplianceStatus`

## Quick Env Setup (demo-safe defaults)
```env
NEXTAUTH_SECRET=<32+ chars>
HIPAA_ENCRYPTION_KEY=<64 hex chars>  # required for production
HIPAA_SESSION_TIMEOUT=900            # 15 min inactivity
HIPAA_AUDIT_PROVIDER=database        # console|database|cloudwatch|splunk
HIPAA_ENCRYPTION_PROVIDER=local      # local|aws-kms|azure-keyvault|hashicorp-vault
HIPAA_MFA_ENABLED=false              # set true when ready
HIPAA_MFA_PROVIDER=totp              # totp|sms|duo|okta
```

## How to Use
- **Initialize (optional):** call `initializeHIPAA()` at app start to validate config.
- **Track PHI:** wrap API handlers with `withPHITracking(handler)`.
- **Handle PHI Data:**
  - Storage: `dataHandler.prepareForStorage(payload, ctx)`
  - Read: `dataHandler.prepareForReading(payload, ctx)`
  - Display masking: `dataHandler.maskForDisplay(payload)`
- **Audit:** `auditLog.logPHIAccess(userId, patientId, 'PHI_VIEW', 'patient')`
- **Encryption:** `await encryption.encrypt(value)` / `await encryption.decrypt(obj)`
- **MFA:** `mfaService.generateChallenge(userId)` when `HIPAA_MFA_ENABLED=true`.

## Switching Providers (plugs)
- **Audit:** set `HIPAA_AUDIT_PROVIDER` to `console` for local, `database` for production.
- **Encryption:** set `HIPAA_ENCRYPTION_PROVIDER` to `aws-kms`/`azure-keyvault`/`hashicorp-vault` once keys are configured.
- **MFA:** set `HIPAA_MFA_ENABLED=true` and pick a provider (start with `totp`).

## Recommended Next Steps
1) Point `DATABASE_URL` to Postgres and run `pnpm db:generate && pnpm db:push`.
2) Swap in Prisma for in-memory API routes and wrap PHI routes with `withPHITracking`.
3) Add a dashboard badge using `getComplianceStatus()` to show current compliance posture.
4) When using real data, enable encryption + audit in env and set a strong `NEXTAUTH_SECRET`.
5) Add MFA before any real PHI (set `HIPAA_MFA_ENABLED=true`).

## Notes
- Demo users/passwords are not HIPAA-grade; replace before real PHI.
- Local encryption provider is for development only; use KMS/Vault in production.
- Audit retention defaults to 6 years (2190 days) per HIPAA.
