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
import { UserCog, Plus, Search, Mail, Phone } from 'lucide-react'

interface Practitioner {
  id: string
  name: string
  specialty: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  patients: number
}

const mockPractitioners: Practitioner[] = [
  { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Internal Medicine', email: 'sarah.johnson@clinic.com', phone: '(555) 123-4567', status: 'active', patients: 145 },
  { id: '2', name: 'Dr. Michael Chen', specialty: 'Cardiology', email: 'michael.chen@clinic.com', phone: '(555) 234-5678', status: 'active', patients: 98 },
  { id: '3', name: 'Dr. Emily Brown', specialty: 'Pediatrics', email: 'emily.brown@clinic.com', phone: '(555) 345-6789', status: 'active', patients: 210 },
  { id: '4', name: 'Dr. James Wilson', specialty: 'Orthopedics', email: 'james.wilson@clinic.com', phone: '(555) 456-7890', status: 'inactive', patients: 67 },
  { id: '5', name: 'Dr. Lisa Anderson', specialty: 'Neurology', email: 'lisa.anderson@clinic.com', phone: '(555) 567-8901', status: 'active', patients: 82 },
  { id: '6', name: 'Dr. Robert Martinez', specialty: 'Psychiatry', email: 'robert.martinez@clinic.com', phone: '(555) 678-9012', status: 'active', patients: 120 },
]

export default function PractitionersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all')

  const specialties = [...new Set(mockPractitioners.map(p => p.specialty))]

  const filtered = mockPractitioners.filter(p => {
    if (specialtyFilter !== 'all' && p.specialty !== specialtyFilter) return false
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <UserCog className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Practitioners</h1>
          <span className="text-sm text-muted-foreground">({filtered.length})</span>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Practitioner</Button>
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
                <td><div className="flex items-center gap-3"><span className="action-link">View</span><span className="action-link">Edit</span><span className="action-link">Schedule</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
