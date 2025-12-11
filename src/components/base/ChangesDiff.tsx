'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitCompare, Plus, Minus, Edit3, Clock, User } from 'lucide-react'

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'modified'
  content: string
  lineNumber?: number
}

export interface VersionInfo {
  id: string
  timestamp: Date
  author?: string
  label?: string
}

export interface ChangesDiffProps {
  original: string
  modified: string
  originalVersion?: VersionInfo
  modifiedVersion?: VersionInfo
  title?: string
  showLineNumbers?: boolean
  unified?: boolean
  className?: string
}

// Simple diff algorithm
function computeDiff(original: string, modified: string): DiffLine[] {
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')
  const result: DiffLine[] = []
  
  let i = 0
  let j = 0
  
  while (i < originalLines.length || j < modifiedLines.length) {
    if (i >= originalLines.length) {
      // Remaining lines are additions
      result.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 })
      j++
    } else if (j >= modifiedLines.length) {
      // Remaining lines are deletions
      result.push({ type: 'removed', content: originalLines[i], lineNumber: i + 1 })
      i++
    } else if (originalLines[i] === modifiedLines[j]) {
      // Lines match
      result.push({ type: 'unchanged', content: originalLines[i], lineNumber: i + 1 })
      i++
      j++
    } else {
      // Lines differ - check if it's a modification or add/remove
      const nextOriginalMatch = modifiedLines.indexOf(originalLines[i], j)
      const nextModifiedMatch = originalLines.indexOf(modifiedLines[j], i)
      
      if (nextModifiedMatch !== -1 && (nextOriginalMatch === -1 || nextModifiedMatch < nextOriginalMatch)) {
        // Original line exists later - current modified line is an addition
        result.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 })
        j++
      } else if (nextOriginalMatch !== -1) {
        // Modified line exists later - current original line is a deletion
        result.push({ type: 'removed', content: originalLines[i], lineNumber: i + 1 })
        i++
      } else {
        // Lines are modified
        result.push({ type: 'removed', content: originalLines[i], lineNumber: i + 1 })
        result.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 })
        i++
        j++
      }
    }
  }
  
  return result
}

// Compute statistics
function computeStats(diff: DiffLine[]) {
  let added = 0
  let removed = 0
  let unchanged = 0
  
  for (const line of diff) {
    if (line.type === 'added') added++
    else if (line.type === 'removed') removed++
    else unchanged++
  }
  
  return { added, removed, unchanged, total: diff.length }
}

export function ChangesDiff({
  original,
  modified,
  originalVersion,
  modifiedVersion,
  title = 'Changes',
  showLineNumbers = true,
  unified = true,
  className = ''
}: ChangesDiffProps) {
  const diff = useMemo(() => computeDiff(original, modified), [original, modified])
  const stats = useMemo(() => computeStats(diff), [diff])

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-green-700 border-green-200">
              <Plus className="h-3 w-3" />
              {stats.added}
            </Badge>
            <Badge variant="outline" className="gap-1 text-red-700 border-red-200">
              <Minus className="h-3 w-3" />
              {stats.removed}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              {stats.unchanged} unchanged
            </Badge>
          </div>
        </div>
        
        {/* Version info */}
        {(originalVersion || modifiedVersion) && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {originalVersion && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Original</Badge>
                {originalVersion.label && <span>{originalVersion.label}</span>}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(originalVersion.timestamp)}
                </span>
                {originalVersion.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {originalVersion.author}
                  </span>
                )}
              </div>
            )}
            {modifiedVersion && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">Modified</Badge>
                {modifiedVersion.label && <span>{modifiedVersion.label}</span>}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(modifiedVersion.timestamp)}
                </span>
                {modifiedVersion.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {modifiedVersion.author}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {unified ? (
          // Unified diff view
          <div className="font-mono text-sm border-t overflow-x-auto">
            {diff.map((line, index) => (
              <div
                key={index}
                className={`flex ${
                  line.type === 'added' 
                    ? 'bg-green-50 text-green-800' 
                    : line.type === 'removed' 
                    ? 'bg-red-50 text-red-800'
                    : 'bg-white'
                }`}
              >
                {showLineNumbers && (
                  <span className="w-12 px-2 py-0.5 text-right text-muted-foreground bg-slate-50 border-r select-none shrink-0">
                    {line.lineNumber}
                  </span>
                )}
                <span className="w-6 px-1 py-0.5 text-center shrink-0">
                  {line.type === 'added' && <Plus className="h-3 w-3 inline" />}
                  {line.type === 'removed' && <Minus className="h-3 w-3 inline" />}
                </span>
                <span className="px-2 py-0.5 whitespace-pre flex-1">
                  {line.content || '\u00A0'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          // Side-by-side diff view
          <div className="grid grid-cols-2 border-t">
            {/* Original */}
            <div className="border-r">
              <div className="px-3 py-1.5 bg-slate-100 border-b text-xs font-medium text-muted-foreground">
                Original
              </div>
              <div className="font-mono text-sm">
                {diff.filter(l => l.type !== 'added').map((line, index) => (
                  <div
                    key={index}
                    className={`flex ${line.type === 'removed' ? 'bg-red-50 text-red-800' : ''}`}
                  >
                    {showLineNumbers && (
                      <span className="w-10 px-2 py-0.5 text-right text-muted-foreground bg-slate-50 border-r select-none">
                        {line.lineNumber}
                      </span>
                    )}
                    <span className="px-2 py-0.5 whitespace-pre flex-1">
                      {line.content || '\u00A0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Modified */}
            <div>
              <div className="px-3 py-1.5 bg-slate-100 border-b text-xs font-medium text-muted-foreground">
                Modified
              </div>
              <div className="font-mono text-sm">
                {diff.filter(l => l.type !== 'removed').map((line, index) => (
                  <div
                    key={index}
                    className={`flex ${line.type === 'added' ? 'bg-green-50 text-green-800' : ''}`}
                  >
                    {showLineNumbers && (
                      <span className="w-10 px-2 py-0.5 text-right text-muted-foreground bg-slate-50 border-r select-none">
                        {line.lineNumber}
                      </span>
                    )}
                    <span className="px-2 py-0.5 whitespace-pre flex-1">
                      {line.content || '\u00A0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {diff.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No changes detected
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Utility to compare FHIR resources
export function compareFHIRResources(original: any, modified: any): { original: string; modified: string } {
  const formatResource = (resource: any) => {
    return JSON.stringify(resource, null, 2)
  }
  
  return {
    original: formatResource(original),
    modified: formatResource(modified)
  }
}
