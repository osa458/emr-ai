'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Plus,
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  Star,
  UserCheck,
} from 'lucide-react'

export interface CareTeamMember {
  id: string
  name: string
  role: string
  specialty?: string
  isPrimary: boolean
  phone?: string
  email?: string
  npi?: string
  startDate: string
  endDate?: string
  status: 'active' | 'inactive'
}

interface CareTeamPanelProps {
  patientId: string
  careTeam: CareTeamMember[]
  onAddMember?: (member: Omit<CareTeamMember, 'id'>) => Promise<void>
  onUpdateMember?: (id: string, updates: Partial<CareTeamMember>) => Promise<void>
  onRemoveMember?: (id: string) => Promise<void>
  readOnly?: boolean
}

const roles = [
  'Attending Physician',
  'Primary Care Physician',
  'Specialist',
  'Resident',
  'Nurse Practitioner',
  'Physician Assistant',
  'Registered Nurse',
  'Care Coordinator',
  'Social Worker',
  'Physical Therapist',
  'Occupational Therapist',
  'Pharmacist',
  'Dietitian',
  'Case Manager',
  'Other',
]

const specialties = [
  'Internal Medicine',
  'Family Medicine',
  'Cardiology',
  'Pulmonology',
  'Nephrology',
  'Neurology',
  'Oncology',
  'Endocrinology',
  'Gastroenterology',
  'Infectious Disease',
  'Rheumatology',
  'Psychiatry',
  'Surgery',
  'Orthopedics',
  'Emergency Medicine',
  'Critical Care',
]

const roleColors: Record<string, string> = {
  'Attending Physician': 'bg-blue-100 text-blue-800',
  'Primary Care Physician': 'bg-green-100 text-green-800',
  Specialist: 'bg-purple-100 text-purple-800',
  Resident: 'bg-yellow-100 text-yellow-800',
  'Nurse Practitioner': 'bg-pink-100 text-pink-800',
  'Physician Assistant': 'bg-indigo-100 text-indigo-800',
  'Registered Nurse': 'bg-cyan-100 text-cyan-800',
  default: 'bg-gray-100 text-gray-800',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function CareTeamPanel({
  patientId,
  careTeam,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  readOnly = false,
}: CareTeamPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<CareTeamMember | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    specialty: '',
    isPrimary: false,
    phone: '',
    email: '',
    npi: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      specialty: '',
      isPrimary: false,
      phone: '',
      email: '',
      npi: '',
    })
    setEditingMember(null)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.role) return

    setIsSubmitting(true)
    try {
      const data = {
        name: formData.name,
        role: formData.role,
        specialty: formData.specialty || undefined,
        isPrimary: formData.isPrimary,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        npi: formData.npi || undefined,
        startDate: new Date().toISOString(),
        status: 'active' as const,
      }

      if (editingMember && onUpdateMember) {
        await onUpdateMember(editingMember.id, data)
      } else if (onAddMember) {
        await onAddMember(data)
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save care team member:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (member: CareTeamMember) => {
    setFormData({
      name: member.name,
      role: member.role,
      specialty: member.specialty || '',
      isPrimary: member.isPrimary,
      phone: member.phone || '',
      email: member.email || '',
      npi: member.npi || '',
    })
    setEditingMember(member)
    setIsDialogOpen(true)
  }

  const handleRemove = async (id: string) => {
    if (onRemoveMember && confirm('Remove this team member?')) {
      await onRemoveMember(id)
    }
  }

  const activeMembers = careTeam.filter((m) => m.status === 'active')
  const primaryProvider = activeMembers.find((m) => m.isPrimary)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Care Team
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!readOnly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? 'Edit Team Member' : 'Add Team Member'}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Dr. John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(v) => setFormData({ ...formData, role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Specialty</Label>
                    <Select
                      value={formData.specialty}
                      onValueChange={(v) => setFormData({ ...formData, specialty: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={formData.isPrimary}
                    onChange={(e) =>
                      setFormData({ ...formData, isPrimary: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isPrimary">Primary Provider</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="doctor@hospital.org"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>NPI Number</Label>
                  <Input
                    placeholder="1234567890"
                    value={formData.npi}
                    onChange={(e) => setFormData({ ...formData, npi: e.target.value })}
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
        {activeMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No care team members assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Primary Provider First */}
            {primaryProvider && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-blue-600">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getInitials(primaryProvider.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{primaryProvider.name}</span>
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge
                          className={roleColors[primaryProvider.role] || roleColors.default}
                        >
                          {primaryProvider.role}
                        </Badge>
                        {primaryProvider.specialty && (
                          <span>{primaryProvider.specialty}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {primaryProvider.phone && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`tel:${primaryProvider.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {primaryProvider.email && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`mailto:${primaryProvider.email}`}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {!readOnly && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(primaryProvider)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(primaryProvider.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other Members */}
            {activeMembers
              .filter((m) => !m.isPrimary)
              .map((member) => (
                <div
                  key={member.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{member.name}</span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge
                            variant="outline"
                            className={roleColors[member.role] || roleColors.default}
                          >
                            {member.role}
                          </Badge>
                          {member.specialty && <span>{member.specialty}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {member.phone && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={`tel:${member.phone}`}>
                            <Phone className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {member.email && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={`mailto:${member.email}`}>
                            <Mail className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {!readOnly && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemove(member.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CareTeamPanel
