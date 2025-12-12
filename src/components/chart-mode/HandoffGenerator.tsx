'use client'

import { useState } from 'react'
import {
  FileText,
  Copy,
  Printer,
  Send,
  RefreshCw,
  Edit,
  Check,
  Download,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface PatientData {
  id: string
  name: string
  age: number
  gender: string
  mrn: string
  location: string
  admitDate: string
  attendingPhysician: string
  diagnosis: string[]
  keyUpdates: string[]
  overnightTasks: string[]
  codeStatus: string
  allergies: string[]
}

interface HandoffGeneratorProps {
  isOpen: boolean
  onClose: () => void
  patient: PatientData
  receivingProvider?: string
}

function generateOneLiner(patient: PatientData): string {
  const ageGender = `${patient.age}${patient.gender.charAt(0).toUpperCase()}`
  const conditions = patient.diagnosis.slice(0, 3).join(', ')
  return `${ageGender} w/ ${conditions} admitted for ${patient.diagnosis[0]?.toLowerCase() || 'evaluation'}`
}

function generateHandoffSummary(patient: PatientData): string {
  const oneLiner = generateOneLiner(patient)
  
  const summary = `
HANDOFF SUMMARY
═══════════════════════════════════════════════════════

PATIENT: ${patient.name}
${patient.age}y ${patient.gender} | MRN: ${patient.mrn}
Location: ${patient.location}
Attending: ${patient.attendingPhysician}
Admit Date: ${new Date(patient.admitDate).toLocaleDateString()}

───────────────────────────────────────────────────────
ONE-LINER
───────────────────────────────────────────────────────
${oneLiner}

───────────────────────────────────────────────────────
OVERNIGHT TASKS
───────────────────────────────────────────────────────
${patient.overnightTasks.map((task, i) => `□ ${task}`).join('\n')}

───────────────────────────────────────────────────────
KEY UPDATES TODAY
───────────────────────────────────────────────────────
${patient.keyUpdates.map((update) => `• ${update}`).join('\n')}

───────────────────────────────────────────────────────
ACTIVE ISSUES
───────────────────────────────────────────────────────
${patient.diagnosis.map((dx, i) => `${i + 1}. ${dx}`).join('\n')}

───────────────────────────────────────────────────────
CODE STATUS: ${patient.codeStatus}
ALLERGIES: ${patient.allergies.join(', ') || 'NKDA'}
═══════════════════════════════════════════════════════
`.trim()

  return summary
}

export function HandoffGenerator({
  isOpen,
  onClose,
  patient,
  receivingProvider,
}: HandoffGeneratorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [summary, setSummary] = useState(() => generateHandoffSummary(patient))
  const [isExpanded, setIsExpanded] = useState(false)

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    // Simulate AI regeneration
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSummary(generateHandoffSummary(patient))
    setIsRegenerating(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Handoff - ${patient.name}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.5;
                padding: 20px;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>${summary}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleSendToTeam = () => {
    // This would integrate with secure messaging
    alert('Sending to care team...')
  }

  if (!isOpen) return null

  const panelWidth = isExpanded ? 'w-[600px]' : 'w-[400px]'

  return (
    <>
      {/* Backdrop - semi-transparent to allow seeing chart */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Right Side Panel */}
      <div className={cn(
        "fixed right-0 top-14 bottom-0 bg-white shadow-2xl z-50 flex flex-col transition-all duration-300",
        panelWidth
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title={isExpanded ? 'Collapse panel' : 'Expand panel'}
            >
              {isExpanded ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Handoff Summary
              </h2>
              <p className="text-xs text-blue-100">
                {patient.name} {receivingProvider && `→ ${receivingProvider}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 px-4 py-2 border-b bg-slate-50 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Day {Math.floor((Date.now() - new Date(patient.admitDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {patient.codeStatus}
          </Badge>
          {patient.allergies.length > 0 && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {patient.allergies.length} Allergies
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <CheckSquare className="h-3 w-3" />
            {patient.overnightTasks.length} Tasks
          </Badge>
        </div>

        {/* Summary Content */}
        <div className="flex-1 overflow-auto p-4">
          {isEditing ? (
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="h-full min-h-[400px] font-mono text-sm resize-none"
            />
          ) : (
            <pre className="p-4 bg-slate-50 rounded-lg text-sm font-mono whitespace-pre-wrap h-full overflow-auto">
              {summary}
            </pre>
          )}
        </div>

        {/* Actions Footer */}
        <div className="border-t bg-white p-4 space-y-3">
          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex-1"
            >
              {isRegenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
              {copied ? (
                <Check className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>

          {/* Send Action */}
          <Button className="w-full" onClick={handleSendToTeam}>
            <Send className="h-4 w-4 mr-2" />
            Send to Team
          </Button>
        </div>
      </div>
    </>
  )
}
