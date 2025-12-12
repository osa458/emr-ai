'use client'

import { useState, useEffect } from 'react'
import { StickyNote, X, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPatientNote, savePatientNote } from '@/lib/patientNotes'
import { cn } from '@/lib/utils'

interface PatientStickyNoteProps {
  patientId: string
}

export function PatientStickyNote({ patientId }: PatientStickyNoteProps) {
  const [note, setNote] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const savedNote = getPatientNote(patientId)
    setNote(savedNote)
  }, [patientId])

  const handleSave = () => {
    savePatientNote(patientId, note)
    setIsEditing(false)
  }

  const handleCancel = () => {
    const savedNote = getPatientNote(patientId)
    setNote(savedNote)
    setIsEditing(false)
  }

  if (!note && !isEditing) {
    return (
      <div className="fixed top-20 right-4 z-40">
        <Button
          variant="outline"
          size="sm"
          className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
          onClick={() => setIsEditing(true)}
        >
          <StickyNote className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "fixed top-20 right-4 z-40 bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow-lg transition-all duration-200",
        isExpanded ? "w-80" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-2 border-b border-yellow-200">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-semibold text-yellow-900">Patient Note</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsEditing(true)}
            >
              <span className="text-xs">Edit</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this patient..."
              className="w-full min-h-[120px] p-2 border border-yellow-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {note || 'No note added yet.'}
            </p>
            {!isExpanded && note.length > 100 && (
              <p className="text-xs text-yellow-600">Click expand to see full note</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

