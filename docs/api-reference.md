# EMR AI - API Reference

## Overview

EMR AI exposes REST API endpoints for AI-powered clinical decision support, authentication, and audit logging.

## Base URL

```
Development: http://localhost:3300/api
Production: https://your-domain.com/api
```

## Authentication

All API endpoints (except `/api/auth/*`) require authentication via NextAuth.js session.

### Headers

```
Cookie: next-auth.session-token=<session_token>
```

---

## AI Endpoints

### POST /api/ai/diagnostic-assist

Analyze clinical text and suggest diagnoses with ICD-10 codes.

**Request Body:**
```json
{
  "selectedText": "Patient presents with acute chest pain radiating to left arm",
  "patientId": "patient-123",
  "encounterId": "encounter-456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "condition": "Acute coronary syndrome",
        "icd10Code": "I24.9",
        "confidence": "high",
        "rationale": "Classic presentation with chest pain radiating to arm",
        "supportingEvidence": [
          {
            "type": "vital",
            "description": "Elevated blood pressure 160/95"
          }
        ],
        "differentialConsiderations": ["GERD", "Musculoskeletal"],
        "suggestedWorkup": ["Troponin", "ECG", "Chest X-ray"]
      }
    ],
    "clinicalContext": "68yo male with cardiac risk factors",
    "limitations": ["No ECG data available"],
    "disclaimer": "Decision support only. Clinical judgment required."
  },
  "usage": {
    "inputTokens": 450,
    "outputTokens": 380
  },
  "latencyMs": 1250
}
```

---

### GET /api/ai/billing-assist/:encounterId

Get billing optimization suggestions for an encounter.

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestedCodes": [
      {
        "codeType": "ICD-10",
        "code": "I50.9",
        "description": "Heart failure, unspecified",
        "category": "principal_diagnosis",
        "evidence": [
          {
            "source": "Admission note",
            "quote": "CHF exacerbation"
          }
        ],
        "documentationTip": "Specify systolic vs diastolic for more specific coding"
      }
    ],
    "missingDocumentation": [
      {
        "codeAtRisk": "I50.23",
        "whatIsMissing": "Ejection fraction documentation",
        "suggestedAddition": "Document EF from recent echo"
      }
    ],
    "cmiImpact": {
      "currentEstimate": "1.2",
      "potentialWithSuggestions": "1.5",
      "explanation": "Capturing acute-on-chronic and comorbidities"
    },
    "complianceWarnings": [],
    "disclaimer": "All codes require physician attestation"
  }
}
```

---

### GET /api/ai/morning-triage

Get prioritized inpatient list for morning rounds.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| service | string | Filter by service (e.g., "medicine") |
| location | string | Filter by location |

**Response:**
```json
{
  "success": true,
  "data": {
    "generatedAt": "2024-01-15T06:30:00Z",
    "totalPatients": 24,
    "criticalCount": 3,
    "highRiskCount": 5,
    "patients": [
      {
        "patientId": "patient-123",
        "patientName": "John Smith",
        "location": "Room 412",
        "riskLevel": "critical",
        "riskScore": 92,
        "priorityRank": 1,
        "riskFactors": [
          {
            "factor": "Declining kidney function",
            "severity": "critical",
            "details": "Creatinine trending up: 1.8 → 2.4",
            "trend": "worsening"
          }
        ],
        "deteriorationRisk": {
          "level": "high",
          "indicators": ["Rising creatinine", "Oliguria"],
          "timeframe": "24-48 hours"
        },
        "quickWins": [
          {
            "action": "Hold nephrotoxic medications",
            "rationale": "AKI progression",
            "priority": "high",
            "timeToComplete": "5 min"
          }
        ],
        "keyUpdates": ["New AKI stage 2", "Nephrology consult pending"]
      }
    ],
    "systemAlerts": [
      {
        "type": "critical_lab",
        "message": "Critical potassium 6.2 for patient Smith",
        "patientId": "patient-123"
      }
    ],
    "disclaimer": "AI-generated prioritization. Verify with clinical assessment."
  }
}
```

---

### GET /api/ai/discharge-readiness/:encounterId

Assess discharge readiness for a patient encounter.

**Response:**
```json
{
  "success": true,
  "data": {
    "readinessLevel": "READY_SOON",
    "readinessScore": 72,
    "readinessReasons": [
      "Vitals stable for 24 hours",
      "Tolerating oral intake",
      "Pain controlled"
    ],
    "blockingFactors": [
      {
        "factor": "Pending echocardiogram",
        "category": "workup",
        "details": "Scheduled for this afternoon",
        "estimatedResolutionTime": "4-6 hours",
        "responsibleParty": "Cardiology"
      }
    ],
    "clinicalStatus": {
      "vitalsStable": true,
      "vitalsNotes": "Afebrile, BP controlled",
      "labsAcceptable": true,
      "labsNotes": "Creatinine stable at 1.2",
      "symptomsControlled": true,
      "symptomsNotes": "No dyspnea at rest",
      "oxygenRequirement": "Room air",
      "mobilityStatus": "Ambulatory with walker"
    },
    "followupNeeds": [
      {
        "specialty": "Cardiology",
        "timeframe": "within_1_week",
        "reason": "Post-MI follow-up",
        "mode": "in_person",
        "priority": "critical"
      }
    ],
    "pendingTests": [
      {
        "testName": "Echocardiogram",
        "orderedDate": "2024-01-14",
        "expectedResultDate": "2024-01-15",
        "criticalForDischarge": true
      }
    ],
    "safetyChecks": [
      {
        "item": "Medication reconciliation",
        "category": "medication",
        "completed": true
      },
      {
        "item": "Fall risk assessment",
        "category": "safety",
        "completed": true
      }
    ],
    "estimatedDischargeDate": "2024-01-16",
    "dischargeDisposition": "home_with_services",
    "disclaimer": "Assessment based on available data. Clinical judgment required."
  }
}
```

---

### POST /api/ai/discharge-materials/:encounterId

Generate patient discharge instructions.

**Request Body:**
```json
{
  "patientPreferences": {
    "language": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "patientInstructions": {
      "greeting": "Dear Mr. Smith,",
      "hospitalSummary": "You were in the hospital for 4 days because your heart was not pumping as well as it should...",
      "diagnosisExplanations": [...],
      "warningSigns": {
        "callClinic": ["Weight gain more than 3 pounds in 1 day"],
        "goToUrgentCare": ["Moderate swelling in legs"],
        "callOrGoToER": ["Chest pain", "Difficulty breathing"]
      }
    },
    "medicationSection": {
      "summary": "You will take 5 medications at home...",
      "medications": [...]
    },
    "followupPlan": {
      "summary": "You have 2 appointments scheduled...",
      "appointments": [...]
    },
    "readingLevel": "6th grade",
    "generatedAt": "2024-01-15T14:30:00Z"
  }
}
```

---

## Authentication Endpoints

### GET /api/auth/session

Get current user session.

**Response:**
```json
{
  "user": {
    "id": "user-123",
    "name": "Dr. Williams",
    "email": "williams@hospital.org",
    "role": "physician"
  },
  "expires": "2024-01-16T00:00:00Z"
}
```

### POST /api/auth/signin

Sign in with credentials.

### POST /api/auth/signout

Sign out and invalidate session.

---

## Audit Endpoints

### GET /api/audit

Get audit log entries.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | ISO date filter start |
| endDate | string | ISO date filter end |
| userId | string | Filter by user |
| action | string | Filter by action type |
| limit | number | Max results (default 100) |

**Response:**
```json
{
  "entries": [
    {
      "id": "audit-123",
      "timestamp": "2024-01-15T10:30:00Z",
      "userId": "user-456",
      "userName": "Dr. Williams",
      "action": "VIEW_PATIENT",
      "resourceType": "Patient",
      "resourceId": "patient-789",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "details": {}
    }
  ],
  "total": 1250,
  "page": 1,
  "pageSize": 100
}
```

### POST /api/audit

Create audit log entry.

**Request Body:**
```json
{
  "action": "AI_DIAGNOSTIC_ASSIST",
  "resourceType": "Encounter",
  "resourceId": "encounter-123",
  "details": {
    "promptType": "diagnostic",
    "latencyMs": 1250
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| FHIR_ERROR | 502 | FHIR server error |
| AI_ERROR | 503 | AI service unavailable |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| AI endpoints | 60 requests/minute |
| FHIR proxy | 300 requests/minute |
| Auth endpoints | 10 requests/minute |

---

## Webhooks (Future)

Planned webhook support for:
- Critical lab results
- Patient discharge
- Appointment reminders
