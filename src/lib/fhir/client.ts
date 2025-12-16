import type {
  Patient,
  Encounter,
  Condition,
  Observation,
  Procedure,
  DiagnosticReport,
  MedicationRequest,
  MedicationStatement,
  MedicationAdministration,
  Appointment,
  Task,
  CarePlan,
  DocumentReference,
  Coverage,
  Organization,
  Bundle,
} from '@medplum/fhirtypes'
import type { FhirClientConfig, FhirBundle, FhirResource } from './types'

export class FhirClient {
  private baseUrl: string
  private accessToken: string | null = null

  constructor(config: FhirClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    if (config.accessToken) {
      this.accessToken = config.accessToken
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  private async request<T = FhirResource>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json',
      ...(options.headers as Record<string, string>),
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`FHIR request failed: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Generic CRUD operations
  async read<T = FhirResource>(resourceType: string, id: string): Promise<T> {
    return this.request<T>(`/${resourceType}/${id}`)
  }

  async search<T = FhirResource>(
    resourceType: string,
    params: Record<string, string | string[]> = {}
  ): Promise<FhirBundle<T>> {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v))
      } else {
        searchParams.append(key, value)
      }
    })

    const queryString = searchParams.toString()
    const path = queryString
      ? `/${resourceType}?${queryString}`
      : `/${resourceType}`

    return this.request(path)
  }

  async create<T = FhirResource>(
    resourceType: string,
    resource: Partial<T>
  ): Promise<T> {
    return this.request<T>(`/${resourceType}`, {
      method: 'POST',
      body: JSON.stringify(resource),
    })
  }

  async update<T = FhirResource>(
    resourceType: string,
    id: string,
    resource: T
  ): Promise<T> {
    return this.request<T>(`/${resourceType}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resource),
    })
  }

  // Resource-specific methods
  async getPatient(id: string): Promise<Patient> {
    return this.read<Patient>('Patient', id)
  }

  async searchPatients(params: {
    name?: string
    identifier?: string
    _count?: number
  } = {}): Promise<Patient[]> {
    const searchParams: Record<string, string> = {}
    if (params.name) searchParams.name = params.name
    if (params.identifier) searchParams.identifier = params.identifier
    if (params._count) searchParams._count = params._count.toString()

    const bundle = await this.search<Patient>('Patient', searchParams)
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getActiveInpatients(): Promise<Patient[]> {
    const bundle = await this.search<Encounter>('Encounter', {
      status: 'in-progress',
      class: 'IMP',
      _include: 'Encounter:patient',
    })

    const patients: Patient[] = []
    bundle.entry?.forEach((entry) => {
      const resource = entry.resource as unknown as FhirResource
      if (resource?.resourceType === 'Patient') {
        patients.push(resource as unknown as Patient)
      }
    })

    return patients
  }

  async getEncounter(id: string): Promise<Encounter> {
    return this.read<Encounter>('Encounter', id)
  }

  async getPatientEncounters(patientId: string): Promise<Encounter[]> {
    const bundle = await this.search<Encounter>('Encounter', {
      patient: patientId,
      _sort: '-date',
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getActiveEncounter(patientId: string): Promise<Encounter | null> {
    const bundle = await this.search<Encounter>('Encounter', {
      patient: patientId,
      status: 'in-progress',
      _sort: '-date',
      _count: '1',
    })
    return bundle.entry?.[0]?.resource || null
  }

  async getConditions(patientId: string): Promise<Condition[]> {
    const bundle = await this.search<Condition>('Condition', {
      patient: patientId,
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getEncounterConditions(encounterId: string): Promise<Condition[]> {
    const bundle = await this.search<Condition>('Condition', {
      encounter: encounterId,
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getObservations(
    patientId: string,
    category?: string,
    count = 100
  ): Promise<Observation[]> {
    const params: Record<string, string> = {
      patient: patientId,
      _sort: '-date',
      _count: count.toString(),
    }
    if (category) params.category = category

    const bundle = await this.search<Observation>('Observation', params)
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getVitals(patientId: string, count = 50): Promise<Observation[]> {
    return this.getObservations(patientId, 'vital-signs', count)
  }

  async getLabs(patientId: string, count = 100): Promise<Observation[]> {
    return this.getObservations(patientId, 'laboratory', count)
  }

  async getMedicationRequests(patientId: string): Promise<MedicationRequest[]> {
    const bundle = await this.search<MedicationRequest>('MedicationRequest', {
      patient: patientId,
      status: 'active',
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getEncounterMedications(encounterId: string): Promise<MedicationRequest[]> {
    const bundle = await this.search<MedicationRequest>('MedicationRequest', {
      encounter: encounterId,
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getProcedures(patientId: string): Promise<Procedure[]> {
    const bundle = await this.search<Procedure>('Procedure', {
      patient: patientId,
      _sort: '-date',
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getDiagnosticReports(patientId: string): Promise<DiagnosticReport[]> {
    const bundle = await this.search<DiagnosticReport>('DiagnosticReport', {
      patient: patientId,
      _sort: '-date',
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getPendingTests(encounterId: string): Promise<DiagnosticReport[]> {
    const bundle = await this.search<DiagnosticReport>('DiagnosticReport', {
      encounter: encounterId,
      status: 'registered,preliminary',
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getTasks(encounterId: string): Promise<Task[]> {
    const bundle = await this.search<Task>('Task', {
      encounter: encounterId,
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getCarePlans(patientId: string): Promise<CarePlan[]> {
    const bundle = await this.search<CarePlan>('CarePlan', {
      patient: patientId,
      status: 'active',
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async getAppointments(patientId: string): Promise<Appointment[]> {
    const bundle = await this.search<Appointment>('Appointment', {
      patient: patientId,
      status: 'proposed,pending,booked',
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    return this.create<Appointment>('Appointment', appointment)
  }

  async getDocumentReferences(patientId: string, count = 20): Promise<DocumentReference[]> {
    const bundle = await this.search<DocumentReference>('DocumentReference', {
      patient: patientId,
      _sort: '-date',
      _count: count.toString(),
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  // Home Medications (MedicationStatement with category=community)
  async getHomeMedications(patientId: string): Promise<MedicationStatement[]> {
    const bundle = await this.search<MedicationStatement>('MedicationStatement', {
      patient: patientId,
      status: 'active',
    })
    // Filter for community/home medications
    const meds = bundle.entry?.map((e) => e.resource) || []
    return meds.filter((m) => 
      m.category?.coding?.some((c) => c.code === 'community')
    )
  }

  // Imaging studies (DiagnosticReport with category=RAD)
  async getImagingStudies(patientId: string, count = 50): Promise<DiagnosticReport[]> {
    const bundle = await this.search<DiagnosticReport>('DiagnosticReport', {
      patient: patientId,
      category: 'RAD',
      _sort: '-date',
      _count: count.toString(),
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  // Insurance Coverage
  async getCoverage(patientId: string): Promise<Coverage[]> {
    const bundle = await this.search<Coverage>('Coverage', {
      beneficiary: patientId,
      status: 'active',
    })
    return bundle.entry?.map((e) => e.resource) || []
  }

  // Pharmacies
  async getPharmacies(): Promise<Organization[]> {
    const bundle = await this.search<Organization>('Organization', {
      type: 'prov',
    })
    // Filter for pharmacies
    const orgs = bundle.entry?.map((e) => e.resource) || []
    return orgs.filter((o) =>
      o.type?.some((t) => t.text === 'Pharmacy')
    )
  }

  // Get organization by ID
  async getOrganization(id: string): Promise<Organization> {
    return this.read<Organization>('Organization', id)
  }
}

// Singleton instance
let fhirClient: FhirClient | null = null

export function getFhirClient(): FhirClient {
  if (!fhirClient) {
    fhirClient = new FhirClient({
      baseUrl: process.env.AIDBOX_BASE_URL || process.env.MEDPLUM_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app',
    })
  }
  return fhirClient
}
