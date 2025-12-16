# EMR AI - System Architecture

## Overview

EMR AI is a modern, AI-powered Electronic Medical Records system built with Next.js 14, featuring clinical decision support, HIPAA-compliant telemedicine, and intelligent workflow automation.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Next.js 14 App                                 │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐   │
│  │    React Pages     │  │    API Routes      │  │   Components     │   │
│  │    /               │  │    /api/ai/*       │  │   shadcn/ui      │   │
│  │    /patients       │  │    /api/fhir/*     │  │   Beda EMR       │   │
│  │    /triage         │  │    /api/auth/*     │  │   Custom         │   │
│  │    /telemedicine   │  │    /api/audit      │  │                  │   │
│  │    /appointments   │  │                    │  │                  │   │
│  │    /admin/forms    │  │                    │  │                  │   │
│  └─────────┬──────────┘  └─────────┬──────────┘  └──────────────────┘   │
│            │                       │                                     │
│  ┌─────────▼───────────────────────▼─────────────┐                      │
│  │              React Query + Zustand            │                      │
│  │            (State Management & Caching)       │                      │
│  └─────────────────────┬─────────────────────────┘                      │
└────────────────────────┼────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬───────────────┐
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────────┐ ┌───────────┐ ┌───────────────┐ ┌───────────────┐
│   FHIR Client   │ │LLM Client │ │    Prisma     │ │  Jitsi Meet   │
│   (Aidbox)      │ │ (OpenAI)  │ │  (App Data)   │ │ (Telemedicine)│
└────────┬────────┘ └─────┬─────┘ └───────┬───────┘ └───────┬───────┘
         │                │               │                 │
         ▼                ▼               ▼                 ▼
┌─────────────────┐ ┌───────────┐ ┌───────────────┐ ┌───────────────┐
│    Aidbox       │ │  OpenAI   │ │  PostgreSQL   │ │  meet.jit.si  │
│   FHIR Server   │ │    API    │ │   (Docker)    │ │   (Public)    │
│ (Hosted/Local)  │ │           │ │               │ │               │
└─────────────────┘ └───────────┘ └───────────────┘ └───────────────┘
```

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Database ORM
- **NextAuth.js** - Authentication

### Data Layer
- **Aidbox** - FHIR R4 server (hosted or self-hosted)
- **PostgreSQL** - Application database
- **FHIR REST** - via pluggable adapter (Aidbox/other)

### AI Integration
- **OpenAI GPT-4** - Language model
- **Zod** - Schema validation for AI outputs

### Telemedicine
- **Jitsi Meet** - HIPAA-compliant video conferencing
- **@jitsi/react-sdk** - React integration

## Directory Structure

```
emr-ai/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Dashboard
│   │   ├── patients/           # Patient management
│   │   ├── triage/             # Morning triage
│   │   ├── telemedicine/       # Video visits
│   │   ├── appointments/       # Scheduling
│   │   ├── discharge-planning/ # Discharge management
│   │   ├── admin/              # Admin pages
│   │   │   ├── forms/          # Form builder
│   │   │   └── audit/          # Audit log
│   │   ├── api/                # API routes
│   │   │   ├── ai/             # AI endpoints
│   │   │   ├── auth/           # Authentication
│   │   │   └── audit/          # Audit logging
│   │   └── login/              # Authentication page
│   │
│   ├── components/
│   │   ├── ai/                 # AI-related components
│   │   │   ├── AISidebar.tsx
│   │   │   ├── BillingAssistPanel.tsx
│   │   │   └── DiagnosticSuggestions.tsx
│   │   ├── base/               # Beda EMR base components
│   │   │   ├── Calendar.tsx
│   │   │   ├── ResourceTable.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── RichTextEditor.tsx
│   │   │   └── AudioRecorder.tsx
│   │   ├── clinical/           # Clinical components
│   │   │   ├── ChartingPanel.tsx
│   │   │   ├── ClinicalNotes.tsx
│   │   │   ├── PrescriptionPanel.tsx
│   │   │   └── RealTimeVitals.tsx
│   │   ├── discharge/          # Discharge components
│   │   ├── forms/              # Form components
│   │   │   ├── QuestionnaireBuilder.tsx
│   │   │   ├── QuestionnaireRenderer.tsx
│   │   │   └── items/          # Form field types
│   │   ├── layout/             # Layout components
│   │   │   └── Sidebar.tsx
│   │   ├── telemedicine/       # Telemedicine components
│   │   │   ├── JitsiMeeting.tsx
│   │   │   └── TelemedicineAIAssistant.tsx
│   │   └── ui/                 # shadcn/ui components
│   │
│   ├── lib/
│   │   ├── fhir/               # FHIR client library
│   │   │   ├── client.ts
│   │   │   └── queries/
│   │   ├── llm/                # LLM integration
│   │   │   ├── client.ts
│   │   │   ├── prompts/
│   │   │   └── schemas/
│   │   ├── telemedicine/       # Telemedicine config
│   │   │   └── jitsi-config.ts
│   │   └── utils/              # Utility functions
│   │
│   └── types/                  # TypeScript types
│
├── scripts/
│   ├── seed-aidbox.ts          # Synthetic data seeding
│   ├── setup.sh                # One-command setup
│   └── demo.ts                 # Demo scenarios
│
├── docs/                       # Documentation
├── prisma/                     # Database schema
└── docker-compose.yml          # Docker services
```

## Data Flow

### Morning Triage Flow

```
1. User opens /triage
         │
         ▼
2. React Query fetches patient data
         │
         ▼
3. GET /api/ai/morning-triage
         │
         ├──► FHIR Client: getMorningSnapshot()
         │         │
         │         ├──► All inpatient Encounters
         │         ├──► Patient demographics
         │         ├──► Recent Observations (vitals, labs)
         │         ├──► Active Conditions
         │         └──► Pending DiagnosticReports
         │
         ├──► LLM Client: analyzePatients()
         │         │
         │         ├──► System prompt (triage criteria)
         │         ├──► Patient data (formatted)
         │         └──► Output schema (MorningTriageOutput)
         │
         ▼
4. Return prioritized patient list
         │
         ▼
5. UI renders risk badges, factors, quick wins
```

### Discharge Readiness Flow

```
1. User opens patient discharge tab
         │
         ▼
2. useDischargeReadiness hook
         │
         ▼
3. GET /api/ai/discharge-readiness/:encounterId
         │
         ├──► FHIR Client: getDischargeSnapshot()
         │         │
         │         ├──► Patient, Encounter
         │         ├──► Conditions, Observations
         │         ├──► MedicationRequests
         │         ├──► DiagnosticReports (pending)
         │         └──► Tasks (consults)
         │
         ├──► LLM Client: assessDischarge()
         │         │
         │         ├──► System prompt (discharge criteria)
         │         ├──► Clinical data
         │         └──► Output schema (DischargeReadinessOutput)
         │
         ▼
4. Return structured assessment
         │
         ▼
5. UI renders readiness badge, blocking factors, etc.
```

### Telemedicine Flow

```
1. Provider selects patient from queue
         │
         ▼
2. JitsiMeeting component initializes
         │
         ├──► Generate secure room name
         ├──► Generate meeting password
         └──► Configure HIPAA settings
         │
         ▼
3. Provider clicks "Start Video Call"
         │
         ├──► Load Jitsi External API
         ├──► Initialize with HIPAA config
         │         │
         │         ├──► E2E encryption enabled
         │         ├──► Recording disabled
         │         ├──► Lobby enabled
         │         └──► Password required
         │
         ▼
4. Video call active
         │
         ├──► AI Assistant provides:
         │         ├──► Patient summary
         │         ├──► Clinical suggestions
         │         └──► Visit note generation
         │
         ▼
5. Call ends → Audit log entry created
```

## Key Design Decisions

1. **Next.js App Router** - Single framework for frontend + API, with React Server Components for performance

2. **Aidbox for FHIR** - Flexible FHIR server with hosted/self-hosted options

3. **Zod Schemas** - Enforce LLM output structure and type safety

4. **React Query** - Efficient caching, background refetch, optimistic updates

5. **shadcn/ui** - Customizable, accessible components that own your code

6. **Jitsi for Telemedicine** - Open-source, HIPAA-compliant video with no vendor lock-in

7. **Beda EMR Components** - Battle-tested clinical UI components (Calendar, Forms, Tables)

## Security Considerations

- All PHI access is logged to audit trail
- Telemedicine uses E2E encryption
- No PHI in application logs
- Session management via NextAuth.js
- Role-based access control ready

See [compliance-notes.md](./compliance-notes.md) for full security documentation.
