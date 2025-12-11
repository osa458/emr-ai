# EMR AI - FHIR Client Documentation

## Overview

EMR AI uses a FHIR R4 compliant data layer built on Medplum. This document describes the FHIR client architecture and usage patterns.

## Setup

### Prerequisites

- Docker and Docker Compose
- Medplum server running on `http://localhost:8103`

### Starting the FHIR Server

```bash
# Start all services including Medplum
docker-compose up -d

# Wait for Medplum to be ready
curl http://localhost:8103/healthcheck

# Seed synthetic data
pnpm seed
```

## Client Configuration

### Basic Client Setup

```typescript
// src/lib/fhir/client.ts
import { MedplumClient } from '@medplum/core';

const medplum = new MedplumClient({
  baseUrl: process.env.MEDPLUM_BASE_URL || 'http://localhost:8103',
});

export default medplum;
```

### Authentication

```typescript
// For server-side operations
await medplum.startLogin({
  email: process.env.MEDPLUM_ADMIN_EMAIL,
  password: process.env.MEDPLUM_ADMIN_PASSWORD,
});
```

## Resource Types Used

### Patient

```typescript
interface Patient {
  resourceType: 'Patient';
  id: string;
  name: HumanName[];
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  identifier: Identifier[];
}

// Fetch patient
const patient = await medplum.readResource('Patient', patientId);

// Search patients
const bundle = await medplum.search('Patient', {
  name: 'Smith',
  _count: 20,
});
```

### Encounter

```typescript
interface Encounter {
  resourceType: 'Encounter';
  id: string;
  status: 'in-progress' | 'finished' | 'cancelled';
  class: Coding;  // IMP = Inpatient
  subject: Reference<Patient>;
  period: Period;
  location: EncounterLocation[];
  reasonCode: CodeableConcept[];
}

// Get active encounters
const encounters = await medplum.search('Encounter', {
  status: 'in-progress',
  class: 'IMP',
  _include: 'Encounter:patient',
});
```

### Observation (Vitals & Labs)

```typescript
interface Observation {
  resourceType: 'Observation';
  id: string;
  status: 'final' | 'preliminary';
  category: CodeableConcept[];  // vital-signs | laboratory
  code: CodeableConcept;
  subject: Reference<Patient>;
  encounter?: Reference<Encounter>;
  effectiveDateTime: string;
  valueQuantity?: Quantity;
  valueString?: string;
  referenceRange?: ObservationReferenceRange[];
  interpretation?: CodeableConcept[];
}

// Get recent vitals
const vitals = await medplum.search('Observation', {
  patient: patientId,
  category: 'vital-signs',
  _sort: '-date',
  _count: 50,
});

// Get labs with reference ranges
const labs = await medplum.search('Observation', {
  patient: patientId,
  category: 'laboratory',
  _sort: '-date',
  _count: 100,
});
```

### Condition

```typescript
interface Condition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: CodeableConcept;
  code: CodeableConcept;
  subject: Reference<Patient>;
  encounter?: Reference<Encounter>;
  onsetDateTime?: string;
}

// Get active conditions
const conditions = await medplum.search('Condition', {
  patient: patientId,
  'clinical-status': 'active',
});
```

### MedicationRequest

```typescript
interface MedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'completed' | 'stopped';
  intent: 'order';
  medicationCodeableConcept: CodeableConcept;
  subject: Reference<Patient>;
  encounter?: Reference<Encounter>;
  dosageInstruction: Dosage[];
}

// Get active medications
const meds = await medplum.search('MedicationRequest', {
  patient: patientId,
  status: 'active',
});
```

### DiagnosticReport

```typescript
interface DiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  status: 'registered' | 'partial' | 'final';
  code: CodeableConcept;
  subject: Reference<Patient>;
  encounter?: Reference<Encounter>;
  issued?: string;
  result?: Reference<Observation>[];
}

// Get pending tests
const pendingTests = await medplum.search('DiagnosticReport', {
  patient: patientId,
  status: 'registered,partial',
});
```

### Task (Consults)

```typescript
interface Task {
  resourceType: 'Task';
  id: string;
  status: 'requested' | 'in-progress' | 'completed';
  code?: CodeableConcept;
  for: Reference<Patient>;
  encounter?: Reference<Encounter>;
  authoredOn?: string;
}

// Get open consults
const consults = await medplum.search('Task', {
  patient: patientId,
  status: 'requested,in-progress',
});
```

### Questionnaire & QuestionnaireResponse

```typescript
interface Questionnaire {
  resourceType: 'Questionnaire';
  id: string;
  status: 'draft' | 'active' | 'retired';
  title?: string;
  description?: string;
  item?: QuestionnaireItem[];
}

interface QuestionnaireResponse {
  resourceType: 'QuestionnaireResponse';
  questionnaire: string;
  status: 'in-progress' | 'completed';
  subject?: Reference<Patient>;
  item?: QuestionnaireResponseItem[];
}
```

## Query Helpers

### Morning Snapshot

```typescript
// src/lib/fhir/queries/morning-snapshot.ts

export async function getMorningSnapshot() {
  // Get all in-progress encounters
  const encounters = await medplum.search('Encounter', {
    status: 'in-progress',
    class: 'IMP',
    _include: 'Encounter:patient',
  });

  const patients = [];
  
  for (const entry of encounters.entry || []) {
    if (entry.resource?.resourceType === 'Encounter') {
      const encounter = entry.resource;
      const patientId = encounter.subject?.reference?.split('/')[1];
      
      // Fetch related data in parallel
      const [vitals, labs, conditions, meds] = await Promise.all([
        getRecentVitals(patientId),
        getRecentLabs(patientId),
        getActiveConditions(patientId),
        getActiveMedications(patientId),
      ]);
      
      patients.push({
        patient: getPatientFromBundle(encounters, patientId),
        encounter,
        vitals,
        labs,
        conditions,
        medications: meds,
      });
    }
  }
  
  return patients;
}
```

### Discharge Snapshot

```typescript
// src/lib/fhir/queries/discharge-snapshot.ts

export async function getDischargeSnapshot(encounterId: string) {
  const encounter = await medplum.readResource('Encounter', encounterId);
  const patientId = encounter.subject?.reference?.split('/')[1];
  
  const [
    patient,
    conditions,
    vitals,
    labs,
    medications,
    pendingTests,
    consults,
  ] = await Promise.all([
    medplum.readResource('Patient', patientId),
    getActiveConditions(patientId),
    getRecentVitals(patientId),
    getRecentLabs(patientId),
    getActiveMedications(patientId),
    getPendingTests(patientId),
    getOpenConsults(patientId),
  ]);
  
  return {
    patient,
    encounter,
    conditions,
    vitals,
    labs,
    medications,
    pendingTests,
    consults,
  };
}
```

### Pending Tests

```typescript
// src/lib/fhir/queries/pending-tests.ts

export async function getPendingTests(patientId: string) {
  const bundle = await medplum.search('DiagnosticReport', {
    patient: patientId,
    status: 'registered,partial,preliminary',
    _sort: '-date',
  });
  
  return (bundle.entry || [])
    .map(e => e.resource as DiagnosticReport)
    .map(report => ({
      id: report.id,
      name: report.code?.text || report.code?.coding?.[0]?.display,
      status: report.status,
      orderedDate: report.issued,
    }));
}
```

## FHIR Server Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /fhir/R4/Patient` | Search patients |
| `GET /fhir/R4/Patient/:id` | Get patient by ID |
| `GET /fhir/R4/Encounter` | Search encounters |
| `GET /fhir/R4/Observation` | Search observations (vitals/labs) |
| `GET /fhir/R4/Condition` | Search conditions |
| `GET /fhir/R4/MedicationRequest` | Search medications |
| `GET /fhir/R4/DiagnosticReport` | Search diagnostic reports |
| `GET /fhir/R4/Task` | Search tasks (consults) |
| `GET /fhir/R4/Questionnaire` | Search questionnaires |
| `POST /fhir/R4/:resourceType` | Create resource |
| `PUT /fhir/R4/:resourceType/:id` | Update resource |

## Error Handling

```typescript
try {
  const patient = await medplum.readResource('Patient', patientId);
} catch (error) {
  if (error.outcome?.issue?.[0]?.code === 'not-found') {
    // Patient not found
  } else if (error.outcome?.issue?.[0]?.code === 'forbidden') {
    // Access denied
  } else {
    // Other error
    console.error('FHIR error:', error);
  }
}
```

## Best Practices

1. **Use `_include`** - Reduce round trips by including related resources
2. **Paginate** - Use `_count` and pagination for large result sets
3. **Cache** - Use React Query for client-side caching
4. **Batch** - Use `Promise.all` for parallel requests
5. **Index** - Ensure search parameters are indexed in Medplum

## Resources

- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [Medplum Documentation](https://www.medplum.com/docs)
- [@medplum/core API](https://www.medplum.com/docs/api/core)
