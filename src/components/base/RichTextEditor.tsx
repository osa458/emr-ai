'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  Heading1, Heading2, Quote, Code, Link, 
  Undo, Redo, Sparkles, Copy, Check
} from 'lucide-react'

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  maxHeight?: string
  enableAI?: boolean
  onAIAssist?: (selectedText: string, action: string) => Promise<string>
  readOnly?: boolean
  className?: string
}

// Toolbar button component
function ToolbarButton({ 
  icon, 
  label, 
  onClick, 
  active = false,
  disabled = false 
}: { 
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`p-1.5 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed ${
        active ? 'bg-slate-200 text-blue-600' : 'text-slate-600'
      }`}
    >
      {icon}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px',
  maxHeight = '500px',
  enableAI = true,
  onAIAssist,
  readOnly = false,
  className = ''
}: RichTextEditorProps) {
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [copied, setCopied] = useState(false)
  const editorRef = React.useRef<HTMLTextAreaElement>(null)

  // Get selected text
  const getSelectedText = useCallback(() => {
    if (!editorRef.current) return ''
    const start = editorRef.current.selectionStart
    const end = editorRef.current.selectionEnd
    return value.substring(start, end)
  }, [value])

  // Insert text at cursor or replace selection
  const insertText = useCallback((text: string, wrapStart = '', wrapEnd = '') => {
    if (!editorRef.current) return
    
    const start = editorRef.current.selectionStart
    const end = editorRef.current.selectionEnd
    const selectedText = value.substring(start, end)
    
    let newText: string
    if (selectedText) {
      newText = value.substring(0, start) + wrapStart + selectedText + wrapEnd + value.substring(end)
    } else {
      newText = value.substring(0, start) + text + value.substring(end)
    }
    
    onChange(newText)
    
    // Restore focus
    setTimeout(() => {
      editorRef.current?.focus()
      const newCursorPos = start + (selectedText ? wrapStart.length + selectedText.length + wrapEnd.length : text.length)
      editorRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [value, onChange])

  // Formatting handlers
  const handleBold = () => insertText('**bold**', '**', '**')
  const handleItalic = () => insertText('*italic*', '*', '*')
  const handleUnderline = () => insertText('<u>underline</u>', '<u>', '</u>')
  const handleHeading1 = () => insertText('\n# Heading 1\n', '\n# ', '\n')
  const handleHeading2 = () => insertText('\n## Heading 2\n', '\n## ', '\n')
  const handleBulletList = () => insertText('\n- Item 1\n- Item 2\n- Item 3\n')
  const handleNumberedList = () => insertText('\n1. Item 1\n2. Item 2\n3. Item 3\n')
  const handleQuote = () => insertText('\n> Quote\n', '\n> ', '\n')
  const handleCode = () => insertText('`code`', '`', '`')
  const handleLink = () => insertText('[link text](url)', '[', '](url)')

  // AI assistance
  const handleAIAssist = async (action: string) => {
    if (!onAIAssist || !enableAI) return
    
    const selectedText = getSelectedText() || value
    if (!selectedText.trim()) return
    
    setIsAIProcessing(true)
    try {
      const result = await onAIAssist(selectedText, action)
      
      if (getSelectedText()) {
        // Replace selection
        const start = editorRef.current?.selectionStart || 0
        const end = editorRef.current?.selectionEnd || 0
        const newText = value.substring(0, start) + result + value.substring(end)
        onChange(newText)
      } else {
        // Append to end
        onChange(value + '\n\n' + result)
      }
    } catch (error) {
      console.error('AI assist error:', error)
    } finally {
      setIsAIProcessing(false)
    }
  }

  // Copy to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle selection change
  const handleSelectionChange = () => {
    if (editorRef.current) {
      setSelection({
        start: editorRef.current.selectionStart,
        end: editorRef.current.selectionEnd
      })
    }
  }

  return (
    <Card className={className}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center flex-wrap gap-1 p-2 border-b bg-slate-50">
          {/* Text formatting */}
          <div className="flex items-center gap-0.5 pr-2 border-r">
            <ToolbarButton icon={<Bold className="h-4 w-4" />} label="Bold (Ctrl+B)" onClick={handleBold} />
            <ToolbarButton icon={<Italic className="h-4 w-4" />} label="Italic (Ctrl+I)" onClick={handleItalic} />
            <ToolbarButton icon={<Underline className="h-4 w-4" />} label="Underline" onClick={handleUnderline} />
          </div>
          
          {/* Headings */}
          <div className="flex items-center gap-0.5 px-2 border-r">
            <ToolbarButton icon={<Heading1 className="h-4 w-4" />} label="Heading 1" onClick={handleHeading1} />
            <ToolbarButton icon={<Heading2 className="h-4 w-4" />} label="Heading 2" onClick={handleHeading2} />
          </div>
          
          {/* Lists */}
          <div className="flex items-center gap-0.5 px-2 border-r">
            <ToolbarButton icon={<List className="h-4 w-4" />} label="Bullet List" onClick={handleBulletList} />
            <ToolbarButton icon={<ListOrdered className="h-4 w-4" />} label="Numbered List" onClick={handleNumberedList} />
          </div>
          
          {/* Other */}
          <div className="flex items-center gap-0.5 px-2 border-r">
            <ToolbarButton icon={<Quote className="h-4 w-4" />} label="Quote" onClick={handleQuote} />
            <ToolbarButton icon={<Code className="h-4 w-4" />} label="Code" onClick={handleCode} />
            <ToolbarButton icon={<Link className="h-4 w-4" />} label="Link" onClick={handleLink} />
          </div>
          
          {/* Copy */}
          <div className="flex items-center gap-0.5 px-2 border-r">
            <ToolbarButton 
              icon={copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />} 
              label="Copy" 
              onClick={handleCopy} 
            />
          </div>
          
          {/* AI Assistance */}
          {enableAI && onAIAssist && (
            <div className="flex items-center gap-1 pl-2">
              <Badge variant="outline" className="text-xs gap-1 text-purple-600 border-purple-200">
                <Sparkles className="h-3 w-3" />
                AI
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleAIAssist('improve')}
                disabled={isAIProcessing}
              >
                Improve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleAIAssist('simplify')}
                disabled={isAIProcessing}
              >
                Simplify
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleAIAssist('expand')}
                disabled={isAIProcessing}
              >
                Expand
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleAIAssist('summarize')}
                disabled={isAIProcessing}
              >
                Summarize
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Editor area */}
      <CardContent className="p-0">
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelectionChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full p-4 resize-none border-0 focus:outline-none focus:ring-0 font-mono text-sm ${
            readOnly ? 'bg-slate-50 cursor-default' : ''
          }`}
          style={{ minHeight, maxHeight }}
        />
        
        {isAIProcessing && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex items-center gap-2 text-purple-600">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span>AI is processing...</span>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50 text-xs text-muted-foreground">
        <span>{value.length} characters</span>
        <span>{value.split(/\s+/).filter(Boolean).length} words</span>
      </div>
    </Card>
  )
}
