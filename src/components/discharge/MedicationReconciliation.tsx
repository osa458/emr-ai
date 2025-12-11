'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pill,
  Building2,
  Home,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  Phone,
  MapPin,
  Truck,
  FileText,
  Send,
  RefreshCw,
} from 'lucide-react'
import type { MedicationRequest, MedicationStatement, Coverage, Organization } from '@medplum/fhirtypes'

interface MedicationReconciliationProps {
  patientId: string
  encounterId: string
  inpatientMedications: MedicationRequest[]
  homeMedications: MedicationStatement[]
  coverage: Coverage[]
  pharmacies: Organization[]
  isLoading?: boolean
}

interface ReconciliationItem {
  id: string
  name: string
  homeDose?: string
  dischargeDose: string
  frequency: string
  status: 'continue' | 'discontinue' | 'modify' | 'new'
  isNew: boolean
  insuranceCovered: boolean
  priorAuthRequired: boolean
  estimatedCost?: string
  alternativeSuggestion?: string
}

// Simulated formulary data (in production, this would come from insurance API)
const formularyDatabase: Record<string, { 
  covered: boolean; 
  tier: number; 
  priorAuth: boolean; 
  copay: string;
  alternatives?: string[];
}> = {
  'lisinopril': { covered: true, tier: 1, priorAuth: false, copay: '$5' },
  'metoprolol': { covered: true, tier: 1, priorAuth: false, copay: '$5' },
  'aspirin': { covered: true, tier: 1, priorAuth: false, copay: '$3' },
  'atorvastatin': { covered: true, tier: 2, priorAuth: false, copay: '$15' },
  'furosemide': { covered: true, tier: 1, priorAuth: false, copay: '$5' },
  'metformin': { covered: true, tier: 1, priorAuth: false, copay: '$5' },
  'omeprazole': { covered: true, tier: 1, priorAuth: false, copay: '$10' },
  'gabapentin': { covered: true, tier: 2, priorAuth: false, copay: '$15' },
  'albuterol': { covered: true, tier: 2, priorAuth: false, copay: '$25' },
  'prednisone': { covered: true, tier: 1, priorAuth: false, copay: '$5' },
  'empagliflozin': { covered: false, tier: 4, priorAuth: true, copay: '$75', alternatives: ['metformin', 'glipizide'] },
  'tiotropium': { covered: false, tier: 3, priorAuth: true, copay: '$50', alternatives: ['ipratropium'] },
  'eliquis': { covered: true, tier: 3, priorAuth: true, copay: '$45' },
  'xarelto': { covered: true, tier: 3, priorAuth: true, copay: '$45' },
  'insulin glargine': { covered: true, tier: 2, priorAuth: false, copay: '$35' },
  'ceftriaxone': { covered: true, tier: 2, priorAuth: false, copay: '$20' },
  'vancomycin': { covered: true, tier: 3, priorAuth: false, copay: '$30' },
}

function checkFormulary(medicationName: string): { 
  covered: boolean; 
  tier: number; 
  priorAuth: boolean; 
  copay: string;
  alternatives?: string[];
} {
  const normalizedName = medicationName.toLowerCase().split(' ')[0]
  return formularyDatabase[normalizedName] || { 
    covered: true, tier: 2, priorAuth: false, copay: '$15' 
  }
}

export function MedicationReconciliation({
  patientId,
  encounterId,
  inpatientMedications,
  homeMedications,
  coverage,
  pharmacies,
  isLoading,
}: MedicationReconciliationProps) {
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('')
  const [reconciliationList, setReconciliationList] = useState<ReconciliationItem[]>([])
  const [isChecking, setIsChecking] = useState(false)

  // Get active insurance plan
  const activeCoverage = coverage[0]
  const insuranceName = activeCoverage?.class?.[0]?.name || 'Unknown Insurance'
  const formularyTier = activeCoverage?.class?.[0]?.value || 'standard'

  // Build reconciliation list
  useEffect(() => {
    const items: ReconciliationItem[] = []

    // Process home medications
    homeMedications.forEach(homeMed => {
      const name = homeMed.medicationCodeableConcept?.text || 
                   homeMed.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown'
      const dose = homeMed.dosage?.[0]?.text || ''
      const frequency = homeMed.dosage?.[0]?.timing?.code?.text || ''

      // Check if continued in inpatient
      const matchingInpatient = inpatientMedications.find(inpMed => {
        const inpName = inpMed.medicationCodeableConcept?.text?.toLowerCase() || ''
        return inpName.includes(name.split(' ')[0].toLowerCase())
      })

      const formularyInfo = checkFormulary(name)

      items.push({
        id: homeMed.id || Math.random().toString(),
        name,
        homeDose: dose,
        dischargeDose: matchingInpatient 
          ? (inpatientMedications.find(m => m.id === matchingInpatient.id)?.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.value?.toString() || dose)
          : dose,
        frequency,
        status: matchingInpatient ? 'continue' : 'discontinue',
        isNew: false,
        insuranceCovered: formularyInfo.covered,
        priorAuthRequired: formularyInfo.priorAuth,
        estimatedCost: formularyInfo.copay,
        alternativeSuggestion: formularyInfo.alternatives?.[0],
      })
    })

    // Add new inpatient medications not in home list
    inpatientMedications.forEach(inpMed => {
      const name = inpMed.medicationCodeableConcept?.text || 
                   inpMed.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown'
      
      // Skip IV medications
      if (name.toLowerCase().includes(' iv') || name.toLowerCase().includes('iv ')) {
        return
      }

      const existsInHome = homeMedications.some(homeMed => {
        const homeName = homeMed.medicationCodeableConcept?.text?.toLowerCase() || ''
        return homeName.includes(name.split(' ')[0].toLowerCase())
      })

      if (!existsInHome) {
        const dosage = inpMed.dosageInstruction?.[0]
        const dose = dosage?.doseAndRate?.[0]?.doseQuantity?.value?.toString() || ''
        const unit = dosage?.doseAndRate?.[0]?.doseQuantity?.unit || ''
        const frequency = dosage?.timing?.code?.text || ''

        const formularyInfo = checkFormulary(name)

        items.push({
          id: inpMed.id || Math.random().toString(),
          name,
          dischargeDose: `${dose} ${unit}`.trim(),
          frequency,
          status: 'new',
          isNew: true,
          insuranceCovered: formularyInfo.covered,
          priorAuthRequired: formularyInfo.priorAuth,
          estimatedCost: formularyInfo.copay,
          alternativeSuggestion: formularyInfo.alternatives?.[0],
        })
      }
    })

    setReconciliationList(items)
  }, [homeMedications, inpatientMedications])

  const toggleMedicationStatus = (id: string, newStatus: ReconciliationItem['status']) => {
    setReconciliationList(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      )
    )
  }

  const coverageIssues = reconciliationList.filter(
    item => item.status !== 'discontinue' && (!item.insuranceCovered || item.priorAuthRequired)
  )

  const totalEstimatedCost = reconciliationList
    .filter(item => item.status !== 'discontinue')
    .reduce((sum, item) => {
      const cost = parseInt(item.estimatedCost?.replace('$', '') || '0')
      return sum + cost
    }, 0)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Insurance & Pharmacy Selection */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Insurance Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Insurance Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan:</span>
                <span className="font-medium">{insuranceName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Formulary:</span>
                <Badge variant="outline" className="capitalize">{formularyTier}</Badge>
              </div>
              {coverageIssues.length > 0 && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                  <div className="flex items-center gap-1 text-amber-800 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    {coverageIssues.length} coverage issue(s) detected
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pharmacy Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Discharge Pharmacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
              <SelectTrigger>
                <SelectValue placeholder="Select pharmacy..." />
              </SelectTrigger>
              <SelectContent>
                {pharmacies.map(pharmacy => (
                  <SelectItem key={pharmacy.id} value={pharmacy.id || ''}>
                    <div className="flex items-center gap-2">
                      <span>{pharmacy.name}</span>
                      {pharmacy.extension?.some(e => e.valueBoolean) && (
                        <Truck className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPharmacy && (
              <div className="mt-3 text-sm space-y-1">
                {(() => {
                  const pharmacy = pharmacies.find(p => p.id === selectedPharmacy)
                  if (!pharmacy) return null
                  return (
                    <>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {pharmacy.address?.[0]?.text}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {pharmacy.telecom?.[0]?.value}
                      </div>
                      {pharmacy.extension?.some(e => e.valueBoolean) && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          <Truck className="h-3 w-3 mr-1" />
                          Delivery Available
                        </Badge>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medication Reconciliation Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Discharge Medication Reconciliation
              </CardTitle>
              <CardDescription>
                Review and confirm medications to send to pharmacy
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Est. Monthly Cost</div>
              <div className="text-xl font-bold">${totalEstimatedCost}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Home Dose</TableHead>
                <TableHead>Discharge Dose</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliationList.map(item => (
                <TableRow 
                  key={item.id}
                  className={item.status === 'discontinue' ? 'opacity-50' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.isNew && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          NEW
                        </Badge>
                      )}
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.homeDose || '—'}
                  </TableCell>
                  <TableCell>
                    {item.status === 'discontinue' ? (
                      <span className="text-muted-foreground line-through">{item.dischargeDose}</span>
                    ) : (
                      item.dischargeDose
                    )}
                  </TableCell>
                  <TableCell>{item.frequency || '—'}</TableCell>
                  <TableCell>
                    {item.insuranceCovered ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">{item.estimatedCost}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">Not covered</span>
                        </div>
                        {item.alternativeSuggestion && (
                          <div className="text-xs text-muted-foreground">
                            Try: {item.alternativeSuggestion}
                          </div>
                        )}
                      </div>
                    )}
                    {item.priorAuthRequired && item.insuranceCovered && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        PA Required
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.status === 'continue' ? 'bg-green-100 text-green-800' :
                        item.status === 'discontinue' ? 'bg-red-100 text-red-800' :
                        item.status === 'modify' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }
                    >
                      {item.status === 'continue' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {item.status === 'discontinue' && <XCircle className="h-3 w-3 mr-1" />}
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.status !== 'continue' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleMedicationStatus(item.id, 'continue')}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {item.status !== 'discontinue' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleMedicationStatus(item.id, 'discontinue')}
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Coverage Issues Alert */}
          {coverageIssues.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                <AlertTriangle className="h-5 w-5" />
                Coverage Issues Requiring Attention
              </div>
              <ul className="space-y-2">
                {coverageIssues.map(item => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-amber-700">
                      {item.name}: {!item.insuranceCovered ? 'Not covered' : 'Prior auth required'}
                    </span>
                    {item.alternativeSuggestion && (
                      <Button size="sm" variant="outline" className="text-xs">
                        Switch to {item.alternativeSuggestion}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {reconciliationList.filter(i => i.status !== 'discontinue').length} medications to dispense
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Print Summary
              </Button>
              <Button 
                disabled={!selectedPharmacy}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Pharmacy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
