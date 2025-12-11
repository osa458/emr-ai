/**
 * Task Resource Client
 * Used for consults and other clinical tasks
 */

import type { Task, Bundle } from '@medplum/fhirtypes'

export interface TaskSearchParams {
  patient?: string
  encounter?: string
  status?: string
  code?: string
  _sort?: string
  _count?: number
}

export class TaskClient {
  constructor(
    private baseUrl: string,
    private getHeaders: () => HeadersInit
  ) {}

  async getById(id: string): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/Task/${id}`, {
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch task ${id}: ${response.status}`)
    }
    return response.json()
  }

  async search(params: TaskSearchParams = {}): Promise<Task[]> {
    const searchParams = new URLSearchParams()
    if (params.patient) searchParams.append('patient', params.patient)
    if (params.encounter) searchParams.append('encounter', params.encounter)
    if (params.status) searchParams.append('status', params.status)
    if (params.code) searchParams.append('code', params.code)
    if (params._sort) searchParams.append('_sort', params._sort)
    if (params._count) searchParams.append('_count', params._count.toString())

    const query = searchParams.toString()
    const url = query ? `${this.baseUrl}/Task?${query}` : `${this.baseUrl}/Task`

    const response = await fetch(url, { headers: this.getHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to search tasks: ${response.status}`)
    }

    const bundle: Bundle = await response.json()
    return (bundle.entry || [])
      .map(e => e.resource as Task)
      .filter(Boolean)
  }

  async getByPatient(patientId: string): Promise<Task[]> {
    return this.search({ patient: patientId, _sort: '-authored' })
  }

  async getByEncounter(encounterId: string): Promise<Task[]> {
    return this.search({ encounter: encounterId, _sort: '-authored' })
  }

  async getOpenConsults(patientId: string): Promise<Task[]> {
    return this.search({
      patient: patientId,
      status: 'requested,in-progress',
      _sort: '-authored',
    })
  }

  async getCompletedConsults(patientId: string): Promise<Task[]> {
    return this.search({
      patient: patientId,
      status: 'completed',
      _sort: '-authored',
    })
  }

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/Task`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...task, resourceType: 'Task' }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.status}`)
    }
    return response.json()
  }

  async update(id: string, task: Task): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/Task/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(task),
    })
    if (!response.ok) {
      throw new Error(`Failed to update task ${id}: ${response.status}`)
    }
    return response.json()
  }
}

/**
 * Get task/consult specialty
 */
export function getTaskSpecialty(task: Task): string {
  return task.code?.text || task.code?.coding?.[0]?.display || 'Unknown Specialty'
}

/**
 * Check if task is open
 */
export function isOpenTask(task: Task): boolean {
  return ['requested', 'in-progress', 'received', 'accepted'].includes(task.status || '')
}
