// Utility functions for managing patient notes in localStorage

const NOTES_STORAGE_KEY = 'patient_notes'

export interface PatientNote {
  patientId: string
  note: string
  updatedAt: string
}

export function getPatientNote(patientId: string): string {
  if (typeof window === 'undefined') return ''
  
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}')
    return notes[patientId]?.note || ''
  } catch {
    return ''
  }
}

export function savePatientNote(patientId: string, note: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}')
    notes[patientId] = {
      patientId,
      note,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
  } catch (error) {
    console.error('Failed to save patient note:', error)
  }
}

export function getAllPatientNotes(): Record<string, PatientNote> {
  if (typeof window === 'undefined') return {}
  
  try {
    return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function deletePatientNote(patientId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}')
    delete notes[patientId]
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
  } catch (error) {
    console.error('Failed to delete patient note:', error)
  }
}

