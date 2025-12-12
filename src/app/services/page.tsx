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
import {
  Briefcase,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'

interface Service {
  id: string
  code: string
  name: string
  category: string
  duration: number
  price: number
  active: boolean
}

const mockServices: Service[] = [
  { id: '1', code: 'CONS-001', name: 'Initial Consultation', category: 'Consultation', duration: 60, price: 150.00, active: true },
  { id: '2', code: 'CONS-002', name: 'Follow-up Visit', category: 'Consultation', duration: 30, price: 75.00, active: true },
  { id: '3', code: 'LAB-001', name: 'Complete Blood Count', category: 'Laboratory', duration: 15, price: 45.00, active: true },
  { id: '4', code: 'LAB-002', name: 'Metabolic Panel', category: 'Laboratory', duration: 15, price: 65.00, active: true },
  { id: '5', code: 'IMG-001', name: 'X-Ray', category: 'Imaging', duration: 20, price: 120.00, active: true },
  { id: '6', code: 'IMG-002', name: 'Ultrasound', category: 'Imaging', duration: 30, price: 200.00, active: true },
  { id: '7', code: 'PROC-001', name: 'Wound Care', category: 'Procedure', duration: 45, price: 95.00, active: true },
  { id: '8', code: 'PROC-002', name: 'IV Infusion', category: 'Procedure', duration: 60, price: 180.00, active: false },
  { id: '9', code: 'VAC-001', name: 'Vaccination Administration', category: 'Preventive', duration: 15, price: 35.00, active: true },
  { id: '10', code: 'TELE-001', name: 'Telemedicine Consult', category: 'Telehealth', duration: 30, price: 85.00, active: true },
]

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = [...new Set(mockServices.map(s => s.category))]

  const filteredServices = mockServices.filter(s => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase()) && !s.code.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Services</h1>
          <span className="text-sm text-muted-foreground">({filteredServices.length})</span>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Service
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 input-sharp"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => {
          setSearchTerm('')
          setCategoryFilter('all')
        }}>
          Clear filters
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="table-sharp">
          <thead className="sticky top-0 bg-background">
            <tr>
              <th>Code</th>
              <th>Service Name</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.map((service) => (
              <tr key={service.id}>
                <td className="font-mono text-xs">{service.code}</td>
                <td className="font-medium">{service.name}</td>
                <td>
                  <span className="badge-status badge-info">{service.category}</span>
                </td>
                <td className="text-muted-foreground">{service.duration} min</td>
                <td className="font-medium">${service.price.toFixed(2)}</td>
                <td>
                  <span className={service.active ? 'badge-status badge-success' : 'badge-status badge-error'}>
                    {service.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded hover:bg-muted/50 transition-colors">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-muted/50 transition-colors">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
