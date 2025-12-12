/**
 * Appointment Resource Client
 * Typed client for FHIR Appointment resources
 */

import type { Appointment, Bundle } from '@medplum/fhirtypes'

export interface AppointmentSearchParams {
  patient?: string
  practitioner?: string
  status?: string
  date?: string
  'service-type'?: string
  _count?: number
  _sort?: string
}

export class AppointmentClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<Appointment> {
    const response = await fetch(`${this.baseUrl}/Appointment/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch appointment ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: AppointmentSearchParams = {}): Promise<Appointment[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.practitioner) searchParams.append('practitioner', params.practitioner)
    if (params.status) searchParams.append('status', params.status)
    if (params.date) searchParams.append('date', params.date)
    if (params['service-type']) searchParams.append('service-type', params['service-type'])
    if (params._count) searchParams.append('_count', params._count.toString())
    if (params._sort) searchParams.append('_sort', params._sort)

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/Appointment?${query}` : `${this.baseUrl}/Appointment`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search appointments: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as Appointment)
      .filter(Boolean)
  }

  async getByPatient(patientId: string, params: Omit<AppointmentSearchParams, 'patient'> = {}): Promise<Appointment[]> {
    return this.search({ ...params, patient: patientId, _sort: params._sort || 'date' })
  }

  async getUpcomingAppointments(patientId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.search({ 
      patient: patientId, 
      date: `ge${today}`,
      status: 'booked,pending,proposed',
      _sort: 'date'
    })
  }

  async getPastAppointments(patientId: string, limit: number = 10): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.search({ 
      patient: patientId, 
      date: `lt${today}`,
      _sort: '-date',
      _count: limit
    })
  }

  async create(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    const response = await fetch(`${this.baseUrl}/Appointment`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...appointment, resourceType: 'Appointment' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create appointment: ${response.status}`)
    }
    return response.json()
  }

  async update(id: string, appointment: Appointment): Promise<Appointment> {
    const response = await fetch(`${this.baseUrl}/Appointment/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(appointment),
    })
    if (!response.ok) {
      throw new Error(`Failed to update appointment ${id}: ${response.status}`)
    }
    return response.json()
  }

  async cancel(id: string, reason?: string): Promise<Appointment> {
    const appointment = await this.getById(id)
    appointment.status = 'cancelled'
    if (reason) {
      appointment.cancelationReason = { text: reason }
    }
    return this.update(id, appointment)
  }
}

/**
 * Helper to get appointment status display
 */
export function getAppointmentStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'proposed': 'Proposed',
    'pending': 'Pending',
    'booked': 'Booked',
    'arrived': 'Arrived',
    'fulfilled': 'Completed',
    'cancelled': 'Cancelled',
    'noshow': 'No Show',
    'entered-in-error': 'Error',
    'checked-in': 'Checked In',
    'waitlist': 'Waitlist',
  }
  return statusMap[status] || status
}

/**
 * Helper to format appointment time
 */
export function formatAppointmentTime(appointment: Appointment): string {
  if (!appointment.start) return 'TBD'
  const start = new Date(appointment.start)
  return start.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Helper to get appointment duration in minutes
 */
export function getAppointmentDuration(appointment: Appointment): number | null {
  if (appointment.minutesDuration) {
    return appointment.minutesDuration
  }
  if (appointment.start && appointment.end) {
    const start = new Date(appointment.start)
    const end = new Date(appointment.end)
    return Math.round((end.getTime() - start.getTime()) / 60000)
  }
  return null
}

/**
 * Helper to get service type display
 */
export function getServiceTypeDisplay(appointment: Appointment): string {
  return appointment.serviceType?.[0]?.text ||
         appointment.serviceType?.[0]?.coding?.[0]?.display ||
         appointment.appointmentType?.text ||
         'Appointment'
}

/**
 * Calculate suggested appointment date based on timeframe
 */
export function calculateSuggestedDate(timeframe: string): Date {
  const now = new Date()
  
  switch (timeframe) {
    case 'within_48_hours':
      return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    case 'within_1_week':
      return new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    case 'within_2_weeks':
      return new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    case 'within_1_month':
      return new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }
}
