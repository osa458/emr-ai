// Patient Lists Storage Utilities
// Stores custom patient lists in localStorage

export interface PatientList {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  patientIds: string[]
  createdAt: string
  updatedAt: string
  isDefault?: boolean
}

const STORAGE_KEY = 'emr-patient-lists'

// Static date for default lists to avoid hydration mismatch
const STATIC_DATE = '2024-01-01T00:00:00.000Z'

// Default lists that come pre-configured
const DEFAULT_LISTS: PatientList[] = [
  {
    id: 'all-patients',
    name: 'All Patients',
    description: 'All active patients',
    color: '#3B82F6',
    icon: 'users',
    patientIds: [],
    createdAt: STATIC_DATE,
    updatedAt: STATIC_DATE,
    isDefault: true,
  },
  {
    id: 'my-patients',
    name: 'My Patients',
    description: 'Patients assigned to me',
    color: '#10B981',
    icon: 'user-check',
    patientIds: ['1', '2', '3'],
    createdAt: STATIC_DATE,
    updatedAt: STATIC_DATE,
    isDefault: true,
  },
  {
    id: 'critical',
    name: 'Critical',
    description: 'Patients requiring close monitoring',
    color: '#EF4444',
    icon: 'alert-triangle',
    patientIds: ['1'],
    createdAt: STATIC_DATE,
    updatedAt: STATIC_DATE,
    isDefault: true,
  },
  {
    id: 'pending-discharge',
    name: 'Pending Discharge',
    description: 'Patients ready or near ready for discharge',
    color: '#F59E0B',
    icon: 'log-out',
    patientIds: ['2'],
    createdAt: STATIC_DATE,
    updatedAt: STATIC_DATE,
    isDefault: true,
  },
]

// Get all patient lists
export function getPatientLists(): PatientList[] {
  if (typeof window === 'undefined') return DEFAULT_LISTS
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    // Initialize with defaults
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LISTS))
    return DEFAULT_LISTS
  }
  
  try {
    return JSON.parse(stored)
  } catch {
    return DEFAULT_LISTS
  }
}

// Get a single list by ID
export function getPatientList(listId: string): PatientList | undefined {
  const lists = getPatientLists()
  return lists.find((l) => l.id === listId)
}

// Create a new list
export function createPatientList(list: Omit<PatientList, 'id' | 'createdAt' | 'updatedAt'>): PatientList {
  const lists = getPatientLists()
  
  const newList: PatientList = {
    ...list,
    id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  lists.push(newList)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  
  return newList
}

// Update an existing list
export function updatePatientList(listId: string, updates: Partial<PatientList>): PatientList | null {
  const lists = getPatientLists()
  const index = lists.findIndex((l) => l.id === listId)
  
  if (index === -1) return null
  
  lists[index] = {
    ...lists[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  return lists[index]
}

// Delete a list
export function deletePatientList(listId: string): boolean {
  const lists = getPatientLists()
  const list = lists.find((l) => l.id === listId)
  
  // Can't delete default lists
  if (list?.isDefault) return false
  
  const filtered = lists.filter((l) => l.id !== listId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  
  return true
}

// Add a patient to a list
export function addPatientToList(listId: string, patientId: string): boolean {
  const lists = getPatientLists()
  const index = lists.findIndex((l) => l.id === listId)
  
  if (index === -1) return false
  
  if (!lists[index].patientIds.includes(patientId)) {
    lists[index].patientIds.push(patientId)
    lists[index].updatedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  }
  
  return true
}

// Remove a patient from a list
export function removePatientFromList(listId: string, patientId: string): boolean {
  const lists = getPatientLists()
  const index = lists.findIndex((l) => l.id === listId)
  
  if (index === -1) return false
  
  lists[index].patientIds = lists[index].patientIds.filter((id) => id !== patientId)
  lists[index].updatedAt = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  
  return true
}

// Get all lists that contain a specific patient
export function getListsForPatient(patientId: string): PatientList[] {
  const lists = getPatientLists()
  return lists.filter((l) => l.patientIds.includes(patientId))
}

// Available colors for lists
export const LIST_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Slate', value: '#64748B' },
]

// Available icons for lists
export const LIST_ICONS = [
  'users',
  'user-check',
  'user-plus',
  'alert-triangle',
  'activity',
  'heart',
  'clipboard',
  'log-out',
  'star',
  'flag',
  'folder',
  'bookmark',
]

