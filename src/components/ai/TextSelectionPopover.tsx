'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Search, BookOpen } from 'lucide-react'

interface TextSelectionPopoverProps {
  onAnalyze: (text: string) => void
  onDefine: (text: string) => void
  onSearch: (text: string) => void
}

export function TextSelectionPopover({ onAnalyze, onDefine, onSearch }: TextSelectionPopoverProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Small delay to let selection complete
      setTimeout(() => {
        const selection = window.getSelection()
        const text = selection?.toString().trim()

        if (text && text.length > 2 && text.length < 500) {
          const range = selection?.getRangeAt(0)
          const rect = range?.getBoundingClientRect()
          
          if (rect) {
            setSelectedText(text)
            setPosition({
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
            })
          }
        } else {
          setPosition(null)
          setSelectedText('')
        }
      }, 10)
    }

    const handleMouseDown = (e: MouseEvent) => {
      // Check if click is outside the popover
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPosition(null)
        setSelectedText('')
      }
    }

    const handleScroll = () => {
      setPosition(null)
      setSelectedText('')
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  if (!position || !selectedText) return null

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white border rounded-lg shadow-lg p-1 flex gap-1 transform -translate-x-1/2 -translate-y-full"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs"
        onClick={() => {
          onAnalyze(selectedText)
          setPosition(null)
        }}
      >
        <Sparkles className="h-3 w-3 mr-1 text-purple-500" />
        AI Assist
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs"
        onClick={() => {
          onDefine(selectedText)
          setPosition(null)
        }}
      >
        <BookOpen className="h-3 w-3 mr-1 text-blue-500" />
        Define
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs"
        onClick={() => {
          onSearch(selectedText)
          setPosition(null)
        }}
      >
        <Search className="h-3 w-3 mr-1 text-green-500" />
        Search
      </Button>
    </div>
  )
}
