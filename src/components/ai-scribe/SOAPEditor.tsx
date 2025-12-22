'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    FileText,
    Edit,
    Save,
    Copy,
    Check,
    Sparkles,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SOAPNote } from '@/lib/ai-scribe'

interface SOAPEditorProps {
    soap: SOAPNote
    onSave?: (soap: SOAPNote) => void
    onChange?: (soap: SOAPNote) => void
    readOnly?: boolean
    className?: string
}

export function SOAPEditor({
    soap,
    onSave,
    onChange,
    readOnly = false,
    className = '',
}: SOAPEditorProps) {
    const [editingSection, setEditingSection] = useState<string | null>(null)
    const [localSoap, setLocalSoap] = useState<SOAPNote>(soap)
    const [copied, setCopied] = useState(false)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['subjective', 'objective', 'assessment', 'plan'])
    )

    const sections = [
        { key: 'subjective', label: 'Subjective', icon: '📋' },
        { key: 'objective', label: 'Objective', icon: '🔬' },
        { key: 'assessment', label: 'Assessment', icon: '💡' },
        { key: 'plan', label: 'Plan', icon: '📝' },
    ] as const

    const handleSectionChange = (key: keyof SOAPNote, value: string) => {
        const updated = { ...localSoap, [key]: value }
        setLocalSoap(updated)
        onChange?.(updated)
    }

    const handleSave = () => {
        setEditingSection(null)
        onSave?.(localSoap)
    }

    const handleCopy = async () => {
        const fullText = `SUBJECTIVE:
${localSoap.subjective}

OBJECTIVE:
${localSoap.objective}

ASSESSMENT:
${localSoap.assessment}

PLAN:
${localSoap.plan}`

        await navigator.clipboard.writeText(fullText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const toggleSection = (key: string) => {
        const newExpanded = new Set(expandedSections)
        if (newExpanded.has(key)) {
            newExpanded.delete(key)
        } else {
            newExpanded.add(key)
        }
        setExpandedSections(newExpanded)
    }

    return (
        <Card className={cn('', className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        SOAP Note
                        <Badge variant="outline" className="ml-2">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Generated
                        </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                            {copied ? (
                                <Check className="h-4 w-4 mr-1" />
                            ) : (
                                <Copy className="h-4 w-4 mr-1" />
                            )}
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                        {!readOnly && onSave && (
                            <Button size="sm" onClick={handleSave}>
                                <Save className="h-4 w-4 mr-1" />
                                Save Note
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {sections.map(({ key, label, icon }) => (
                    <div key={key} className="border rounded-lg overflow-hidden">
                        {/* Section Header */}
                        <button
                            className="w-full flex items-center justify-between px-4 py-2 bg-muted/50 hover:bg-muted/70 transition-colors"
                            onClick={() => toggleSection(key)}
                        >
                            <div className="flex items-center gap-2">
                                <span>{icon}</span>
                                <span className="font-semibold">{label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {!readOnly && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingSection(editingSection === key ? null : key)
                                        }}
                                    >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                )}
                                {expandedSections.has(key) ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </div>
                        </button>

                        {/* Section Content */}
                        {expandedSections.has(key) && (
                            <div className="p-4">
                                {editingSection === key ? (
                                    <Textarea
                                        value={localSoap[key]}
                                        onChange={(e) => handleSectionChange(key, e.target.value)}
                                        className="min-h-[150px] font-mono text-sm"
                                        placeholder={`Enter ${label.toLowerCase()}...`}
                                    />
                                ) : (
                                    <div className="whitespace-pre-wrap text-sm">
                                        {localSoap[key] || (
                                            <span className="text-muted-foreground italic">
                                                No content
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Problem List if available */}
                {localSoap.sections?.problemList && localSoap.sections.problemList.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-muted/50">
                            <span className="font-semibold">📌 Problem List</span>
                        </div>
                        <div className="p-4">
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {localSoap.sections.problemList.map((problem, i) => (
                                    <li key={i}>{problem}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
