/**
 * Surescripts E-Prescribing Integration
 * 
 * This module provides integration with Surescripts for:
 * - NewRx: New prescription transmission
 * - RxRenewal: Refill requests
 * - RxCancel: Prescription cancellation
 * - RxChange: Prescription change requests
 * - EPCS: Electronic Prescribing for Controlled Substances
 * 
 * Note: Production use requires Surescripts certification and credentials
 */

export interface SurescriptsConfig {
  partnerId: string
  apiKey: string
  environment: 'test' | 'certification' | 'production'
  ncpdpProviderId: string
  deaNumber?: string  // Required for EPCS
}

export interface Pharmacy {
  ncpdpId: string
  npi: string
  name: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
  }
  phone: string
  fax?: string
}

export interface Prescriber {
  npi: string
  deaNumber?: string
  firstName: string
  lastName: string
  credentials: string
  specialty?: string
  phone: string
  fax?: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
  }
}

export interface Patient {
  firstName: string
  lastName: string
  middleName?: string
  dob: string  // YYYY-MM-DD
  gender: 'M' | 'F' | 'U'
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
  }
  phone?: string
  allergies?: string[]
}

export interface Medication {
  drugName: string
  ndc: string
  rxcui?: string
  strength: string
  strengthUnit: string
  form: string
  quantity: number
  quantityUnit: string
  daysSupply: number
  refills: number
  sig: string
  notes?: string
  daw: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9  // Dispense as Written code
  isControlled: boolean
  scheduleClass?: 'II' | 'III' | 'IV' | 'V'
}

export interface NewRxRequest {
  patient: Patient
  prescriber: Prescriber
  pharmacy: Pharmacy
  medication: Medication
  effectiveDate?: string
  supervisingPhysician?: Prescriber  // For mid-level providers
}

export interface NewRxResponse {
  success: boolean
  messageId: string
  status: 'transmitted' | 'pending' | 'error'
  timestamp: string
  errorCode?: string
  errorMessage?: string
}

export interface PharmacySearchRequest {
  zipCode: string
  radius?: number  // miles, default 10
  pharmacyName?: string
  is24Hour?: boolean
  hasMailOrder?: boolean
}

export interface MedicationHistoryRequest {
  patientId: string
  patientDob: string
  consent: boolean
  dateRange?: {
    start: string
    end: string
  }
}

export interface FormularyCheckRequest {
  ndcs: string[]
  payerBin: string
  payerPcn: string
  groupId: string
  memberId: string
}

class SurescriptsClient {
  private config: SurescriptsConfig
  private baseUrl: string

  constructor(config: SurescriptsConfig) {
    this.config = config
    this.baseUrl = this.getBaseUrl(config.environment)
  }

  private getBaseUrl(env: SurescriptsConfig['environment']): string {
    switch (env) {
      case 'test':
        return 'https://test.surescripts.net/api/v1'
      case 'certification':
        return 'https://cert.surescripts.net/api/v1'
      case 'production':
        return 'https://api.surescripts.net/api/v1'
    }
  }

  /**
   * Send a new prescription to a pharmacy
   */
  async sendNewRx(request: NewRxRequest): Promise<NewRxResponse> {
    // Validate EPCS requirements for controlled substances
    if (request.medication.isControlled) {
      if (!this.config.deaNumber) {
        throw new Error('DEA number required for controlled substance prescriptions')
      }
      if (!request.prescriber.deaNumber) {
        throw new Error('Prescriber DEA number required for controlled substances')
      }
    }

    // Build NCPDP SCRIPT message
    const scriptMessage = this.buildNewRxMessage(request)

    try {
      // In production, this would make an actual API call
      // For now, simulate the response
      console.log('[Surescripts] Sending NewRx:', {
        pharmacy: request.pharmacy.name,
        medication: request.medication.drugName,
        patient: `${request.patient.lastName}, ${request.patient.firstName}`,
      })

      // Simulate API response
      return {
        success: true,
        messageId: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'transmitted',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('[Surescripts] NewRx failed:', error)
      return {
        success: false,
        messageId: '',
        status: 'error',
        timestamp: new Date().toISOString(),
        errorCode: 'TRANSMISSION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Search for pharmacies by location
   */
  async searchPharmacies(request: PharmacySearchRequest): Promise<Pharmacy[]> {
    // In production, this would query Surescripts Directory
    console.log('[Surescripts] Searching pharmacies:', request)

    // Return sample pharmacies for demo
    return [
      {
        ncpdpId: '1234567',
        npi: '1234567890',
        name: 'CVS Pharmacy #1234',
        address: {
          line1: '123 Main Street',
          city: 'Anytown',
          state: 'TX',
          zip: request.zipCode,
        },
        phone: '(555) 123-4567',
      },
      {
        ncpdpId: '2345678',
        npi: '2345678901',
        name: 'Walgreens #5678',
        address: {
          line1: '456 Oak Avenue',
          city: 'Anytown',
          state: 'TX',
          zip: request.zipCode,
        },
        phone: '(555) 234-5678',
      },
    ]
  }

  /**
   * Get patient medication history (requires patient consent)
   */
  async getMedicationHistory(request: MedicationHistoryRequest): Promise<any[]> {
    if (!request.consent) {
      throw new Error('Patient consent required for medication history request')
    }

    console.log('[Surescripts] Fetching medication history:', request.patientId)

    // In production, this would query Surescripts Medication History
    return []
  }

  /**
   * Check formulary coverage for medications
   */
  async checkFormulary(request: FormularyCheckRequest): Promise<any[]> {
    console.log('[Surescripts] Checking formulary:', request.ndcs)

    // In production, this would query Surescripts Formulary
    return request.ndcs.map(ndc => ({
      ndc,
      covered: true,
      tier: 1,
      priorAuthRequired: false,
      alternatives: [],
    }))
  }

  /**
   * Cancel a previously sent prescription
   */
  async cancelRx(originalMessageId: string, reason: string): Promise<NewRxResponse> {
    console.log('[Surescripts] Canceling Rx:', originalMessageId, reason)

    return {
      success: true,
      messageId: `CANCEL-${Date.now()}`,
      status: 'transmitted',
      timestamp: new Date().toISOString(),
    }
  }

  private buildNewRxMessage(request: NewRxRequest): string {
    // Build NCPDP SCRIPT 2017071 XML message
    // This is a simplified representation
    return `
      <Message>
        <Header>
          <To>${request.pharmacy.ncpdpId}</To>
          <From>${this.config.ncpdpProviderId}</From>
          <MessageID>${Date.now()}</MessageID>
        </Header>
        <Body>
          <NewRx>
            <Patient>
              <Name>${request.patient.lastName}, ${request.patient.firstName}</Name>
              <DOB>${request.patient.dob}</DOB>
              <Gender>${request.patient.gender}</Gender>
            </Patient>
            <Prescriber>
              <NPI>${request.prescriber.npi}</NPI>
              <Name>${request.prescriber.lastName}, ${request.prescriber.firstName}</Name>
            </Prescriber>
            <MedicationPrescribed>
              <DrugDescription>${request.medication.drugName}</DrugDescription>
              <NDC>${request.medication.ndc}</NDC>
              <Quantity>${request.medication.quantity}</Quantity>
              <DaysSupply>${request.medication.daysSupply}</DaysSupply>
              <Refills>${request.medication.refills}</Refills>
              <Sig>${request.medication.sig}</Sig>
            </MedicationPrescribed>
          </NewRx>
        </Body>
      </Message>
    `
  }
}

// Singleton instance
let surescriptsClient: SurescriptsClient | null = null

export function getSurescriptsClient(): SurescriptsClient {
  if (!surescriptsClient) {
    surescriptsClient = new SurescriptsClient({
      partnerId: process.env.SURESCRIPTS_PARTNER_ID || 'demo',
      apiKey: process.env.SURESCRIPTS_API_KEY || 'demo-key',
      environment: (process.env.SURESCRIPTS_ENV as SurescriptsConfig['environment']) || 'test',
      ncpdpProviderId: process.env.SURESCRIPTS_NCPDP_ID || 'DEMO123',
      deaNumber: process.env.SURESCRIPTS_DEA_NUMBER,
    })
  }
  return surescriptsClient
}

export { SurescriptsClient }
