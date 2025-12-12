'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuestionnaireBuilder } from '@/components/forms/QuestionnaireBuilder'
import { QuestionnaireRenderer } from '@/components/forms/QuestionnaireRenderer'
import {
  FileText, Plus, Search, Edit, Trash2, Eye, Copy,
  Clock, User, Check, AlertCircle, Sparkles, Settings
} from 'lucide-react'
import type { Questionnaire } from '@medplum/fhirtypes'

// Mock questionnaires
const mockQuestionnaires: Questionnaire[] = [
  {
    resourceType: 'Questionnaire',
    id: 'intake-form',
    status: 'active',
    title: 'Patient Intake Form',
    description: 'Initial patient registration and history',
    date: '2024-01-15',
    publisher: 'EMR Admin',
    item: [
      { linkId: 'demographics', type: 'group', text: 'Demographics', item: [
        { linkId: 'name', type: 'string', text: 'Full Name', required: true },
        { linkId: 'dob', type: 'date', text: 'Date of Birth', required: true },
        { linkId: 'gender', type: 'choice', text: 'Gender', answerOption: [
          { valueString: 'Male' }, { valueString: 'Female' }, { valueString: 'Other' }
        ]}
      ]},
      { linkId: 'medical-history', type: 'group', text: 'Medical History', item: [
        { linkId: 'conditions', type: 'text', text: 'Current Medical Conditions' },
        { linkId: 'allergies', type: 'text', text: 'Known Allergies' },
        { linkId: 'medications', type: 'text', text: 'Current Medications' }
      ]}
    ]
  },
  {
    resourceType: 'Questionnaire',
    id: 'phq9',
    status: 'active',
    title: 'PHQ-9 Depression Screening',
    description: 'Patient Health Questionnaire for depression',
    date: '2024-02-20',
    publisher: 'Clinical Team',
    item: [
      { linkId: 'q1', type: 'choice', text: 'Little interest or pleasure in doing things', required: true,
        answerOption: [
          { valueInteger: 0, valueCoding: { display: 'Not at all' } },
          { valueInteger: 1, valueCoding: { display: 'Several days' } },
          { valueInteger: 2, valueCoding: { display: 'More than half the days' } },
          { valueInteger: 3, valueCoding: { display: 'Nearly every day' } }
        ]
      }
    ]
  },
  {
    resourceType: 'Questionnaire',
    id: 'consent-form',
    status: 'active',
    title: 'Informed Consent',
    description: 'General treatment consent form',
    date: '2024-03-01',
    publisher: 'Legal/Compliance',
    item: [
      { linkId: 'understand', type: 'boolean', text: 'I understand the proposed treatment', required: true },
      { linkId: 'questions', type: 'boolean', text: 'I have had the opportunity to ask questions', required: true },
      { linkId: 'consent', type: 'boolean', text: 'I consent to the proposed treatment', required: true },
      { linkId: 'signature', type: 'string', text: 'Electronic Signature', required: true }
    ]
  },
  {
    resourceType: 'Questionnaire',
    id: 'fall-risk',
    status: 'draft',
    title: 'Fall Risk Assessment',
    description: 'Morse Fall Scale assessment',
    date: '2024-03-10',
    publisher: 'Nursing',
    item: []
  }
]

type ViewMode = 'list' | 'builder' | 'preview' | 'fill'

// AI Form templates for generation
const aiFormTemplates: Record<string, Questionnaire> = {
  'pre-op': {
    resourceType: 'Questionnaire',
    id: `form-${Date.now()}`,
    status: 'draft',
    title: 'Pre-Operative Assessment',
    description: 'Standard surgical pre-operative questionnaire',
    date: new Date().toISOString().split('T')[0],
    publisher: 'AI Generated',
    item: [
      { linkId: 'history', type: 'group', text: 'Medical History', item: [
        { linkId: 'prev-surgeries', type: 'text', text: 'Previous surgeries', required: true },
        { linkId: 'anesthesia-reactions', type: 'boolean', text: 'Any previous reactions to anesthesia?', required: true },
        { linkId: 'current-meds', type: 'text', text: 'Current medications', required: true },
        { linkId: 'allergies', type: 'text', text: 'Known allergies', required: true }
      ]},
      { linkId: 'vitals', type: 'group', text: 'Pre-Op Vitals', item: [
        { linkId: 'bp', type: 'string', text: 'Blood Pressure', required: true },
        { linkId: 'hr', type: 'integer', text: 'Heart Rate', required: true },
        { linkId: 'temp', type: 'decimal', text: 'Temperature (°F)', required: true }
      ]},
      { linkId: 'consent', type: 'boolean', text: 'Patient consents to procedure', required: true }
    ]
  },
  'cage': {
    resourceType: 'Questionnaire',
    id: `form-${Date.now()}`,
    status: 'draft',
    title: 'CAGE Alcohol Screening',
    description: '4-question alcohol use disorder screening',
    date: new Date().toISOString().split('T')[0],
    publisher: 'AI Generated',
    item: [
      { linkId: 'c', type: 'boolean', text: 'Have you ever felt you should Cut down on your drinking?', required: true },
      { linkId: 'a', type: 'boolean', text: 'Have people Annoyed you by criticizing your drinking?', required: true },
      { linkId: 'g', type: 'boolean', text: 'Have you ever felt Guilty about your drinking?', required: true },
      { linkId: 'e', type: 'boolean', text: 'Have you ever had a drink first thing in the morning (Eye-opener)?', required: true }
    ]
  },
  'gad7': {
    resourceType: 'Questionnaire',
    id: `form-${Date.now()}`,
    status: 'draft',
    title: 'GAD-7 Anxiety Assessment',
    description: 'Generalized Anxiety Disorder 7-item scale',
    date: new Date().toISOString().split('T')[0],
    publisher: 'AI Generated',
    item: [
      { linkId: 'intro', type: 'display', text: 'Over the last 2 weeks, how often have you been bothered by the following problems?' },
      { linkId: 'q1', type: 'choice', text: 'Feeling nervous, anxious, or on edge', required: true,
        answerOption: [
          { valueCoding: { code: '0', display: 'Not at all' } },
          { valueCoding: { code: '1', display: 'Several days' } },
          { valueCoding: { code: '2', display: 'More than half the days' } },
          { valueCoding: { code: '3', display: 'Nearly every day' } }
        ]
      },
      { linkId: 'q2', type: 'choice', text: 'Not being able to stop or control worrying', required: true,
        answerOption: [
          { valueCoding: { code: '0', display: 'Not at all' } },
          { valueCoding: { code: '1', display: 'Several days' } },
          { valueCoding: { code: '2', display: 'More than half the days' } },
          { valueCoding: { code: '3', display: 'Nearly every day' } }
        ]
      },
      { linkId: 'q3', type: 'choice', text: 'Worrying too much about different things', required: true,
        answerOption: [
          { valueCoding: { code: '0', display: 'Not at all' } },
          { valueCoding: { code: '1', display: 'Several days' } },
          { valueCoding: { code: '2', display: 'More than half the days' } },
          { valueCoding: { code: '3', display: 'Nearly every day' } }
        ]
      },
      { linkId: 'q4', type: 'choice', text: 'Trouble relaxing', required: true,
        answerOption: [
          { valueCoding: { code: '0', display: 'Not at all' } },
          { valueCoding: { code: '1', display: 'Several days' } },
          { valueCoding: { code: '2', display: 'More than half the days' } },
          { valueCoding: { code: '3', display: 'Nearly every day' } }
        ]
      },
      { linkId: 'q5', type: 'choice', text: 'Being so restless that it is hard to sit still', required: true,
        answerOption: [
          { valueCoding: { code: '0', display: 'Not at all' } },
          { valueCoding: { code: '1', display: 'Several days' } },
          { valueCoding: { code: '2', display: 'More than half the days' } },
          { valueCoding: { code: '3', display: 'Nearly every day' } }
        ]
      },
      { linkId: 'q6', type: 'choice', text: 'Becoming easily annoyed or irritable', required: true,
        answerOption: [
          { valueCoding: { code: '0', display: 'Not at all' } },
          { valueCoding: { code: '1', display: 'Several days' } },
          { valueCoding: { code: '2', display: 'More than half the days' } },
          { valueCoding: { code: '3', display: 'Nearly every day' } }
        ]
      },
      { linkId: 'q7', type: 'choice', text: 'Feeling afraid as if something awful might happen', required: true,
        answerOption: [
          { valueCoding: { code: '0', display: 'Not at all' } },
          { valueCoding: { code: '1', display: 'Several days' } },
          { valueCoding: { code: '2', display: 'More than half the days' } },
          { valueCoding: { code: '3', display: 'Nearly every day' } }
        ]
      }
    ]
  }
}

export default function AdminFormsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedForm, setSelectedForm] = useState<Questionnaire | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [forms, setForms] = useState<Questionnaire[]>(mockQuestionnaires)
  const [isGenerating, setIsGenerating] = useState(false)

  const filteredForms = forms.filter(q => {
    const matchesSearch = q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateNew = () => {
    setSelectedForm(null)
    setViewMode('builder')
  }

  const handleEditForm = (form: Questionnaire) => {
    setSelectedForm(form)
    setViewMode('builder')
  }

  const handlePreviewForm = (form: Questionnaire) => {
    setSelectedForm(form)
    setViewMode('preview')
  }

  const handleFillForm = (form: Questionnaire) => {
    setSelectedForm(form)
    setViewMode('fill')
  }

  const handleSaveForm = (questionnaire: Questionnaire) => {
    // Add or update the form in the list
    setForms(prev => {
      const exists = prev.find(f => f.id === questionnaire.id)
      if (exists) {
        return prev.map(f => f.id === questionnaire.id ? questionnaire : f)
      }
      return [...prev, questionnaire]
    })
    setViewMode('list')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedForm(null)
  }

  const handleDeleteForm = (formId: string) => {
    if (confirm('Are you sure you want to delete this form?')) {
      setForms(prev => prev.filter(f => f.id !== formId))
    }
  }

  const handleDuplicateForm = (form: Questionnaire) => {
    const duplicate: Questionnaire = {
      ...form,
      id: `form-${Date.now()}`,
      title: `${form.title} (Copy)`,
      status: 'draft',
      date: new Date().toISOString().split('T')[0]
    }
    setForms(prev => [...prev, duplicate])
  }

  const handleGenerateAIForm = async (templateKey: string) => {
    setIsGenerating(true)
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const template = aiFormTemplates[templateKey]
    if (template) {
      const newForm: Questionnaire = {
        ...template,
        id: `form-${Date.now()}`,
        date: new Date().toISOString().split('T')[0]
      }
      setForms(prev => [...prev, newForm])
      setSelectedForm(newForm)
      setViewMode('builder')
    }
    setIsGenerating(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'retired':
        return <Badge variant="outline">Retired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // List View
  if (viewMode === 'list') {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Form Builder
            </h1>
            <p className="text-muted-foreground">Create and manage clinical questionnaires</p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Form
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{mockQuestionnaires.length}</div>
                  <div className="text-sm text-muted-foreground">Total Forms</div>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {mockQuestionnaires.filter(q => q.status === 'active').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <Check className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {mockQuestionnaires.filter(q => q.status === 'draft').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Drafts</div>
                </div>
                <Edit className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">1,234</div>
                  <div className="text-sm text-muted-foreground">Submissions</div>
                </div>
                <Sparkles className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        {/* Forms List */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredForms.map(form => (
                <div key={form.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{form.title}</span>
                        {getStatusBadge(form.status || 'draft')}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {form.description}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {form.publisher || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {form.date || 'No date'}
                        </span>
                        <span>
                          {form.item?.length || 0} items
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleFillForm(form)} title="Fill Form">
                        <FileText className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handlePreviewForm(form)} title="Preview">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditForm(form)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Duplicate" onClick={() => handleDuplicateForm(form)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" title="Delete" onClick={() => handleDeleteForm(form.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredForms.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No forms found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Form Suggestions
              {isGenerating && <span className="text-xs text-muted-foreground ml-2">Generating...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <button 
                className="p-4 border rounded-lg text-left hover:bg-purple-50 hover:border-purple-300 transition-colors disabled:opacity-50"
                onClick={() => handleGenerateAIForm('pre-op')}
                disabled={isGenerating}
              >
                <div className="font-medium mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Pre-Op Assessment
                </div>
                <div className="text-sm text-muted-foreground">Standard surgical pre-operative questionnaire</div>
              </button>
              <button 
                className="p-4 border rounded-lg text-left hover:bg-purple-50 hover:border-purple-300 transition-colors disabled:opacity-50"
                onClick={() => handleGenerateAIForm('cage')}
                disabled={isGenerating}
              >
                <div className="font-medium mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  CAGE Alcohol Screening
                </div>
                <div className="text-sm text-muted-foreground">4-question alcohol use disorder screening</div>
              </button>
              <button 
                className="p-4 border rounded-lg text-left hover:bg-purple-50 hover:border-purple-300 transition-colors disabled:opacity-50"
                onClick={() => handleGenerateAIForm('gad7')}
                disabled={isGenerating}
              >
                <div className="font-medium mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  GAD-7 Anxiety
                </div>
                <div className="text-sm text-muted-foreground">Generalized Anxiety Disorder assessment</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Builder View
  if (viewMode === 'builder') {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToList}>
            ← Back to Forms
          </Button>
          <h1 className="text-xl font-bold">
            {selectedForm ? `Editing: ${selectedForm.title}` : 'Create New Form'}
          </h1>
          <div />
        </div>
        
        <QuestionnaireBuilder
          questionnaire={selectedForm || undefined}
          onSave={handleSaveForm}
          onPreview={(q) => {
            setSelectedForm(q)
            setViewMode('preview')
          }}
        />
      </div>
    )
  }

  // Preview View
  if (viewMode === 'preview' && selectedForm) {
    return (
      <div className="container mx-auto py-6 space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToList}>
            ← Back to Forms
          </Button>
          <h1 className="text-xl font-bold">Preview: {selectedForm.title}</h1>
          <Button onClick={() => setViewMode('builder')}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Form
          </Button>
        </div>
        
        <QuestionnaireRenderer
          questionnaire={selectedForm}
          onSubmit={(response) => {
            console.log('Form submitted:', response)
            alert('Form submitted successfully!')
          }}
          onSaveDraft={(response) => {
            console.log('Draft saved:', response)
          }}
          showAISuggestions
        />
      </div>
    )
  }

  // Fill Form View - for patient data intake
  if (viewMode === 'fill' && selectedForm) {
    return (
      <div className="container mx-auto py-6 space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToList}>
            ← Back to Forms
          </Button>
          <h1 className="text-xl font-bold">Fill: {selectedForm.title}</h1>
          <Badge className="bg-green-600">Patient Data Entry</Badge>
        </div>
        
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Patient:</span>
                <span className="ml-2 font-medium">Select patient below</span>
              </div>
              <div>
                <span className="text-muted-foreground">Form:</span>
                <span className="ml-2 font-medium">{selectedForm.title}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <QuestionnaireRenderer
          questionnaire={selectedForm}
          onSubmit={(response) => {
            console.log('Form response saved to patient chart:', response)
            alert('Form data saved to patient chart successfully!')
            handleBackToList()
          }}
          onSaveDraft={(response) => {
            console.log('Draft saved:', response)
          }}
          showAISuggestions
        />
      </div>
    )
  }

  return null
}
