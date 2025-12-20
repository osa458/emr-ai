'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuestionnaireRenderer } from '@/components/forms/QuestionnaireRenderer'
import {
  User, ChevronLeft, ChevronRight, Check, AlertCircle,
  FileText, ClipboardCheck, Heart, Stethoscope, Loader2,
  UserPlus, Building, Phone, Mail, Calendar, MapPin
} from 'lucide-react'
import type { Questionnaire, QuestionnaireResponse, Patient } from '@medplum/fhirtypes'

// Step configuration
type StepId = 'demographics' | 'contact' | 'insurance' | 'intake' | 'medical-history' | 'consent' | 'review'

interface Step {
  id: StepId
  title: string
  description: string
  icon: React.ReactNode
}

const steps: Step[] = [
  { id: 'demographics', title: 'Demographics', description: 'Basic patient information', icon: <User className="h-5 w-5" /> },
  { id: 'contact', title: 'Contact Info', description: 'Address and phone', icon: <Phone className="h-5 w-5" /> },
  { id: 'insurance', title: 'Insurance', description: 'Insurance details', icon: <Building className="h-5 w-5" /> },
  { id: 'intake', title: 'Intake Form', description: 'Initial assessment', icon: <FileText className="h-5 w-5" /> },
  { id: 'medical-history', title: 'Medical History', description: 'Health questionnaire', icon: <Heart className="h-5 w-5" /> },
  { id: 'consent', title: 'Consent', description: 'Treatment consent', icon: <ClipboardCheck className="h-5 w-5" /> },
  { id: 'review', title: 'Review & Admit', description: 'Final review', icon: <Check className="h-5 w-5" /> },
]

// Intake Form Questionnaire
const intakeFormQuestionnaire: Questionnaire = {
  resourceType: 'Questionnaire',
  id: 'intake-form',
  status: 'active',
  title: 'Patient Intake Form',
  description: 'Initial patient registration and assessment',
  item: [
    {
      linkId: 'chief-complaint',
      type: 'group',
      text: 'Chief Complaint',
      item: [
        { linkId: 'reason-for-visit', type: 'text', text: 'What is the main reason for your visit today?', required: true },
        { linkId: 'symptom-duration', type: 'string', text: 'How long have you had these symptoms?', required: true },
        {
          linkId: 'pain-level', type: 'choice', text: 'Current pain level (0-10)', required: true,
          answerOption: [
            { valueString: '0 - No pain' },
            { valueString: '1-3 - Mild' },
            { valueString: '4-6 - Moderate' },
            { valueString: '7-9 - Severe' },
            { valueString: '10 - Worst possible' }
          ]
        }
      ]
    },
    {
      linkId: 'vital-signs',
      type: 'group',
      text: 'Vital Signs (Nurse to complete)',
      item: [
        { linkId: 'blood-pressure', type: 'string', text: 'Blood Pressure (e.g., 120/80)' },
        { linkId: 'heart-rate', type: 'integer', text: 'Heart Rate (bpm)' },
        { linkId: 'temperature', type: 'decimal', text: 'Temperature (°F)' },
        { linkId: 'respiratory-rate', type: 'integer', text: 'Respiratory Rate' },
        { linkId: 'oxygen-saturation', type: 'integer', text: 'Oxygen Saturation (%)' },
        { linkId: 'weight', type: 'decimal', text: 'Weight (lbs)' },
        { linkId: 'height', type: 'string', text: 'Height' }
      ]
    }
  ]
}

// Medical History Questionnaire
const medicalHistoryQuestionnaire: Questionnaire = {
  resourceType: 'Questionnaire',
  id: 'medical-history',
  status: 'active',
  title: 'Medical History',
  description: 'Comprehensive medical history assessment',
  item: [
    {
      linkId: 'conditions',
      type: 'group',
      text: 'Current Medical Conditions',
      item: [
        { linkId: 'existing-conditions', type: 'text', text: 'List any current medical conditions (e.g., diabetes, hypertension, heart disease)', required: true },
        { linkId: 'previous-surgeries', type: 'text', text: 'Previous surgeries and dates' },
        { linkId: 'hospitalizations', type: 'text', text: 'Previous hospitalizations and reasons' }
      ]
    },
    {
      linkId: 'medications',
      type: 'group',
      text: 'Current Medications',
      item: [
        { linkId: 'current-medications', type: 'text', text: 'List all current medications with dosages', required: true },
        { linkId: 'supplements', type: 'text', text: 'Vitamins, herbs, or supplements' },
        { linkId: 'medication-allergies', type: 'text', text: 'Drug allergies and reactions', required: true }
      ]
    },
    {
      linkId: 'allergies',
      type: 'group',
      text: 'Allergies',
      item: [
        { linkId: 'food-allergies', type: 'text', text: 'Food allergies' },
        { linkId: 'environmental-allergies', type: 'text', text: 'Environmental allergies (pollen, dust, etc.)' },
        { linkId: 'latex-allergy', type: 'boolean', text: 'Latex allergy?' }
      ]
    },
    {
      linkId: 'family-history',
      type: 'group',
      text: 'Family Medical History',
      item: [
        { linkId: 'family-conditions', type: 'text', text: 'Family history of major conditions (heart disease, cancer, diabetes, etc.)' }
      ]
    },
    {
      linkId: 'social-history',
      type: 'group',
      text: 'Social History',
      item: [
        {
          linkId: 'tobacco-use', type: 'choice', text: 'Tobacco use',
          answerOption: [
            { valueString: 'Never' },
            { valueString: 'Former' },
            { valueString: 'Current - occasional' },
            { valueString: 'Current - daily' }
          ]
        },
        {
          linkId: 'alcohol-use', type: 'choice', text: 'Alcohol use',
          answerOption: [
            { valueString: 'Never' },
            { valueString: 'Occasional (1-2 drinks/week)' },
            { valueString: 'Moderate (3-7 drinks/week)' },
            { valueString: 'Heavy (>7 drinks/week)' }
          ]
        },
        {
          linkId: 'exercise', type: 'choice', text: 'Exercise frequency',
          answerOption: [
            { valueString: 'Never' },
            { valueString: '1-2 times/week' },
            { valueString: '3-4 times/week' },
            { valueString: '5+ times/week' }
          ]
        },
        { linkId: 'occupation', type: 'string', text: 'Occupation' }
      ]
    }
  ]
}

// Consent Form Questionnaire
const consentFormQuestionnaire: Questionnaire = {
  resourceType: 'Questionnaire',
  id: 'consent-form',
  status: 'active',
  title: 'Informed Consent',
  description: 'General treatment and privacy consent',
  item: [
    {
      linkId: 'treatment-consent',
      type: 'group',
      text: 'Treatment Consent',
      item: [
        { linkId: 'understand-treatment', type: 'boolean', text: 'I understand the nature of my condition and proposed treatment options', required: true },
        { linkId: 'questions-answered', type: 'boolean', text: 'I have had the opportunity to ask questions about my care', required: true },
        { linkId: 'consent-treatment', type: 'boolean', text: 'I consent to receive medical treatment', required: true }
      ]
    },
    {
      linkId: 'privacy-consent',
      type: 'group',
      text: 'Privacy & HIPAA',
      item: [
        { linkId: 'hipaa-notice', type: 'boolean', text: 'I acknowledge receipt of the Notice of Privacy Practices', required: true },
        { linkId: 'release-info', type: 'boolean', text: 'I authorize release of information to my insurance company for billing purposes', required: true }
      ]
    },
    {
      linkId: 'emergency-contact-consent',
      type: 'group',
      text: 'Emergency Contact Authorization',
      item: [
        { linkId: 'emergency-contact-name', type: 'string', text: 'Emergency Contact Name', required: true },
        { linkId: 'emergency-contact-relationship', type: 'string', text: 'Relationship', required: true },
        { linkId: 'emergency-contact-phone', type: 'string', text: 'Phone Number', required: true },
        { linkId: 'authorize-contact', type: 'boolean', text: 'I authorize this person to receive information about my care if I am unable to communicate', required: true }
      ]
    },
    {
      linkId: 'signature',
      type: 'group',
      text: 'Signature',
      item: [
        { linkId: 'patient-signature', type: 'string', text: 'Patient Signature (Type full legal name)', required: true },
        { linkId: 'signature-date', type: 'date', text: 'Date', required: true }
      ]
    }
  ]
}

// Demographics form state
interface DemographicsData {
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  gender: string
  ssn: string
  preferredLanguage: string
  maritalStatus: string
}

// Contact form state
interface ContactData {
  street: string
  city: string
  state: string
  zipCode: string
  phone: string
  alternatePhone: string
  email: string
}

// Insurance form state
interface InsuranceData {
  insuranceProvider: string
  policyNumber: string
  groupNumber: string
  policyHolderName: string
  policyHolderDob: string
  relationshipToPatient: string
  hasSecondaryInsurance: boolean
  secondaryProvider: string
  secondaryPolicyNumber: string
}

// Admission type
interface AdmissionData {
  admissionType: string
  admissionSource: string
  assignedRoom: string
  attendingPhysician: string
  admitDiagnosis: string
}

export default function PatientAdmitPage() {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Form data states
  const [demographics, setDemographics] = useState<DemographicsData>({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    ssn: '',
    preferredLanguage: 'English',
    maritalStatus: ''
  })

  const [contact, setContact] = useState<ContactData>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    alternatePhone: '',
    email: ''
  })

  const [insurance, setInsurance] = useState<InsuranceData>({
    insuranceProvider: '',
    policyNumber: '',
    groupNumber: '',
    policyHolderName: '',
    policyHolderDob: '',
    relationshipToPatient: 'Self',
    hasSecondaryInsurance: false,
    secondaryProvider: '',
    secondaryPolicyNumber: ''
  })

  const [admission, setAdmission] = useState<AdmissionData>({
    admissionType: 'Inpatient',
    admissionSource: 'Emergency Room',
    assignedRoom: '',
    attendingPhysician: '',
    admitDiagnosis: ''
  })

  const [intakeResponse, setIntakeResponse] = useState<QuestionnaireResponse | null>(null)
  const [medicalHistoryResponse, setMedicalHistoryResponse] = useState<QuestionnaireResponse | null>(null)
  const [consentResponse, setConsentResponse] = useState<QuestionnaireResponse | null>(null)

  const currentStep = steps[currentStepIndex]

  // Validation for each step
  const validateStep = useCallback((stepId: StepId): string[] => {
    const errs: string[] = []

    switch (stepId) {
      case 'demographics':
        if (!demographics.firstName) errs.push('First name is required')
        if (!demographics.lastName) errs.push('Last name is required')
        if (!demographics.dateOfBirth) errs.push('Date of birth is required')
        if (!demographics.gender) errs.push('Gender is required')
        break
      case 'contact':
        if (!contact.phone) errs.push('Phone number is required')
        if (!contact.street) errs.push('Street address is required')
        if (!contact.city) errs.push('City is required')
        if (!contact.state) errs.push('State is required')
        if (!contact.zipCode) errs.push('ZIP code is required')
        break
      case 'insurance':
        if (!insurance.insuranceProvider) errs.push('Insurance provider is required')
        if (!insurance.policyNumber) errs.push('Policy number is required')
        break
    }

    return errs
  }, [demographics, contact, insurance])

  const handleNext = () => {
    const validationErrors = validateStep(currentStep.id)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setErrors([])
    setCurrentStepIndex(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors([])

    try {
      // Build patient resource
      const patientData: Partial<Patient> = {
        resourceType: 'Patient',
        name: [{
          use: 'official',
          family: demographics.lastName,
          given: [demographics.firstName, demographics.middleName].filter(Boolean)
        }],
        birthDate: demographics.dateOfBirth,
        gender: demographics.gender as 'male' | 'female' | 'other' | 'unknown',
        telecom: [
          { system: 'phone', value: contact.phone, use: 'home' },
          contact.email && { system: 'email', value: contact.email }
        ].filter(Boolean) as any,
        address: [{
          use: 'home',
          line: [contact.street],
          city: contact.city,
          state: contact.state,
          postalCode: contact.zipCode
        }],
        maritalStatus: demographics.maritalStatus ? {
          coding: [{ display: demographics.maritalStatus }]
        } : undefined,
        communication: [{
          language: { coding: [{ display: demographics.preferredLanguage }] },
          preferred: true
        }]
      }

      // Call API to create patient
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: patientData,
          admission,
          insurance,
          intakeResponse,
          medicalHistoryResponse,
          consentResponse
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create patient')
      }

      const result = await response.json()

      // Navigate to the new patient's chart
      router.push(`/patients/${result.patientId}`)
    } catch (error) {
      console.error('Admission error:', error)
      setErrors(['Failed to complete admission. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'demographics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <input
                  type="text"
                  value={demographics.firstName}
                  onChange={(e) => setDemographics(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Middle Name</label>
                <input
                  type="text"
                  value={demographics.middleName}
                  onChange={(e) => setDemographics(prev => ({ ...prev, middleName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Middle name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <input
                  type="text"
                  value={demographics.lastName}
                  onChange={(e) => setDemographics(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={demographics.dateOfBirth}
                  onChange={(e) => setDemographics(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender *</label>
                <select
                  value={demographics.gender}
                  onChange={(e) => setDemographics(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="unknown">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SSN (last 4 digits)</label>
                <input
                  type="text"
                  value={demographics.ssn}
                  onChange={(e) => setDemographics(prev => ({ ...prev, ssn: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="XXXX"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Language</label>
                <select
                  value={demographics.preferredLanguage}
                  onChange={(e) => setDemographics(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Vietnamese">Vietnamese</option>
                  <option value="Korean">Korean</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Marital Status</label>
                <select
                  value={demographics.maritalStatus}
                  onChange={(e) => setDemographics(prev => ({ ...prev, maritalStatus: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Street Address *</label>
              <input
                type="text"
                value={contact.street}
                onChange={(e) => setContact(prev => ({ ...prev, street: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  value={contact.city}
                  onChange={(e) => setContact(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State *</label>
                <input
                  type="text"
                  value={contact.state}
                  onChange={(e) => setContact(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                <input
                  type="text"
                  value={contact.zipCode}
                  onChange={(e) => setContact(prev => ({ ...prev, zipCode: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="12345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alternate Phone</label>
                <input
                  type="tel"
                  value={contact.alternatePhone}
                  onChange={(e) => setContact(prev => ({ ...prev, alternatePhone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="patient@email.com"
              />
            </div>
          </div>
        )

      case 'insurance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Insurance Provider *</label>
                <select
                  value={insurance.insuranceProvider}
                  onChange={(e) => setInsurance(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select provider</option>
                  <option value="Blue Cross Blue Shield">Blue Cross Blue Shield</option>
                  <option value="United Healthcare">United Healthcare</option>
                  <option value="Aetna">Aetna</option>
                  <option value="Cigna">Cigna</option>
                  <option value="Medicare">Medicare</option>
                  <option value="Medicaid">Medicaid</option>
                  <option value="Kaiser Permanente">Kaiser Permanente</option>
                  <option value="Humana">Humana</option>
                  <option value="Self-Pay">Self-Pay</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Policy Number *</label>
                <input
                  type="text"
                  value={insurance.policyNumber}
                  onChange={(e) => setInsurance(prev => ({ ...prev, policyNumber: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Policy number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Group Number</label>
                <input
                  type="text"
                  value={insurance.groupNumber}
                  onChange={(e) => setInsurance(prev => ({ ...prev, groupNumber: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Group number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Relationship to Policy Holder</label>
                <select
                  value={insurance.relationshipToPatient}
                  onChange={(e) => setInsurance(prev => ({ ...prev, relationshipToPatient: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Self">Self</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {insurance.relationshipToPatient !== 'Self' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Policy Holder Name</label>
                  <input
                    type="text"
                    value={insurance.policyHolderName}
                    onChange={(e) => setInsurance(prev => ({ ...prev, policyHolderName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Policy holder name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Policy Holder DOB</label>
                  <input
                    type="date"
                    value={insurance.policyHolderDob}
                    onChange={(e) => setInsurance(prev => ({ ...prev, policyHolderDob: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={insurance.hasSecondaryInsurance}
                  onChange={(e) => setInsurance(prev => ({ ...prev, hasSecondaryInsurance: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm font-medium">Patient has secondary insurance</span>
              </label>
            </div>

            {insurance.hasSecondaryInsurance && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-1">Secondary Provider</label>
                  <input
                    type="text"
                    value={insurance.secondaryProvider}
                    onChange={(e) => setInsurance(prev => ({ ...prev, secondaryProvider: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Secondary insurance provider"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Secondary Policy Number</label>
                  <input
                    type="text"
                    value={insurance.secondaryPolicyNumber}
                    onChange={(e) => setInsurance(prev => ({ ...prev, secondaryPolicyNumber: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Policy number"
                  />
                </div>
              </div>
            )}
          </div>
        )

      case 'intake':
        return (
          <QuestionnaireRenderer
            questionnaire={intakeFormQuestionnaire}
            onResponseChange={setIntakeResponse}
            onSubmit={(response) => {
              setIntakeResponse(response)
              handleNext()
            }}
            showAISuggestions={false}
          />
        )

      case 'medical-history':
        return (
          <QuestionnaireRenderer
            questionnaire={medicalHistoryQuestionnaire}
            onResponseChange={setMedicalHistoryResponse}
            onSubmit={(response) => {
              setMedicalHistoryResponse(response)
              handleNext()
            }}
            showAISuggestions={false}
          />
        )

      case 'consent':
        return (
          <QuestionnaireRenderer
            questionnaire={consentFormQuestionnaire}
            onResponseChange={setConsentResponse}
            onSubmit={(response) => {
              setConsentResponse(response)
              handleNext()
            }}
            showAISuggestions={false}
          />
        )

      case 'review':
        return (
          <div className="space-y-6">
            {/* Admission Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Admission Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Admission Type</label>
                    <select
                      value={admission.admissionType}
                      onChange={(e) => setAdmission(prev => ({ ...prev, admissionType: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Inpatient">Inpatient</option>
                      <option value="Observation">Observation</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Outpatient">Outpatient</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Admission Source</label>
                    <select
                      value={admission.admissionSource}
                      onChange={(e) => setAdmission(prev => ({ ...prev, admissionSource: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Emergency Room">Emergency Room</option>
                      <option value="Direct Admission">Direct Admission</option>
                      <option value="Transfer">Transfer from another facility</option>
                      <option value="Physician Referral">Physician Referral</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Assigned Room</label>
                    <input
                      type="text"
                      value={admission.assignedRoom}
                      onChange={(e) => setAdmission(prev => ({ ...prev, assignedRoom: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g., Room 412"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Attending Physician</label>
                    <select
                      value={admission.attendingPhysician}
                      onChange={(e) => setAdmission(prev => ({ ...prev, attendingPhysician: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select physician</option>
                      <option value="Dr. Sarah Chen">Dr. Sarah Chen</option>
                      <option value="Dr. Michael Rodriguez">Dr. Michael Rodriguez</option>
                      <option value="Dr. Emily Watson">Dr. Emily Watson</option>
                      <option value="Dr. James Park">Dr. James Park</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Admit Diagnosis</label>
                  <input
                    type="text"
                    value={admission.admitDiagnosis}
                    onChange={(e) => setAdmission(prev => ({ ...prev, admitDiagnosis: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Primary admission diagnosis"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Patient Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Demographics</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {demographics.firstName} {demographics.middleName} {demographics.lastName}</p>
                      <p><span className="font-medium">DOB:</span> {demographics.dateOfBirth}</p>
                      <p><span className="font-medium">Gender:</span> {demographics.gender}</p>
                      <p><span className="font-medium">Language:</span> {demographics.preferredLanguage}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Contact</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Phone:</span> {contact.phone}</p>
                      <p><span className="font-medium">Email:</span> {contact.email || 'Not provided'}</p>
                      <p><span className="font-medium">Address:</span> {contact.street}, {contact.city}, {contact.state} {contact.zipCode}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Insurance</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Provider:</span> {insurance.insuranceProvider}</p>
                      <p><span className="font-medium">Policy #:</span> {insurance.policyNumber}</p>
                      <p><span className="font-medium">Group #:</span> {insurance.groupNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Forms Completed</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {intakeResponse ? <Check className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                        <span className="text-sm">Intake Form</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {medicalHistoryResponse ? <Check className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                        <span className="text-sm">Medical History</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {consentResponse ? <Check className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                        <span className="text-sm">Consent Form</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/patients')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Patients
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Admit New Patient
            </h1>
            <p className="text-muted-foreground">Complete all intake forms to register a new patient</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${index < currentStepIndex
                    ? 'bg-green-600 border-green-600 text-white'
                    : index === currentStepIndex
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
              >
                {index < currentStepIndex ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-full h-1 mx-2 ${index < currentStepIndex ? 'bg-green-600' : 'bg-slate-200'
                    }`}
                  style={{ width: '60px' }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`text-xs text-center ${index === currentStepIndex ? 'text-blue-600 font-medium' : 'text-muted-foreground'
                }`}
              style={{ width: '80px' }}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertCircle className="h-4 w-4" />
            Please fix the following errors:
          </div>
          <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep.icon}
            {currentStep.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{currentStep.description}</p>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className={currentStepIndex === 0 ? 'invisible' : ''}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {['intake', 'medical-history', 'consent'].includes(currentStep.id) ? (
            /* For questionnaire steps, the Next action is handled by the QuestionnaireRenderer's onSubmit */
            /* We can optionally show a disabled Next button or nothing. 
               Let's show nothing to avoid confusion, as the user must complete the form. */
            <div />
          ) : currentStep.id === 'review' ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Admission
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
