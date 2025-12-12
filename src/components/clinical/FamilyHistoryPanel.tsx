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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Users, Heart, Brain, Activity } from 'lucide-react'

export interface FamilyMember {
  id: string
  relationship: string
  condition: string
  ageAtOnset?: number
  ageAtDeath?: number
  causeOfDeath?: string
  isDeceased: boolean
  notes?: string
  addedAt: string
}

interface FamilyHistoryPanelProps {
  patientId: string
  familyHistory: FamilyMember[]
  onAddMember?: (member: Omit<FamilyMember, 'id' | 'addedAt'>) => Promise<void>
  onUpdateMember?: (id: string, updates: Partial<FamilyMember>) => Promise<void>
  onDeleteMember?: (id: string) => Promise<void>
  readOnly?: boolean
}

const relationships = [
  'Mother',
  'Father',
  'Sister',
  'Brother',
  'Maternal Grandmother',
  'Maternal Grandfather',
  'Paternal Grandmother',
  'Paternal Grandfather',
  'Aunt',
  'Uncle',
  'Child',
  'Other',
]

const commonConditions = [
  { name: 'Heart Disease', icon: Heart, category: 'cardiovascular' },
  { name: 'Diabetes Type 2', icon: Activity, category: 'metabolic' },
  { name: 'Hypertension', icon: Heart, category: 'cardiovascular' },
  { name: 'Cancer - Breast', icon: Activity, category: 'cancer' },
  { name: 'Cancer - Colon', icon: Activity, category: 'cancer' },
  { name: 'Cancer - Lung', icon: Activity, category: 'cancer' },
  { name: 'Cancer - Prostate', icon: Activity, category: 'cancer' },
  { name: 'Stroke', icon: Brain, category: 'cardiovascular' },
  { name: "Alzheimer's Disease", icon: Brain, category: 'neurological' },
  { name: 'Depression', icon: Brain, category: 'mental_health' },
  { name: 'Anxiety', icon: Brain, category: 'mental_health' },
  { name: 'Asthma', icon: Activity, category: 'respiratory' },
  { name: 'Arthritis', icon: Activity, category: 'musculoskeletal' },
  { name: 'Kidney Disease', icon: Activity, category: 'renal' },
  { name: 'Thyroid Disease', icon: Activity, category: 'endocrine' },
]

const categoryColors: Record<string, string> = {
  cardiovascular: 'bg-red-100 text-red-800',
  metabolic: 'bg-blue-100 text-blue-800',
  cancer: 'bg-purple-100 text-purple-800',
  neurological: 'bg-yellow-100 text-yellow-800',
  mental_health: 'bg-green-100 text-green-800',
  respiratory: 'bg-cyan-100 text-cyan-800',
  musculoskeletal: 'bg-orange-100 text-orange-800',
  renal: 'bg-pink-100 text-pink-800',
  endocrine: 'bg-indigo-100 text-indigo-800',
  other: 'bg-gray-100 text-gray-800',
}

function getConditionCategory(condition: string): string {
  const found = commonConditions.find(
    (c) => c.name.toLowerCase() === condition.toLowerCase()
  )
  return found?.category || 'other'
}

export function FamilyHistoryPanel({
  patientId,
  familyHistory,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  readOnly = false,
}: FamilyHistoryPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    relationship: '',
    condition: '',
    ageAtOnset: '',
    ageAtDeath: '',
    causeOfDeath: '',
    isDeceased: false,
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      relationship: '',
      condition: '',
      ageAtOnset: '',
      ageAtDeath: '',
      causeOfDeath: '',
      isDeceased: false,
      notes: '',
    })
    setEditingMember(null)
  }

  const handleSubmit = async () => {
    if (!formData.relationship || !formData.condition) return

    setIsSubmitting(true)
    try {
      const data = {
        relationship: formData.relationship,
        condition: formData.condition,
        ageAtOnset: formData.ageAtOnset ? parseInt(formData.ageAtOnset) : undefined,
        ageAtDeath: formData.ageAtDeath ? parseInt(formData.ageAtDeath) : undefined,
        causeOfDeath: formData.causeOfDeath || undefined,
        isDeceased: formData.isDeceased,
        notes: formData.notes || undefined,
      }

      if (editingMember && onUpdateMember) {
        await onUpdateMember(editingMember.id, data)
      } else if (onAddMember) {
        await onAddMember(data)
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save family history:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (member: FamilyMember) => {
    setFormData({
      relationship: member.relationship,
      condition: member.condition,
      ageAtOnset: member.ageAtOnset?.toString() || '',
      ageAtDeath: member.ageAtDeath?.toString() || '',
      causeOfDeath: member.causeOfDeath || '',
      isDeceased: member.isDeceased,
      notes: member.notes || '',
    })
    setEditingMember(member)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (onDeleteMember && confirm('Delete this family history entry?')) {
      await onDeleteMember(id)
    }
  }

  // Group by relationship
  const groupedHistory = familyHistory.reduce(
    (acc, member) => {
      const key = member.relationship
      if (!acc[key]) acc[key] = []
      acc[key].push(member)
      return acc
    },
    {} as Record<string, FamilyMember[]>
  )

  // Calculate risk factors
  const hasCardiacHistory = familyHistory.some((m) =>
    ['heart disease', 'stroke', 'hypertension'].some((c) =>
      m.condition.toLowerCase().includes(c)
    )
  )
  const hasCancerHistory = familyHistory.some((m) =>
    m.condition.toLowerCase().includes('cancer')
  )
  const hasDiabetesHistory = familyHistory.some((m) =>
    m.condition.toLowerCase().includes('diabetes')
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Family Health History
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {familyHistory.length === 0
              ? 'No family history documented'
              : `${familyHistory.length} entries`}
          </p>
        </div>
        {!readOnly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-1" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? 'Edit Family History' : 'Add Family History'}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(v) =>
                        setFormData({ ...formData, relationship: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {relationships.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(v) => setFormData({ ...formData, condition: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {commonConditions.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.condition === 'Other' && (
                  <div className="space-y-2">
                    <Label>Specify Condition</Label>
                    <Input
                      placeholder="Enter condition"
                      value={formData.condition === 'Other' ? '' : formData.condition}
                      onChange={(e) =>
                        setFormData({ ...formData, condition: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age at Onset</Label>
                    <Input
                      type="number"
                      placeholder="Age"
                      value={formData.ageAtOnset}
                      onChange={(e) =>
                        setFormData({ ...formData, ageAtOnset: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isDeceased"
                      checked={formData.isDeceased}
                      onChange={(e) =>
                        setFormData({ ...formData, isDeceased: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="isDeceased">Deceased</Label>
                  </div>
                </div>

                {formData.isDeceased && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Age at Death</Label>
                      <Input
                        type="number"
                        placeholder="Age"
                        value={formData.ageAtDeath}
                        onChange={(e) =>
                          setFormData({ ...formData, ageAtDeath: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cause of Death</Label>
                      <Input
                        placeholder="Cause"
                        value={formData.causeOfDeath}
                        onChange={(e) =>
                          setFormData({ ...formData, causeOfDeath: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingMember ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent>
        {/* Risk Summary */}
        {(hasCardiacHistory || hasCancerHistory || hasDiabetesHistory) && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              Hereditary Risk Factors:
            </p>
            <div className="flex flex-wrap gap-2">
              {hasCardiacHistory && (
                <Badge className="bg-red-100 text-red-800">
                  <Heart className="h-3 w-3 mr-1" />
                  Cardiovascular
                </Badge>
              )}
              {hasCancerHistory && (
                <Badge className="bg-purple-100 text-purple-800">Cancer History</Badge>
              )}
              {hasDiabetesHistory && (
                <Badge className="bg-blue-100 text-blue-800">Diabetes</Badge>
              )}
            </div>
          </div>
        )}

        {familyHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No family health history documented</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedHistory).map(([relationship, members]) => (
              <div key={relationship} className="border rounded-lg p-3">
                <h4 className="font-medium mb-2">{relationship}</h4>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between bg-gray-50 rounded p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          className={categoryColors[getConditionCategory(member.condition)]}
                        >
                          {member.condition}
                        </Badge>
                        {member.ageAtOnset && (
                          <span className="text-sm text-muted-foreground">
                            Onset: {member.ageAtOnset}y
                          </span>
                        )}
                        {member.isDeceased && (
                          <Badge variant="outline" className="text-xs">
                            Deceased{member.ageAtDeath ? ` (${member.ageAtDeath}y)` : ''}
                          </Badge>
                        )}
                      </div>
                      {!readOnly && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FamilyHistoryPanel
