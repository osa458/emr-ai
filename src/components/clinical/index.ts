// Clinical components inspired by Beda EMR patterns
// MIT Licensed - integrated from @beda.software/fhir-emr concepts

export { TextWithMacro, defaultMacros, type MacroTemplate } from './TextWithMacro'
export { PrescriptionPanel, type Prescription } from './PrescriptionPanel'
export { EncounterTimeline, type TimelineEvent } from './EncounterTimeline'
export { DocumentsList, type ClinicalDocument } from './DocumentsList'
export { ChartingPanel, type VitalReading } from './ChartingPanel'
export { ReportGenerator, type ReportType, type ReportTemplate } from './ReportGenerator'

// Re-export existing clinical components
export { RealTimeVitals } from './RealTimeVitals'
export { ClinicalNotes } from './ClinicalNotes'
