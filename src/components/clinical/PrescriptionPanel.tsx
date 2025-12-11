'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Pill,
  Plus,
  Search,
  Clock,
  AlertCircle,
  Check,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  User,
  FileText
} from 'lucide-react'

// Types inspired by FHIR MedicationRequest
interface Prescription {
  id: string
  medication: {
    name: string
    code?: string
    form?: string
  }
  dosage: string
  route: string
  frequency: string
  duration?: string
  quantity?: number
  refills?: number
  status: 'active' | 'completed' | 'cancelled' | 'on-hold' | 'draft'
  prescriber: string
  dateWritten: Date
  instructions?: string
  prn?: boolean
  prnReason?: string
}

interface PrescriptionPanelProps {
  patientId: string
  prescriptions?: Prescription[]
  onCreatePrescription?: (prescription: Omit<Prescription, 'id' | 'dateWritten'>) => void
  onUpdatePrescription?: (prescription: Prescription) => void
  onCancelPrescription?: (prescriptionId: string) => void
  readOnly?: boolean
}

// Mock prescription data
const mockPrescriptions: Prescription[] = [
  {
    id: 'rx-1',
    medication: { name: 'Lisinopril', code: '314076', form: 'tablet' },
    dosage: '10 mg',
    route: 'oral',
    frequency: 'once daily',
    duration: '30 days',
    quantity: 30,
    refills: 3,
    status: 'active',
    prescriber: 'Dr. Smith',
    dateWritten: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    instructions: 'Take in the morning with or without food'
  },
  {
    id: 'rx-2',
    medication: { name: 'Metformin', code: '861007', form: 'tablet' },
    dosage: '500 mg',
    route: 'oral',
    frequency: 'twice daily',
    duration: '30 days',
    quantity: 60,
    refills: 5,
    status: 'active',
    prescriber: 'Dr. Smith',
    dateWritten: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    instructions: 'Take with meals'
  },
  {
    id: 'rx-3',
    medication: { name: 'Furosemide', code: '310429', form: 'tablet' },
    dosage: '40 mg',
    route: 'oral',
    frequency: 'once daily in morning',
    duration: '30 days',
    quantity: 30,
    refills: 2,
    status: 'active',
    prescriber: 'Dr. Johnson',
    dateWritten: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    instructions: 'Take in the morning. Monitor weight daily.'
  },
  {
    id: 'rx-4',
    medication: { name: 'Ondansetron', code: '312086', form: 'tablet' },
    dosage: '4 mg',
    route: 'oral',
    frequency: 'every 8 hours as needed',
    status: 'active',
    prescriber: 'Dr. Smith',
    dateWritten: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    prn: true,
    prnReason: 'nausea',
    instructions: 'Take for nausea. Max 3 doses per day.'
  },
  {
    id: 'rx-5',
    medication: { name: 'Amoxicillin', code: '308182', form: 'capsule' },
    dosage: '500 mg',
    route: 'oral',
    frequency: 'three times daily',
    duration: '10 days',
    quantity: 30,
    refills: 0,
    status: 'completed',
    prescriber: 'Dr. Williams',
    dateWritten: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    instructions: 'Complete full course even if feeling better'
  }
]

// Common medications for quick prescribing
const commonMedications = [
  { name: 'Acetaminophen 650mg', dosage: '650 mg', route: 'oral', frequency: 'every 6 hours PRN', prn: true, prnReason: 'pain/fever' },
  { name: 'Ibuprofen 400mg', dosage: '400 mg', route: 'oral', frequency: 'every 6 hours PRN', prn: true, prnReason: 'pain' },
  { name: 'Ondansetron 4mg', dosage: '4 mg', route: 'oral/IV', frequency: 'every 8 hours PRN', prn: true, prnReason: 'nausea' },
  { name: 'Diphenhydramine 25mg', dosage: '25 mg', route: 'oral', frequency: 'at bedtime PRN', prn: true, prnReason: 'insomnia/itching' },
  { name: 'Pantoprazole 40mg', dosage: '40 mg', route: 'oral', frequency: 'once daily', prn: false },
  { name: 'Metoprolol 25mg', dosage: '25 mg', route: 'oral', frequency: 'twice daily', prn: false },
  { name: 'Amlodipine 5mg', dosage: '5 mg', route: 'oral', frequency: 'once daily', prn: false },
  { name: 'Atorvastatin 40mg', dosage: '40 mg', route: 'oral', frequency: 'once daily at bedtime', prn: false },
]

export function PrescriptionPanel({
  patientId,
  prescriptions = mockPrescriptions,
  onCreatePrescription,
  onUpdatePrescription,
  onCancelPrescription,
  readOnly = false
}: PrescriptionPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewRx, setShowNewRx] = useState(false)
  const [expandedRx, setExpandedRx] = useState<string | null>(null)

  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = rx.medication.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || rx.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activePrescriptions = prescriptions.filter(rx => rx.status === 'active')
  const prnPrescriptions = activePrescriptions.filter(rx => rx.prn)
  const scheduledPrescriptions = activePrescriptions.filter(rx => !rx.prn)

  const getStatusBadge = (status: Prescription['status']) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      active: { variant: 'default', className: 'bg-green-600' },
      completed: { variant: 'secondary', className: 'bg-slate-500' },
      cancelled: { variant: 'destructive', className: '' },
      'on-hold': { variant: 'outline', className: 'border-amber-500 text-amber-700' },
      draft: { variant: 'outline', className: 'border-blue-500 text-blue-700' }
    }
    const { variant, className } = variants[status] || variants.active
    return <Badge variant={variant} className={className}>{status}</Badge>
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border rounded-md text-sm w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>
        {!readOnly && (
          <Button onClick={() => setShowNewRx(!showNewRx)}>
            <Plus className="h-4 w-4 mr-2" /> New Prescription
          </Button>
        )}
      </div>

      {/* Quick Prescribe Panel */}
      {showNewRx && !readOnly && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4" /> Quick Prescribe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mb-2">Click to add common medications</div>
            <div className="flex flex-wrap gap-2">
              {commonMedications.map((med, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onCreatePrescription?.({
                      medication: { name: med.name },
                      dosage: med.dosage,
                      route: med.route,
                      frequency: med.frequency,
                      status: 'active',
                      prescriber: 'Current User',
                      prn: med.prn,
                      prnReason: med.prnReason
                    })
                  }}
                  className="px-3 py-1.5 text-xs border rounded-md hover:bg-blue-100 hover:border-blue-400 bg-white"
                >
                  {med.name}
                  {med.prn && <Badge variant="outline" className="ml-1 text-[10px]">PRN</Badge>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{activePrescriptions.length}</div>
                <div className="text-sm text-muted-foreground">Active Medications</div>
              </div>
              <Pill className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{scheduledPrescriptions.length}</div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </div>
              <Clock className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{prnPrescriptions.length}</div>
                <div className="text-sm text-muted-foreground">PRN Medications</div>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescription List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Prescriptions ({filteredPrescriptions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredPrescriptions.map(rx => (
              <div key={rx.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{rx.medication.name}</span>
                      {getStatusBadge(rx.status)}
                      {rx.prn && <Badge variant="outline" className="text-amber-700 border-amber-300">PRN</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rx.dosage} {rx.route} {rx.frequency}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {rx.prescriber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(rx.dateWritten)}
                      </span>
                      {rx.refills !== undefined && (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" /> {rx.refills} refills
                        </span>
                      )}
                    </div>
                    {expandedRx === rx.id && rx.instructions && (
                      <div className="mt-2 p-2 bg-slate-100 rounded text-sm">
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                          <FileText className="h-3 w-3" /> Instructions
                        </div>
                        {rx.instructions}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRx(expandedRx === rx.id ? null : rx.id)}
                    >
                      {expandedRx === rx.id ? 'Less' : 'More'}
                    </Button>
                    {!readOnly && rx.status === 'active' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => onUpdatePrescription?.(rx)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => onCancelPrescription?.(rx.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredPrescriptions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No prescriptions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export type { Prescription }
