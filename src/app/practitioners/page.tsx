'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { UserCog, Plus, Search, Mail, Phone, Calendar, Users, Clock, X } from 'lucide-react'

interface Practitioner {
  id: string
  name: string
  specialty: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  patients: number
  npi?: string
  license?: string
  joinDate?: string
}

const initialPractitioners: Practitioner[] = [
  { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Internal Medicine', email: 'sarah.johnson@clinic.com', phone: '(555) 123-4567', status: 'active', patients: 145, npi: '1234567890', license: 'MD-12345', joinDate: '2020-01-15' },
  { id: '2', name: 'Dr. Michael Chen', specialty: 'Cardiology', email: 'michael.chen@clinic.com', phone: '(555) 234-5678', status: 'active', patients: 98, npi: '2345678901', license: 'MD-23456', joinDate: '2019-06-20' },
  { id: '3', name: 'Dr. Emily Brown', specialty: 'Pediatrics', email: 'emily.brown@clinic.com', phone: '(555) 345-6789', status: 'active', patients: 210, npi: '3456789012', license: 'MD-34567', joinDate: '2018-03-10' },
  { id: '4', name: 'Dr. James Wilson', specialty: 'Orthopedics', email: 'james.wilson@clinic.com', phone: '(555) 456-7890', status: 'inactive', patients: 67, npi: '4567890123', license: 'MD-45678', joinDate: '2021-08-05' },
  { id: '5', name: 'Dr. Lisa Anderson', specialty: 'Neurology', email: 'lisa.anderson@clinic.com', phone: '(555) 567-8901', status: 'active', patients: 82, npi: '5678901234', license: 'MD-56789', joinDate: '2022-02-14' },
  { id: '6', name: 'Dr. Robert Martinez', specialty: 'Psychiatry', email: 'robert.martinez@clinic.com', phone: '(555) 678-9012', status: 'active', patients: 120, npi: '6789012345', license: 'MD-67890', joinDate: '2017-11-30' },
]

const specialtyOptions = ['Internal Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Psychiatry', 'Family Medicine', 'Emergency Medicine', 'Surgery', 'Oncology']

export default function PractitionersPage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>(initialPractitioners)
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all')
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Practitioner>>({})
  const [newPractitioner, setNewPractitioner] = useState<Partial<Practitioner>>({ status: 'active' })

  const specialties = Array.from(new Set(practitioners.map(p => p.specialty)))

  const filtered = practitioners.filter(p => {
    if (specialtyFilter !== 'all' && p.specialty !== specialtyFilter) return false
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const handleView = (p: Practitioner) => {
    setSelectedPractitioner(p)
    setViewDialogOpen(true)
  }

  const handleEdit = (p: Practitioner) => {
    setSelectedPractitioner(p)
    setEditForm({ ...p })
    setEditDialogOpen(true)
  }

  const handleSchedule = (p: Practitioner) => {
    setSelectedPractitioner(p)
    setScheduleDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (selectedPractitioner && editForm.name) {
      setPractitioners(practitioners.map(p => 
        p.id === selectedPractitioner.id ? { ...p, ...editForm } as Practitioner : p
      ))
      setEditDialogOpen(false)
    }
  }

  const handleAddPractitioner = () => {
    if (newPractitioner.name && newPractitioner.email && newPractitioner.specialty) {
      const newP: Practitioner = {
        id: `${Date.now()}`,
        name: newPractitioner.name,
        specialty: newPractitioner.specialty,
        email: newPractitioner.email,
        phone: newPractitioner.phone || '',
        status: newPractitioner.status as 'active' | 'inactive' || 'active',
        patients: 0,
        npi: newPractitioner.npi,
        license: newPractitioner.license,
        joinDate: new Date().toISOString().split('T')[0],
      }
      setPractitioners([...practitioners, newP])
      setAddDialogOpen(false)
      setNewPractitioner({ status: 'active' })
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border/50">
        <div className="flex items-center gap-2">
          <UserCog className="h-3 w-3 text-primary"/>
          <h1 className="text-xs font-semibold">Practitioners</h1>
          <span className="text-xs text-muted-foreground">({filtered.length})</span>
        </div>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}><Plus className="h-3 w-3 mr-1" />Add Practitioner</Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search practitioners..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 input-sharp" />
        </div>
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Specialty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSpecialtyFilter('all'); }}>Clear filters</Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="table-sharp">
          <thead className="sticky top-0 bg-background">
            <tr>
              <th>Name</th>
              <th>Specialty</th>
              <th>Contact</th>
              <th>Patients</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.name}</td>
                <td><span className="badge-status badge-info">{p.specialty}</span></td>
                <td>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="h-3 w-3" />{p.email}</div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="h-3 w-3" />{p.phone}</div>
                  </div>
                </td>
                <td className="font-medium">{p.patients}</td>
                <td><span className={p.status === 'active' ? 'badge-status badge-success' : 'badge-status badge-error'}>{p.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="action-link" onClick={() => handleView(p)}>View</span>
                    <span className="action-link" onClick={() => handleEdit(p)}>Edit</span>
                    <span className="action-link" onClick={() => handleSchedule(p)}>Schedule</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Practitioner Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPractitioner?.name}</DialogTitle>
            <DialogDescription>{selectedPractitioner?.specialty}</DialogDescription>
          </DialogHeader>
          {selectedPractitioner && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="text-sm">{selectedPractitioner.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="text-sm">{selectedPractitioner.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">NPI</Label>
                  <p className="text-sm">{selectedPractitioner.npi || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">License</Label>
                  <p className="text-sm">{selectedPractitioner.license || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <p className="text-sm capitalize">{selectedPractitioner.status}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Active Patients</Label>
                  <p className="text-sm">{selectedPractitioner.patients}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Join Date</Label>
                  <p className="text-sm">{selectedPractitioner.joinDate || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => { setViewDialogOpen(false); handleEdit(selectedPractitioner!); }}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Practitioner Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Practitioner</DialogTitle>
            <DialogDescription>Update practitioner information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Specialty</Label>
              <Select value={editForm.specialty || ''} onValueChange={(v) => setEditForm({ ...editForm, specialty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {specialtyOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NPI</Label>
                <Input value={editForm.npi || ''} onChange={(e) => setEditForm({ ...editForm, npi: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>License</Label>
                <Input value={editForm.license || ''} onChange={(e) => setEditForm({ ...editForm, license: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status || 'active'} onValueChange={(v) => setEditForm({ ...editForm, status: v as 'active' | 'inactive' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Practitioner Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Practitioner</DialogTitle>
            <DialogDescription>Add a new practitioner to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Dr. John Doe" value={newPractitioner.name || ''} onChange={(e) => setNewPractitioner({ ...newPractitioner, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Specialty *</Label>
              <Select value={newPractitioner.specialty || ''} onValueChange={(v) => setNewPractitioner({ ...newPractitioner, specialty: v })}>
                <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                <SelectContent>
                  {specialtyOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="email@clinic.com" value={newPractitioner.email || ''} onChange={(e) => setNewPractitioner({ ...newPractitioner, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="(555) 000-0000" value={newPractitioner.phone || ''} onChange={(e) => setNewPractitioner({ ...newPractitioner, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NPI</Label>
                <Input placeholder="1234567890" value={newPractitioner.npi || ''} onChange={(e) => setNewPractitioner({ ...newPractitioner, npi: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>License</Label>
                <Input placeholder="MD-12345" value={newPractitioner.license || ''} onChange={(e) => setNewPractitioner({ ...newPractitioner, license: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPractitioner}>Add Practitioner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule - {selectedPractitioner?.name}</DialogTitle>
            <DialogDescription>Weekly availability and appointments</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 text-center text-sm">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                <div key={day} className="font-medium py-2 bg-muted">{day}</div>
              ))}
              {['9am-5pm', '9am-5pm', '9am-12pm', '9am-5pm', '9am-3pm'].map((time, i) => (
                <div key={i} className="py-2 text-xs text-muted-foreground border">{time}</div>
              ))}
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> Upcoming Appointments</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-muted">
                  <span>John Smith - Follow-up</span>
                  <span className="text-muted-foreground">Today 2:00 PM</span>
                </div>
                <div className="flex justify-between p-2 bg-muted">
                  <span>Maria Garcia - Consultation</span>
                  <span className="text-muted-foreground">Tomorrow 10:00 AM</span>
                </div>
                <div className="flex justify-between p-2 bg-muted">
                  <span>Robert Wilson - Lab Review</span>
                  <span className="text-muted-foreground">Dec 15 3:30 PM</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>Close</Button>
            <Button>Manage Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
