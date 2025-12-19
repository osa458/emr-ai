# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key (for AI features)

## Environment Variables

Set these in your deployment platform:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/emr_db"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OpenAI
OPENAI_API_KEY="sk-your-key"

# Optional: FHIR Server
AIDBOX_BASE_URL="https://your-aidbox-host"
AIDBOX_CLIENT_ID="your-client-id"
AIDBOX_CLIENT_SECRET="your-client-secret"

# Aidbox OAuth (Authorization Code)
# Used for end-user login via Aidbox (/auth/authorize -> /auth/token)
AIDBOX_OAUTH_CLIENT_ID="emr-webapp"
AIDBOX_OAUTH_CLIENT_SECRET="generate-a-strong-secret"

# Optional override. If omitted, the app assumes:
#   ${NEXTAUTH_URL}/api/auth/callback/aidbox
AIDBOX_OAUTH_REDIRECT_URI="https://your-domain.com/api/auth/callback/aidbox"

# Optional: seed an initial Aidbox user (used by scripts/aidbox:configure-oauth)
AIDBOX_SEED_USER_ID="exampleuser"
AIDBOX_SEED_USER_EMAIL="test@example.com"
AIDBOX_SEED_USER_PASSWORD="ChangeMe123!"
```

## Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel link
   ```

2. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables for Production/Preview/Development

3. **Deploy**
   ```bash
   vercel --prod
   ```

## Database Setup

1. **Generate Prisma Client**
   ```bash
   pnpm db:generate
   ```

2. **Run Migrations**
   ```bash
   pnpm db:migrate
   ```

3. **Push Schema (for new databases)**
   ```bash
   pnpm db:push
   ```

## Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
# Install Playwright browsers (first time)
npx playwright install

# Run tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui
```

## Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Open http://localhost:3300
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Physician | physician@demo.com | demo123 |
| Nurse | nurse@demo.com | demo123 |
| Case Manager | casemanager@demo.com | demo123 |
| Admin | admin@demo.com | demo123 |

## Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure database connection pooling
- [ ] Enable rate limiting on API routes
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure CORS if needed
- [ ] Review security headers
- [ ] Set up backup schedule for database
