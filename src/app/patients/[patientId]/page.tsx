'use client'

import { useParams } from 'next/navigation'
import { usePatient } from '@/hooks/usePatient'
import { FHIRPatientChart } from './FHIRPatientChart'

// Format FHIR HumanName to string
function formatPatientName(patient: any): string {
  if (!patient?.name?.[0]) return 'Unknown Patient'
  const name = patient.name[0]
  const given = name.given?.join(' ') || ''
  const family = name.family || ''
  return `${given} ${family}`.trim() || 'Unknown Patient'
}

export default function PatientChartPage() {
  const params = useParams()
  const patientId = params.patientId as string
  const { data: aidboxPatient } = usePatient(patientId)

  // Format address from FHIR
  const formatAddress = (addr: any) => {
    if (!addr) return null
    const lines = addr.line?.join(', ') || ''
    const city = addr.city || ''
    const state = addr.state || ''
    const postalCode = addr.postalCode || ''
    return { lines, city, state, postalCode, full: `${lines}, ${city}, ${state} ${postalCode}`.trim() }
  }

  // Format phone from FHIR telecom
  const getPhone = (telecom: any[] | undefined) => {
    if (!telecom) return null
    const phone = telecom.find((t: any) => t.system === 'phone')
    return phone?.value || null
  }

  // Format email from FHIR telecom
  const getEmail = (telecom: any[] | undefined) => {
    if (!telecom) return null
    const email = telecom.find((t: any) => t.system === 'email')
    return email?.value || null
  }

  const patient = aidboxPatient ? {
    id: aidboxPatient.id,
    name: formatPatientName(aidboxPatient),
    mrn: aidboxPatient.identifier?.[0]?.value || aidboxPatient.id,
    age: aidboxPatient.birthDate ? Math.floor((Date.now() - new Date(aidboxPatient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
    gender: aidboxPatient.gender || 'unknown',
    birthDate: aidboxPatient.birthDate,
    address: formatAddress(aidboxPatient.address?.[0]),
    phone: getPhone(aidboxPatient.telecom),
    email: getEmail(aidboxPatient.telecom),
    maritalStatus: aidboxPatient.maritalStatus?.text || aidboxPatient.maritalStatus?.coding?.[0]?.display,
    language: aidboxPatient.communication?.[0]?.language?.text || aidboxPatient.communication?.[0]?.language?.coding?.[0]?.display,
    race: aidboxPatient.extension?.find((e: any) => e.url?.includes('race'))?.valueCodeableConcept?.text,
    ethnicity: aidboxPatient.extension?.find((e: any) => e.url?.includes('ethnicity'))?.valueCodeableConcept?.text,
    location: aidboxPatient.address?.[0]?.city || 'Unknown',
    admitDate: aidboxPatient.meta?.lastUpdated || '',
    attending: 'Attending MD',
    fhirPatient: aidboxPatient, // Pass full FHIR resource
  } : {
    id: patientId,
    name: 'Unknown Patient',
    mrn: 'MRN-N/A',
    age: 0,
    gender: 'unknown',
    birthDate: '',
    address: null,
    phone: null,
    email: null,
    maritalStatus: null,
    language: null,
    race: null,
    ethnicity: null,
    location: 'Unknown',
    admitDate: '',
    attending: 'Attending MD',
    fhirPatient: null,
  }

  return (
    <FHIRPatientChart patient={patient} patientId={patientId} />
  )
}
