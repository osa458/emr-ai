'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock,
  User,
  FileText,
  Pill,
  FlaskConical,
  Stethoscope,
  Activity,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { useEncounterTimeline, type TimelineEvent } from '@/hooks/useEncounterTimeline'

interface EncounterTimelineProps {
  patientId: string
  encounterId?: string
  events?: TimelineEvent[] // Optional override for custom events
  onEventClick?: (event: TimelineEvent) => void
}


export function EncounterTimeline({
  patientId,
  encounterId,
  events: providedEvents,
  onEventClick
}: EncounterTimelineProps) {
  // Fetch events from FHIR if not provided
  const { data: fhirEvents, isLoading } = useEncounterTimeline(
    providedEvents ? undefined : patientId, // Skip fetch if events provided
    encounterId
  )

  // Use provided events or fetched FHIR events
  const events = providedEvents || fhirEvents || []

  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const toggleExpanded = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  // Show loading state
  if (isLoading && !providedEvents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Clinical Timeline
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const filteredEvents = events.filter(e => typeFilter === 'all' || e.type === typeFilter)

  const getEventIcon = (type: TimelineEvent['type']) => {
    const icons: Record<string, React.ReactNode> = {
      note: <FileText className="h-4 w-4" />,
      order: <ClipboardIcon className="h-4 w-4" />,
      lab: <FlaskConical className="h-4 w-4" />,
      vital: <Activity className="h-4 w-4" />,
      medication: <Pill className="h-4 w-4" />,
      procedure: <Stethoscope className="h-4 w-4" />,
      consult: <MessageSquare className="h-4 w-4" />,
      alert: <AlertCircle className="h-4 w-4" />
    }
    return icons[type] || <Clock className="h-4 w-4" />
  }

  const getEventColor = (type: TimelineEvent['type'], priority?: string) => {
    if (priority === 'stat') return 'bg-red-100 border-red-300 text-red-700'
    if (priority === 'urgent') return 'bg-amber-100 border-amber-300 text-amber-700'

    const colors: Record<string, string> = {
      note: 'bg-blue-100 border-blue-300 text-blue-700',
      order: 'bg-purple-100 border-purple-300 text-purple-700',
      lab: 'bg-green-100 border-green-300 text-green-700',
      vital: 'bg-cyan-100 border-cyan-300 text-cyan-700',
      medication: 'bg-pink-100 border-pink-300 text-pink-700',
      procedure: 'bg-orange-100 border-orange-300 text-orange-700',
      consult: 'bg-indigo-100 border-indigo-300 text-indigo-700',
      alert: 'bg-red-100 border-red-300 text-red-700'
    }
    return colors[type] || 'bg-slate-100 border-slate-300 text-slate-700'
  }

  const getStatusIcon = (status?: TimelineEvent['status']) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === 'pending') return <Clock className="h-4 w-4 text-amber-600" />
    if (status === 'cancelled') return <XCircle className="h-4 w-4 text-red-600" />
    return null
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours < 1) return `${mins}m ago`
    if (hours < 24) return `${hours}h ${mins}m ago`
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const eventTypes = ['all', 'note', 'order', 'lab', 'vital', 'medication', 'procedure', 'consult', 'alert']

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Encounter Timeline
          </CardTitle>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1 border rounded text-sm"
          >
            {eventTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Events' : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

          {filteredEvents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No clinical events found for this encounter.</p>
              <p className="text-sm">Events will appear here as care is documented.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredEvents.map((event, index) => {
                const isExpanded = expandedEvents.has(event.id)
                return (
                  <div
                    key={event.id}
                    className="relative pl-12 pr-4 py-3 hover:bg-slate-50 cursor-pointer"
                    onClick={() => onEventClick?.(event)}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type, event.priority)}`}>
                      {getEventIcon(event.type)}
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.title}</span>
                          {event.priority === 'stat' && (
                            <Badge variant="destructive" className="text-[10px]">STAT</Badge>
                          )}
                          {event.priority === 'urgent' && (
                            <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">URGENT</Badge>
                          )}
                          {getStatusIcon(event.status)}
                        </div>
                        {event.description && (
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {event.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatTime(event.timestamp)}</span>
                          {event.author && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> {event.author}
                            </span>
                          )}
                        </div>

                        {/* Expanded details */}
                        {isExpanded && event.details && (
                          <div className="mt-2 p-2 bg-slate-100 rounded text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(event.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {event.details && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpanded(event.id)
                          }}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Simple clipboard icon component
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

export type { TimelineEvent }
