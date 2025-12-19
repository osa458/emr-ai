import { Client } from '@aidbox/sdk-r4';

const AIDBOX_URL = process.env.AIDBOX_BASE_URL || process.env.NEXT_PUBLIC_AIDBOX_BASE_URL || '';
const CLIENT_ID = process.env.AIDBOX_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET || '';

export const aidbox = new Client(AIDBOX_URL, {
  auth: {
    method: 'basic',
    credentials: {
      username: CLIENT_ID,
      password: CLIENT_SECRET,
    },
  },
});

// Helper functions using the SDK

export async function getPatients(count: number = 100) {
  return aidbox.resource.list('Patient').count(count);
}

export async function getPatient(id: string) {
  return aidbox.resource.get('Patient', id);
}

export async function createPatient(data: Record<string, unknown>) {
  return aidbox.resource.create('Patient', data as any);
}

export async function updatePatient(id: string, data: Record<string, unknown>) {
  return aidbox.resource.update('Patient', id, data as any);
}

export async function deletePatient(id: string) {
  return aidbox.resource.delete('Patient', id);
}

// Encounter operations
export async function getEncounters(count: number = 100) {
  return aidbox.resource.list('Encounter').count(count);
}

export async function getEncounter(id: string) {
  return aidbox.resource.get('Encounter', id);
}

export async function getEncountersByPatient(patientId: string) {
  return aidbox.resource.list('Encounter').where('subject', `Patient/${patientId}`);
}

// Condition operations
export async function getConditions(count: number = 100) {
  return aidbox.resource.list('Condition').count(count);
}

export async function getConditionsByPatient(patientId: string) {
  return aidbox.resource.list('Condition').where('subject', `Patient/${patientId}`);
}

// Observation operations
export async function getObservations(count: number = 100) {
  return aidbox.resource.list('Observation').count(count);
}

export async function getObservationsByPatient(patientId: string) {
  return aidbox.resource.list('Observation').where('subject', `Patient/${patientId}`);
}

export async function getVitalsByPatient(patientId: string) {
  return aidbox.resource
    .list('Observation')
    .where('subject', `Patient/${patientId}`)
    .where('category', 'vital-signs');
}

export async function getLabsByPatient(patientId: string) {
  return aidbox.resource
    .list('Observation')
    .where('subject', `Patient/${patientId}`)
    .where('category', 'laboratory');
}

// MedicationRequest operations
export async function getMedicationRequests(count: number = 100) {
  return aidbox.resource.list('MedicationRequest').count(count);
}

export async function getMedicationRequestsByPatient(patientId: string) {
  return aidbox.resource.list('MedicationRequest').where('subject', `Patient/${patientId}`);
}

// DiagnosticReport operations
export async function getDiagnosticReports(count: number = 100) {
  return aidbox.resource.list('DiagnosticReport').count(count);
}

export async function getDiagnosticReportsByPatient(patientId: string) {
  return aidbox.resource.list('DiagnosticReport').where('subject', `Patient/${patientId}`);
}

// Appointment operations
export async function getAppointments(count: number = 100) {
  return aidbox.resource.list('Appointment').count(count);
}

export async function getAppointmentsByPatient(patientId: string) {
  return aidbox.resource.list('Appointment').where('actor', `Patient/${patientId}`);
}

// Practitioner operations
export async function getPractitioners(count: number = 100) {
  return aidbox.resource.list('Practitioner').count(count);
}

export async function getPractitioner(id: string) {
  return aidbox.resource.get('Practitioner', id);
}

// CarePlan operations
export async function getCarePlans(count: number = 100) {
  return aidbox.resource.list('CarePlan').count(count);
}

export async function getCarePlansByPatient(patientId: string) {
  return aidbox.resource.list('CarePlan').where('subject', `Patient/${patientId}`);
}

// Task operations
export async function getTasks(count: number = 100) {
  return aidbox.resource.list('Task').count(count);
}

export async function getTasksByPatient(patientId: string) {
  return aidbox.resource.list('Task').where('for', `Patient/${patientId}`);
}

// Generic resource operations
export async function getResource<T extends string>(resourceType: T, id: string) {
  return aidbox.resource.get(resourceType as any, id);
}

export async function listResources<T extends string>(resourceType: T, count: number = 100) {
  return aidbox.resource.list(resourceType as any).count(count);
}

export async function searchResources<T extends string>(
  resourceType: T,
  params: Record<string, string>
) {
  let query = aidbox.resource.list(resourceType as any);
  for (const [key, value] of Object.entries(params)) {
    query = query.where(key, value);
  }
  return query;
}
