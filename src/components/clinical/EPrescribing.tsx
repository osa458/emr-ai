'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Pill,
  Plus,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  RefreshCw,
  Printer,
} from 'lucide-react'
import { checkDrugAllergyInteractions, checkDrugDrugInteractions } from '@/lib/drug-interactions'
import { toastSuccess, toastError } from '@/hooks/useToast'

export interface Prescription {
  id: string
  medication: string
  ndc?: string
  strength: string
  form: string
  quantity: number
  daysSupply: number
  refills: number
  sig: string
  pharmacy?: {
    name: string
    address: string
    phone: string
    ncpdpId: string
  }
  status: 'draft' | 'pending' | 'sent' | 'filled' | 'cancelled'
  prescribedDate: string
  prescribedBy: string
  notes?: string
}

interface EPrescribingProps {
  patientId: string
  patientAllergies: Array<{ allergen: string; severity: string }>
  currentMedications: string[]
  prescriptions: Prescription[]
  onCreatePrescription?: (rx: Omit<Prescription, 'id' | 'status' | 'prescribedDate'>) => Promise<void>
  onSendToPharmacy?: (rxId: string, pharmacyId: string) => Promise<void>
  onCancelPrescription?: (rxId: string) => Promise<void>
}

const commonMedications = [
  { name: 'Lisinopril', strengths: ['5mg', '10mg', '20mg', '40mg'], form: 'Tablet' },
  { name: 'Metformin', strengths: ['500mg', '850mg', '1000mg'], form: 'Tablet' },
  { name: 'Atorvastatin', strengths: ['10mg', '20mg', '40mg', '80mg'], form: 'Tablet' },
  { name: 'Amlodipine', strengths: ['2.5mg', '5mg', '10mg'], form: 'Tablet' },
  { name: 'Metoprolol', strengths: ['25mg', '50mg', '100mg'], form: 'Tablet' },
  { name: 'Omeprazole', strengths: ['20mg', '40mg'], form: 'Capsule' },
  { name: 'Losartan', strengths: ['25mg', '50mg', '100mg'], form: 'Tablet' },
  { name: 'Gabapentin', strengths: ['100mg', '300mg', '400mg'], form: 'Capsule' },
  { name: 'Hydrochlorothiazide', strengths: ['12.5mg', '25mg', '50mg'], form: 'Tablet' },
  { name: 'Sertraline', strengths: ['25mg', '50mg', '100mg'], form: 'Tablet' },
  { name: 'Fluoxetine', strengths: ['10mg', '20mg', '40mg'], form: 'Capsule' },
  { name: 'Prednisone', strengths: ['5mg', '10mg', '20mg'], form: 'Tablet' },
  { name: 'Amoxicillin', strengths: ['250mg', '500mg'], form: 'Capsule' },
  { name: 'Azithromycin', strengths: ['250mg', '500mg'], form: 'Tablet' },
  { name: 'Ibuprofen', strengths: ['400mg', '600mg', '800mg'], form: 'Tablet' },
]

const frequencies = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'At bedtime',
  'As needed',
  'With meals',
]

const samplePharmacies = [
  { id: 'ph1', name: 'CVS Pharmacy', address: '123 Main St', phone: '(555) 123-4567', ncpdpId: '1234567' },
  { id: 'ph2', name: 'Walgreens', address: '456 Oak Ave', phone: '(555) 234-5678', ncpdpId: '2345678' },
  { id: 'ph3', name: 'Rite Aid', address: '789 Elm Blvd', phone: '(555) 345-6789', ncpdpId: '3456789' },
]

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  filled: { label: 'Filled', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
}

export function EPrescribing({
  patientId,
  patientAllergies,
  currentMedications,
  prescriptions,
  onCreatePrescription,
  onSendToPharmacy,
  onCancelPrescription,
}: EPrescribingProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('')
  const [interactionWarnings, setInteractionWarnings] = useState<{
    drugDrug: any[]
    drugAllergy: any[]
  }>({ drugDrug: [], drugAllergy: [] })

  const [formData, setFormData] = useState({
    medication: '',
    strength: '',
    form: 'Tablet',
    quantity: '30',
    daysSupply: '30',
    refills: '0',
    frequency: 'Once daily',
    instructions: '',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      medication: '',
      strength: '',
      form: 'Tablet',
      quantity: '30',
      daysSupply: '30',
      refills: '0',
      frequency: 'Once daily',
      instructions: '',
      notes: '',
    })
    setInteractionWarnings({ drugDrug: [], drugAllergy: [] })
  }

  const handleMedicationSelect = (medName: string) => {
    const med = commonMedications.find(m => m.name === medName)
    setFormData({
      ...formData,
      medication: medName,
      form: med?.form || 'Tablet',
      strength: med?.strengths[0] || '',
    })

    // Check for interactions
    const allMeds = [...currentMedications, medName]
    const drugDrug = checkDrugDrugInteractions(allMeds)
    const drugAllergy = checkDrugAllergyInteractions([medName], patientAllergies)
    setInteractionWarnings({ drugDrug, drugAllergy })
  }

  const generateSig = (): string => {
    const { medication, strength, form, frequency, instructions } = formData
    let sig = `Take ${strength} ${form.toLowerCase()}`
    if (frequency) sig += ` ${frequency.toLowerCase()}`
    if (instructions) sig += `. ${instructions}`
    return sig
  }

  const handleSubmit = async () => {
    if (!formData.medication || !formData.strength || !onCreatePrescription) return

    setIsSubmitting(true)
    try {
      const pharmacy = samplePharmacies.find(p => p.id === selectedPharmacy)
      await onCreatePrescription({
        medication: formData.medication,
        strength: formData.strength,
        form: formData.form,
        quantity: parseInt(formData.quantity),
        daysSupply: parseInt(formData.daysSupply),
        refills: parseInt(formData.refills),
        sig: generateSig(),
        pharmacy: pharmacy ? {
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          ncpdpId: pharmacy.ncpdpId,
        } : undefined,
        prescribedBy: 'Current Provider',
        notes: formData.notes || undefined,
      })
      setIsDialogOpen(false)
      resetForm()
      toastSuccess(
        'Prescription Created',
        pharmacy ? `${formData.medication} sent to ${pharmacy.name}` : `${formData.medication} saved`
      )
    } catch (error) {
      console.error('Failed to create prescription:', error)
      toastError('Failed to Create Prescription', 'Please try again')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedMed = commonMedications.find(m => m.name === formData.medication)
  const hasWarnings = interactionWarnings.drugDrug.length > 0 || interactionWarnings.drugAllergy.length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-500" />
            e-Prescribe
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-1" />
              New Rx
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Prescription</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Interaction Warnings */}
              {hasWarnings && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Drug Interaction Warning</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {interactionWarnings.drugAllergy.length > 0 && (
                      <div>⚠️ Allergy alert: {interactionWarnings.drugAllergy.map(a => a.description).join('; ')}</div>
                    )}
                    {interactionWarnings.drugDrug.length > 0 && (
                      <div>⚠️ Drug interaction: {interactionWarnings.drugDrug.map(i => `${i.drug1} + ${i.drug2}: ${i.description}`).join('; ')}</div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Medication Search */}
              <div className="space-y-2">
                <Label>Medication *</Label>
                <Select value={formData.medication} onValueChange={handleMedicationSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select medication..." />
                  </SelectTrigger>
                  <SelectContent>
                    {commonMedications.map(med => (
                      <SelectItem key={med.name} value={med.name}>
                        {med.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Strength *</Label>
                  <Select
                    value={formData.strength}
                    onValueChange={(v) => setFormData({ ...formData, strength: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedMed?.strengths || ['5mg', '10mg', '20mg']).map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Form</Label>
                  <Select
                    value={formData.form}
                    onValueChange={(v) => setFormData({ ...formData, form: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Capsule">Capsule</SelectItem>
                      <SelectItem value="Solution">Solution</SelectItem>
                      <SelectItem value="Injection">Injection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(v) => setFormData({ ...formData, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Days Supply</Label>
                  <Input
                    type="number"
                    value={formData.daysSupply}
                    onChange={(e) => setFormData({ ...formData, daysSupply: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Refills</Label>
                  <Select
                    value={formData.refills}
                    onValueChange={(v) => setFormData({ ...formData, refills: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6, 11].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Instructions</Label>
                <Input
                  placeholder="With food, avoid alcohol, etc."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </div>

              {/* Sig Preview */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-xs text-muted-foreground">SIG Preview:</Label>
                <p className="font-medium">{generateSig() || 'Select medication to preview'}</p>
              </div>

              {/* Pharmacy Selection */}
              <div className="space-y-2">
                <Label>Send to Pharmacy</Label>
                <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pharmacy..." />
                  </SelectTrigger>
                  <SelectContent>
                    {samplePharmacies.map(ph => (
                      <SelectItem key={ph.id} value={ph.id}>
                        {ph.name} - {ph.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !formData.medication}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Sending...' : selectedPharmacy ? 'Send to Pharmacy' : 'Save Rx'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {prescriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No prescriptions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map(rx => {
              const StatusIcon = statusConfig[rx.status].icon
              return (
                <div key={rx.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{rx.medication} {rx.strength}</div>
                      <div className="text-sm text-muted-foreground">{rx.sig}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Qty: {rx.quantity} | Days: {rx.daysSupply} | Refills: {rx.refills}
                      </div>
                      {rx.pharmacy && (
                        <div className="text-xs text-blue-600 mt-1">
                          → {rx.pharmacy.name}
                        </div>
                      )}
                    </div>
                    <Badge className={statusConfig[rx.status].color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[rx.status].label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EPrescribing
