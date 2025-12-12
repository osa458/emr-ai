'use client'

import { useState, useRef, useEffect } from 'react'
import { StickyNote, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PatientNoteProps {
  patientId: string
  initialNote?: string
  onSave: (note: string) => void
  position?: 'above' | 'below'
}

export function PatientNote({ patientId, initialNote = '', onSave, position = 'above' }: PatientNoteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [note, setNote] = useState(initialNote)
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNote(initialNote)
  }, [initialNote])

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const popoverHeight = 200 // Approximate height
      
      // Determine if we should show above or below based on available space
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      const shouldShowAbove = spaceBelow < popoverHeight && spaceAbove > spaceBelow
      
      setPopoverPosition({
        top: shouldShowAbove
          ? rect.top - popoverHeight - 10
          : rect.bottom + 10,
        left: rect.left + rect.width / 2,
      })
      setIsOpen(true)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    onSave(note)
  }

  const handleSave = () => {
    onSave(note)
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, note])

  // Truncate text for display
  const displayText = note.length > 25 ? `${note.substring(0, 25)}...` : note
  const hasNote = note.trim().length > 0

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        className={cn(
          "h-6 w-6 p-0 flex-shrink-0",
          hasNote && "text-yellow-600 hover:text-yellow-700"
        )}
        onClick={handleOpen}
        title={hasNote ? note : "Add note"}
      >
        <StickyNote className="h-3.5 w-3.5" />
      </Button>

      {!isOpen && hasNote && (
        <div 
          className="text-xs text-muted-foreground truncate flex-1 cursor-pointer"
          style={{ fontSize: '12px' }}
          title={note}
          onClick={(e) => {
            e.stopPropagation()
            handleOpen(e as any)
          }}
        >
          {displayText}
        </div>
      )}

      {isOpen && popoverPosition && (
        <div
          ref={popoverRef}
          className="fixed z-[100] w-80 bg-white border rounded-lg shadow-xl p-4"
          style={{
            top: `${popoverPosition.top}px`,
            left: `${popoverPosition.left}px`,
            transform: 'translate(-50%, 0)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Patient Note</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this patient..."
            className="w-full min-h-[100px] p-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

