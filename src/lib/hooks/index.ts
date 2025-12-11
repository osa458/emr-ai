// FHIR React Hooks
// Comprehensive hooks for working with FHIR resources using TanStack Query

export {
  // Core hooks
  useFHIRResource,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  
  // Patient hooks
  usePatient,
  usePatientSearch,
  
  // Encounter hooks
  useEncounter,
  usePatientEncounters,
  useCurrentEncounter,
  
  // Clinical data hooks
  useObservations,
  useVitals,
  useLabs,
  useConditions,
  useMedications,
  
  // Appointment hooks
  useAppointments,
  usePatientAppointments,
  
  // Document hooks
  useDocuments,
  usePatientDocuments,
  
  // Questionnaire hooks
  useQuestionnaires,
  useQuestionnaire,
  useQuestionnaireResponses,
  useQuestionnaireForm
} from './useFHIR'
