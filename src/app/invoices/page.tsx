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
import {
  Receipt,
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  DollarSign,
} from 'lucide-react'

type InvoiceStatus = 'issued' | 'balanced' | 'cancelled' | 'pending'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

interface Invoice {
  id: string
  practitioner: string
  patient: string
  date: string
  status: InvoiceStatus
  amount: number
  items?: InvoiceItem[]
  notes?: string
}

const initialInvoices: Invoice[] = [
  { id: 'INV-001', practitioner: 'Dr. Sarah Johnson', patient: 'John Smith', date: '12 Dec 2024 09:30', status: 'issued', amount: 150.00, items: [{ description: 'Initial Consultation', quantity: 1, unitPrice: 150.00 }] },
  { id: 'INV-002', practitioner: 'Dr. Michael Chen', patient: 'Maria Garcia', date: '12 Dec 2024 10:15', status: 'balanced', amount: 275.00, items: [{ description: 'Follow-up Visit', quantity: 1, unitPrice: 75.00 }, { description: 'Ultrasound', quantity: 1, unitPrice: 200.00 }] },
  { id: 'INV-003', practitioner: 'Dr. Sarah Johnson', patient: 'Robert Wilson', date: '11 Dec 2024 14:00', status: 'cancelled', amount: 80.00 },
  { id: 'INV-004', practitioner: 'Dr. Emily Brown', patient: 'Sarah Davis', date: '11 Dec 2024 11:30', status: 'pending', amount: 320.00, items: [{ description: 'Metabolic Panel', quantity: 1, unitPrice: 65.00 }, { description: 'X-Ray', quantity: 2, unitPrice: 120.00 }, { description: 'Vaccination', quantity: 1, unitPrice: 15.00 }] },
  { id: 'INV-005', practitioner: 'Dr. Michael Chen', patient: 'James Miller', date: '10 Dec 2024 16:45', status: 'balanced', amount: 195.00 },
  { id: 'INV-006', practitioner: 'Dr. Emily Brown', patient: 'Jennifer Taylor', date: '10 Dec 2024 09:00', status: 'issued', amount: 450.00 },
]

const statusConfig: Record<InvoiceStatus, { label: string; class: string }> = {
  issued: { label: 'Issued', class: 'badge-status badge-info' },
  balanced: { label: 'Balanced', class: 'badge-status badge-success' },
  cancelled: { label: 'Cancelled', class: 'badge-status badge-error' },
  pending: { label: 'Pending', class: 'badge-status badge-warning' },
}

const practitionersList = ['Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Brown', 'Dr. James Wilson']
const patientsList = ['John Smith', 'Maria Garcia', 'Robert Wilson', 'Sarah Davis', 'James Miller', 'Jennifer Taylor']

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [patientSearch, setPatientSearch] = useState('')
  const [practitionerFilter, setPractitionerFilter] = useState<string>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({})
  const [paymentAmount, setPaymentAmount] = useState('')

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false
    if (patientSearch && !inv.patient.toLowerCase().includes(patientSearch.toLowerCase())) return false
    if (practitionerFilter !== 'all' && inv.practitioner !== practitionerFilter) return false
    return true
  })

  const practitioners = Array.from(new Set(invoices.map(i => i.practitioner)))

  const handleView = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setViewDialogOpen(true)
  }

  const handlePay = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setPaymentAmount(inv.amount.toFixed(2))
    setPayDialogOpen(true)
  }

  const handleCancel = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setCancelDialogOpen(true)
  }

  const handleConfirmPayment = () => {
    if (selectedInvoice) {
      setInvoices(invoices.map(inv => 
        inv.id === selectedInvoice.id ? { ...inv, status: 'balanced' as InvoiceStatus } : inv
      ))
      setPayDialogOpen(false)
    }
  }

  const handleConfirmCancel = () => {
    if (selectedInvoice) {
      setInvoices(invoices.map(inv => 
        inv.id === selectedInvoice.id ? { ...inv, status: 'cancelled' as InvoiceStatus } : inv
      ))
      setCancelDialogOpen(false)
    }
  }

  const handleAddInvoice = () => {
    if (newInvoice.patient && newInvoice.practitioner && newInvoice.amount) {
      const inv: Invoice = {
        id: `INV-${Date.now()}`,
        patient: newInvoice.patient,
        practitioner: newInvoice.practitioner,
        date: new Date().toLocaleString(),
        status: 'issued',
        amount: newInvoice.amount,
      }
      setInvoices([inv, ...invoices])
      setAddDialogOpen(false)
      setNewInvoice({})
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Receipt className="h-4 w-4 text-primary"/>
          <h1 className="text-sm font-semibold">Invoices</h1>
          <span className="text-xs text-muted-foreground">({filteredInvoices.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
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
                    <span className="action-link" onClick={() => handleView(invoice)}>Open</span>
                    <span className="action-link" onClick={() => handleCancel(invoice)}>Cancel</span>
                    <span className="action-link" onClick={() => handlePay(invoice)}>Pay</span>
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

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Invoice {selectedInvoice?.id}</DialogTitle>
            <DialogDescription>Invoice details</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Patient</Label>
                  <p className="text-sm font-medium">{selectedInvoice.patient}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Practitioner</Label>
                  <p className="text-sm">{selectedInvoice.practitioner}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Date</Label>
                  <p className="text-sm">{selectedInvoice.date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <span className={statusConfig[selectedInvoice.status].class}>{statusConfig[selectedInvoice.status].label}</span>
                </div>
              </div>
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs">Line Items</Label>
                  <div className="mt-2 border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Description</th>
                          <th className="text-center p-2">Qty</th>
                          <th className="text-right p-2">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{item.description}</td>
                            <td className="text-center p-2">{item.quantity}</td>
                            <td className="text-right p-2">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-bold">${selectedInvoice.amount.toFixed(2)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            {selectedInvoice?.status !== 'balanced' && selectedInvoice?.status !== 'cancelled' && (
              <Button onClick={() => { setViewDialogOpen(false); handlePay(selectedInvoice!); }}>
                <CreditCard className="h-4 w-4 mr-1.5" /> Process Payment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Invoice Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Process Payment</DialogTitle>
            <DialogDescription>Record payment for {selectedInvoice?.patient}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted text-center">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold">${selectedInvoice?.amount.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label>Payment Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select defaultValue="card">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmPayment}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Invoice</DialogTitle>
            <DialogDescription>Are you sure you want to cancel invoice {selectedInvoice?.id} for {selectedInvoice?.patient}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>No, Keep It</Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>Yes, Cancel Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Invoice Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
            <DialogDescription>Create a new invoice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={newInvoice.patient || ''} onValueChange={(v) => setNewInvoice({ ...newInvoice, patient: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patientsList.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Practitioner *</Label>
              <Select value={newInvoice.practitioner || ''} onValueChange={(v) => setNewInvoice({ ...newInvoice, practitioner: v })}>
                <SelectTrigger><SelectValue placeholder="Select practitioner" /></SelectTrigger>
                <SelectContent>
                  {practitionersList.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" step="0.01" className="pl-8" placeholder="0.00" value={newInvoice.amount || ''} onChange={(e) => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddInvoice}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
