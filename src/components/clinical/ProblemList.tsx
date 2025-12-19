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
  AlertCircle,
  Plus,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Search,
} from 'lucide-react'
import { format } from 'date-fns'
import { toastSuccess, toastError } from '@/hooks/useToast'

export interface Problem {
  id: string
  code: string
  codeSystem: 'ICD-10' | 'SNOMED'
  description: string
  status: 'active' | 'resolved' | 'inactive'
  severity: 'mild' | 'moderate' | 'severe'
  onsetDate: string
  resolvedDate?: string
  notes?: string
  addedBy?: string
  addedAt: string
}

interface ProblemListProps {
  patientId: string
  problems: Problem[]
  onAddProblem?: (problem: Omit<Problem, 'id' | 'addedAt'>) => Promise<void>
  onUpdateProblem?: (id: string, updates: Partial<Problem>) => Promise<void>
  onDeleteProblem?: (id: string) => Promise<void>
  readOnly?: boolean
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800', icon: Clock },
}

const severityConfig = {
  mild: { label: 'Mild', color: 'bg-yellow-100 text-yellow-800' },
  moderate: { label: 'Moderate', color: 'bg-orange-100 text-orange-800' },
  severe: { label: 'Severe', color: 'bg-red-100 text-red-800' },
}

const commonICD10Codes = [
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified' },
  { code: 'I50.9', description: 'Heart failure, unspecified' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'K21.0', description: 'Gastro-esophageal reflux disease with esophagitis' },
  { code: 'G47.33', description: 'Obstructive sleep apnea' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
]

export function ProblemList({
  patientId,
  problems,
  onAddProblem,
  onUpdateProblem,
  onDeleteProblem,
  readOnly = false,
}: ProblemListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    codeSystem: 'ICD-10' as 'ICD-10' | 'SNOMED',
    description: '',
    status: 'active' as 'active' | 'resolved' | 'inactive',
    severity: 'moderate' as 'mild' | 'moderate' | 'severe',
    onsetDate: format(new Date(), 'yyyy-MM-dd'),
    resolvedDate: '',
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      code: '',
      codeSystem: 'ICD-10',
      description: '',
      status: 'active',
      severity: 'moderate',
      onsetDate: format(new Date(), 'yyyy-MM-dd'),
      resolvedDate: '',
      notes: '',
    })
    setEditingProblem(null)
  }

  const handleSubmit = async () => {
    if (!formData.code || !formData.description) return

    setIsSubmitting(true)
    try {
      if (editingProblem && onUpdateProblem) {
        await onUpdateProblem(editingProblem.id, formData)
        toastSuccess('Problem Updated', formData.description)
      } else if (onAddProblem) {
        await onAddProblem(formData)
        toastSuccess('Problem Added', formData.description)
      }
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save problem:', error)
      toastError('Failed to Save', 'Could not save problem')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (problem: Problem) => {
    setFormData({
      code: problem.code,
      codeSystem: problem.codeSystem,
      description: problem.description,
      status: problem.status,
      severity: problem.severity,
      onsetDate: problem.onsetDate,
      resolvedDate: problem.resolvedDate || '',
      notes: problem.notes || '',
    })
    setEditingProblem(problem)
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (onDeleteProblem && confirm('Are you sure you want to delete this problem?')) {
      try {
        await onDeleteProblem(id)
        toastSuccess('Problem Removed', 'Problem has been deleted')
      } catch (error) {
        toastError('Failed to Delete', 'Could not delete problem')
      }
    }
  }

  const handleQuickAdd = (icd10: { code: string; description: string }) => {
    setFormData((prev) => ({
      ...prev,
      code: icd10.code,
      description: icd10.description,
      codeSystem: 'ICD-10',
    }))
  }

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeCount = problems.filter((p) => p.status === 'active').length
  const resolvedCount = problems.filter((p) => p.status === 'resolved').length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Problem List
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} active, {resolvedCount} resolved
          </p>
        </div>
        {!readOnly && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-1" />
                Add Problem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProblem ? 'Edit Problem' : 'Add New Problem'}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Diagnosis Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g., I10"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codeSystem">Code System</Label>
                    <Select
                      value={formData.codeSystem}
                      onValueChange={(v) =>
                        setFormData({ ...formData, codeSystem: v as 'ICD-10' | 'SNOMED' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ICD-10">ICD-10</SelectItem>
                        <SelectItem value="SNOMED">SNOMED CT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Problem description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quick Add (Common Diagnoses)</Label>
                  <div className="flex flex-wrap gap-1">
                    {commonICD10Codes.slice(0, 5).map((icd) => (
                      <Button
                        key={icd.code}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleQuickAdd(icd)}
                      >
                        {icd.code}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          status: v as 'active' | 'resolved' | 'inactive',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          severity: v as 'mild' | 'moderate' | 'severe',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
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

                {formData.status === 'resolved' && (
                  <div className="space-y-2">
                    <Label htmlFor="resolvedDate">Resolved Date</Label>
                    <Input
                      id="resolvedDate"
                      type="date"
                      value={formData.resolvedDate}
                      onChange={(e) =>
                        setFormData({ ...formData, resolvedDate: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Clinical Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about this problem..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingProblem ? 'Update' : 'Add Problem'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredProblems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {problems.length === 0
              ? 'No problems documented'
              : 'No problems match your search'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Onset</TableHead>
                {!readOnly && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems.map((problem) => {
                const StatusIcon = statusConfig[problem.status].icon
                return (
                  <TableRow key={problem.id}>
                    <TableCell className="font-mono text-sm">
                      {problem.code}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({problem.codeSystem})
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>{problem.description}</div>
                      {problem.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {problem.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[problem.status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[problem.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={severityConfig[problem.severity].color}>
                        {severityConfig[problem.severity].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(problem.onsetDate), 'MMM d, yyyy')}
                      {problem.resolvedDate && (
                        <div className="text-xs text-muted-foreground">
                          Resolved: {format(new Date(problem.resolvedDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(problem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(problem.id)}
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

export default ProblemList
