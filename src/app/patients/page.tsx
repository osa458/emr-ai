'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { User, Search, UserPlus, ChevronUp, ChevronDown, MoreHorizontal, ListPlus, ListMinus, Check } from 'lucide-react'
import { PatientNote } from '@/components/patients/PatientNote'
import { PatientListsSidebar } from '@/components/patients/PatientListsSidebar'
import { getAllPatientNotes, savePatientNote } from '@/lib/patientNotes'
import { 
  getPatientLists, 
  getPatientList, 
  addPatientToList, 
  removePatientFromList,
  getListsForPatient,
  type PatientList 
} from '@/lib/patientLists'
import { usePatients } from '@/hooks/usePatient'
import { formatPatientName } from '@/lib/fhir/resources/patient'

// Mock patient data for demo - matches seed data
const mockPatients = [
  { id: 'patient-1', name: 'Robert Johnson', mrn: 'MRN-001', age: 78, gender: 'male', location: 'Room 412', diagnosis: 'Acute Kidney Injury', status: 'critical', admitDate: '2024-12-05' },
  { id: 'patient-2', name: 'Sarah Williams', mrn: 'MRN-002', age: 58, gender: 'female', location: 'Room 305', diagnosis: 'COPD Exacerbation', status: 'high', admitDate: '2024-12-04' },
  { id: 'patient-3', name: 'John Smith', mrn: 'MRN-003', age: 65, gender: 'male', location: 'Room 218', diagnosis: 'CHF Exacerbation', status: 'high', admitDate: '2024-12-03' },
  { id: 'patient-4', name: 'Maria Garcia', mrn: 'MRN-004', age: 52, gender: 'female', location: 'Room 422', diagnosis: 'Community Acquired Pneumonia', status: 'moderate', admitDate: '2024-12-04' },
  { id: 'patient-5', name: 'Michael Brown', mrn: 'MRN-005', age: 43, gender: 'male', location: 'Room 108', diagnosis: 'Cellulitis', status: 'low', admitDate: '2024-12-06' },
  { id: 'patient-6', name: 'Patricia Davis', mrn: 'MRN-006', age: 72, gender: 'female', location: 'Room 315', diagnosis: 'Atrial Fibrillation with RVR', status: 'high', admitDate: '2024-12-05' },
  { id: 'patient-7', name: 'James Wilson', mrn: 'MRN-007', age: 56, gender: 'male', location: 'Room 210', diagnosis: 'Diabetic Ketoacidosis', status: 'critical', admitDate: '2024-12-04' },
  { id: 'patient-8', name: 'Jennifer Martinez', mrn: 'MRN-008', age: 49, gender: 'female', location: 'Room 405', diagnosis: 'Acute Pancreatitis', status: 'high', admitDate: '2024-12-03' },
  { id: 'patient-9', name: 'William Anderson', mrn: 'MRN-009', age: 84, gender: 'male', location: 'Room 512', diagnosis: 'Hip Fracture Post-Op', status: 'critical', admitDate: '2024-12-01' },
  { id: 'patient-10', name: 'Elizabeth Taylor', mrn: 'MRN-010', age: 66, gender: 'female', location: 'Room 320', diagnosis: 'GI Bleed', status: 'high', admitDate: '2024-12-04' },
  { id: 'patient-11', name: 'David Lee', mrn: 'MRN-011', age: 69, gender: 'male', location: 'Room 610', diagnosis: 'Stroke - CVA', status: 'critical', admitDate: '2024-11-30' },
  { id: 'patient-12', name: 'Susan Clark', mrn: 'MRN-012', age: 76, gender: 'female', location: 'ICU-4', diagnosis: 'Sepsis', status: 'critical', admitDate: '2024-12-02' },
  { id: 'patient-13', name: 'Thomas White', mrn: 'MRN-013', age: 62, gender: 'male', location: 'CCU-2', diagnosis: 'Acute MI - NSTEMI', status: 'high', admitDate: '2024-12-04' },
  { id: 'patient-14', name: 'Nancy Hall', mrn: 'MRN-014', age: 54, gender: 'female', location: 'Room 225', diagnosis: 'Pulmonary Embolism', status: 'high', admitDate: '2024-12-03' },
  { id: 'patient-15', name: 'Christopher Young', mrn: 'MRN-015', age: 47, gender: 'male', location: 'Room 118', diagnosis: 'Alcohol Withdrawal', status: 'high', admitDate: '2024-12-05' },
  { id: 'patient-16', name: 'Dorothy King', mrn: 'MRN-016', age: 81, gender: 'female', location: 'Room 430', diagnosis: 'UTI / Pyelonephritis', status: 'moderate', admitDate: '2024-12-04' },
  { id: 'patient-17', name: 'Daniel Wright', mrn: 'MRN-017', age: 59, gender: 'male', location: 'Room 312', diagnosis: 'Syncope - Workup', status: 'moderate', admitDate: '2024-12-05' },
  { id: 'patient-18', name: 'Betty Scott', mrn: 'MRN-018', age: 73, gender: 'female', location: 'Room 520', diagnosis: 'Hypertensive Emergency', status: 'high', admitDate: '2024-12-04' },
  { id: 'patient-19', name: 'Mark Thompson', mrn: 'MRN-019', age: 51, gender: 'male', location: 'Room 205', diagnosis: 'Asthma Exacerbation', status: 'moderate', admitDate: '2024-12-05' },
  { id: 'patient-20', name: 'Karen Phillips', mrn: 'MRN-020', age: 68, gender: 'female', location: 'Room 415', diagnosis: 'Small Bowel Obstruction', status: 'high', admitDate: '2024-12-03' },
  { id: 'patient-21', name: 'Steven Robinson', mrn: 'MRN-021', age: 45, gender: 'male', location: 'Room 102', diagnosis: 'Appendicitis Post-Op', status: 'low', admitDate: '2024-12-06' },
  { id: 'patient-22', name: 'Helen Carter', mrn: 'MRN-022', age: 77, gender: 'female', location: 'Room 328', diagnosis: 'Heart Failure - New Onset', status: 'high', admitDate: '2024-12-04' },
  { id: 'patient-23', name: 'George Mitchell', mrn: 'MRN-023', age: 61, gender: 'male', location: 'Room 115', diagnosis: 'Diverticulitis', status: 'moderate', admitDate: '2024-12-04' },
]

const statusColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
}

type SortField = 'name' | 'mrn' | 'location' | 'diagnosis' | 'admitDate' | 'status' | null
type SortDirection = 'asc' | 'desc'

export default function PatientsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedListId, setSelectedListId] = useState<string>('aidbox-patients')
  const [patientLists, setPatientLists] = useState<PatientList[]>([])
  const [listRefreshKey, setListRefreshKey] = useState(0)
  const [aidboxPage, setAidboxPage] = useState(1)
  const {
    data: aidboxData,
    isLoading: isLoadingAidbox,
    isError: isAidboxError,
  } = usePatients({ _count: 50, page: aidboxPage })
  const aidboxPatients = aidboxData?.patients || []
  const aidboxTotal = aidboxData?.total || 0

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Load patient lists
  useEffect(() => {
    setPatientLists(getPatientLists())
  }, [listRefreshKey])

  // Load notes from localStorage
  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const ids = getListPatients().map((p) => p.id).filter(Boolean)
        if (ids.length > 0) {
          const res = await fetch(`/api/sticky-notes?patientIds=${encodeURIComponent(ids.join(','))}`)
          if (res.ok) {
            const data = await res.json()
            const fromApi = (data?.notesByPatientId || {}) as Record<string, string>
            if (mounted) setNotes(fromApi)
            return
          }
        }
      } catch {
        // ignore
      }

      const allNotes = getAllPatientNotes()
      const loadedNotes: Record<string, string> = {}
      Object.entries(allNotes).forEach(([patientId, n]) => {
        loadedNotes[patientId] = n.note || ''
      })
      if (mounted) setNotes(loadedNotes)
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const handleNoteSave = (patientId: string, note: string) => {
    ;(async () => {
      try {
        const res = await fetch('/api/sticky-notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId, note }),
        })
        if (res.ok) {
          setNotes((prev) => ({ ...prev, [patientId]: note }))
          return
        }
      } catch {
        // ignore
      }

      savePatientNote(patientId, note)
      setNotes((prev) => ({ ...prev, [patientId]: note }))
    })()
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with ascending direction
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Format Aidbox patient for display
  const formatAidboxPatient = (p: any) => ({
    id: p.id || '',
    name: formatPatientName(p),
    mrn: p.identifier?.[0]?.value || 'MRN-N/A',
    age: p.birthDate ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
    gender: p.gender || 'unknown',
    location: p.address?.[0]?.text || 'Unknown',
    diagnosis: '—',
    status: 'moderate',
    admitDate: p.meta?.lastUpdated || '',
  })

  // Get patients for selected list
  const getListPatients = () => {
    if (selectedListId === 'mock-patients') {
      return mockPatients
    }
    if (selectedListId === 'aidbox-patients') {
      return aidboxPatients.map(formatAidboxPatient)
    }
    const list = patientLists.find((l) => l.id === selectedListId)
    if (!list) return mockPatients
    
    // Check if list contains Aidbox patient IDs (UUIDs with dashes)
    const hasAidboxIds = list.patientIds.some(id => id.includes('-') && id.length > 30)
    
    if (hasAidboxIds) {
      // Filter Aidbox patients by list IDs
      return aidboxPatients
        .filter((p) => list.patientIds.includes(p.id || ''))
        .map(formatAidboxPatient)
    }
    
    // Filter mock patients
    return mockPatients.filter((p) => list.patientIds.includes(p.id))
  }

  // Reset Aidbox page when switching lists
  useEffect(() => {
    if (selectedListId === 'aidbox-patients') {
      setAidboxPage(1)
    }
  }, [selectedListId])

  const listPatients = getListPatients()

  const filteredPatients = listPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate patient counts for each list
  const patientCounts: Record<string, number> = {
    all: mockPatients.length,
    'mock-patients': mockPatients.length,
    'aidbox-patients': aidboxPatients.length,
  }
  patientLists.forEach((list) => {
    if (list.id === 'mock-patients') {
      patientCounts[list.id] = mockPatients.length
    } else if (list.id === 'aidbox-patients') {
      patientCounts[list.id] = aidboxPatients.length
    } else {
      // Check if list contains Aidbox patient IDs
      const hasAidboxIds = list.patientIds.some(id => id.includes('-') && id.length > 30)
      if (hasAidboxIds) {
        patientCounts[list.id] = aidboxPatients.filter((p) => 
          list.patientIds.includes(p.id || '')
        ).length
      } else {
        patientCounts[list.id] = mockPatients.filter((p) => 
          list.patientIds.includes(p.id)
        ).length
      }
    }
  })

  // Handle adding/removing patients from lists
  const handleAddToList = (patientId: string, listId: string) => {
    addPatientToList(listId, patientId)
    setListRefreshKey((k) => k + 1)
  }

  const handleRemoveFromList = (patientId: string, listId: string) => {
    removePatientFromList(listId, patientId)
    setListRefreshKey((k) => k + 1)
  }

  // Get lists that a patient belongs to
  const getPatientListMembership = (patientId: string): string[] => {
    return patientLists
      .filter((l) => l.patientIds.includes(patientId))
      .map((l) => l.id)
  }

  // Sort patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (!sortField) return 0

    let aVal: any
    let bVal: any

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'mrn':
        aVal = a.mrn
        bVal = b.mrn
        break
      case 'location':
        aVal = a.location
        bVal = b.location
        break
      case 'diagnosis':
        aVal = a.diagnosis.toLowerCase()
        bVal = b.diagnosis.toLowerCase()
        break
      case 'admitDate':
        aVal = new Date(a.admitDate).getTime()
        bVal = new Date(b.admitDate).getTime()
        break
      case 'status':
        // Sort by status priority: critical > high > moderate > low
        const statusOrder: Record<string, number> = {
          critical: 4,
          high: 3,
          moderate: 2,
          low: 1,
        }
        aVal = statusOrder[a.status] || 0
        bVal = statusOrder[b.status] || 0
        break
      default:
        return 0
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const selectedList = patientLists.find((l) => l.id === selectedListId)

  const totalPages = selectedListId === 'aidbox-patients' ? Math.max(1, Math.ceil(aidboxTotal / 50)) : 1

  return (
    <div className="flex h-[calc(100vh-6rem)]" style={{ fontWeight: 200, fontSize: '14px' }}>
      {/* Patient Lists Sidebar */}
      <PatientListsSidebar
        selectedListId={selectedListId}
        onSelectList={setSelectedListId}
        patientCounts={patientCounts}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {selectedList?.name || 'All Patients'}
            </h1>
            <p className="text-muted-foreground">
              {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
              {selectedList?.description && ` • ${selectedList.description}`}
            </p>
          </div>
          <Link href="/patients/admit">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Admit New Patient
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, MRN, or diagnosis..."
                className="w-full rounded-md border pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Patient
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('mrn')}
              >
                <div className="flex items-center gap-1">
                  MRN
                  {sortField === 'mrn' && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center gap-1">
                  Location
                  {sortField === 'location' && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('diagnosis')}
              >
                <div className="flex items-center gap-1">
                  Diagnosis
                  {sortField === 'diagnosis' && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('admitDate')}
              >
                <div className="flex items-center gap-1">
                  Admit Date
                  {sortField === 'admitDate' && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))
            ) : filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {searchTerm 
                    ? `No patients found matching "${searchTerm}"`
                    : 'No patients in this list. Add patients using the actions menu.'}
                </TableCell>
              </TableRow>
            ) : sortedPatients.map((patient) => (
              <TableRow 
                key={patient.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/patients/${patient.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3" style={{ fontSize: '12px' }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium">{patient.name}</div>
                      <div className="text-xs font-medium text-muted-foreground">
                        {patient.age}y {patient.gender === 'male' ? 'M' : 'F'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-medium">{patient.mrn}</TableCell>
                <TableCell className="text-xs font-medium">{patient.location}</TableCell>
                <TableCell className="text-xs font-medium">{patient.diagnosis}</TableCell>
                <TableCell className="text-xs font-medium">
                  {new Date(patient.admitDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[patient.status]}>
                    {patient.status}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <PatientNote
                      patientId={patient.id}
                      initialNote={notes[patient.id] || ''}
                      onSave={(note) => handleNoteSave(patient.id, note)}
                      position="above"
                    />
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <ListPlus className="h-4 w-4 mr-2" />
                          Add to list
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {patientLists
                            .filter((l) => !l.isDefault || (l.id !== 'mock-patients' && l.id !== 'aidbox-patients'))
                            .map((list) => {
                              const isInList = list.patientIds.includes(patient.id)
                              return (
                                <DropdownMenuItem
                                  key={list.id}
                                  onClick={() => handleAddToList(patient.id, list.id)}
                                  disabled={isInList}
                                >
                                  <div
                                    className="h-3 w-3 rounded mr-2"
                                    style={{ backgroundColor: list.color }}
                                  />
                                  {list.name}
                                  {isInList && <Check className="h-4 w-4 ml-auto" />}
                                </DropdownMenuItem>
                              )
                            })}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      {getPatientListMembership(patient.id).length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <ListMinus className="h-4 w-4 mr-2" />
                              Remove from list
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {patientLists
                                .filter((l) => l.patientIds.includes(patient.id) && l.id !== 'mock-patients' && l.id !== 'aidbox-patients')
                                .map((list) => (
                                  <DropdownMenuItem
                                    key={list.id}
                                    onClick={() => handleRemoveFromList(patient.id, list.id)}
                                  >
                                    <div
                                      className="h-3 w-3 rounded mr-2"
                                      style={{ backgroundColor: list.color }}
                                    />
                                    {list.name}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {selectedListId === 'aidbox-patients' && (
          <CardContent className="flex items-center justify-between py-3">
            <div className="text-sm text-muted-foreground">
              Showing {aidboxPatients.length} of {aidboxTotal} patients
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={aidboxPage <= 1 || isLoadingAidbox}
                onClick={() => setAidboxPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {aidboxPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={aidboxPage >= totalPages || isLoadingAidbox}
                onClick={() => setAidboxPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
      </div>
    </div>
  )
}
