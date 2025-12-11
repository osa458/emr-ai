'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Download, Eye, Upload, Search, Filter,
  Calendar, User, FileCheck, AlertCircle, Sparkles,
  ChevronDown, ExternalLink, Trash2
} from 'lucide-react'

export interface ClinicalDocument {
  id: string
  type: string
  category: string
  title: string
  status: 'current' | 'superseded' | 'entered-in-error'
  date: Date
  author: string
  description?: string
  contentType?: string
  size?: number
  url?: string
  aiSummary?: string
}

export interface DocumentsListProps {
  patientId: string
  documents?: ClinicalDocument[]
  onViewDocument?: (doc: ClinicalDocument) => void
  onDownloadDocument?: (doc: ClinicalDocument) => void
  onUploadDocument?: () => void
  onDeleteDocument?: (docId: string) => void
  showAISummaries?: boolean
  className?: string
}

// Mock documents
const mockDocuments: ClinicalDocument[] = [
  {
    id: 'doc-1',
    type: 'Discharge Summary',
    category: 'clinical-note',
    title: 'Discharge Summary - CHF Exacerbation',
    status: 'current',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    author: 'Dr. Williams',
    description: 'Discharge summary for acute CHF exacerbation admission',
    contentType: 'application/pdf',
    size: 245000,
    aiSummary: 'Patient discharged after 5-day admission for CHF exacerbation. Responded well to IV diuresis. Discharged on increased Lasix dose. Follow-up in 1 week.'
  },
  {
    id: 'doc-2',
    type: 'Lab Report',
    category: 'lab-report',
    title: 'Comprehensive Metabolic Panel',
    status: 'current',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    author: 'Lab Services',
    contentType: 'application/pdf',
    size: 89000,
    aiSummary: 'BMP shows improved kidney function (Cr 1.2 from 1.8). Electrolytes normalized. Continue current management.'
  },
  {
    id: 'doc-3',
    type: 'Imaging Report',
    category: 'imaging',
    title: 'Chest X-Ray Report',
    status: 'current',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    author: 'Dr. Chen (Radiology)',
    contentType: 'application/pdf',
    size: 156000,
    aiSummary: 'Cardiomegaly with improved pulmonary edema compared to prior. No pneumonia or effusion.'
  },
  {
    id: 'doc-4',
    type: 'Progress Note',
    category: 'clinical-note',
    title: 'Hospital Day 3 Progress Note',
    status: 'current',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    author: 'Dr. Williams',
    contentType: 'text/plain',
    size: 12000,
    aiSummary: 'Patient improving with diuresis. Weight down 5kg. Planning discharge tomorrow if stable.'
  },
  {
    id: 'doc-5',
    type: 'Echocardiogram',
    category: 'imaging',
    title: 'Transthoracic Echocardiogram',
    status: 'current',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    author: 'Dr. Patel (Cardiology)',
    contentType: 'application/pdf',
    size: 320000,
    aiSummary: 'EF 35% (reduced). Moderate LV dilation. Grade II diastolic dysfunction. No significant valvular disease.'
  },
  {
    id: 'doc-6',
    type: 'Consent Form',
    category: 'administrative',
    title: 'Informed Consent - Cardiac Catheterization',
    status: 'current',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    author: 'Patient/Dr. Williams',
    contentType: 'application/pdf',
    size: 45000
  }
]

const categoryColors: Record<string, string> = {
  'clinical-note': 'bg-blue-100 text-blue-800',
  'lab-report': 'bg-green-100 text-green-800',
  'imaging': 'bg-purple-100 text-purple-800',
  'procedure': 'bg-orange-100 text-orange-800',
  'administrative': 'bg-slate-100 text-slate-800'
}

export function DocumentsList({
  patientId,
  documents = mockDocuments,
  onViewDocument,
  onDownloadDocument,
  onUploadDocument,
  onDeleteDocument,
  showAISummaries = true,
  className = ''
}: DocumentsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())

  const categories = ['all', ...Array.from(new Set(documents.map(d => d.category)))]

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const toggleExpanded = (docId: string) => {
    setExpandedDocs(prev => {
      const next = new Set(prev)
      if (next.has(docId)) {
        next.delete(docId)
      } else {
        next.add(docId)
      }
      return next
    })
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getDocIcon = (category: string) => {
    switch (category) {
      case 'lab-report': return <FileCheck className="h-5 w-5" />
      case 'imaging': return <ExternalLink className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Clinical Documents ({filteredDocuments.length})
          </CardTitle>
          {onUploadDocument && (
            <Button size="sm" onClick={onUploadDocument}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y">
          {filteredDocuments.map(doc => {
            const isExpanded = expandedDocs.has(doc.id)
            return (
              <div key={doc.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${categoryColors[doc.category] || 'bg-slate-100'}`}>
                    {getDocIcon(doc.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{doc.title}</span>
                      <Badge variant={doc.status === 'current' ? 'default' : 'secondary'} className="text-[10px]">
                        {doc.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {doc.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(doc.date)}
                      </span>
                      {doc.size && (
                        <span>{formatSize(doc.size)}</span>
                      )}
                    </div>
                    
                    {/* AI Summary */}
                    {showAISummaries && doc.aiSummary && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleExpanded(doc.id)}
                          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                        >
                          <Sparkles className="h-3 w-3" />
                          AI Summary
                          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="mt-2 p-2 bg-purple-50 border border-purple-100 rounded text-sm text-purple-900">
                            {doc.aiSummary}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {onViewDocument && (
                      <Button variant="ghost" size="sm" onClick={() => onViewDocument(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onDownloadDocument && (
                      <Button variant="ghost" size="sm" onClick={() => onDownloadDocument(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeleteDocument && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => onDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          
          {filteredDocuments.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No documents found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
