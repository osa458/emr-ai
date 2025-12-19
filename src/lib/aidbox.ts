/**
 * Aidbox FHIR Client
 * Handles connection and operations with Aidbox
 * Now uses the official @aidbox/sdk-r4 SDK
 */

import { Client } from '@aidbox/sdk-r4'

const AIDBOX_BASE_URL = process.env.AIDBOX_BASE_URL || 'https://aoadhslfxc.edge.aidbox.app'
const AIDBOX_CLIENT_ID = process.env.AIDBOX_CLIENT_ID || 'emr-api'
const AIDBOX_CLIENT_SECRET = process.env.AIDBOX_CLIENT_SECRET || 'emr-secret-123'

// Official Aidbox SDK Client
export const aidbox = new Client(AIDBOX_BASE_URL, {
  auth: {
    method: 'basic',
    credentials: {
      username: AIDBOX_CLIENT_ID,
      password: AIDBOX_CLIENT_SECRET,
    },
  },
})

function getAuthHeader(): string {
  const credentials = Buffer.from(`${AIDBOX_CLIENT_ID}:${AIDBOX_CLIENT_SECRET}`).toString('base64')
  return `Basic ${credentials}`
}

// Legacy fetch function (kept for backward compatibility)
export async function aidboxFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${AIDBOX_BASE_URL}${path}`
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// SDK-based helper functions
export async function getPatients(count: number = 100) {
  return aidbox.resource.list('Patient').count(count)
}

export async function getPatient(id: string) {
  return aidbox.resource.get('Patient', id)
}

export async function createPatient(data: Record<string, unknown>) {
  return aidbox.resource.create('Patient', data as any)
}

export async function getEncountersByPatient(patientId: string) {
  return aidbox.resource.list('Encounter').where('subject', `Patient/${patientId}`)
}

export async function getConditionsByPatient(patientId: string) {
  return aidbox.resource.list('Condition').where('subject', `Patient/${patientId}`)
}

export async function getObservationsByPatient(patientId: string) {
  return aidbox.resource.list('Observation').where('subject', `Patient/${patientId}`)
}

export async function getMedicationRequestsByPatient(patientId: string) {
  return aidbox.resource.list('MedicationRequest').where('subject', `Patient/${patientId}`)
}

export async function getQuestionnaires(count: number = 500): Promise<any> {
  const response = await aidboxFetch(`/Questionnaire?_count=${count}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch questionnaires: ${response.statusText}`)
  }
  return response.json()
}

export async function getQuestionnaire(id: string): Promise<any> {
  const response = await aidboxFetch(`/Questionnaire/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch questionnaire ${id}: ${response.statusText}`)
  }
  return response.json()
}

export async function createQuestionnaire(questionnaire: any): Promise<any> {
  const response = await aidboxFetch('/Questionnaire', {
    method: 'POST',
    body: JSON.stringify(questionnaire),
  })
  if (!response.ok) {
    throw new Error(`Failed to create questionnaire: ${response.statusText}`)
  }
  return response.json()
}

export async function upsertQuestionnaire(questionnaire: any): Promise<any> {
  const id = questionnaire.id || questionnaire.url?.split('/').pop()
  const response = await aidboxFetch(`/Questionnaire/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...questionnaire, id }),
  })
  if (!response.ok) {
    throw new Error(`Failed to upsert questionnaire: ${response.statusText}`)
  }
  return response.json()
}

// Form URLs from the Aidbox gallery
export const GALLERY_FORM_URLS = [
  // Health Samurai forms
  'http://forms.aidbox.io/questionnaire/ros',
  'http://forms.aidbox.io/questionnaire/physical-exam',
  // LOINC forms - Lab panels
  'http://loinc.org/q/100109-8',  // Leishmania sp Ab IB Pnl
  'http://loinc.org/q/57019-2',   // UA dipstick W Reflex Culture
  'http://loinc.org/q/57020-0',   // UA dipstick W Reflex Micro
  'http://loinc.org/q/100017-3',  // Perioperative nursing
  'http://loinc.org/q/100062-9',  // SDOM panel
  'http://loinc.org/q/57085-3',   // OA NB scn pnl
  'http://loinc.org/q/100066-0',  // Specular microscopy
  'http://loinc.org/q/57086-1',   // CAH NB scn pnl
  'http://loinc.org/q/100088-4',  // T solium Ab bands
  'http://loinc.org/q/100092-6',  // T cruzi Ab bands
  'http://loinc.org/q/100105-6',  // Filaria Ab
  'http://loinc.org/q/100112-2',  // Fasciola sp Ab
  'http://loinc.org/q/100113-0',  // H pylori Ab
  'http://loinc.org/q/100120-5',  // C trachomatis Ab
  'http://loinc.org/q/98706-5',   // RMNS Pnl Nerve
  'http://loinc.org/q/100122-1',  // C pneum Ab
  'http://loinc.org/q/100125-4',  // C psittaci Ab
  'http://loinc.org/q/100126-2',  // B pert IgG
  'http://loinc.org/q/55402-2',   // WNV IgG+IgM
  'http://loinc.org/q/100127-0',  // Campylobacter Ab
  'http://loinc.org/q/100128-8',  // Cryptoc Ag
  'http://loinc.org/q/100147-8',  // T gondii Ab bands
  'http://loinc.org/q/100148-6',  // Schistosoma sp Ab
  'http://loinc.org/q/100149-4',  // 6-oxo-PIP
  'http://loinc.org/q/100159-3',  // Knee Society Score pre-op
  'http://loinc.org/q/100203-9',  // Knee Society Score post-op
  'http://loinc.org/q/100224-5',  // Cardiac LV SWM
  'http://loinc.org/q/100230-2',  // Routine prenatal
  'http://loinc.org/q/101681-5',  // Leukotriene E4
  'http://loinc.org/q/100280-7',  // Five Facet Mindfulness
  'http://loinc.org/q/100283-1',  // Harris Hip Score
  'http://loinc.org/q/100302-9',  // Time start/end
  'http://loinc.org/q/100307-8',  // Behavioral screening elder
  'http://loinc.org/q/100429-0',  // LRBA deficiency
  'http://loinc.org/q/100353-2',  // Norwalk Community Health
  'http://loinc.org/q/100710-3',  // C trach+GC
  'http://loinc.org/q/100732-7',  // LPALD Ser
  'http://loinc.org/q/100734-3',  // Ur Cfm
  'http://loinc.org/q/100360-7',  // Brief Resilience Scale
  'http://loinc.org/q/100368-0',  // AAUCD SerPl
  'http://loinc.org/q/100652-7',  // Pure tone bone thresh
  'http://loinc.org/q/100735-0',  // M6PI & PMM1
  'http://loinc.org/q/92697-2',   // GI parasitic pathogens
  'http://loinc.org/q/100653-5',  // Pure tone air thresh
  'http://loinc.org/q/100662-6',  // CORTO SerPl
  'http://loinc.org/q/100747-5',  // Lp-SG panel
  'http://loinc.org/q/100751-7',  // Meat allergen
  'http://loinc.org/q/100757-4',  // Oligoclonal Bands
  'http://loinc.org/q/100765-7',  // Hcys+Me-Malonate
  'http://loinc.org/q/100766-5',  // CES Depression Scale
  'http://loinc.org/q/100821-8',  // National POLST Form
  'http://loinc.org/q/100847-3',  // BldA
  'http://loinc.org/q/100848-1',  // Cell Cnt + Diff Amn
  'http://loinc.org/q/100866-3',  // Febrile antibody
  'http://loinc.org/q/100893-7',  // Orthopoxvirus IgG+IgM
  'http://loinc.org/q/100904-2',  // UTI pathogens
  'http://loinc.org/q/55403-0',   // Asthma tracking
  'http://loinc.org/q/100898-6',  // Lipid panel
  'http://loinc.org/q/100900-0',  // Enterobac Carb Resis
  'http://loinc.org/q/100903-4',  // Yst+Candida sp ID
  'http://loinc.org/q/100912-5',  // Enterob ESBL & VRE
  'http://loinc.org/q/100913-3',  // S. aureus+MRSA screen
  'http://loinc.org/q/100921-6',  // User satisfaction
  'http://loinc.org/q/94499-1',   // Resp viral path
  'http://loinc.org/q/100922-4',  // Privacy panel
  'http://loinc.org/q/100928-1',  // Digital confidence
  'http://loinc.org/q/100934-9',  // Personal safety
  'http://loinc.org/q/100940-6',  // Neighbor relationships
  'http://loinc.org/q/100951-3',  // Loneliness ONS
  'http://loinc.org/q/100952-1',  // Product confidence
  'http://loinc.org/q/100958-8',  // Digital readiness
  'http://loinc.org/q/100968-7',  // Bovine Tub
  'http://loinc.org/q/101144-4',  // USTEK panel
  'http://loinc.org/q/62294-4',   // PhenX standing height
  'http://loinc.org/q/100972-9',  // FLU+SARS-CoV2
  'http://loinc.org/q/100987-7',  // Lymph Tcell+Bcell
  'http://loinc.org/q/100994-3',  // Bld FC
  'http://loinc.org/q/62295-1',   // Recumbent length
  'http://loinc.org/q/100997-6',  // Respiratory Allergen
  'http://loinc.org/q/101146-9',  // Monocyte subsets
  'http://loinc.org/q/100998-4',  // Cortisol post insulin
  'http://loinc.org/q/100999-2',  // GH post insulin
  'http://loinc.org/q/101172-5',  // CT + NG + TV
  'http://loinc.org/q/101002-4',  // MVPX sequencing
  'http://loinc.org/q/101105-5',  // MDS v3.0 NC
  'http://loinc.org/q/101106-3',  // MDS v3.0 NQ
  'http://loinc.org/q/101107-1',  // MDS v3.0 ND
  'http://loinc.org/q/101108-9',  // MDS v3.0 NT & ST
  'http://loinc.org/q/101109-7',  // MDS v3.0 NPE
  'http://loinc.org/q/101110-5',  // MDS v3.0 NP
  'http://loinc.org/q/101111-3',  // MDS v3.0 IPA
  'http://loinc.org/q/101112-1',  // MDS v3.0 SP
  'http://loinc.org/q/101113-9',  // MDS v3.0 SD
  'http://loinc.org/q/101132-9',  // Glucose post challenge
  'http://loinc.org/q/62296-9',   // Self reported height
  'http://loinc.org/q/101209-5',  // Hantavirus IgG
  'http://loinc.org/q/101214-5',  // Hantavirus IgM
  'http://loinc.org/q/101285-5',  // Pharyngeal path
]

export interface FormSummary {
  id: string
  title: string
  status: string
  publisher?: string
  url?: string
  itemCount: number
  lastUpdated?: string
}

function countItems(items: any[] = []): number {
  let count = 0
  for (const item of items) {
    if (item.type !== 'group' && item.type !== 'display') {
      count++
    }
    if (item.item) {
      count += countItems(item.item)
    }
  }
  return count
}

export function transformToFormSummary(questionnaire: any): FormSummary {
  return {
    id: questionnaire.id,
    title: questionnaire.title || questionnaire.name || 'Untitled Form',
    status: questionnaire.status || 'draft',
    publisher: questionnaire.publisher,
    url: questionnaire.url,
    itemCount: countItems(questionnaire.item || []),
    lastUpdated: questionnaire.meta?.lastUpdated,
  }
}
