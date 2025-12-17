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
    id: 'my-patients',
    name: 'My Patients',
    description: 'Patients with rich FHIR data for testing',
    color: '#10B981',
    icon: 'user-check',
    patientIds: [
      '04fa9220-931b-6504-1444-5523f8f25710', // Dorthey Eichmann - 68y female, HTN/Osteoporosis/Depression
      '0413360c-f05b-adaf-16de-3c9dfe7170d4', // Heriberto Murazik - 54y male, HTN/Hyperlipidemia
      '01a12c22-f97a-2804-90f6-d77b5c68387c', // Preston Yundt - 31y male, HTN/Hyperlipidemia
      '0337ce1a-4012-7e62-99dc-2547d449bef7', // Rhett Bechtelar - 33y male, HTN/Hyperlipidemia
      '03c85a2f-23d9-8f25-63f1-580a1bddae72', // Kimbery Strosin - 23y female, Migraine/Anxiety
      '5ab3b247-dc11-35cb-3ed6-8be889f6ccbe', // Robby Koepp - 11y male, Asthma/ADHD
      '2193c2e7-4d66-74c6-17c5-6d0c1c094fc2', // Creola Franecki - 9y female, Allergies
      '5994d754-de6b-5333-884a-073f55fcd358', // Del Luettgen - 6y male, Asthma
      '625d1b5b-21d6-b1e9-931f-bcb1d02c1b10', // Joleen Stiedemann - 13y female, Eczema
      '88cba6af-295e-add7-7a7c-59972c18a866', // Candra Grant - 11y female, Allergies
    ],
    createdAt: STATIC_DATE,
    updatedAt: STATIC_DATE,
    isDefault: true,
  },
  {
    id: 'mock-patients',
    name: 'Mock Patients',
    description: 'Synthetic demo patients',
    color: '#3B82F6',
    icon: 'users',
    patientIds: [],
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
    patientIds: [
      '04fa9220-931b-6504-1444-5523f8f25710', // Dorthey Eichmann - elderly with multiple conditions
    ],
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
    patientIds: [
      '03c85a2f-23d9-8f25-63f1-580a1bddae72', // Kimbery Strosin - stable young adult
    ],
    createdAt: STATIC_DATE,
    updatedAt: STATIC_DATE,
    isDefault: true,
  },
  {
    id: 'aidbox-patients',
    name: 'Aidbox Patients',
    description: 'Live patients from Aidbox',
    color: '#06B6D4',
    icon: 'activity',
    patientIds: [
      '04fa9220-931b-6504-1444-5523f8f25710',
      '0413360c-f05b-adaf-16de-3c9dfe7170d4',
      '01a12c22-f97a-2804-90f6-d77b5c68387c',
      '0337ce1a-4012-7e62-99dc-2547d449bef7',
      '03c85a2f-23d9-8f25-63f1-580a1bddae72',
      '5ab3b247-dc11-35cb-3ed6-8be889f6ccbe',
      '2193c2e7-4d66-74c6-17c5-6d0c1c094fc2',
      '5994d754-de6b-5333-884a-073f55fcd358',
      '625d1b5b-21d6-b1e9-931f-bcb1d02c1b10',
      '88cba6af-295e-add7-7a7c-59972c18a866',
    ],
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LISTS))
    return DEFAULT_LISTS
  }
  
  try {
    let parsed: PatientList[] = JSON.parse(stored)
    // Remove legacy list ids
    parsed = parsed.filter((l) => l.id !== 'all-patients')
    // Ensure default lists exist and have correct patient IDs
    const byId = new Map(parsed.map((l) => [l.id, l]))
    DEFAULT_LISTS.forEach((d) => {
      if (!byId.has(d.id)) {
        parsed.push(d)
      } else if (d.isDefault) {
        // Update default lists with current patient IDs
        const existing = byId.get(d.id)!
        existing.patientIds = d.patientIds
        existing.description = d.description
      }
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    return parsed
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
