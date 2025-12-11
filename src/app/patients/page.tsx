'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { User, ChevronRight, Search, UserPlus } from 'lucide-react'

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

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground">
            {mockPatients.length} active inpatients
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
              <TableHead>Patient</TableHead>
              <TableHead>MRN</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Admit Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.age}y {patient.gender === 'male' ? 'M' : 'F'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{patient.mrn}</TableCell>
                <TableCell>{patient.location}</TableCell>
                <TableCell>{patient.diagnosis}</TableCell>
                <TableCell>
                  {new Date(patient.admitDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[patient.status]}>
                    {patient.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/patients/${patient.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
