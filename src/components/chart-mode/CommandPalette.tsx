'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  FileText,
  FlaskConical,
  Pill,
  ImageIcon,
  Users,
  Calendar,
  Stethoscope,
  ClipboardList,
  Activity,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Command,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  category: 'actions' | 'navigation' | 'patients' | 'recent'
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  patientId?: string
  patientName?: string
}

export function CommandPalette({ isOpen, onClose, patientId, patientName }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isMac, setIsMac] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  const modKey = isMac ? '⌘' : 'Ctrl'

  // Define commands
  const commands: CommandItem[] = [
    // Actions (when in patient context)
    ...(patientId ? [
      {
        id: 'new-note',
        title: 'New Progress Note',
        description: `Create a new note for ${patientName}`,
        icon: FileText,
        shortcut: `${modKey}N`,
        category: 'actions' as const,
        action: () => { router.push(`/patients/${patientId}?tab=notes&new=true`); onClose() },
      },
      {
        id: 'order-labs',
        title: 'Order Labs',
        description: 'Order laboratory tests',
        icon: FlaskConical,
        shortcut: `${modKey}L`,
        category: 'actions' as const,
        action: () => { router.push(`/patients/${patientId}?tab=orders&type=lab`); onClose() },
      },
      {
        id: 'order-meds',
        title: 'Order Medications',
        description: 'Prescribe or order medications',
        icon: Pill,
        shortcut: `${modKey}M`,
        category: 'actions' as const,
        action: () => { router.push(`/patients/${patientId}?tab=orders&type=med`); onClose() },
      },
      {
        id: 'order-imaging',
        title: 'Order Imaging',
        description: 'Order imaging studies',
        icon: ImageIcon,
        shortcut: `${modKey}I`,
        category: 'actions' as const,
        action: () => { router.push(`/patients/${patientId}?tab=orders&type=imaging`); onClose() },
      },
      {
        id: 'ai-assist',
        title: 'Ask AI Assistant',
        description: 'Get AI-powered clinical insights',
        icon: Sparkles,
        shortcut: `${modKey}/`,
        category: 'actions' as const,
        action: () => { /* Open AI sidebar */ onClose() },
      },
      {
        id: 'page-consult',
        title: 'Page a Consultant',
        description: 'Send a page to specialty service',
        icon: Phone,
        category: 'actions' as const,
        action: () => { onClose() },
      },
      {
        id: 'send-message',
        title: 'Send Secure Message',
        description: 'Message care team member',
        icon: MessageSquare,
        category: 'actions' as const,
        action: () => { onClose() },
      },
    ] : []),
    // Navigation
    {
      id: 'nav-patients',
      title: 'Go to Patients',
      description: 'View patient list',
      icon: Users,
      category: 'navigation' as const,
      action: () => { router.push('/patients'); onClose() },
    },
    {
      id: 'nav-appointments',
      title: 'Go to Appointments',
      description: 'View schedule',
      icon: Calendar,
      category: 'navigation' as const,
      action: () => { router.push('/appointments'); onClose() },
    },
    {
      id: 'nav-encounters',
      title: 'Go to Encounters',
      description: 'View encounters',
      icon: Stethoscope,
      category: 'navigation' as const,
      action: () => { router.push('/encounters'); onClose() },
    },
    {
      id: 'nav-triage',
      title: 'Morning Triage',
      description: 'Review patient priorities',
      icon: Activity,
      category: 'navigation' as const,
      action: () => { router.push('/triage'); onClose() },
    },
    {
      id: 'nav-forms',
      title: 'Clinical Forms',
      description: 'Access form templates',
      icon: ClipboardList,
      category: 'navigation' as const,
      action: () => { router.push('/forms'); onClose() },
    },
  ]

  // Filter commands based on query
  const filteredCommands = query
    ? commands.filter(
        (cmd) =>
          cmd.title.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const allFilteredCommands = filteredCommands

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, allFilteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (allFilteredCommands[selectedIndex]) {
          allFilteredCommands[selectedIndex].action()
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [isOpen, allFilteredCommands, selectedIndex, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Global keyboard shortcut to open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!isOpen) {
          // This would be handled by parent, but we can emit an event
        }
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  const categoryLabels: Record<string, string> = {
    actions: 'Actions',
    navigation: 'Navigation',
    patients: 'Patients',
    recent: 'Recent',
  }

  let flatIndex = 0

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            className="flex-1 bg-transparent outline-none text-lg"
          />
          <kbd className="px-2 py-1 text-xs bg-slate-100 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, items]) => (
            <div key={category} className="mb-2">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {categoryLabels[category] || category}
              </div>
              {items.map((cmd) => {
                const currentIndex = flatIndex++
                const isSelected = currentIndex === selectedIndex

                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50'
                    )}
                  >
                    <cmd.icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isSelected ? 'text-blue-600' : 'text-muted-foreground'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{cmd.title}</div>
                      {cmd.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {cmd.description}
                        </div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="px-2 py-1 text-xs bg-slate-100 rounded font-mono">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No commands found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 rounded">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 rounded">ESC</kbd>
              Close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  )
}

