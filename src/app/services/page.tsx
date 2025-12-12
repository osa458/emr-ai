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
import { Briefcase, Plus, Search, Edit, Trash2 } from 'lucide-react'

interface Service {
  id: string
  code: string
  name: string
  category: string
  duration: number
  price: number
  active: boolean
}

const initialServices: Service[] = [
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

const categoryOptions = ['Consultation', 'Laboratory', 'Imaging', 'Procedure', 'Preventive', 'Telehealth']

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Service>>({ active: true })

  const categories = Array.from(new Set(services.map(s => s.category)))

  const filteredServices = services.filter(s => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase()) && !s.code.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setFormData({ ...service })
    setEditDialogOpen(true)
  }

  const handleDelete = (service: Service) => {
    setSelectedService(service)
    setDeleteDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (selectedService && formData.name && formData.code) {
      setServices(services.map(s => 
        s.id === selectedService.id ? { ...s, ...formData } as Service : s
      ))
      setEditDialogOpen(false)
    }
  }

  const handleConfirmDelete = () => {
    if (selectedService) {
      setServices(services.filter(s => s.id !== selectedService.id))
      setDeleteDialogOpen(false)
    }
  }

  const handleAddService = () => {
    if (formData.name && formData.code && formData.category) {
      const newService: Service = {
        id: `${Date.now()}`,
        code: formData.code,
        name: formData.name,
        category: formData.category,
        duration: formData.duration || 30,
        price: formData.price || 0,
        active: formData.active ?? true,
      }
      setServices([...services, newService])
      setAddDialogOpen(false)
      setFormData({ active: true })
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Briefcase className="h-4 w-4 text-primary"/>
          <h1 className="text-sm font-semibold">Services</h1>
          <span className="text-xs text-muted-foreground">({filteredServices.length})</span>
        </div>
        <Button size="sm" onClick={() => { setFormData({ active: true }); setAddDialogOpen(true); }}>
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
                    <button className="p-1.5 rounded hover:bg-muted/50 transition-colors" onClick={() => handleEdit(service)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-muted/50 transition-colors" onClick={() => handleDelete(service)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Service Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription>Create a new service offering</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input placeholder="e.g., CONS-003" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category || ''} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input placeholder="e.g., Specialist Consultation" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={formData.duration || ''} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="number" step="0.01" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddService}>Add Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update service details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category || ''} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={formData.duration || ''} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="number" step="0.01" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.active ? 'active' : 'inactive'} onValueChange={(v) => setFormData({ ...formData, active: v === 'active' })}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>Are you sure you want to delete &quot;{selectedService?.name}&quot;? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
