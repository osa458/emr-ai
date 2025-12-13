'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Search,
  ExternalLink,
  Play,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { QuestionnaireRenderer } from '@/components/forms/QuestionnaireRenderer'
import type { Questionnaire, QuestionnaireResponse } from '@medplum/fhirtypes'

interface FormSummary {
  id: string
  title: string
  status: string
  publisher?: string
  url?: string
  itemCount: number
  lastUpdated?: string
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedForm, setSelectedForm] = useState<Questionnaire | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/forms')
      const data = await res.json()
      if (data.success) {
        setForms(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const openForm = async (formId: string) => {
    try {
      const res = await fetch(`/api/forms?id=${formId}`)
      const data = await res.json()
      if (data.success) {
        setSelectedForm(data.data as Questionnaire)
        setIsFormDialogOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch form:', error)
    }
  }

  const handleFormSubmit = async (response: QuestionnaireResponse) => {
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to save response')
      }
      alert('Form submitted successfully!')
    } catch (error) {
      console.error('Failed to save form response:', error)
      alert('Failed to save form response')
    } finally {
      setIsFormDialogOpen(false)
    }
  }

  const filteredForms = forms.filter(
    (f) =>
      f.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.publisher?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            Clinical Forms
          </h1>
          <p className="text-muted-foreground">
            FHIR Questionnaire forms from Aidbox
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {forms.length} forms available
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Form Library</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading forms...
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No forms found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Publisher</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{form.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {form.publisher || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{form.itemCount} items</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {statusIcon(form.status)}
                        <span className="capitalize">{form.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {form.lastUpdated
                        ? new Date(form.lastUpdated).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openForm(form.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedForm?.title || 'Form'}</DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <QuestionnaireRenderer
              questionnaire={selectedForm}
              onSubmit={handleFormSubmit}
              showAISuggestions
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
