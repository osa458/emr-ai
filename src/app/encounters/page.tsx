'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Stethoscope, Plus, Search, Clock, FileText, User, Calendar } from 'lucide-react'

type EncounterStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled'
type EncounterType = 'outpatient' | 'inpatient' | 'emergency' | 'telehealth'

interface Encounter {
  id: string
  patient: string
  practitioner: string
  type: EncounterType
  status: EncounterStatus
  date: string
  duration: string
  reason: string
  notes?: string
  vitals?: { bp: string; hr: string; temp: string }
  diagnosis?: string
}

const initialEncounters: Encounter[] = [
  { id: 'ENC-001', patient: 'John Smith', practitioner: 'Dr. Sarah Johnson', type: 'outpatient', status: 'completed', date: '12 Dec 2024 09:00', duration: '45 min', reason: 'Annual Physical', notes: 'Patient in good health. Routine labs ordered.', vitals: { bp: '120/80', hr: '72', temp: '98.6°F' }, diagnosis: 'Z00.00 - General adult medical examination' },
  { id: 'ENC-002', patient: 'Maria Garcia', practitioner: 'Dr. Michael Chen', type: 'telehealth', status: 'in-progress', date: '12 Dec 2024 10:30', duration: '30 min', reason: 'Follow-up', notes: 'Discussing medication adjustment.', vitals: { bp: '135/85', hr: '78', temp: '98.4°F' } },
  { id: 'ENC-003', patient: 'Robert Wilson', practitioner: 'Dr. Emily Brown', type: 'emergency', status: 'completed', date: '11 Dec 2024 15:20', duration: '2 hr', reason: 'Chest Pain', notes: 'Troponin negative. EKG normal. Discharged with follow-up.', vitals: { bp: '145/92', hr: '88', temp: '98.8°F' }, diagnosis: 'R07.9 - Chest pain, unspecified' },
  { id: 'ENC-004', patient: 'Sarah Davis', practitioner: 'Dr. Sarah Johnson', type: 'outpatient', status: 'planned', date: '13 Dec 2024 11:00', duration: '30 min', reason: 'Lab Review' },
  { id: 'ENC-005', patient: 'James Miller', practitioner: 'Dr. Michael Chen', type: 'inpatient', status: 'in-progress', date: '10 Dec 2024 08:00', duration: '3 days', reason: 'Post-Op', notes: 'Day 3 post appendectomy. Tolerating diet well.', vitals: { bp: '118/76', hr: '68', temp: '99.1°F' } },
]

const statusConfig: Record<EncounterStatus, { label: string; class: string }> = {
  planned: { label: 'Planned', class: 'badge-status badge-info' },
  'in-progress': { label: 'In Progress', class: 'badge-status badge-warning' },
  completed: { label: 'Completed', class: 'badge-status badge-success' },
  cancelled: { label: 'Cancelled', class: 'badge-status badge-error' },
}

const practitioners = ['Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Brown', 'Dr. James Wilson', 'Dr. Lisa Anderson']
const patients = ['John Smith', 'Maria Garcia', 'Robert Wilson', 'Sarah Davis', 'James Miller', 'Patricia Davis', 'William Anderson']

export default function EncountersPage() {
  const [encounters, setEncounters] = useState<Encounter[]>(initialEncounters)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newEncounter, setNewEncounter] = useState<Partial<Encounter>>({ type: 'outpatient', status: 'planned' })
  const [editNotes, setEditNotes] = useState('')

  const filteredEncounters = encounters.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    if (searchTerm && !e.patient.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const handleView = (enc: Encounter) => {
    setSelectedEncounter(enc)
    setViewDialogOpen(true)
  }

  const handleNotes = (enc: Encounter) => {
    setSelectedEncounter(enc)
    setEditNotes(enc.notes || '')
    setNotesDialogOpen(true)
  }

  const handleSaveNotes = () => {
    if (selectedEncounter) {
      setEncounters(encounters.map(e => 
        e.id === selectedEncounter.id ? { ...e, notes: editNotes } : e
      ))
      setNotesDialogOpen(false)
    }
  }

  const handleAddEncounter = () => {
    if (newEncounter.patient && newEncounter.practitioner && newEncounter.reason) {
      const enc: Encounter = {
        id: `ENC-${Date.now()}`,
        patient: newEncounter.patient,
        practitioner: newEncounter.practitioner,
        type: newEncounter.type as EncounterType || 'outpatient',
        status: newEncounter.status as EncounterStatus || 'planned',
        date: newEncounter.date || new Date().toLocaleString(),
        duration: newEncounter.duration || '30 min',
        reason: newEncounter.reason,
      }
      setEncounters([enc, ...encounters])
      setAddDialogOpen(false)
      setNewEncounter({ type: 'outpatient', status: 'planned' })
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-4 w-4 text-primary"/>
          <h1 className="text-sm font-semibold">Encounters</h1>
          <span className="text-xs text-muted-foreground">({filteredEncounters.length})</span>
        </div>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New Encounter</Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 input-sharp" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>Clear filters</Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="table-sharp">
          <thead className="sticky top-0 bg-background">
            <tr>
              <th>Patient</th>
              <th>Practitioner</th>
              <th>Type</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEncounters.map((enc) => (
              <tr key={enc.id}>
                <td className="font-medium">{enc.patient}</td>
                <td className="text-muted-foreground">{enc.practitioner}</td>
                <td className="capitalize">{enc.type}</td>
                <td className="text-muted-foreground">{enc.date}</td>
                <td><span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{enc.duration}</span></td>
                <td>{enc.reason}</td>
                <td><span className={statusConfig[enc.status].class}>{statusConfig[enc.status].label}</span></td>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="action-link" onClick={() => handleView(enc)}>View</span>
                    <span className="action-link" onClick={() => handleNotes(enc)}>Notes</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Encounter Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Encounter Details</DialogTitle>
            <DialogDescription>{selectedEncounter?.id}</DialogDescription>
          </DialogHeader>
          {selectedEncounter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Patient</Label>
                  <p className="text-sm font-medium">{selectedEncounter.patient}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Practitioner</Label>
                  <p className="text-sm">{selectedEncounter.practitioner}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Type</Label>
                  <p className="text-sm capitalize">{selectedEncounter.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <span className={statusConfig[selectedEncounter.status].class}>{statusConfig[selectedEncounter.status].label}</span>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Date</Label>
                  <p className="text-sm">{selectedEncounter.date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Duration</Label>
                  <p className="text-sm">{selectedEncounter.duration}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Reason</Label>
                <p className="text-sm">{selectedEncounter.reason}</p>
              </div>
              {selectedEncounter.vitals && (
                <div>
                  <Label className="text-muted-foreground text-xs">Vitals</Label>
                  <div className="flex gap-4 text-sm mt-1">
                    <span>BP: {selectedEncounter.vitals.bp}</span>
                    <span>HR: {selectedEncounter.vitals.hr}</span>
                    <span>Temp: {selectedEncounter.vitals.temp}</span>
                  </div>
                </div>
              )}
              {selectedEncounter.diagnosis && (
                <div>
                  <Label className="text-muted-foreground text-xs">Diagnosis</Label>
                  <p className="text-sm">{selectedEncounter.diagnosis}</p>
                </div>
              )}
              {selectedEncounter.notes && (
                <div>
                  <Label className="text-muted-foreground text-xs">Notes</Label>
                  <p className="text-sm">{selectedEncounter.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => { setViewDialogOpen(false); handleNotes(selectedEncounter!); }}>Edit Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Encounter Notes</DialogTitle>
            <DialogDescription>{selectedEncounter?.patient} - {selectedEncounter?.reason}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea 
              placeholder="Enter encounter notes..." 
              value={editNotes} 
              onChange={(e) => setEditNotes(e.target.value)}
              rows={8}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Encounter Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Encounter</DialogTitle>
            <DialogDescription>Create a new patient encounter</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={newEncounter.patient || ''} onValueChange={(v) => setNewEncounter({ ...newEncounter, patient: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Practitioner *</Label>
              <Select value={newEncounter.practitioner || ''} onValueChange={(v) => setNewEncounter({ ...newEncounter, practitioner: v })}>
                <SelectTrigger><SelectValue placeholder="Select practitioner" /></SelectTrigger>
                <SelectContent>
                  {practitioners.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newEncounter.type || 'outpatient'} onValueChange={(v) => setNewEncounter({ ...newEncounter, type: v as EncounterType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outpatient">Outpatient</SelectItem>
                    <SelectItem value="inpatient">Inpatient</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="telehealth">Telehealth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={newEncounter.duration || '30 min'} onValueChange={(v) => setNewEncounter({ ...newEncounter, duration: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 min">15 min</SelectItem>
                    <SelectItem value="30 min">30 min</SelectItem>
                    <SelectItem value="45 min">45 min</SelectItem>
                    <SelectItem value="1 hr">1 hour</SelectItem>
                    <SelectItem value="2 hr">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Input placeholder="e.g., Follow-up, Annual Physical" value={newEncounter.reason || ''} onChange={(e) => setNewEncounter({ ...newEncounter, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEncounter}>Create Encounter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
