'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Stethoscope, Plus, Search, Clock } from 'lucide-react'

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
}

const mockEncounters: Encounter[] = [
  { id: 'ENC-001', patient: 'John Smith', practitioner: 'Dr. Sarah Johnson', type: 'outpatient', status: 'completed', date: '12 Dec 2024 09:00', duration: '45 min', reason: 'Annual Physical' },
  { id: 'ENC-002', patient: 'Maria Garcia', practitioner: 'Dr. Michael Chen', type: 'telehealth', status: 'in-progress', date: '12 Dec 2024 10:30', duration: '30 min', reason: 'Follow-up' },
  { id: 'ENC-003', patient: 'Robert Wilson', practitioner: 'Dr. Emily Brown', type: 'emergency', status: 'completed', date: '11 Dec 2024 15:20', duration: '2 hr', reason: 'Chest Pain' },
  { id: 'ENC-004', patient: 'Sarah Davis', practitioner: 'Dr. Sarah Johnson', type: 'outpatient', status: 'planned', date: '13 Dec 2024 11:00', duration: '30 min', reason: 'Lab Review' },
  { id: 'ENC-005', patient: 'James Miller', practitioner: 'Dr. Michael Chen', type: 'inpatient', status: 'in-progress', date: '10 Dec 2024 08:00', duration: '3 days', reason: 'Post-Op' },
]

const statusConfig: Record<EncounterStatus, { label: string; class: string }> = {
  planned: { label: 'Planned', class: 'badge-status badge-info' },
  'in-progress': { label: 'In Progress', class: 'badge-status badge-warning' },
  completed: { label: 'Completed', class: 'badge-status badge-success' },
  cancelled: { label: 'Cancelled', class: 'badge-status badge-error' },
}

export default function EncountersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredEncounters = mockEncounters.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    if (searchTerm && !e.patient.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Encounters</h1>
          <span className="text-sm text-muted-foreground">({filteredEncounters.length})</span>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New Encounter</Button>
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
                <td><div className="flex items-center gap-3"><span className="action-link">View</span><span className="action-link">Notes</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
