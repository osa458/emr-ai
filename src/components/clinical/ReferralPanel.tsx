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
  Send,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Phone,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'

export interface Referral {
  id: string
  specialty: string
  provider?: string
  facility?: string
  reason: string
  urgency: 'routine' | 'urgent' | 'emergent'
  status: 'draft' | 'sent' | 'received' | 'scheduled' | 'completed' | 'cancelled'
  requestedDate: string
  appointmentDate?: string
  notes?: string
  responseNotes?: string
  createdBy: string
  createdAt: string
}

interface ReferralPanelProps {
  patientId: string
  referrals: Referral[]
  onCreateReferral?: (referral: Omit<Referral, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>
  onUpdateReferral?: (id: string, updates: Partial<Referral>) => Promise<void>
  onCancelReferral?: (id: string) => Promise<void>
  readOnly?: boolean
}

const specialties = [
  'Cardiology',
  'Pulmonology',
  'Gastroenterology',
  'Nephrology',
  'Neurology',
  'Oncology',
  'Endocrinology',
  'Rheumatology',
  'Infectious Disease',
  'Psychiatry',
  'Orthopedics',
  'General Surgery',
  'Dermatology',
  'Ophthalmology',
  'ENT',
  'Urology',
  'Physical Therapy',
  'Occupational Therapy',
  'Social Work',
  'Palliative Care',
]

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  received: { label: 'Received', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-purple-100 text-purple-800', icon: Calendar },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
}

const urgencyConfig = {
  routine: { label: 'Routine', color: 'bg-gray-100 text-gray-800' },
  urgent: { label: 'Urgent', color: 'bg-orange-100 text-orange-800' },
  emergent: { label: 'Emergent', color: 'bg-red-100 text-red-800' },
}

export function ReferralPanel({
  patientId,
  referrals,
  onCreateReferral,
  onUpdateReferral,
  onCancelReferral,
  readOnly = false,
}: ReferralPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    specialty: '',
    provider: '',
    facility: '',
    reason: '',
    urgency: 'routine' as Referral['urgency'],
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      specialty: '',
      provider: '',
      facility: '',
      reason: '',
      urgency: 'routine',
      notes: '',
    })
  }

  const handleSubmit = async () => {
    if (!formData.specialty || !formData.reason || !onCreateReferral) return

    setIsSubmitting(true)
    try {
      await onCreateReferral({
        specialty: formData.specialty,
        provider: formData.provider || undefined,
        facility: formData.facility || undefined,
        reason: formData.reason,
        urgency: formData.urgency,
        status: 'sent',
        requestedDate: new Date().toISOString(),
        notes: formData.notes || undefined,
      })
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create referral:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (onCancelReferral && confirm('Cancel this referral?')) {
      await onCancelReferral(id)
    }
  }

  const pendingReferrals = referrals.filter(
    (r) => !['completed', 'cancelled'].includes(r.status)
  )
  const completedReferrals = referrals.filter(
    (r) => ['completed', 'cancelled'].includes(r.status)
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-500" />
            Referrals
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingReferrals.length} pending, {completedReferrals.length} completed
          </p>
        </div>
        {!readOnly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-1" />
                New Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Referral</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Specialty *</Label>
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
                  <div className="space-y-2">
                    <Label>Urgency</Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(v) =>
                        setFormData({ ...formData, urgency: v as Referral['urgency'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergent">Emergent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Provider</Label>
                    <Input
                      placeholder="Dr. Smith"
                      value={formData.provider}
                      onChange={(e) =>
                        setFormData({ ...formData, provider: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Facility</Label>
                    <Input
                      placeholder="City Hospital"
                      value={formData.facility}
                      onChange={(e) =>
                        setFormData({ ...formData, facility: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason for Referral *</Label>
                  <Textarea
                    placeholder="Clinical indication and specific questions..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Relevant history, medications, etc."
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
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Referral'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent>
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Send className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No referrals</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specialty</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                {!readOnly && <TableHead className="w-[80px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => {
                const StatusIcon = statusConfig[referral.status].icon
                return (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <div className="font-medium">{referral.specialty}</div>
                      {referral.provider && (
                        <div className="text-xs text-muted-foreground">
                          {referral.provider}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={referral.reason}>
                        {referral.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={urgencyConfig[referral.urgency].color}>
                        {urgencyConfig[referral.urgency].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[referral.status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[referral.status].label}
                      </Badge>
                      {referral.appointmentDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(new Date(referral.appointmentDate), 'MMM d')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(referral.requestedDate), 'MMM d, yyyy')}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        {!['completed', 'cancelled'].includes(referral.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleCancel(referral.id)}
                          >
                            Cancel
                          </Button>
                        )}
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

export default ReferralPanel
