'use client'

import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { QuestionnaireItem } from '@medplum/fhirtypes'

export interface GroupItemProps {
  item: QuestionnaireItem
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function GroupItem({ item, expanded, onToggle, children }: GroupItemProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-medium">{item.text}</span>
        {item.required && <span className="text-red-500">*</span>}
      </button>
      
      {expanded && (
        <div className="p-4 space-y-4 border-t">
          {children}
        </div>
      )}
    </div>
  )
}
