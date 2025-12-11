'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  User,
  Calendar,
  SortAsc,
  Plus,
  Edit,
  Save,
  X,
  Clock,
  FileSignature,
  Copy,
  AlertTriangle,
  History,
  UserCheck,
  FilePlus,
  Sparkles,
  FileEdit,
} from 'lucide-react'
import { SOAPNoteEditor } from './SOAPNoteEditor'

interface NoteVersion {
  id: string
  content: string
  author: string
  date: Date
  action: 'created' | 'edited' | 'cosigned' | 'attested' | 'addendum'
}

interface Addendum {
  id: string
  author: string
  authorRole: string
  date: Date
  content: string
}

interface Note {
  id: string
  type: string
  service: string
  title: string
  author: string
  authorRole: string
  date: Date
  content: string
  status: 'draft' | 'pended' | 'signed'
  isSmartNote?: boolean // Track if note was created with smart builder
  versions?: NoteVersion[]
  cosigners?: { name: string; role: string; date: Date }[]
  attestations?: { name: string; role: string; date: Date }[]
  addendums?: Addendum[]
}

interface NotesPanelProps {
  patientId: string
}

// Services list
const services = [
  'Hospitalist',
  'Cardiology',
  'Case Manager/Care Coordinator',
  'Critical Care Medicine',
  'Dialysis',
  'Dietitian, Registered',
  'Gastroenterology',
  'Heart Failure',
  'Infectious Disease',
  'Nephrology',
  'Occupational Therapy',
  'Oncology and Hematology',
  'Palliative Care',
  'Pharmacist',
  'Physical Therapy',
  'Pulmonary Medicine',
  'Registered Nurse',
  'Social Work',
  'Urology',
]

// Note types
const noteTypes = [
  'Progress Note',
  'H&P',
  'Consult Note',
  'Discharge Summary',
  'Procedure Note',
  'Nursing Note',
  'Therapy Note',
]

// Plain text note templates
const plainTextTemplates: Record<string, string> = {
  hp: `HISTORY AND PHYSICAL

PATIENT: ***Patient Name***
MRN: ***MRN***
DATE: ${new Date().toLocaleDateString()}
ATTENDING: ***Attending Name***

CHIEF COMPLAINT:
***Chief complaint***

HISTORY OF PRESENT ILLNESS:
***Age*** year old ***male/female*** with PMH of ***medical history*** presenting with ***presenting complaint***.

***HPI details - onset, duration, severity, quality, associated symptoms, aggravating/alleviating factors***

REVIEW OF SYSTEMS:
Constitutional: ***
HEENT: ***
CV: ***
Respiratory: ***
GI: ***
GU: ***
MSK: ***
Neuro: ***
Psych: ***
All other systems reviewed and negative unless noted above.

PAST MEDICAL HISTORY:
***List conditions***

PAST SURGICAL HISTORY:
***List surgeries***

FAMILY HISTORY:
***Relevant family history***

SOCIAL HISTORY:
- Smoking: ***current/former/never, pack-years***
- Alcohol: ***use***
- Drugs: ***use***
- Living situation: ***
- Occupation: ***

ALLERGIES:
***NKDA or list allergies with reactions***

HOME MEDICATIONS:
***List home medications***

PHYSICAL EXAMINATION:
Vitals: T ***, HR ***, BP ***/***, RR ***, SpO2 *** on ***
General: ***
HEENT: ***
Neck: ***
CV: ***
Lungs: ***
Abdomen: ***
Extremities: ***
Neuro: ***
Skin: ***

LABS:
***Include relevant labs***

IMAGING:
***Include relevant imaging***

ASSESSMENT AND PLAN:
***Age*** year old ***male/female*** with ***PMH*** admitted for ***diagnosis***.

1. ***Problem 1***
   - ***Plan***

2. ***Problem 2***
   - ***Plan***

3. ***Problem 3***
   - ***Plan***

PROPHYLAXIS:
- DVT: ***
- GI: ***

CODE STATUS: ***Full code / DNR/DNI***
DISPOSITION: ***

_______________________________________________
***Provider Name, Credentials***
`,

  progress: `PROGRESS NOTE

DATE: ${new Date().toLocaleDateString()}
HOSPITAL DAY #: ***

SUBJECTIVE:
Patient reports ***symptoms/complaints***.
Overnight events: ***

OBJECTIVE:
Vitals: T ***, HR ***, BP ***/***, RR ***, SpO2 *** on ***
I/O (24h): ***mL in / ***mL out, Net ***mL

Physical Exam:
General: ***
CV: ***
Lungs: ***
Abdomen: ***
Extremities: ***

Labs:
***Today's labs***

Imaging:
***Any new imaging***

ASSESSMENT AND PLAN:
***Age*** y/o ***M/F*** with ***PMH*** admitted for *** (HD#***).

1. ***Problem 1***
   - ***Plan***

2. ***Problem 2***
   - ***Plan***

DIET: ***
PROPHYLAXIS: DVT - ***, GI - ***
CODE STATUS: ***
DISPOSITION: ***

_______________________________________________
***Provider Name, Credentials***
`,

  discharge: `DISCHARGE SUMMARY

PATIENT: ***Patient Name***
MRN: ***MRN***
ADMISSION DATE: ***
DISCHARGE DATE: ${new Date().toLocaleDateString()}
ATTENDING: ***Attending Name***
LENGTH OF STAY: *** days

PRIMARY DIAGNOSIS:
***Primary diagnosis***

SECONDARY DIAGNOSES:
***List secondary diagnoses***

BRIEF HOSPITAL COURSE:
***Age*** year old ***male/female*** with PMH of ***medical history*** who presented with ***presenting complaint***. 

***Summary of hospital course by problem***

PROCEDURES PERFORMED:
***List procedures or "None"***

DISCHARGE CONDITION:
***Stable/Improved***

DISCHARGE MEDICATIONS:
***List all discharge medications with doses, routes, frequencies***

MEDICATIONS CHANGED:
- NEW: ***
- DISCONTINUED: ***
- CHANGED: ***

FOLLOW-UP APPOINTMENTS:
- PCP: ***Provider*** on ***date***
- Specialist: ***Provider*** on ***date***

DISCHARGE INSTRUCTIONS:
1. ***Instructions***
2. Activity: ***
3. Diet: ***
4. Return to ED if: ***warning signs***

PENDING RESULTS AT DISCHARGE:
***List pending labs/studies or "None"***

_______________________________________________
***Provider Name, Credentials***
`,
}

// Generate mock notes
function generateMockNotes(): Note[] {
  const notes: Note[] = []
  const now = new Date()
  
  // Generate notes for various services
  const noteData = [
    { service: 'Hospitalist', author: 'Dr. Sarah Johnson', role: 'Attending Physician', type: 'Progress Note', daysAgo: 0 },
    { service: 'Hospitalist', author: 'Dr. Sarah Johnson', role: 'Attending Physician', type: 'Progress Note', daysAgo: 1 },
    { service: 'Hospitalist', author: 'Dr. Sarah Johnson', role: 'Attending Physician', type: 'H&P', daysAgo: 3 },
    { service: 'Cardiology', author: 'Dr. Michael Chen', role: 'Cardiologist', type: 'Consult Note', daysAgo: 2 },
    { service: 'Cardiology', author: 'Dr. Michael Chen', role: 'Cardiologist', type: 'Progress Note', daysAgo: 1 },
    { service: 'Heart Failure', author: 'Dr. Emily Rodriguez', role: 'CHF Specialist', type: 'Consult Note', daysAgo: 2 },
    { service: 'Nephrology', author: 'Dr. Robert Kim', role: 'Nephrologist', type: 'Consult Note', daysAgo: 1 },
    { service: 'Case Manager/Care Coordinator', author: 'Jennifer Williams', role: 'Case Manager', type: 'Progress Note', daysAgo: 0 },
    { service: 'Case Manager/Care Coordinator', author: 'Jennifer Williams', role: 'Case Manager', type: 'Progress Note', daysAgo: 1 },
    { service: 'Dietitian, Registered', author: 'Amanda Foster', role: 'RD', type: 'Progress Note', daysAgo: 1 },
    { service: 'Physical Therapy', author: 'Mark Stevens', role: 'PT', type: 'Therapy Note', daysAgo: 0 },
    { service: 'Physical Therapy', author: 'Mark Stevens', role: 'PT', type: 'Therapy Note', daysAgo: 1 },
    { service: 'Occupational Therapy', author: 'Lisa Chen', role: 'OT', type: 'Therapy Note', daysAgo: 0 },
    { service: 'Registered Nurse', author: 'Mary Thompson', role: 'RN', type: 'Nursing Note', daysAgo: 0 },
    { service: 'Registered Nurse', author: 'John Davis', role: 'RN', type: 'Nursing Note', daysAgo: 0 },
    { service: 'Social Work', author: 'Patricia Moore', role: 'LCSW', type: 'Progress Note', daysAgo: 1 },
    { service: 'Pharmacist', author: 'David Lee', role: 'PharmD', type: 'Progress Note', daysAgo: 0 },
    { service: 'Palliative Care', author: 'Dr. Nancy White', role: 'Palliative Physician', type: 'Consult Note', daysAgo: 2 },
    { service: 'Pulmonary Medicine', author: 'Dr. James Brown', role: 'Pulmonologist', type: 'Consult Note', daysAgo: 1 },
    { service: 'Infectious Disease', author: 'Dr. Karen Taylor', role: 'ID Physician', type: 'Consult Note', daysAgo: 2 },
  ]

  noteData.forEach((data, idx) => {
    const noteDate = new Date(now)
    noteDate.setDate(noteDate.getDate() - data.daysAgo)
    noteDate.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))
    
    notes.push({
      id: `note-${idx}`,
      type: data.type,
      service: data.service,
      title: `${data.type} - ${data.service}`,
      author: data.author,
      authorRole: data.role,
      date: noteDate,
      content: generateNoteContent(data.service, data.type),
      status: 'signed',
    })
  })

  return notes.sort((a, b) => b.date.getTime() - a.date.getTime())
}

function generateNoteContent(service: string, type: string): string {
  const templates: Record<string, string> = {
    'Hospitalist': `SUBJECTIVE: Patient reports improved symptoms. Slept well overnight.\n\nOBJECTIVE: Vitals stable. Exam unchanged.\n\nASSESSMENT/PLAN:\n1. Continue current management\n2. Monitor for changes`,
    'Cardiology': `CARDIOLOGY CONSULT NOTE\n\nReason: Heart failure management\n\nRecommendations:\n1. Continue diuresis\n2. Optimize GDMT\n3. Echo before discharge`,
    'Heart Failure': `CHF CLINIC FOLLOW-UP\n\nAssessment: Acute on chronic HFrEF\n\nPlan:\n1. Diuresis to euvolemia\n2. Restart home medications\n3. Clinic follow-up in 1 week`,
    'Case Manager/Care Coordinator': `CASE MANAGEMENT NOTE\n\nDischarge planning in progress.\nFamily meeting completed.\nSNF referral initiated.`,
    'Physical Therapy': `PT EVALUATION\n\nMobility: Ambulates 50ft with rolling walker\nBalance: Fair\nGoal: Independent ambulation for discharge`,
    'Registered Nurse': `NURSING ASSESSMENT\n\nPatient comfortable. Pain controlled.\nI/O: 1200/1800\nFalls risk: Moderate`,
  }
  return templates[service] || `${type} for ${service}\n\nDocumentation pending.`
}

type SortBy = 'date' | 'noteType' | 'service' | 'author'

export function NotesPanel({ patientId }: NotesPanelProps) {
  const [sortBy, setSortBy] = useState<SortBy>('service')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [notes, setNotes] = useState<Note[]>(() => generateMockNotes())
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [newNote, setNewNote] = useState({
    type: 'Progress Note',
    service: 'Hospitalist',
    content: '',
  })
  
  // New feature states
  const [showEditModeDialog, setShowEditModeDialog] = useState(false)
  const [useSmartBuilder, setUseSmartBuilder] = useState(true)
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showAddendumEditor, setShowAddendumEditor] = useState(false)
  const [addendumContent, setAddendumContent] = useState('')
  const [showCosignDialog, setShowCosignDialog] = useState(false)
  const [showAttestDialog, setShowAttestDialog] = useState(false)
  
  // Current user (mock)
  const currentUser = { name: 'Dr. Current User', role: 'Physician' }
  
  // Group notes based on sort selection
  const groupedNotes = useMemo(() => {
    const groups: Record<string, Note[]> = {}
    
    notes.forEach(note => {
      let key: string
      switch (sortBy) {
        case 'date':
          key = note.date.toLocaleDateString()
          break
        case 'noteType':
          key = note.type
          break
        case 'author':
          key = note.author
          break
        case 'service':
        default:
          key = note.service
      }
      
      if (!groups[key]) groups[key] = []
      groups[key].push(note)
    })
    
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b).getTime() - new Date(a).getTime()
      }
      return a.localeCompare(b)
    })
    
    return sortedKeys.map(key => ({ key, notes: groups[key] }))
  }, [notes, sortBy])

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedGroups(newExpanded)
  }

  const expandAll = () => setExpandedGroups(new Set(groupedNotes.map(g => g.key)))
  const collapseAll = () => setExpandedGroups(new Set())

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const isOwnNote = (note: Note) => note.author === currentUser.name
  
  const hasOtherEditors = (note: Note) => {
    if (!note.versions) return false
    return note.versions.some(v => v.author !== note.author)
  }

  const handleEdit = () => {
    if (selectedNote) {
      // If note was created with smart builder (or is signed/pended), show edit mode dialog
      if (selectedNote.status === 'signed' || selectedNote.status === 'pended') {
        // For signed/pended notes, always show the edit mode dialog
        setShowEditModeDialog(true)
      } else if (selectedNote.isSmartNote) {
        // Draft smart notes also show dialog
        setShowEditModeDialog(true)
      } else {
        // Plain text draft notes go straight to plain text edit
        setEditContent(selectedNote.content)
        setIsEditing(true)
        setIsCreating(false)
      }
    }
  }
  
  const handleEditModeSelect = (mode: 'smart' | 'plain') => {
    setShowEditModeDialog(false)
    if (selectedNote) {
      if (mode === 'smart') {
        setUseSmartBuilder(true)
        setIsCreating(true) // Reuse creating state for smart builder
        setIsEditing(false)
      } else {
        setUseSmartBuilder(false)
        setEditContent(selectedNote.content)
        setIsEditing(true)
        setIsCreating(false)
      }
    }
  }
  
  const handleCopyNote = (noteToCopy: Note) => {
    setNewNote({
      type: noteToCopy.type,
      service: noteToCopy.service,
      content: noteToCopy.content,
    })
    setShowCopyDialog(false)
    setIsCreating(true)
    setSelectedNote(null)
  }
  
  const handleAddAddendum = () => {
    if (selectedNote && addendumContent.trim()) {
      const addendum: Addendum = {
        id: `addendum-${Date.now()}`,
        author: currentUser.name,
        authorRole: currentUser.role,
        date: new Date(),
        content: addendumContent,
      }
      const updatedNotes = notes.map(n => 
        n.id === selectedNote.id 
          ? { ...n, addendums: [...(n.addendums || []), addendum] }
          : n
      )
      setNotes(updatedNotes)
      setSelectedNote({ ...selectedNote, addendums: [...(selectedNote.addendums || []), addendum] })
      setAddendumContent('')
      setShowAddendumEditor(false)
    }
  }
  
  const handleCosign = () => {
    if (selectedNote) {
      const cosigner = { name: currentUser.name, role: currentUser.role, date: new Date() }
      const version: NoteVersion = {
        id: `v-${Date.now()}`,
        content: selectedNote.content,
        author: currentUser.name,
        date: new Date(),
        action: 'cosigned',
      }
      const updatedNotes = notes.map(n => 
        n.id === selectedNote.id 
          ? { 
              ...n, 
              cosigners: [...(n.cosigners || []), cosigner],
              versions: [...(n.versions || []), version]
            }
          : n
      )
      setNotes(updatedNotes)
      setSelectedNote({ 
        ...selectedNote, 
        cosigners: [...(selectedNote.cosigners || []), cosigner],
        versions: [...(selectedNote.versions || []), version]
      })
      setShowCosignDialog(false)
    }
  }
  
  const handleAttest = () => {
    if (selectedNote) {
      const attestation = { name: currentUser.name, role: currentUser.role, date: new Date() }
      const version: NoteVersion = {
        id: `v-${Date.now()}`,
        content: selectedNote.content,
        author: currentUser.name,
        date: new Date(),
        action: 'attested',
      }
      const updatedNotes = notes.map(n => 
        n.id === selectedNote.id 
          ? { 
              ...n, 
              attestations: [...(n.attestations || []), attestation],
              versions: [...(n.versions || []), version]
            }
          : n
      )
      setNotes(updatedNotes)
      setSelectedNote({ 
        ...selectedNote, 
        attestations: [...(selectedNote.attestations || []), attestation],
        versions: [...(selectedNote.versions || []), version]
      })
      setShowAttestDialog(false)
    }
  }

  const handleSaveEdit = (status: 'draft' | 'pended' | 'signed') => {
    if (selectedNote) {
      const version: NoteVersion = {
        id: `v-${Date.now()}`,
        content: selectedNote.content, // Save previous content
        author: currentUser.name,
        date: new Date(),
        action: 'edited',
      }
      const updatedNotes = notes.map(n => 
        n.id === selectedNote.id 
          ? { 
              ...n, 
              content: editContent, 
              status, 
              date: new Date(),
              versions: [...(n.versions || []), version]
            }
          : n
      )
      setNotes(updatedNotes)
      setSelectedNote({ 
        ...selectedNote, 
        content: editContent, 
        status, 
        date: new Date(),
        versions: [...(selectedNote.versions || []), version]
      })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent('')
  }

  const handleCreateNew = (useSmartBuilderParam = true) => {
    setUseSmartBuilder(useSmartBuilderParam)
    setIsCreating(true)
    setIsEditing(false)
    setSelectedNote(null)
    setNewNote({ type: 'Progress Note', service: 'Hospitalist', content: '' })
  }

  const handleSaveNew = (status: 'draft' | 'pended' | 'signed') => {
    const note: Note = {
      id: `note-${Date.now()}`,
      type: newNote.type,
      service: newNote.service,
      title: `${newNote.type} - ${newNote.service}`,
      author: 'Dr. Current User',
      authorRole: 'Physician',
      date: new Date(),
      content: newNote.content,
      status,
      isSmartNote: useSmartBuilder, // Track if created with smart builder
    }
    setNotes([note, ...notes])
    setSelectedNote(note)
    setIsCreating(false)
    setNewNote({ type: 'Progress Note', service: 'Hospitalist', content: '' })
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setNewNote({ type: 'Progress Note', service: 'Hospitalist', content: '' })
  }

  const getStatusBadge = (status: Note['status']) => {
    switch (status) {
      case 'signed':
        return <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-green-50 text-green-700 border-green-200">Signed</Badge>
      case 'pended':
        return <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-yellow-50 text-yellow-700 border-yellow-200">Pended</Badge>
      case 'draft':
        return <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-gray-50 text-gray-600 border-gray-200">Draft</Badge>
    }
  }

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Left Panel - Notes List */}
      <Card className="w-[400px] flex flex-col overflow-hidden">
        <CardHeader className="pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Notes ({notes.length})
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="default" size="sm" onClick={() => handleCreateNew(true)} className="h-7 px-2" title="Smart Builder">
                <Sparkles className="h-3 w-3 mr-1" /> New
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCreateNew(false)} className="h-7 px-2" title="Plain Text">
                <FileEdit className="h-3 w-3 mr-1" /> Plain
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCopyDialog(true)} title="Copy Previous Note" className="h-7 w-7 p-0">
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={expandAll} title="Expand All" className="h-7 w-7 p-0">
                <ChevronsDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAll} title="Collapse All" className="h-7 w-7 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <SortAsc className="h-3 w-3" /> Sort:
            </span>
            <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <TabsList className="h-7">
                <TabsTrigger value="date" className="text-xs px-2 h-5">Date</TabsTrigger>
                <TabsTrigger value="noteType" className="text-xs px-2 h-5">Note Type</TabsTrigger>
                <TabsTrigger value="service" className="text-xs px-2 h-5 font-semibold">Service</TabsTrigger>
                <TabsTrigger value="author" className="text-xs px-2 h-5">Author</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 overflow-y-auto">
          <div className="divide-y">
            {groupedNotes.map(group => (
              <div key={group.key}>
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedGroups.has(group.key) ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    )}
                    <span className="font-medium text-sm">{group.key}</span>
                    <Badge variant="secondary" className="text-xs">{group.notes.length}</Badge>
                  </div>
                  <ChevronsDown className="h-4 w-4 text-blue-500" />
                </button>
                
                {expandedGroups.has(group.key) && (
                  <div className="bg-white">
                    {group.notes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => { setSelectedNote(note); setIsEditing(false); setIsCreating(false); }}
                        className={`w-full text-left px-4 py-2 border-l-4 hover:bg-blue-50 transition-colors ${
                          selectedNote?.id === note.id ? 'bg-blue-50 border-l-blue-500' : 'border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{note.type}</span>
                              {getStatusBadge(note.status)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <User className="h-3 w-3" />{note.author}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                            <div>{formatDate(note.date)}</div>
                            <div>{formatTime(note.date)}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Right Panel - Note Content/Edit */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {isCreating && useSmartBuilder ? (
          <SOAPNoteEditor 
            patientId={patientId}
            onSave={(note, status) => {
              const newNoteObj: Note = {
                id: `note-${Date.now()}`,
                type: note.type,
                service: note.service,
                title: `${note.type} - ${note.service}`,
                author: currentUser.name,
                authorRole: currentUser.role,
                date: new Date(),
                content: note.content,
                status,
                versions: [{ id: 'v-1', content: note.content, author: currentUser.name, date: new Date(), action: 'created' }],
              }
              setNotes([newNoteObj, ...notes])
              setSelectedNote(newNoteObj)
              setIsCreating(false)
            }}
            onCancel={handleCancelCreate}
          />
        ) : isCreating && !useSmartBuilder ? (
          /* Plain Text Note Creation */
          <>
            <CardHeader className="pb-2 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileEdit className="h-4 w-4" /> New Note (Plain Text)
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCancelCreate}><X className="h-4 w-4" /></Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Select value={newNote.type} onValueChange={v => setNewNote({...newNote, type: v})}>
                  <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {noteTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={newNote.service} onValueChange={v => setNewNote({...newNote, service: v})}>
                  <SelectTrigger className="w-48 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Template buttons */}
              <div className="flex gap-2 mt-2">
                <span className="text-xs text-muted-foreground self-center">Templates:</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setNewNote({...newNote, type: 'H&P', content: plainTextTemplates.hp})}>
                  H&P
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setNewNote({...newNote, type: 'Progress Note', content: plainTextTemplates.progress})}>
                  Progress Note
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setNewNote({...newNote, type: 'Discharge Summary', content: plainTextTemplates.discharge})}>
                  Discharge Summary
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
              {/* Snippet help */}
              <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-xs text-blue-800">
                <strong>Tip:</strong> Use <code className="bg-blue-100 px-1 rounded">***text***</code> for placeholders. Press <kbd className="px-1 py-0.5 bg-blue-200 rounded">F2</kbd> to jump between them. Cannot sign with unfilled placeholders.
              </div>
              <textarea
                className="flex-1 w-full p-3 border rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newNote.content}
                onChange={e => setNewNote({...newNote, content: e.target.value})}
                placeholder="Enter note content... Use ***placeholder*** for fields to fill."
              />
              <div className="flex justify-between mt-3">
                <div className="text-xs text-muted-foreground self-center">
                  {newNote.content.includes('***') && (
                    <span className="text-amber-600">⚠️ {Math.floor((newNote.content.match(/\*\*\*/g) || []).length / 2)} placeholder(s) remaining</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSaveNew('draft')}><Save className="h-3 w-3 mr-1" /> Draft</Button>
                  <Button variant="outline" size="sm" onClick={() => handleSaveNew('pended')} className="text-yellow-700"><Clock className="h-3 w-3 mr-1" /> Pend</Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleSaveNew('signed')} 
                    className={newNote.content.includes('***') ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}
                    disabled={newNote.content.includes('***')}
                  >
                    <FileSignature className="h-3 w-3 mr-1" /> Sign
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : selectedNote ? (
          <>
            <CardHeader className="pb-2 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{selectedNote.type}</CardTitle>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">{selectedNote.author}</span>
                    <span className="mx-1">•</span>
                    <span>{selectedNote.authorRole}</span>
                    <span className="mx-1">•</span>
                    <span>{selectedNote.service}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selectedNote.date)} at {formatTime(selectedNote.date)}
                    {getStatusBadge(selectedNote.status)}
                    {selectedNote.versions && selectedNote.versions.length > 1 && (
                      <Badge variant="outline" className="text-[10px] cursor-pointer" onClick={() => setShowVersionHistory(true)}>
                        <History className="h-2 w-2 mr-1" /> {selectedNote.versions.length} versions
                      </Badge>
                    )}
                  </div>
                  {/* Cosigners & Attestations */}
                  {(selectedNote.cosigners?.length || selectedNote.attestations?.length) && (
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                      {selectedNote.cosigners?.map((c, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] bg-blue-50 text-blue-700">
                          <UserCheck className="h-2 w-2 mr-1" /> Cosigned: {c.name}
                        </Badge>
                      ))}
                      {selectedNote.attestations?.map((a, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] bg-purple-50 text-purple-700">
                          <UserCheck className="h-2 w-2 mr-1" /> Attested: {a.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={handleEdit}><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                    {selectedNote.status === 'signed' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setShowAddendumEditor(true)}><FilePlus className="h-3 w-3 mr-1" /> Addendum</Button>
                        <Button variant="outline" size="sm" onClick={() => setShowCosignDialog(true)}><UserCheck className="h-3 w-3 mr-1" /> Cosign</Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
              {/* Warning if editing someone else's note */}
              {isEditing && !isOwnNote(selectedNote) && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mb-3 flex items-center gap-2 text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span><strong>Warning:</strong> You are editing a note authored by {selectedNote.author}. Your edits will be tracked.</span>
                </div>
              )}
              {/* Version history warning */}
              {isEditing && hasOtherEditors(selectedNote) && (
                <div className="bg-blue-50 border border-blue-300 rounded p-2 mb-3 flex items-center gap-2 text-sm text-blue-800">
                  <History className="h-4 w-4" />
                  <span>This note has been edited by other users. <button className="underline font-medium" onClick={() => setShowVersionHistory(true)}>View version history</button></span>
                </div>
              )}
              {isEditing ? (
                <>
                  <textarea
                    className="flex-1 w-full p-3 border rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="flex justify-between mt-3">
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleSaveEdit('draft')}>
                        <Save className="h-3 w-3 mr-1" /> Save Draft
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleSaveEdit('pended')} className="text-yellow-700">
                        <Clock className="h-3 w-3 mr-1" /> Pend
                      </Button>
                      <Button size="sm" onClick={() => handleSaveEdit('signed')} className="bg-green-600 hover:bg-green-700">
                        <FileSignature className="h-3 w-3 mr-1" /> Sign
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {selectedNote.content}
                  </pre>
                  {/* Display Addendums */}
                  {selectedNote.addendums && selectedNote.addendums.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <div className="text-sm font-medium mb-2">Addendums:</div>
                      {selectedNote.addendums.map(add => (
                        <div key={add.id} className="bg-amber-50 border border-amber-200 rounded p-3 mb-2">
                          <div className="text-xs text-muted-foreground mb-1">
                            {add.author} ({add.authorRole}) - {formatDate(add.date)} {formatTime(add.date)}
                          </div>
                          <pre className="whitespace-pre-wrap font-sans text-sm">{add.content}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Select a note to view or click New to create one</p>
            </div>
          </CardContent>
        )}
      </Card>
      
      {/* Edit Mode Dialog */}
      {showEditModeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Edit Note</h3>
            {!isOwnNote(selectedNote!) && (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-4 flex items-start gap-2 text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                  <strong>Warning:</strong> This note was authored by {selectedNote?.author}. Your edits will be tracked in version history.
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground mb-4">How would you like to edit this note?</p>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={() => handleEditModeSelect('smart')}>
                <Sparkles className="h-4 w-4 mr-2" /> Smart Builder
                <span className="ml-auto text-xs text-muted-foreground">Structured editing</span>
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => handleEditModeSelect('plain')}>
                <FileEdit className="h-4 w-4 mr-2" /> Plain Text Editor
                <span className="ml-auto text-xs text-muted-foreground">Free-form editing</span>
              </Button>
            </div>
            <Button variant="ghost" className="w-full mt-4" onClick={() => setShowEditModeDialog(false)}>Cancel</Button>
          </div>
        </div>
      )}
      
      {/* Copy Previous Note Dialog */}
      {showCopyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] shadow-xl flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Copy Previous Note</h3>
            <p className="text-sm text-muted-foreground mb-4">Select a note to use as a template for your new note.</p>
            <div className="flex-1 overflow-y-auto border rounded divide-y">
              {notes.slice(0, 10).map(note => (
                <button
                  key={note.id}
                  onClick={() => handleCopyNote(note)}
                  className="w-full text-left p-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{note.type} - {note.service}</div>
                      <div className="text-xs text-muted-foreground">{note.author}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(note.date)}</div>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="ghost" className="mt-4" onClick={() => setShowCopyDialog(false)}>Cancel</Button>
          </div>
        </div>
      )}
      
      {/* Version History Dialog */}
      {showVersionHistory && selectedNote?.versions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] shadow-xl flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5" /> Version History
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedNote.versions.slice().reverse().map((version, idx) => (
                <div key={version.id} className="border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {version.action === 'created' ? 'Created' : version.action === 'edited' ? 'Edited' : version.action === 'cosigned' ? 'Cosigned' : version.action === 'attested' ? 'Attested' : 'Addendum'}
                      </Badge>
                      <span className="ml-2 text-sm font-medium">{version.author}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(version.date)} {formatTime(version.date)}</span>
                  </div>
                  {version.action === 'edited' && (
                    <pre className="text-xs bg-gray-50 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">{version.content}</pre>
                  )}
                </div>
              ))}
            </div>
            <Button variant="ghost" className="mt-4" onClick={() => setShowVersionHistory(false)}>Close</Button>
          </div>
        </div>
      )}
      
      {/* Addendum Editor Dialog */}
      {showAddendumEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FilePlus className="h-5 w-5" /> Add Addendum
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Add supplementary information to this signed note.</p>
            <textarea
              className="w-full p-3 border rounded-md text-sm min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={addendumContent}
              onChange={e => setAddendumContent(e.target.value)}
              placeholder="Enter addendum content..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => { setShowAddendumEditor(false); setAddendumContent(''); }}>Cancel</Button>
              <Button onClick={handleAddAddendum} disabled={!addendumContent.trim()}>Add Addendum</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cosign Dialog */}
      {showCosignDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5" /> Cosign Note
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You are about to cosign this note by <strong>{selectedNote?.author}</strong>. 
              This indicates you have reviewed and agree with the note content.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm mb-4">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-muted-foreground">{currentUser.role}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCosignDialog(false)}>Cancel</Button>
              <Button onClick={handleCosign} className="bg-blue-600 hover:bg-blue-700">Cosign</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Attest Dialog */}
      {showAttestDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5" /> Attest Note
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You are attesting that you were present and agree with the documentation in this note.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAttestDialog(false)}>Cancel</Button>
              <Button onClick={handleAttest} className="bg-purple-600 hover:bg-purple-700">Attest</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
