'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, AlertTriangle, Loader2, Copy, Check,
  Video, Lock, Users, Clock
} from 'lucide-react'
import {
  hipaaConfig,
  generateSecureRoomName,
  generateMeetingPassword,
  getJitsiConfigOverwrite,
  getJitsiInterfaceConfigOverwrite,
  createAuditLogEntry,
  logTelemedicineEvent
} from '@/lib/telemedicine/jitsi-config'

export interface JitsiMeetingProps {
  patientId: string
  patientName: string
  providerId: string
  providerName: string
  encounterId?: string
  onSessionStart?: (sessionId: string) => void
  onSessionEnd?: (sessionId: string, duration: number) => void
  onError?: (error: Error) => void
  className?: string
}

interface MeetingState {
  status: 'idle' | 'preparing' | 'ready' | 'active' | 'ended' | 'error'
  roomName?: string
  password?: string
  error?: string
  startTime?: Date
  duration?: number
}

export function JitsiMeeting({
  patientId,
  patientName,
  providerId,
  providerName,
  encounterId,
  onSessionStart,
  onSessionEnd,
  onError,
  className = ''
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)
  const [meetingState, setMeetingState] = useState<MeetingState>({ status: 'idle' })
  const [copied, setCopied] = useState(false)

  // Initialize meeting room
  const prepareMeeting = useCallback(() => {
    const roomName = generateSecureRoomName(patientId, providerId, encounterId)
    const password = generateMeetingPassword()
    
    setMeetingState({
      status: 'ready',
      roomName,
      password
    })
  }, [patientId, providerId, encounterId])

  // Auto-prepare meeting when component mounts
  useEffect(() => {
    if (meetingState.status === 'idle') {
      prepareMeeting()
    }
  }, []) // Only run on mount

  // Trigger meeting preparation (just sets status to 'preparing')
  const startMeeting = useCallback(() => {
    if (!meetingState.roomName) return
    setMeetingState(prev => ({ ...prev, status: 'preparing' }))
  }, [meetingState.roomName])

  // Actually initialize Jitsi when status is 'preparing' and container is ready
  useEffect(() => {
    if (meetingState.status !== 'preparing' || !containerRef.current || apiRef.current) return

    const initializeJitsi = async () => {
      try {
        const domain = hipaaConfig.domain
        const options = {
          roomName: meetingState.roomName,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          configOverwrite: getJitsiConfigOverwrite(),
          interfaceConfigOverwrite: getJitsiInterfaceConfigOverwrite(),
          userInfo: {
            displayName: providerName,
            email: '' // Don't expose email for HIPAA
          },
          onload: () => {
            console.log('Jitsi meeting loaded')
          }
        }

        // Load Jitsi external API script
        if (!(window as any).JitsiMeetExternalAPI) {
          const script = document.createElement('script')
          script.src = `https://${domain}/external_api.js`
          script.async = true
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.body.appendChild(script)
          })
        }

        // Initialize API
        const api = new (window as any).JitsiMeetExternalAPI(domain, options)
        apiRef.current = api

        // Set password after room is created
        api.addEventListener('participantRoleChanged', (event: any) => {
          if (event.role === 'moderator' && meetingState.password) {
            api.executeCommand('password', meetingState.password)
          }
        })

        // Enable lobby
        api.addEventListener('videoConferenceJoined', () => {
          if (hipaaConfig.enableLobby) {
            api.executeCommand('toggleLobby', true)
          }
          
          const startTime = new Date()
          setMeetingState(prev => ({ 
            ...prev, 
            status: 'active',
            startTime 
          }))

          // Log session start
          logTelemedicineEvent(createAuditLogEntry(
            'session_start',
            meetingState.roomName!,
            providerId,
            'provider',
            { patientId, encounterId }
          ))

          onSessionStart?.(meetingState.roomName!)
        })

        // Handle meeting end
        api.addEventListener('videoConferenceLeft', () => {
          const endTime = new Date()
          const duration = meetingState.startTime 
            ? Math.round((endTime.getTime() - meetingState.startTime.getTime()) / 1000)
            : 0

          setMeetingState(prev => ({ 
            ...prev, 
            status: 'ended',
            duration 
          }))

          // Log session end
          logTelemedicineEvent(createAuditLogEntry(
            'session_end',
            meetingState.roomName!,
            providerId,
            'provider',
            { patientId, encounterId, duration }
          ))

          onSessionEnd?.(meetingState.roomName!, duration)
        })

        // Handle errors
        api.addEventListener('errorOccurred', (error: any) => {
          console.error('Jitsi error:', error)
          setMeetingState(prev => ({ 
            ...prev, 
            status: 'error',
            error: error.message || 'An error occurred'
          }))
          onError?.(new Error(error.message))
        })

      } catch (error) {
        console.error('Failed to start meeting:', error)
        setMeetingState(prev => ({ 
          ...prev, 
          status: 'error',
          error: 'Failed to initialize video call'
        }))
        onError?.(error as Error)
      }
    }

    initializeJitsi()
  }, [meetingState.status, meetingState.roomName, meetingState.password, meetingState.startTime, providerName, providerId, patientId, encounterId, onSessionStart, onSessionEnd, onError])

  // End the meeting
  const endMeeting = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup')
      apiRef.current.dispose()
      apiRef.current = null
    }
  }, [])

  // Copy meeting info to clipboard
  const copyMeetingInfo = useCallback(async () => {
    const info = `
Telemedicine Visit Information
------------------------------
Meeting Link: https://${hipaaConfig.domain}/${meetingState.roomName}
Password: ${meetingState.password}

Please join at your scheduled appointment time.
This is a secure, HIPAA-compliant video call.
    `.trim()

    await navigator.clipboard.writeText(info)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [meetingState.roomName, meetingState.password])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
      }
    }
  }, [])

  return (
    <div className={className}>
      {/* HIPAA Compliance Banner */}
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
        <Shield className="h-5 w-5 text-green-600" />
        <div className="flex-1">
          <span className="text-sm font-medium text-green-800">HIPAA-Compliant Video Call</span>
          <span className="text-xs text-green-600 ml-2">
            End-to-end encrypted • No recording • Secure lobby enabled
          </span>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-300">
          <Lock className="h-3 w-3 mr-1" />
          Encrypted
        </Badge>
      </div>

      {/* Meeting States */}
      {meetingState.status === 'idle' && (
        <Card>
          <CardContent className="py-8 text-center">
            <Video className="h-16 w-16 mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-medium mb-2">Start Telemedicine Visit</h3>
            <p className="text-muted-foreground mb-4">
              Patient: <strong>{patientName}</strong>
            </p>
            <Button onClick={prepareMeeting} size="lg">
              <Video className="h-5 w-5 mr-2" />
              Prepare Meeting Room
            </Button>
          </CardContent>
        </Card>
      )}

      {meetingState.status === 'ready' && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center mb-6">
              <Badge className="mb-4 bg-blue-600">Room Ready</Badge>
              <h3 className="text-lg font-medium">Meeting Room Prepared</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Share the meeting details with the patient
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Room Name:</span>
                <code className="text-sm bg-white px-2 py-1 rounded">{meetingState.roomName}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Password:</span>
                <code className="text-sm bg-white px-2 py-1 rounded">{meetingState.password}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Patient:</span>
                <span className="text-sm font-medium">{patientName}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyMeetingInfo} variant="outline" className="flex-1">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Meeting Info'}
              </Button>
              <Button onClick={startMeeting} className="flex-1">
                <Video className="h-4 w-4 mr-2" />
                Start Video Call
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {meetingState.status === 'preparing' && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center mb-4">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
              <h3 className="text-lg font-medium">Starting Secure Video Call...</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Initializing encrypted connection
              </p>
            </div>
            {/* Video container - must be in DOM before Jitsi initializes */}
            <div 
              ref={containerRef} 
              className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden"
            />
          </CardContent>
        </Card>
      )}

      {meetingState.status === 'active' && (
        <div>
          {/* Meeting info bar */}
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="destructive" className="animate-pulse">
                <span className="h-2 w-2 rounded-full bg-white mr-1" />
                LIVE
              </Badge>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                {patientName}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                In progress
              </span>
            </div>
            <Button variant="destructive" size="sm" onClick={endMeeting}>
              End Call
            </Button>
          </div>

          {/* Video container */}
          <div 
            ref={containerRef} 
            className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden"
          />
        </div>
      )}

      {meetingState.status === 'ended' && (
        <Card>
          <CardContent className="py-8 text-center">
            <Check className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium mb-2">Visit Completed</h3>
            <p className="text-muted-foreground mb-4">
              Duration: {Math.floor((meetingState.duration || 0) / 60)} minutes {(meetingState.duration || 0) % 60} seconds
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setMeetingState({ status: 'idle' })}>
                Start New Visit
              </Button>
              <Button>
                Complete Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {meetingState.status === 'error' && (
        <Card className="border-red-200">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium text-red-700 mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-4">{meetingState.error}</p>
            <Button onClick={() => setMeetingState({ status: 'idle' })}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
