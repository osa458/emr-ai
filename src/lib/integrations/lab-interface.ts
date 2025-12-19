/**
 * Lab Interface Integration
 * 
 * This module provides integration with laboratory information systems via:
 * - HL7 v2.x messaging (ADT, ORM, ORU)
 * - FHIR R4 resources (ServiceRequest, DiagnosticReport, Observation)
 * 
 * Supports common lab workflows:
 * - Order entry (ORM^O01)
 * - Result delivery (ORU^R01)
 * - Order status updates
 */

import type {
  ServiceRequest,
  DiagnosticReport,
  Observation,
  Specimen,
  Patient,
} from '@medplum/fhirtypes'

export interface LabInterfaceConfig {
  endpoint: string
  apiKey?: string
  protocol: 'hl7v2' | 'fhir'
  labName: string
  labOid: string
  mllpPort?: number  // For HL7v2 MLLP connections
}

export interface LabOrderRequest {
  patient: {
    id: string
    mrn: string
    firstName: string
    lastName: string
    dob: string
    gender: string
  }
  orderer: {
    npi: string
    name: string
  }
  tests: LabTest[]
  priority: 'routine' | 'stat' | 'asap' | 'timed'
  collectionDateTime?: string
  clinicalInfo?: string
  specimenType?: string
  fastingStatus?: 'fasting' | 'non-fasting' | 'unknown'
}

export interface LabTest {
  code: string
  codeSystem: 'LOINC' | 'CPT' | 'LOCAL'
  name: string
  specimenRequirements?: string
}

export interface LabOrderResponse {
  success: boolean
  orderId: string
  accessionNumber?: string
  status: 'pending' | 'received' | 'in-progress' | 'completed' | 'cancelled'
  estimatedCompletionTime?: string
  errors?: string[]
}

export interface LabResult {
  orderId: string
  accessionNumber: string
  status: 'preliminary' | 'final' | 'corrected' | 'cancelled'
  collectionDateTime: string
  resultDateTime: string
  observations: LabObservation[]
  interpretation?: string
  performingLab: {
    name: string
    clia: string
    address?: string
  }
}

export interface LabObservation {
  code: string
  codeSystem: string
  name: string
  value: string | number
  unit?: string
  referenceRange?: {
    low?: number
    high?: number
    text?: string
  }
  interpretation?: 'N' | 'L' | 'H' | 'LL' | 'HH' | 'A' | 'AA'
  interpretationText?: string
  abnormalFlag?: boolean
  criticalFlag?: boolean
  notes?: string
}

// Common LOINC codes for frequently ordered labs
export const COMMON_LAB_PANELS = {
  BMP: {
    code: '24323-8',
    name: 'Basic Metabolic Panel',
    components: ['2345-7', '2160-0', '3094-0', '2823-3', '2951-2', '2075-0', '17861-6', '2028-9'],
  },
  CMP: {
    code: '24324-6',
    name: 'Comprehensive Metabolic Panel',
    components: ['2345-7', '2160-0', '3094-0', '2823-3', '2951-2', '2075-0', '17861-6', '2028-9', '1751-7', '1975-2', '6768-6', '1742-6', '1920-8'],
  },
  CBC: {
    code: '58410-2',
    name: 'Complete Blood Count with Differential',
    components: ['6690-2', '789-8', '718-7', '4544-3', '787-2', '785-6', '786-4', '788-0', '777-3'],
  },
  LIPID: {
    code: '24331-1',
    name: 'Lipid Panel',
    components: ['2093-3', '2085-9', '2089-1', '2571-8', '13457-7'],
  },
  TSH: {
    code: '3016-3',
    name: 'Thyroid Stimulating Hormone',
    components: ['3016-3'],
  },
  HBA1C: {
    code: '4548-4',
    name: 'Hemoglobin A1c',
    components: ['4548-4'],
  },
  UA: {
    code: '24356-8',
    name: 'Urinalysis Complete',
    components: ['5778-6', '5794-3', '5803-2', '5804-0', '5802-4', '5799-2', '5797-6', '5811-5'],
  },
  COAG: {
    code: '24325-3',
    name: 'Coagulation Panel',
    components: ['5902-2', '5964-2', '3173-2'],
  },
}

class LabInterfaceClient {
  private config: LabInterfaceConfig

  constructor(config: LabInterfaceConfig) {
    this.config = config
  }

  /**
   * Submit a lab order
   */
  async submitOrder(request: LabOrderRequest): Promise<LabOrderResponse> {
    console.log(`[LabInterface] Submitting order to ${this.config.labName}:`, {
      patient: `${request.patient.lastName}, ${request.patient.firstName}`,
      tests: request.tests.map(t => t.name).join(', '),
      priority: request.priority,
    })

    if (this.config.protocol === 'fhir') {
      return this.submitFhirOrder(request)
    } else {
      return this.submitHl7Order(request)
    }
  }

  private async submitFhirOrder(request: LabOrderRequest): Promise<LabOrderResponse> {
    // Build FHIR ServiceRequest resource
    const serviceRequest: ServiceRequest = {
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      priority: request.priority === 'stat' ? 'stat' : 'routine',
      subject: {
        reference: `Patient/${request.patient.id}`,
        display: `${request.patient.lastName}, ${request.patient.firstName}`,
      },
      requester: {
        display: request.orderer.name,
        identifier: {
          system: 'http://hl7.org/fhir/sid/us-npi',
          value: request.orderer.npi,
        },
      },
      code: {
        coding: request.tests.map(test => ({
          system: test.codeSystem === 'LOINC' ? 'http://loinc.org' : 
                  test.codeSystem === 'CPT' ? 'http://www.ama-assn.org/go/cpt' : 
                  `urn:oid:${this.config.labOid}`,
          code: test.code,
          display: test.name,
        })),
      },
      reasonCode: request.clinicalInfo ? [{
        text: request.clinicalInfo,
      }] : undefined,
      occurrenceDateTime: request.collectionDateTime,
    }

    // In production, POST to lab's FHIR endpoint
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    
    return {
      success: true,
      orderId,
      accessionNumber: `ACC${Date.now().toString().slice(-8)}`,
      status: 'received',
      estimatedCompletionTime: this.estimateCompletionTime(request.priority),
    }
  }

  private async submitHl7Order(request: LabOrderRequest): Promise<LabOrderResponse> {
    // Build HL7 v2 ORM^O01 message
    const hl7Message = this.buildOrmMessage(request)
    
    console.log('[LabInterface] HL7 ORM message built:', hl7Message.substring(0, 100) + '...')

    const orderId = `ORD-${Date.now()}`
    
    return {
      success: true,
      orderId,
      accessionNumber: `ACC${Date.now().toString().slice(-8)}`,
      status: 'pending',
      estimatedCompletionTime: this.estimateCompletionTime(request.priority),
    }
  }

  /**
   * Query order status
   */
  async getOrderStatus(orderId: string): Promise<LabOrderResponse> {
    console.log(`[LabInterface] Querying order status: ${orderId}`)

    // In production, query lab system
    return {
      success: true,
      orderId,
      status: 'in-progress',
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason: string): Promise<LabOrderResponse> {
    console.log(`[LabInterface] Canceling order: ${orderId}, reason: ${reason}`)

    return {
      success: true,
      orderId,
      status: 'cancelled',
    }
  }

  /**
   * Parse incoming HL7 ORU result message
   */
  parseOruMessage(hl7Message: string): LabResult {
    // Parse HL7 v2 ORU^R01 message
    const segments = hl7Message.split('\r')
    const msh = this.parseSegment(segments.find(s => s.startsWith('MSH')) || '')
    const pid = this.parseSegment(segments.find(s => s.startsWith('PID')) || '')
    const obr = this.parseSegment(segments.find(s => s.startsWith('OBR')) || '')
    const obxSegments = segments.filter(s => s.startsWith('OBX'))

    const observations: LabObservation[] = obxSegments.map(obxStr => {
      const obx = this.parseSegment(obxStr)
      return {
        code: obx[3]?.split('^')[0] || '',
        codeSystem: obx[3]?.split('^')[2] || 'LOINC',
        name: obx[3]?.split('^')[1] || '',
        value: obx[5] || '',
        unit: obx[6] || '',
        referenceRange: obx[7] ? { text: obx[7] } : undefined,
        interpretation: obx[8] as LabObservation['interpretation'],
        abnormalFlag: ['H', 'L', 'HH', 'LL', 'A', 'AA'].includes(obx[8] || ''),
        criticalFlag: ['HH', 'LL', 'AA'].includes(obx[8] || ''),
      }
    })

    return {
      orderId: obr[2] || '',
      accessionNumber: obr[3] || '',
      status: 'final',
      collectionDateTime: obr[7] || '',
      resultDateTime: obr[22] || new Date().toISOString(),
      observations,
      performingLab: {
        name: this.config.labName,
        clia: msh[4] || '',
      },
    }
  }

  /**
   * Convert lab result to FHIR resources
   */
  toFhirResources(result: LabResult, patientId: string): {
    diagnosticReport: DiagnosticReport
    observations: Observation[]
  } {
    const observations: Observation[] = result.observations.map((obs, idx) => ({
      resourceType: 'Observation' as const,
      id: `obs-${result.accessionNumber}-${idx}`,
      status: result.status === 'final' ? 'final' : 'preliminary',
      code: {
        coding: [{
          system: obs.codeSystem === 'LOINC' ? 'http://loinc.org' : undefined,
          code: obs.code,
          display: obs.name,
        }],
        text: obs.name,
      },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: result.collectionDateTime,
      valueQuantity: typeof obs.value === 'number' ? {
        value: obs.value,
        unit: obs.unit,
        system: 'http://unitsofmeasure.org',
        code: obs.unit,
      } : undefined,
      valueString: typeof obs.value === 'string' ? obs.value : undefined,
      interpretation: obs.interpretation ? [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: obs.interpretation,
        }],
      }] : undefined,
      referenceRange: obs.referenceRange ? [{
        low: obs.referenceRange.low ? { value: obs.referenceRange.low, unit: obs.unit } : undefined,
        high: obs.referenceRange.high ? { value: obs.referenceRange.high, unit: obs.unit } : undefined,
        text: obs.referenceRange.text,
      }] : undefined,
    }))

    const diagnosticReport: DiagnosticReport = {
      resourceType: 'DiagnosticReport',
      id: `dr-${result.accessionNumber}`,
      status: result.status === 'final' ? 'final' : 'preliminary',
      code: {
        text: 'Laboratory Report',
      },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: result.collectionDateTime,
      issued: result.resultDateTime,
      result: observations.map(obs => ({ reference: `Observation/${obs.id}` })),
      performer: [{
        display: result.performingLab.name,
      }],
    }

    return { diagnosticReport, observations }
  }

  private buildOrmMessage(request: LabOrderRequest): string {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const messageId = `${timestamp}${Math.random().toString(36).substr(2, 6)}`

    const segments = [
      `MSH|^~\\&|EMR|FACILITY|${this.config.labName}|LAB|${timestamp}||ORM^O01|${messageId}|P|2.5.1`,
      `PID|1||${request.patient.mrn}^^^MRN||${request.patient.lastName}^${request.patient.firstName}||${request.patient.dob.replace(/-/g, '')}|${request.patient.gender}`,
      `ORC|NW|${messageId}|||${request.priority === 'stat' ? 'S' : 'R'}|||${timestamp}|||${request.orderer.npi}^${request.orderer.name}`,
    ]

    request.tests.forEach((test, idx) => {
      segments.push(
        `OBR|${idx + 1}|${messageId}||${test.code}^${test.name}^${test.codeSystem}|||${timestamp}||||||${request.clinicalInfo || ''}|||${request.orderer.npi}^${request.orderer.name}`
      )
    })

    return segments.join('\r')
  }

  private parseSegment(segment: string): string[] {
    return segment.split('|')
  }

  private estimateCompletionTime(priority: LabOrderRequest['priority']): string {
    const now = new Date()
    switch (priority) {
      case 'stat':
        now.setHours(now.getHours() + 1)
        break
      case 'asap':
        now.setHours(now.getHours() + 4)
        break
      case 'timed':
        now.setHours(now.getHours() + 24)
        break
      default:
        now.setHours(now.getHours() + 48)
    }
    return now.toISOString()
  }
}

// Singleton instance
let labClient: LabInterfaceClient | null = null

export function getLabInterfaceClient(): LabInterfaceClient {
  if (!labClient) {
    labClient = new LabInterfaceClient({
      endpoint: process.env.LAB_INTERFACE_ENDPOINT || 'http://localhost:2575',
      apiKey: process.env.LAB_INTERFACE_API_KEY,
      protocol: (process.env.LAB_INTERFACE_PROTOCOL as 'hl7v2' | 'fhir') || 'fhir',
      labName: process.env.LAB_NAME || 'Reference Lab',
      labOid: process.env.LAB_OID || '2.16.840.1.113883.3.1234',
      mllpPort: process.env.LAB_MLLP_PORT ? parseInt(process.env.LAB_MLLP_PORT) : undefined,
    })
  }
  return labClient
}

export { LabInterfaceClient }
