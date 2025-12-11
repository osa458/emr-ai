'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JitsiMeeting } from '@/components/telemedicine/JitsiMeeting'
import { TelemedicineAIAssistant } from '@/components/telemedicine/TelemedicineAIAssistant'
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff,
  Monitor, MessageSquare, FileText, Users, Clock,
  Settings, Maximize2, Minimize2, Camera, Sparkles, Shield
} from 'lucide-react'

interface TelemedicineSession {
  id: string
  patientName: string
  patientId: string
  scheduledTime: Date
  status: 'waiting' | 'in-progress' | 'completed'
  type: 'video' | 'phone'
  reason: string
}

// Mock sessions
const mockSessions: TelemedicineSession[] = [
  {
    id: 'tele-1',
    patientName: 'Robert Davis',
    patientId: 'patient-3',
    scheduledTime: new Date(Date.now() + 15 * 60 * 1000),
    status: 'waiting',
    type: 'video',
    reason: 'Diabetes follow-up'
  },
  {
    id: 'tele-2',
    patientName: 'Emily Chen',
    patientId: 'patient-5',
    scheduledTime: new Date(Date.now() + 45 * 60 * 1000),
    status: 'waiting',
    type: 'video',
    reason: 'Medication review'
  },
  {
    id: 'tele-3',
    patientName: 'Michael Brown',
    patientId: 'patient-6',
    scheduledTime: new Date(Date.now() + 90 * 60 * 1000),
    status: 'waiting',
    type: 'phone',
    reason: 'Lab results discussion'
  }
]

export default function TelemedicinePage() {
  const [activeSession, setActiveSession] = useState<TelemedicineSession | null>(null)
  const [useJitsi, setUseJitsi] = useState(true) // Toggle between Jitsi and simple UI
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ sender: string; message: string; time: Date }[]>([])
  const [newMessage, setNewMessage] = useState('')

  const startSession = (session: TelemedicineSession) => {
    setActiveSession({ ...session, status: 'in-progress' })
  }

  const endSession = () => {
    setActiveSession(null)
    setIsVideoOn(true)
    setIsMicOn(true)
    setShowChat(false)
  }

  const handleJitsiSessionStart = (sessionId: string) => {
    console.log('Jitsi session started:', sessionId)
  }

  const handleJitsiSessionEnd = (sessionId: string, duration: number) => {
    console.log('Jitsi session ended:', sessionId, 'Duration:', duration)
    endSession()
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages(prev => [...prev, {
        sender: 'Provider',
        message: newMessage,
        time: new Date()
      }])
      setNewMessage('')
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getTimeUntil = (date: Date) => {
    const diff = date.getTime() - Date.now()
    const mins = Math.floor(diff / 60000)
    if (mins < 0) return 'Now'
    if (mins < 60) return `In ${mins} min`
    return `In ${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6" />
            Telemedicine
          </h1>
          <p className="text-muted-foreground">Virtual patient visits and consultations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            System Online
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Main Video Area */}
        <div className={`${activeSession ? 'col-span-3' : 'col-span-4'}`}>
          {activeSession ? (
            <>
              {/* HIPAA-Compliant Jitsi Video Call */}
              {useJitsi && activeSession.type === 'video' ? (
                <JitsiMeeting
                  patientId={activeSession.patientId}
                  patientName={activeSession.patientName}
                  providerId="provider-1"
                  providerName="Dr. Williams"
                  encounterId={activeSession.id}
                  onSessionStart={handleJitsiSessionStart}
                  onSessionEnd={handleJitsiSessionEnd}
                />
              ) : (
                /* Fallback Simple UI for phone calls or when Jitsi is disabled */
                <Card className="overflow-hidden">
                  <div className={`relative bg-slate-900 ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'}`}>
                    {/* Remote video/audio placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {activeSession.type === 'video' ? (
                        <div className="text-center text-white">
                          <Users className="h-24 w-24 mx-auto mb-4 opacity-50" />
                          <div className="text-lg">{activeSession.patientName}</div>
                          <div className="text-sm opacity-70">Connecting...</div>
                        </div>
                      ) : (
                        <div className="text-center text-white">
                          <Phone className="h-24 w-24 mx-auto mb-4 opacity-50" />
                          <div className="text-lg">Audio Call</div>
                          <div className="text-sm opacity-70">{activeSession.patientName}</div>
                        </div>
                      )}
                    </div>

                    {/* Local video preview */}
                    {activeSession.type === 'video' && (
                      <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-800 rounded-lg border-2 border-slate-700 flex items-center justify-center">
                        {isVideoOn ? (
                          <Camera className="h-8 w-8 text-slate-500" />
                        ) : (
                          <VideoOff className="h-8 w-8 text-red-500" />
                        )}
                      </div>
                    )}

                    {/* Call info */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <Badge className="bg-red-600">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
                        LIVE
                      </Badge>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        00:00
                      </Badge>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <Button
                        variant={isMicOn ? 'secondary' : 'destructive'}
                        size="lg"
                        className="rounded-full h-12 w-12 p-0"
                        onClick={() => setIsMicOn(!isMicOn)}
                      >
                        {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                      </Button>
                      
                      {activeSession.type === 'video' && (
                        <Button
                          variant={isVideoOn ? 'secondary' : 'destructive'}
                          size="lg"
                          className="rounded-full h-12 w-12 p-0"
                          onClick={() => setIsVideoOn(!isVideoOn)}
                        >
                          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                        </Button>
                      )}
                      
                      <Button
                        variant="secondary"
                        size="lg"
                        className="rounded-full h-12 w-12 p-0"
                        onClick={() => setShowChat(!showChat)}
                      >
                        <MessageSquare className="h-5 w-5" />
                      </Button>
                      
                      <Button
                        variant="secondary"
                        size="lg"
                        className="rounded-full h-12 w-12 p-0"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                      >
                        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="lg"
                        className="rounded-full h-12 w-12 p-0"
                        onClick={endSession}
                      >
                        <PhoneOff className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Chat panel */}
                  {showChat && (
                    <div className="border-t p-4 h-64 flex flex-col">
                      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-muted-foreground text-sm py-8">
                            No messages yet
                          </div>
                        ) : (
                          chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.sender === 'Provider' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs px-3 py-2 rounded-lg ${
                                msg.sender === 'Provider' ? 'bg-blue-500 text-white' : 'bg-slate-100'
                              }`}>
                                <div className="text-sm">{msg.message}</div>
                                <div className="text-[10px] opacity-70">{formatTime(msg.time)}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        />
                        <Button onClick={sendMessage}>Send</Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Active Session</h3>
                <p className="text-muted-foreground mb-4">
                  Select a waiting patient from the queue to start a telemedicine visit
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">HIPAA-Compliant Video Calls Enabled</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Assistant - Now using HIPAA-compliant component */}
          {activeSession && (
            <TelemedicineAIAssistant
              patientId={activeSession.patientId}
              patientSummary={{
                name: activeSession.patientName,
                age: 68,
                gender: 'Male',
                conditions: ['Type 2 Diabetes', 'Hypertension', 'Hyperlipidemia'],
                medications: ['Metformin 1000mg BID', 'Lisinopril 20mg daily', 'Atorvastatin 40mg daily'],
                allergies: ['Penicillin'],
                visitReason: activeSession.reason
              }}
              className="mt-4"
            />
          )}
        </div>

        {/* Sidebar - Queue */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Waiting Room
                </span>
                <Badge>{mockSessions.filter(s => s.status === 'waiting').length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockSessions.filter(s => s.status === 'waiting').map(session => (
                <div
                  key={session.id}
                  className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                  onClick={() => startSession(session)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{session.patientName}</span>
                    <Badge variant={session.type === 'video' ? 'default' : 'secondary'} className="text-[10px]">
                      {session.type === 'video' ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{session.reason}</div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getTimeUntil(session.scheduledTime)}
                  </div>
                </div>
              ))}
              
              {mockSessions.filter(s => s.status === 'waiting').length === 0 && (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  No patients waiting
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Video className="h-4 w-4 mr-2" />
                Start Instant Visit
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Make Phone Call
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
