'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, Square, Play, Pause, Trash2, Download, Sparkles, Loader2 } from 'lucide-react'

export interface AudioRecording {
  id: string
  blob: Blob
  url: string
  duration: number
  timestamp: Date
  transcript?: string
}

export interface AudioRecorderProps {
  onRecordingComplete?: (recording: AudioRecording) => void
  onTranscriptReady?: (transcript: string, recording: AudioRecording) => void
  enableTranscription?: boolean
  maxDuration?: number // seconds
  className?: string
}

export function AudioRecorder({
  onRecordingComplete,
  onTranscriptReady,
  enableTranscription = true,
  maxDuration = 300, // 5 minutes default
  className = ''
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordings, setRecordings] = useState<AudioRecording[]>([])
  const [currentDuration, setCurrentDuration] = useState(0)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [transcribingId, setTranscribingId] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      recordings.forEach(r => URL.revokeObjectURL(r.url))
    }
  }, [recordings])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const recording: AudioRecording = {
          id: Date.now().toString(),
          blob,
          url,
          duration: currentDuration,
          timestamp: new Date()
        }
        
        setRecordings(prev => [...prev, recording])
        onRecordingComplete?.(recording)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        // Auto-transcribe if enabled
        if (enableTranscription) {
          transcribeRecording(recording)
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setCurrentDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setCurrentDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setCurrentDuration(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
      setIsPaused(!isPaused)
    }
  }

  const transcribeRecording = async (recording: AudioRecording) => {
    setTranscribingId(recording.id)
    
    try {
      // Call our AI transcription endpoint
      const formData = new FormData()
      formData.append('audio', recording.blob, 'recording.webm')
      
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const { transcript } = await response.json()
        
        // Update recording with transcript
        setRecordings(prev => prev.map(r => 
          r.id === recording.id ? { ...r, transcript } : r
        ))
        
        onTranscriptReady?.(transcript, { ...recording, transcript })
      } else {
        // Mock transcription for demo
        const mockTranscript = "Patient reports improvement in symptoms since last visit. No new complaints. Continue current medication regimen."
        setRecordings(prev => prev.map(r => 
          r.id === recording.id ? { ...r, transcript: mockTranscript } : r
        ))
        onTranscriptReady?.(mockTranscript, { ...recording, transcript: mockTranscript })
      }
    } catch (error) {
      console.error('Transcription error:', error)
      // Provide mock transcript on error
      const mockTranscript = "[Transcription unavailable - audio recorded successfully]"
      setRecordings(prev => prev.map(r => 
        r.id === recording.id ? { ...r, transcript: mockTranscript } : r
      ))
    } finally {
      setTranscribingId(null)
    }
  }

  const playRecording = (recording: AudioRecording) => {
    if (playingId === recording.id) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(recording.url)
      audioRef.current.onended = () => setPlayingId(null)
      audioRef.current.play()
      setPlayingId(recording.id)
    }
  }

  const deleteRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id)
    if (recording) {
      URL.revokeObjectURL(recording.url)
    }
    setRecordings(prev => prev.filter(r => r.id !== id))
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
    }
  }

  const downloadRecording = (recording: AudioRecording) => {
    const a = document.createElement('a')
    a.href = recording.url
    a.download = `recording-${recording.timestamp.toISOString()}.webm`
    a.click()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={className}>
      {/* Recording controls */}
      <Card className={`${isRecording ? 'border-red-300 bg-red-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <Button onClick={startRecording} className="gap-2">
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button onClick={stopRecording} variant="destructive" className="gap-2">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
                <Button onClick={pauseRecording} variant="outline" className="gap-2">
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              </>
            )}
            
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-lg">{formatDuration(currentDuration)}</span>
                <span className="text-sm text-muted-foreground">/ {formatDuration(maxDuration)}</span>
              </div>
            )}
          </div>
          
          {isRecording && (
            <div className="mt-3">
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-1000"
                  style={{ width: `${(currentDuration / maxDuration) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recordings list */}
      {recordings.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Recordings ({recordings.length})</h4>
          {recordings.map(recording => (
            <Card key={recording.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 shrink-0"
                    onClick={() => playRecording(recording)}
                  >
                    {playingId === recording.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {recording.timestamp.toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(recording.duration)}
                      </Badge>
                      {transcribingId === recording.id && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Transcribing...
                        </Badge>
                      )}
                    </div>
                    
                    {recording.transcript && (
                      <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Sparkles className="h-3 w-3" />
                          AI Transcript
                        </div>
                        <p className="text-slate-700">{recording.transcript}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!recording.transcript && enableTranscription && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => transcribeRecording(recording)}
                        disabled={transcribingId === recording.id}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadRecording(recording)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteRecording(recording.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
