'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Syringe,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react'
import { format, differenceInYears, differenceInMonths } from 'date-fns'

export interface Immunization {
  id: string
  vaccine: string
  cvxCode: string
  doseNumber?: number
  seriesComplete: boolean
  administeredDate: string
  expirationDate?: string
  lotNumber?: string
  manufacturer?: string
  site?: string
  route?: string
  administeredBy?: string
  notes?: string
}

interface ImmunizationPanelProps {
  patientId: string
  patientDOB: string
  immunizations: Immunization[]
  onAddImmunization?: (imm: Omit<Immunization, 'id'>) => Promise<void>
  readOnly?: boolean
}

const vaccines = [
  { name: 'Influenza (Flu)', cvx: '141', schedule: 'Annual' },
  { name: 'COVID-19 (Pfizer)', cvx: '208', schedule: 'Per guidelines' },
  { name: 'COVID-19 (Moderna)', cvx: '207', schedule: 'Per guidelines' },
  { name: 'Tdap', cvx: '115', schedule: 'Every 10 years' },
  { name: 'Td (Tetanus/Diphtheria)', cvx: '113', schedule: 'Every 10 years' },
  { name: 'Pneumococcal (PPSV23)', cvx: '33', schedule: 'Age 65+' },
  { name: 'Pneumococcal (PCV20)', cvx: '216', schedule: 'Age 65+' },
  { name: 'Shingles (Shingrix)', cvx: '187', schedule: 'Age 50+, 2 doses' },
  { name: 'Hepatitis B', cvx: '08', schedule: '3 dose series' },
  { name: 'Hepatitis A', cvx: '83', schedule: '2 dose series' },
  { name: 'MMR', cvx: '03', schedule: '2 doses' },
  { name: 'Varicella', cvx: '21', schedule: '2 doses' },
  { name: 'HPV', cvx: '165', schedule: '2-3 doses' },
  { name: 'Meningococcal', cvx: '147', schedule: 'Per risk factors' },
  { name: 'RSV (Arexvy)', cvx: '305', schedule: 'Age 60+' },
]

const sites = ['Left Deltoid', 'Right Deltoid', 'Left Thigh', 'Right Thigh', 'Other']
const routes = ['Intramuscular', 'Subcutaneous', 'Intradermal', 'Oral', 'Intranasal']

function getRecommendedVaccines(age: number): string[] {
  const recommended: string[] = ['Influenza (Flu)']
  
  if (age >= 50) recommended.push('Shingles (Shingrix)')
  if (age >= 60) recommended.push('RSV (Arexvy)')
  if (age >= 65) {
    recommended.push('Pneumococcal (PPSV23)')
    recommended.push('Pneumococcal (PCV20)')
  }
  
  return recommended
}

function isDue(vaccine: string, immunizations: Immunization[]): boolean {
  const existing = immunizations.filter((i) => i.vaccine === vaccine)
  if (existing.length === 0) return true
  
  const lastDose = existing.sort(
    (a, b) => new Date(b.administeredDate).getTime() - new Date(a.administeredDate).getTime()
  )[0]
  
  const monthsSince = differenceInMonths(new Date(), new Date(lastDose.administeredDate))
  
  if (vaccine.includes('Flu') && monthsSince >= 12) return true
  if (vaccine.includes('Tdap') || vaccine.includes('Td')) {
    const yearsSince = differenceInYears(new Date(), new Date(lastDose.administeredDate))
    if (yearsSince >= 10) return true
  }
  
  return false
}

export function ImmunizationPanel({
  patientId,
  patientDOB,
  immunizations,
  onAddImmunization,
  readOnly = false,
}: ImmunizationPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const patientAge = differenceInYears(new Date(), new Date(patientDOB))
  const recommendedVaccines = getRecommendedVaccines(patientAge)

  const [formData, setFormData] = useState({
    vaccine: '',
    cvxCode: '',
    doseNumber: '',
    administeredDate: format(new Date(), 'yyyy-MM-dd'),
    lotNumber: '',
    manufacturer: '',
    site: '',
    route: 'Intramuscular',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      vaccine: '',
      cvxCode: '',
      doseNumber: '',
      administeredDate: format(new Date(), 'yyyy-MM-dd'),
      lotNumber: '',
      manufacturer: '',
      site: '',
      route: 'Intramuscular',
      notes: '',
    })
  }

  const handleVaccineSelect = (vaccineName: string) => {
    const vaccineInfo = vaccines.find((v) => v.name === vaccineName)
    setFormData({
      ...formData,
      vaccine: vaccineName,
      cvxCode: vaccineInfo?.cvx || '',
    })
  }

  const handleSubmit = async () => {
    if (!formData.vaccine || !formData.administeredDate || !onAddImmunization) return

    setIsSubmitting(true)
    try {
      await onAddImmunization({
        vaccine: formData.vaccine,
        cvxCode: formData.cvxCode,
        doseNumber: formData.doseNumber ? parseInt(formData.doseNumber) : undefined,
        seriesComplete: false,
        administeredDate: formData.administeredDate,
        lotNumber: formData.lotNumber || undefined,
        manufacturer: formData.manufacturer || undefined,
        site: formData.site || undefined,
        route: formData.route || undefined,
        notes: formData.notes || undefined,
      })
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to add immunization:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const dueVaccines = recommendedVaccines.filter((v) => isDue(v, immunizations))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-blue-500" />
            Immunizations
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {immunizations.length} recorded
          </p>
        </div>
        {!readOnly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-1" />
                Add Vaccine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Record Immunization</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Vaccine *</Label>
                  <Select value={formData.vaccine} onValueChange={handleVaccineSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vaccine..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vaccines.map((v) => (
                        <SelectItem key={v.cvx} value={v.name}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CVX Code</Label>
                    <Input
                      value={formData.cvxCode}
                      onChange={(e) =>
                        setFormData({ ...formData, cvxCode: e.target.value })
                      }
                      placeholder="CVX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dose Number</Label>
                    <Input
                      type="number"
                      value={formData.doseNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, doseNumber: e.target.value })
                      }
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date Administered *</Label>
                    <Input
                      type="date"
                      value={formData.administeredDate}
                      onChange={(e) =>
                        setFormData({ ...formData, administeredDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lot Number</Label>
                    <Input
                      value={formData.lotNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, lotNumber: e.target.value })
                      }
                      placeholder="Lot #"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Site</Label>
                    <Select
                      value={formData.site}
                      onValueChange={(v) => setFormData({ ...formData, site: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Route</Label>
                    <Select
                      value={formData.route}
                      onValueChange={(v) => setFormData({ ...formData, route: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                    placeholder="Pfizer, Moderna, etc."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Record Vaccine'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Due Vaccines Alert */}
        {dueVaccines.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              Vaccines Due
            </div>
            <div className="flex flex-wrap gap-2">
              {dueVaccines.map((v) => (
                <Badge key={v} className="bg-yellow-100 text-yellow-800">
                  <Clock className="h-3 w-3 mr-1" />
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Immunization History */}
        {immunizations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Syringe className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No immunizations recorded</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vaccine</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Lot #</TableHead>
                <TableHead>Site</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {immunizations
                .sort(
                  (a, b) =>
                    new Date(b.administeredDate).getTime() -
                    new Date(a.administeredDate).getTime()
                )
                .map((imm) => (
                  <TableRow key={imm.id}>
                    <TableCell>
                      <div className="font-medium">{imm.vaccine}</div>
                      {imm.manufacturer && (
                        <div className="text-xs text-muted-foreground">
                          {imm.manufacturer}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {imm.doseNumber ? `Dose ${imm.doseNumber}` : '-'}
                      {imm.seriesComplete && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(imm.administeredDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {imm.lotNumber || '-'}
                    </TableCell>
                    <TableCell className="text-sm">{imm.site || '-'}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default ImmunizationPanel
