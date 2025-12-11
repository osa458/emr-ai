'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from 'lucide-react'

interface Note {
  id: string
  type: 'progress' | 'hp' | 'consult' | 'discharge'
  title: string
  author: string
  authorRole: string
  date: string
  content: string
  signed: boolean
}

interface ClinicalNotesProps {
  patientId: string
  encounterId?: string
}

// Mock notes for demo
const mockNotes: Note[] = [
  {
    id: '1',
    type: 'progress',
    title: 'Progress Note - Hospital Day 3',
    author: 'Dr. Sarah Johnson',
    authorRole: 'Attending Physician',
    date: new Date().toISOString(),
    content: `SUBJECTIVE:
Patient reports improved breathing. Slept well overnight. Denies chest pain, palpitations. 
Mild leg swelling persists but improved from admission.

OBJECTIVE:
Vitals: BP 128/76, HR 72, RR 16, SpO2 96% on 2L NC
Weight: 185 lbs (down 8 lbs from admission)
Exam: Lungs with minimal bibasilar crackles, improved. 1+ pitting edema bilateral LE.
Labs: BNP 450 (down from 850), Cr 1.2 (stable), K 4.2

ASSESSMENT/PLAN:
1. Acute on chronic systolic heart failure - Improving with diuresis
   - Continue Lasix 40mg IV BID
   - Daily weights, I/O monitoring
   - Target euvolemia

2. CKD Stage 3 - Stable
   - Monitor Cr with continued diuresis

3. Diabetes Type 2 - Controlled
   - Continue home regimen

Anticipate discharge in 1-2 days if continued improvement.`,
    signed: true,
  },
  {
    id: '2',
    type: 'consult',
    title: 'Cardiology Consult',
    author: 'Dr. Michael Chen',
    authorRole: 'Cardiologist',
    date: new Date(Date.now() - 86400000).toISOString(),
    content: `REASON FOR CONSULT: Heart failure management

HISTORY: 65M with known HFrEF (EF 35% on prior echo) admitted with acute decompensation.

RECOMMENDATIONS:
1. Aggressive diuresis with IV Lasix
2. Initiate/uptitrate GDMT: 
   - Start spironolactone 25mg daily
   - Start metoprolol succinate 25mg daily
3. Repeat echo prior to discharge to assess EF
4. Follow-up in CHF clinic in 1 week
5. Consider ICD evaluation if EF remains <35%

Thank you for this consult. Will continue to follow.`,
    signed: true,
  },
  {
    id: '3',
    type: 'hp',
    title: 'History & Physical',
    author: 'Dr. Sarah Johnson',
    authorRole: 'Attending Physician',
    date: new Date(Date.now() - 172800000).toISOString(),
    content: `CHIEF COMPLAINT: Shortness of breath x 3 days

HPI: 65-year-old male with history of HFrEF, DM2, HTN presents with progressive dyspnea. 
Reports 10 lb weight gain over 2 weeks, orthopnea (3 pillows), PND. 
Noted bilateral leg swelling. Denies chest pain, fever, cough.

PMH: HFrEF (EF 35%), DM2, HTN, CKD3, former smoker

MEDICATIONS: Lisinopril 10mg, Metformin 1000mg BID, Atorvastatin 40mg

PHYSICAL EXAM:
General: Mild respiratory distress
CV: RRR, S3 present, JVP elevated to 12cm
Lungs: Bibasilar crackles 1/3 up
Ext: 3+ pitting edema bilateral

LABS: BNP 850, Cr 1.4, Na 132, K 4.0

IMAGING: CXR shows cardiomegaly, pulmonary vascular congestion

ASSESSMENT: Acute decompensated heart failure

PLAN: IV diuresis, salt/fluid restriction, cardiology consult`,
    signed: true,
  },
]

const noteTypeColors: Record<string, string> = {
  progress: 'bg-blue-100 text-blue-800',
  hp: 'bg-purple-100 text-purple-800',
  consult: 'bg-green-100 text-green-800',
  discharge: 'bg-orange-100 text-orange-800',
}

const noteTypeLabels: Record<string, string> = {
  progress: 'Progress Note',
  hp: 'H&P',
  consult: 'Consult',
  discharge: 'Discharge Summary',
}

export function ClinicalNotes({ patientId, encounterId }: ClinicalNotesProps) {
  const [notes] = useState<Note[]>(mockNotes)
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNote, setNewNote] = useState({
    type: 'progress' as Note['type'],
    title: '',
    content: '',
  })

  const handleAddNote = () => {
    // In production, would save to backend
    console.log('Adding note:', newNote)
    setIsAddingNote(false)
    setNewNote({ type: 'progress', title: '', content: '' })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Clinical Notes
          </CardTitle>
          <Button size="sm" onClick={() => setIsAddingNote(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {isAddingNote && (
          <div className="rounded-lg border p-4 bg-blue-50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">New Note</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingNote(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full mt-1 rounded-md border p-2"
                  value={newNote.type}
                  onChange={(e) =>
                    setNewNote({ ...newNote, type: e.target.value as Note['type'] })
                  }
                >
                  <option value="progress">Progress Note</option>
                  <option value="consult">Consult Note</option>
                  <option value="discharge">Discharge Summary</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  className="w-full mt-1 rounded-md border p-2"
                  placeholder="Note title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <textarea
                className="w-full mt-1 rounded-md border p-2"
                rows={8}
                placeholder="Enter note content..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNote}>
                <Save className="mr-2 h-4 w-4" />
                Save Note
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.map((note) => (
          <div key={note.id} className="rounded-lg border">
            <button
              className="w-full p-4 text-left hover:bg-gray-50"
              onClick={() =>
                setExpandedNoteId(expandedNoteId === note.id ? null : note.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={noteTypeColors[note.type]}>
                    {noteTypeLabels[note.type]}
                  </Badge>
                  <span className="font-medium">{note.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  {note.signed && (
                    <Badge variant="outline" className="text-green-600">
                      Signed
                    </Badge>
                  )}
                  {expandedNoteId === note.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {note.author} ({note.authorRole})
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(note.date).toLocaleString()}
                </div>
              </div>
            </button>

            {expandedNoteId === note.id && (
              <div className="border-t p-4 bg-gray-50">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {note.content}
                </pre>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
