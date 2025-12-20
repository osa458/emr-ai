'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pill,
  Home,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react'
import type { MedicationRequest, MedicationStatement } from '@medplum/fhirtypes'

interface MedicationsPanelProps {
  inpatientMedications: MedicationRequest[]
  homeMedications: MedicationStatement[]
  isLoading?: boolean
}

interface MedicationDisplay {
  id: string
  name: string
  dose: string
  frequency: string
  route?: string
  status: string
  isIV?: boolean
  indication?: string
  startDate?: string
  insuranceCovered?: boolean
  notes?: string
}

function parseMedicationRequest(med: MedicationRequest): MedicationDisplay {
  const name = med.medicationCodeableConcept?.text ||
    med.medicationCodeableConcept?.coding?.[0]?.display ||
    'Medication not specified'

  const dosage = med.dosageInstruction?.[0]
  const doseValue = dosage?.doseAndRate?.[0]?.doseQuantity?.value
  const doseUnit = dosage?.doseAndRate?.[0]?.doseQuantity?.unit || ''
  const dose = doseValue ? `${doseValue} ${doseUnit}` : ''

  const frequency = dosage?.timing?.code?.text ||
    dosage?.timing?.repeat?.frequency?.toString() || ''

  const route = dosage?.route?.coding?.[0]?.display ||
    dosage?.route?.text || ''

  const isIV = route.toLowerCase().includes('iv') ||
    route.toLowerCase().includes('intravenous') ||
    name.toLowerCase().includes(' iv')

  return {
    id: med.id || '',
    name,
    dose,
    frequency,
    route,
    status: med.status || 'active',
    isIV,
    indication: med.reasonCode?.[0]?.text,
    startDate: med.authoredOn,
  }
}

function parseMedicationStatement(med: MedicationStatement): MedicationDisplay {
  const name = med.medicationCodeableConcept?.text ||
    med.medicationCodeableConcept?.coding?.[0]?.display ||
    'Medication not specified'

  const dosage = med.dosage?.[0]
  const dose = dosage?.text || ''
  const frequency = dosage?.timing?.code?.text || ''

  // Check for insurance coverage note
  const insuranceNote = med.note?.find(n =>
    n.text?.toLowerCase().includes('insurance') ||
    n.text?.toLowerCase().includes('covered')
  )
  const insuranceCovered = !insuranceNote?.text?.toLowerCase().includes('not be covered')

  return {
    id: med.id || '',
    name,
    dose,
    frequency,
    status: med.status || 'active',
    insuranceCovered,
    notes: med.note?.[0]?.text,
  }
}

export function MedicationsPanel({
  inpatientMedications,
  homeMedications,
  isLoading
}: MedicationsPanelProps) {
  const [activeTab, setActiveTab] = useState<'inpatient' | 'home' | 'comparison'>('inpatient')

  const parsedInpatient = inpatientMedications.map(parseMedicationRequest)
  const parsedHome = homeMedications.map(parseMedicationStatement)

  // Find medications that appear in both lists (for comparison)
  const comparisonData = parsedHome.map(homeMed => {
    const matchingInpatient = parsedInpatient.find(inpMed =>
      inpMed.name.toLowerCase().includes(homeMed.name.split(' ')[0].toLowerCase()) ||
      homeMed.name.toLowerCase().includes(inpMed.name.split(' ')[0].toLowerCase())
    )

    return {
      homeMed,
      inpatientMed: matchingInpatient,
      status: matchingInpatient ? 'continued' : 'held',
    }
  })

  // Find new inpatient meds not in home list
  const newInpatientMeds = parsedInpatient.filter(inpMed =>
    !parsedHome.some(homeMed =>
      inpMed.name.toLowerCase().includes(homeMed.name.split(' ')[0].toLowerCase()) ||
      homeMed.name.toLowerCase().includes(inpMed.name.split(' ')[0].toLowerCase())
    )
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Medications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="inpatient" className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              Inpatient ({parsedInpatient.length})
            </TabsTrigger>
            <TabsTrigger value="home" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home ({parsedHome.length})
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              Comparison
            </TabsTrigger>
          </TabsList>

          {/* Inpatient Medications Tab */}
          <TabsContent value="inpatient" className="mt-4">
            {parsedInpatient.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active inpatient medications
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dose</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedInpatient.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{med.name}</span>
                          {med.isIV && (
                            <Badge variant="outline" className="text-xs">
                              IV
                            </Badge>
                          )}
                        </div>
                        {med.indication && (
                          <div className="text-xs text-muted-foreground mt-1">
                            For: {med.indication}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{med.dose || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {med.frequency || '—'}
                        </div>
                      </TableCell>
                      <TableCell>{med.route || 'PO'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={med.status === 'active' ? 'default' : 'secondary'}
                          className={med.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {med.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* IV Medications Warning */}
            {parsedInpatient.some(m => m.isIV) && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">IV Medications Active</span>
                </div>
                <div className="mt-1 text-sm text-amber-700">
                  Patient has {parsedInpatient.filter(m => m.isIV).length} IV medication(s).
                  Must convert to oral before discharge.
                </div>
              </div>
            )}
          </TabsContent>

          {/* Home Medications Tab */}
          <TabsContent value="home" className="mt-4">
            {parsedHome.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No home medications on file
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dose</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Insurance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedHome.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-medium">{med.name}</TableCell>
                      <TableCell>{med.dose || '—'}</TableCell>
                      <TableCell>{med.frequency || '—'}</TableCell>
                      <TableCell>
                        {med.insuranceCovered === false ? (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs">May need PA</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs">Covered</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="mt-4">
            <div className="space-y-4">
              {/* Home meds status */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Home Medication Status
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Home Medication</TableHead>
                      <TableHead>Status During Admission</TableHead>
                      <TableHead>Inpatient Equivalent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.homeMed.name}</TableCell>
                        <TableCell>
                          {item.status === 'continued' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Continued
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Held
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.inpatientMed ? (
                            <span>{item.inpatientMed.name} {item.inpatientMed.dose}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* New inpatient meds */}
              {newInpatientMeds.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    New Medications (Started During Admission)
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Dose</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Indication</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newInpatientMeds.map((med) => (
                        <TableRow key={med.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                NEW
                              </Badge>
                              <span className="font-medium">{med.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{med.dose || '—'}</TableCell>
                          <TableCell>{med.frequency || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {med.indication || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
