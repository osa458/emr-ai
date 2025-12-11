// Base Components - Inspired by Beda EMR patterns
// Reusable, FHIR-aware components built on shadcn/ui

export { 
  SearchBar, 
  patientFilters, 
  encounterFilters, 
  appointmentFilters, 
  documentFilters,
  type SearchFilterConfig,
  type ActiveFilter,
  type SearchBarProps
} from './SearchBar'

export { 
  ResourceTable, 
  patientColumns, 
  encounterColumns, 
  appointmentColumns, 
  documentColumns,
  viewAction,
  editAction,
  deleteAction,
  type ColumnDef,
  type RowAction,
  type ResourceTableProps
} from './ResourceTable'

export { 
  Calendar,
  type CalendarEvent,
  type CalendarProps
} from './Calendar'

export { 
  AudioRecorder,
  type AudioRecording,
  type AudioRecorderProps
} from './AudioRecorder'

export { 
  RichTextEditor,
  type RichTextEditorProps
} from './RichTextEditor'

export { 
  ChangesDiff,
  compareFHIRResources,
  type DiffLine,
  type VersionInfo,
  type ChangesDiffProps
} from './ChangesDiff'
