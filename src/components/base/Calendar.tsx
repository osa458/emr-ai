'use client'

import React, { useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'

export interface CalendarEvent {
  id: string
  title: string
  start: Date | string
  end?: Date | string
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  extendedProps?: {
    patientId?: string
    patientName?: string
    practitionerId?: string
    practitionerName?: string
    status?: string
    type?: string
    notes?: string
    [key: string]: any
  }
}

export interface CalendarProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDateSelect?: (start: Date, end: Date) => void
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void
  onCreateEvent?: () => void
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  editable?: boolean
  selectable?: boolean
  headerToolbar?: boolean
  height?: string | number
  className?: string
}

// Status colors for appointments
const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  booked: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
  pending: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },
  arrived: { bg: '#10b981', border: '#059669', text: '#ffffff' },
  fulfilled: { bg: '#6b7280', border: '#4b5563', text: '#ffffff' },
  cancelled: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' },
  noshow: { bg: '#f97316', border: '#ea580c', text: '#ffffff' },
  default: { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' }
}

export function Calendar({
  events,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onCreateEvent,
  initialView = 'timeGridWeek',
  editable = false,
  selectable = true,
  headerToolbar = true,
  height = 'auto',
  className = ''
}: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [currentView, setCurrentView] = useState(initialView)

  // Transform events to FullCalendar format
  const calendarEvents = events.map(event => {
    const status = event.extendedProps?.status || 'default'
    const colors = statusColors[status] || statusColors.default
    
    return {
      ...event,
      backgroundColor: event.backgroundColor || colors.bg,
      borderColor: event.borderColor || colors.border,
      textColor: event.textColor || colors.text
    }
  })

  const handleEventClick = (info: any) => {
    if (onEventClick) {
      const event = events.find(e => e.id === info.event.id)
      if (event) onEventClick(event)
    }
  }

  const handleDateSelect = (info: any) => {
    if (onDateSelect) {
      onDateSelect(info.start, info.end)
    }
  }

  const handleEventDrop = (info: any) => {
    if (onEventDrop) {
      const event = events.find(e => e.id === info.event.id)
      if (event) {
        onEventDrop(event, info.event.start, info.event.end)
      }
    }
  }

  const navigateCalendar = (direction: 'prev' | 'next' | 'today') => {
    const calendarApi = calendarRef.current?.getApi()
    if (!calendarApi) return
    
    switch (direction) {
      case 'prev':
        calendarApi.prev()
        break
      case 'next':
        calendarApi.next()
        break
      case 'today':
        calendarApi.today()
        break
    }
  }

  const changeView = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.changeView(view)
      setCurrentView(view)
    }
  }

  const getCurrentTitle = () => {
    const calendarApi = calendarRef.current?.getApi()
    return calendarApi?.view.title || ''
  }

  return (
    <Card className={className}>
      {headerToolbar && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{getCurrentTitle() || 'Calendar'}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {/* View switcher */}
              <div className="flex border rounded-md">
                <Button
                  variant={currentView === 'dayGridMonth' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => changeView('dayGridMonth')}
                >
                  Month
                </Button>
                <Button
                  variant={currentView === 'timeGridWeek' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-x"
                  onClick={() => changeView('timeGridWeek')}
                >
                  Week
                </Button>
                <Button
                  variant={currentView === 'timeGridDay' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => changeView('timeGridDay')}
                >
                  Day
                </Button>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateCalendar('today')}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Create button */}
              {onCreateEvent && (
                <Button size="sm" onClick={onCreateEvent}>
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-2">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          events={calendarEvents}
          editable={editable}
          selectable={selectable}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          headerToolbar={false}
          height={height}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventContent={(eventInfo) => (
            <div className="px-1 py-0.5 text-xs overflow-hidden">
              <div className="font-medium truncate">{eventInfo.event.title}</div>
              {eventInfo.event.extendedProps?.patientName && (
                <div className="truncate opacity-80">{eventInfo.event.extendedProps.patientName}</div>
              )}
            </div>
          )}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={true}
          nowIndicator={true}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
        />
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
          {Object.entries(statusColors).filter(([key]) => key !== 'default').map(([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.bg }} />
              <span className="text-xs text-muted-foreground capitalize">{status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

