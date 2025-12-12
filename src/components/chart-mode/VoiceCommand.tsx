'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface VoiceCommandProps {
  isActive: boolean
  onToggle: () => void
  onCommand: (command: string, action: VoiceAction) => void
  patientName?: string
}

interface VoiceAction {
  type: 'order_lab' | 'order_med' | 'order_imaging' | 'page' | 'note' | 'navigate' | 'query' | 'handoff' | 'unknown'
  params?: Record<string, string>
}

interface ParsedCommand {
  action: VoiceAction
  confirmation: string
}

// Voice command patterns
const COMMAND_PATTERNS: Array<{
  pattern: RegExp
  action: (matches: RegExpMatchArray) => VoiceAction
  confirmation: (matches: RegExpMatchArray) => string
}> = [
  // Lab orders
  {
    pattern: /order\s+(?:a\s+)?(.+?)(?:\s+lab)?$/i,
    action: (m) => ({ type: 'order_lab', params: { test: m[1] } }),
    confirmation: (m) => `Ordering ${m[1]} lab`,
  },
  // Medication orders
  {
    pattern: /(?:order|prescribe)\s+(.+?)\s+(\d+\s*(?:mg|mcg|g|ml|units?))/i,
    action: (m) => ({ type: 'order_med', params: { medication: m[1], dose: m[2] } }),
    confirmation: (m) => `Ordering ${m[1]} ${m[2]}`,
  },
  // Imaging orders
  {
    pattern: /order\s+(?:a\s+)?(.+?)\s+(?:scan|x-?ray|imaging|ct|mri|ultrasound)/i,
    action: (m) => ({ type: 'order_imaging', params: { study: m[1] } }),
    confirmation: (m) => `Ordering ${m[1]} imaging`,
  },
  // Page consult
  {
    pattern: /page\s+(.+?)(?:\s+consult)?$/i,
    action: (m) => ({ type: 'page', params: { service: m[1] } }),
    confirmation: (m) => `Paging ${m[1]}`,
  },
  // Start note
  {
    pattern: /(?:start|create|new)\s+(?:a\s+)?(.+?)\s+note/i,
    action: (m) => ({ type: 'note', params: { noteType: m[1] } }),
    confirmation: (m) => `Creating ${m[1]} note`,
  },
  // Query labs/vitals
  {
    pattern: /(?:what(?:'s| is)\s+(?:the\s+)?|show\s+(?:me\s+)?(?:the\s+)?)(.+?)(?:\s+trend)?$/i,
    action: (m) => ({ type: 'query', params: { item: m[1] } }),
    confirmation: (m) => `Looking up ${m[1]}`,
  },
  // Generate handoff
  {
    pattern: /(?:generate|create)\s+(?:a\s+)?handoff/i,
    action: () => ({ type: 'handoff' }),
    confirmation: () => 'Generating handoff summary',
  },
  // Navigation
  {
    pattern: /(?:go\s+to|show|open)\s+(.+)/i,
    action: (m) => ({ type: 'navigate', params: { destination: m[1] } }),
    confirmation: (m) => `Opening ${m[1]}`,
  },
]

function parseCommand(transcript: string): ParsedCommand | null {
  const cleaned = transcript.toLowerCase().replace(/hey\s+emr,?\s*/i, '').trim()
  
  for (const { pattern, action, confirmation } of COMMAND_PATTERNS) {
    const match = cleaned.match(pattern)
    if (match) {
      return {
        action: action(match),
        confirmation: confirmation(match),
      }
    }
  }
  
  return {
    action: { type: 'unknown' },
    confirmation: `I heard: "${cleaned}"`,
  }
}

export function VoiceCommand({ isActive, onToggle, onCommand, patientName }: VoiceCommandProps) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle')
  const [transcript, setTranscript] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event) => {
          const result = event.results[event.results.length - 1]
          const text = result[0].transcript

          setTranscript(text)

          // Check for wake word and command
          if (result.isFinal && text.toLowerCase().includes('hey emr')) {
            setStatus('processing')
            
            // Parse and execute command
            const parsed = parseCommand(text)
            if (parsed) {
              setConfirmation(parsed.confirmation)
              setShowFeedback(true)
              
              if (parsed.action.type !== 'unknown') {
                setStatus('success')
                onCommand(text, parsed.action)
              } else {
                setStatus('error')
              }

              // Reset after delay
              timeoutRef.current = setTimeout(() => {
                setShowFeedback(false)
                setStatus('listening')
                setTranscript('')
              }, 3000)
            }
          }
        }

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          if (event.error !== 'no-speech') {
            setStatus('error')
            setTimeout(() => setStatus(isActive ? 'listening' : 'idle'), 2000)
          }
        }

        recognition.onend = () => {
          // Restart if still active
          if (isActive && recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (e) {
              // Already started
            }
          }
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isActive, onCommand])

  // Start/stop recognition based on isActive
  useEffect(() => {
    if (isActive && recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setStatus('listening')
      } catch (e) {
        // Already started
      }
    } else if (!isActive && recognitionRef.current) {
      recognitionRef.current.stop()
      setStatus('idle')
      setTranscript('')
      setShowFeedback(false)
    }
  }, [isActive])

  // Check for browser support
  const isSupported = typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  // If not supported, don't render anything (TopNavigation handles the disabled state)
  if (!isSupported || !isActive) {
    return null
  }

  return (
    <>
      {/* Feedback Modal - positioned fixed at top right */}
      {showFeedback && (
        <div className="fixed top-16 right-4 w-80 bg-white rounded-lg shadow-xl border p-4 z-[60] animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            {status === 'processing' && (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
            )}
            {status === 'success' && (
              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="h-3 w-3 text-red-600" />
              </div>
            )}
            
            <div className="flex-1">
              <div className={cn(
                "font-medium text-sm",
                status === 'success' ? 'text-green-700' :
                status === 'error' ? 'text-red-700' : 'text-slate-900'
              )}>
                {status === 'success' ? '✓ ' : ''}{confirmation}
              </div>
              
              {status === 'success' && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1">
                    Confirm
                  </Button>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost">
                    Cancel
                  </Button>
                </div>
              )}
              
              {status === 'error' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Try saying: "Hey EMR, order a BMP" or "Hey EMR, page nephrology"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Listening indicator bar - positioned fixed at top right */}
      {!showFeedback && (
        <div className="fixed top-16 right-4 w-64 bg-slate-900 rounded-lg shadow-xl p-3 z-[60] animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-0.5">
              <span className="w-1 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-5 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
              <span className="w-1 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
            </div>
            <span className="text-xs text-white font-medium">Listening...</span>
          </div>
          <p className="text-xs text-slate-400">
            Say <span className="text-white font-medium">"Hey EMR"</span> followed by a command
          </p>
          {transcript && (
            <p className="text-xs text-slate-300 mt-2 italic">"{transcript}"</p>
          )}
        </div>
      )}
    </>
  )
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

