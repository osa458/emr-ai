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
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type InvoiceStatus = 'issued' | 'balanced' | 'cancelled' | 'pending'

interface Invoice {
  id: string
  practitioner: string
  patient: string
  date: string
  status: InvoiceStatus
  amount: number
}

const mockInvoices: Invoice[] = [
  { id: 'INV-001', practitioner: 'Dr. Sarah Johnson', patient: 'John Smith', date: '12 Dec 2024 09:30', status: 'issued', amount: 150.00 },
  { id: 'INV-002', practitioner: 'Dr. Michael Chen', patient: 'Maria Garcia', date: '12 Dec 2024 10:15', status: 'balanced', amount: 275.00 },
  { id: 'INV-003', practitioner: 'Dr. Sarah Johnson', patient: 'Robert Wilson', date: '11 Dec 2024 14:00', status: 'cancelled', amount: 80.00 },
  { id: 'INV-004', practitioner: 'Dr. Emily Brown', patient: 'Sarah Davis', date: '11 Dec 2024 11:30', status: 'pending', amount: 320.00 },
  { id: 'INV-005', practitioner: 'Dr. Michael Chen', patient: 'James Miller', date: '10 Dec 2024 16:45', status: 'balanced', amount: 195.00 },
  { id: 'INV-006', practitioner: 'Dr. Emily Brown', patient: 'Jennifer Taylor', date: '10 Dec 2024 09:00', status: 'issued', amount: 450.00 },
]

const statusConfig: Record<InvoiceStatus, { label: string; class: string }> = {
  issued: { label: 'Issued', class: 'badge-status badge-info' },
  balanced: { label: 'Balanced', class: 'badge-status badge-success' },
  cancelled: { label: 'Cancelled', class: 'badge-status badge-error' },
  pending: { label: 'Pending', class: 'badge-status badge-warning' },
}

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [patientSearch, setPatientSearch] = useState('')
  const [practitionerFilter, setPractitionerFilter] = useState<string>('all')

  const filteredInvoices = mockInvoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false
    if (patientSearch && !inv.patient.toLowerCase().includes(patientSearch.toLowerCase())) return false
    if (practitionerFilter !== 'all' && inv.practitioner !== practitionerFilter) return false
    return true
  })

  const practitioners = [...new Set(mockInvoices.map(i => i.practitioner))]

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Receipt className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Invoices</h1>
          <span className="text-sm text-muted-foreground">({filteredInvoices.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="pl-9 h-9 input-sharp"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={practitionerFilter} onValueChange={setPractitionerFilter}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="Practitioner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Practitioners</SelectItem>
            {practitioners.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => {
          setStatusFilter('all')
          setPatientSearch('')
          setPractitionerFilter('all')
        }}>
          Clear filters
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="table-sharp">
          <thead className="sticky top-0 bg-background">
            <tr>
              <th>Practitioner</th>
              <th>Patient</th>
              <th>Date</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="font-medium">{invoice.practitioner}</td>
                <td>{invoice.patient}</td>
                <td className="text-muted-foreground">{invoice.date}</td>
                <td>
                  <span className={statusConfig[invoice.status].class}>
                    {statusConfig[invoice.status].label}
                  </span>
                </td>
                <td className="font-medium">${invoice.amount.toFixed(2)}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="action-link">Open</span>
                    <span className="action-link">Cancel</span>
                    <span className="action-link">Pay</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border/50">
        <Button variant="outline" size="icon" className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3 py-1 text-sm border border-primary/50 rounded">1</span>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
