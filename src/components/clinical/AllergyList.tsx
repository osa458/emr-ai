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
import { Textarea } from '@/components/ui/textarea'
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  ShieldAlert,
  Pill,
  Apple,
  Bug,
} from 'lucide-react'
import { format } from 'date-fns'
import { toastSuccess, toastError } from '@/hooks/useToast'

export interface Allergy {
  id: string
  allergen: string
  type: 'medication' | 'food' | 'environmental' | 'other'
  reaction: string
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening'
  status: 'active' | 'inactive' | 'resolved'
  onsetDate?: string
  verifiedDate?: string
  verifiedBy?: string
  notes?: string
  addedAt: string
}

interface AllergyListProps {
  patientId: string
  allergies: Allergy[]
  onAddAllergy?: (allergy: Omit<Allergy, 'id' | 'addedAt'>) => Promise<void>
  onUpdateAllergy?: (id: string, updates: Partial<Allergy>) => Promise<void>
  onDeleteAllergy?: (id: string) => Promise<void>
  readOnly?: boolean
}

const typeConfig = {
  medication: { label: 'Medication', icon: Pill, color: 'text-blue-500' },
  food: { label: 'Food', icon: Apple, color: 'text-green-500' },
  environmental: { label: 'Environmental', icon: Bug, color: 'text-yellow-500' },
  other: { label: 'Other', icon: AlertTriangle, color: 'text-gray-500' },
}

const severityConfig = {
  mild: { label: 'Mild', color: 'bg-yellow-100 text-yellow-800' },
  moderate: { label: 'Moderate', color: 'bg-orange-100 text-orange-800' },
  severe: { label: 'Severe', color: 'bg-red-100 text-red-800' },
  'life-threatening': { label: 'Life-Threatening', color: 'bg-purple-100 text-purple-800' },
}

const commonMedicationAllergies = [
  'Penicillin',
  'Sulfa drugs',
  'Aspirin',
  'Ibuprofen',
  'Codeine',
  'Morphine',
  'Latex',
  'Contrast dye',
]

const commonFoodAllergies = [
  'Peanuts',
  'Tree nuts',
  'Shellfish',
  'Fish',
  'Milk',
  'Eggs',
  'Wheat',
  'Soy',
]

const commonReactions = [
  'Rash/Hives',
  'Itching',
  'Swelling',
  'Difficulty breathing',
  'Anaphylaxis',
  'Nausea/Vomiting',
  'Diarrhea',
  'Headache',
]

export function AllergyList({
  patientId,
  allergies,
  onAddAllergy,
  onUpdateAllergy,
  onDeleteAllergy,
  readOnly = false,
}: AllergyListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    allergen: '',
    type: 'medication' as Allergy['type'],
    reaction: '',
    severity: 'moderate' as Allergy['severity'],
    status: 'active' as Allergy['status'],
    onsetDate: '',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      allergen: '',
      type: 'medication',
      reaction: '',
      severity: 'moderate',
      status: 'active',
      onsetDate: '',
      notes: '',
    })
    setEditingAllergy(null)
  }

  const handleSubmit = async () => {
    if (!formData.allergen || !formData.reaction) return

    setIsSubmitting(true)
    try {
      if (editingAllergy && onUpdateAllergy) {
        await onUpdateAllergy(editingAllergy.id, formData)
        toastSuccess('Allergy Updated', formData.allergen)
      } else if (onAddAllergy) {
        await onAddAllergy({
          ...formData,
          verifiedDate: new Date().toISOString(),
          verifiedBy: 'Current User',
        })
        toastSuccess('Allergy Added', formData.allergen)
      }
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save allergy:', error)
      toastError('Failed to Save', 'Could not save allergy')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (allergy: Allergy) => {
    setFormData({
      allergen: allergy.allergen,
      type: allergy.type,
      reaction: allergy.reaction,
      severity: allergy.severity,
      status: allergy.status,
      onsetDate: allergy.onsetDate || '',
      notes: allergy.notes || '',
    })
    setEditingAllergy(allergy)
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (onDeleteAllergy && confirm('Are you sure you want to delete this allergy?')) {
      try {
        await onDeleteAllergy(id)
        toastSuccess('Allergy Removed', 'Allergy has been deleted')
      } catch (error) {
        toastError('Failed to Delete', 'Could not delete allergy')
      }
    }
  }

  const activeAllergies = allergies.filter((a) => a.status === 'active')
  const hasLifeThreatening = allergies.some(
    (a) => a.severity === 'life-threatening' && a.status === 'active'
  )

  return (
    <Card className={hasLifeThreatening ? 'border-red-300' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert
              className={`h-5 w-5 ${hasLifeThreatening ? 'text-red-500' : 'text-orange-500'}`}
            />
            Allergies
            {hasLifeThreatening && (
              <Badge className="bg-red-500 text-white ml-2">⚠️ Life-Threatening</Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {activeAllergies.length === 0
              ? 'No known allergies (NKDA)'
              : `${activeAllergies.length} active allergies`}
          </p>
        </div>
        {!readOnly && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-1" />
                Add Allergy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAllergy ? 'Edit Allergy' : 'Add New Allergy'}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="allergen">Allergen</Label>
                    <Input
                      id="allergen"
                      placeholder="e.g., Penicillin"
                      value={formData.allergen}
                      onChange={(e) =>
                        setFormData({ ...formData, allergen: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) =>
                        setFormData({ ...formData, type: v as Allergy['type'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="environmental">Environmental</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quick Add - Common Allergens</Label>
                  <div className="flex flex-wrap gap-1">
                    {(formData.type === 'medication'
                      ? commonMedicationAllergies
                      : formData.type === 'food'
                        ? commonFoodAllergies
                        : commonMedicationAllergies
                    )
                      .slice(0, 6)
                      .map((allergen) => (
                        <Button
                          key={allergen}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setFormData({ ...formData, allergen })}
                        >
                          {allergen}
                        </Button>
                      ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reaction">Reaction</Label>
                  <Input
                    id="reaction"
                    placeholder="Describe the reaction"
                    value={formData.reaction}
                    onChange={(e) =>
                      setFormData({ ...formData, reaction: e.target.value })
                    }
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {commonReactions.slice(0, 5).map((reaction) => (
                      <Button
                        key={reaction}
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => setFormData({ ...formData, reaction })}
                      >
                        {reaction}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(v) =>
                        setFormData({ ...formData, severity: v as Allergy['severity'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                        <SelectItem value="life-threatening">Life-Threatening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({ ...formData, status: v as Allergy['status'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onsetDate">Onset Date</Label>
                    <Input
                      id="onsetDate"
                      type="date"
                      value={formData.onsetDate}
                      onChange={(e) =>
                        setFormData({ ...formData, onsetDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingAllergy ? 'Update' : 'Add Allergy'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent>
        {allergies.length === 0 ? (
          <div className="text-center py-6">
            <ShieldAlert className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="font-medium text-green-700">No Known Drug Allergies (NKDA)</p>
            <p className="text-sm text-muted-foreground">
              Patient has no documented allergies
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Allergen</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reaction</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                {!readOnly && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allergies.map((allergy) => {
                const TypeIcon = typeConfig[allergy.type].icon
                return (
                  <TableRow
                    key={allergy.id}
                    className={
                      allergy.severity === 'life-threatening' ? 'bg-red-50' : ''
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <TypeIcon
                          className={`h-4 w-4 ${typeConfig[allergy.type].color}`}
                        />
                        {allergy.allergen}
                      </div>
                    </TableCell>
                    <TableCell>{typeConfig[allergy.type].label}</TableCell>
                    <TableCell>{allergy.reaction}</TableCell>
                    <TableCell>
                      <Badge className={severityConfig[allergy.severity].color}>
                        {severityConfig[allergy.severity].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={allergy.status === 'active' ? 'default' : 'secondary'}
                      >
                        {allergy.status}
                      </Badge>
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(allergy)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(allergy.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default AllergyList
