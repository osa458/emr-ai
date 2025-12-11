# EMR AI - AI-Augmented Electronic Medical Records

A modern, AI-powered EMR system for clinical decision support, featuring diagnostic assistance, discharge planning, and morning triage prioritization.

## Features

- **Morning Triage Dashboard**: Prioritized patient list with risk scores and quick win suggestions
- **Discharge Planning**: Readiness assessment, blocking factors, follow-up scheduling
- **AI-Generated Instructions**: Patient-friendly discharge materials at 6th-8th grade reading level
- **Patient Charts**: Comprehensive view of conditions, vitals, labs, and medications

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui components |
| **State** | TanStack Query (React Query) |
| **FHIR Server** | Medplum (containerized) |
| **Database** | PostgreSQL (app data) |
| **AI** | OpenAI GPT-4 |
| **Container** | Docker Compose |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- OpenAI API key

### Setup

1. **Clone and enter the project:**
   ```bash
   cd emr-ai
   ```

2. **Run the setup script:**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Add your OpenAI API key to `.env.local`:**
   ```
   OPENAI_API_KEY=sk-your-api-key
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Open http://localhost:3000**

### Manual Setup

If you prefer manual setup:

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Start Docker services (FHIR server + databases)
docker-compose up -d

# Generate Prisma client
pnpm db:generate

# Seed synthetic patient data
pnpm seed

# Start dev server
pnpm dev
```

## Project Structure

```
emr-ai/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Dashboard
│   │   ├── patients/             # Patient list and charts
│   │   ├── triage/               # Morning triage dashboard
│   │   ├── discharge-planning/   # Discharge queue
│   │   └── api/                  # API routes
│   │       └── ai/               # AI endpoints
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   └── layout/               # Layout components
│   │
│   └── lib/
│       ├── fhir/                 # FHIR client and queries
│       ├── llm/                  # OpenAI client, prompts, schemas
│       └── utils.ts              # Utility functions
│
├── prisma/
│   └── schema.prisma             # App database schema
│
├── scripts/
│   ├── setup.sh                  # One-command setup
│   └── seed-fhir.ts              # Synthetic data seeding
│
└── docker-compose.yml            # Local development services
```

## Pages

### Dashboard (`/`)
Overview of system status with quick action links.

### Patients (`/patients`)
Searchable list of all active inpatients with status badges.

### Patient Chart (`/patients/[id]`)
Comprehensive patient view with:
- Active problems
- Latest vitals and labs
- Current medications
- Tabbed navigation

### Patient Discharge (`/patients/[id]/discharge`)
AI-powered discharge readiness assessment:
- Readiness level (Ready Today / Ready Soon / Not Ready)
- Blocking factors with resolution estimates
- Clinical status summary
- Follow-up appointment scheduler
- Pending tests tracker
- Safety checklist
- Discharge instructions generator

### Morning Triage (`/triage`)
AI-prioritized patient list for rounds:
- Risk levels with color coding
- Deterioration indicators
- Quick wins for each patient
- System alerts for critical values

### Discharge Planning (`/discharge-planning`)
Queue management for discharge coordination:
- Patients sorted by readiness
- Blocking factor counts
- Target discharge dates

## Development

```bash
# Start development server
pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint

# Reset database and reseed
docker-compose down -v
docker-compose up -d
pnpm seed
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MEDPLUM_BASE_URL` | FHIR server URL | Yes |
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `OPENAI_API_KEY` | OpenAI API key | For AI features |
| `NEXTAUTH_SECRET` | Auth secret | For production |

## Demo Mode

The application works without an OpenAI API key by returning mock AI responses. This is useful for UI development and demonstrations.

To enable real AI features, add your OpenAI API key to `.env.local`.

## Disclaimer

⚠️ **This is a demonstration project using synthetic data only.**

This application is NOT approved for use with real patient data or in clinical settings. See the compliance notes for production requirements:

- HIPAA-eligible cloud deployment
- Business Associate Agreements
- Proper authentication and audit logging
- Clinical validation of AI outputs

## License

MIT
