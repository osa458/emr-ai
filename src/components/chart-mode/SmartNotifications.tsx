'use client'

import { useState } from 'react'
import {
  Bell,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  FlaskConical,
  Heart,
  Pill,
  Phone,
  MessageSquare,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type NotificationPriority = 'critical' | 'high' | 'routine' | 'info'

interface Notification {
  id: string
  priority: NotificationPriority
  title: string
  message: string
  timestamp: Date
  patientName?: string
  patientRoom?: string
  type: 'lab' | 'vitals' | 'medication' | 'message' | 'system' | 'consult'
  read: boolean
  actions?: Array<{
    label: string
    action: () => void
    primary?: boolean
  }>
}

interface SmartNotificationsProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onDismiss: (id: string) => void
}

const priorityConfig = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-500',
    label: 'CRITICAL',
  },
  high: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-500',
    label: 'HIGH',
  },
  routine: {
    icon: Info,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-500',
    label: 'ROUTINE',
  },
  info: {
    icon: CheckCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-500',
    label: 'INFO',
  },
}

const typeIcons = {
  lab: FlaskConical,
  vitals: Heart,
  medication: Pill,
  message: MessageSquare,
  system: Bell,
  consult: Phone,
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export function SmartNotifications({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
}: SmartNotificationsProps) {
  const [filter, setFilter] = useState<NotificationPriority | 'all'>('all')

  if (!isOpen) return null

  // Group notifications by priority
  const groupedNotifications = notifications
    .filter((n) => filter === 'all' || n.priority === filter)
    .reduce((acc, notification) => {
      if (!acc[notification.priority]) acc[notification.priority] = []
      acc[notification.priority].push(notification)
      return acc
    }, {} as Record<NotificationPriority, Notification[]>)

  const priorityOrder: NotificationPriority[] = ['critical', 'high', 'routine', 'info']
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-4 top-16 w-96 max-h-[calc(100vh-5rem)] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-top-2">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkAllRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-2 border-b bg-slate-50">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            All
          </Button>
          {priorityOrder.map((priority) => {
            const count = notifications.filter((n) => n.priority === priority).length
            if (count === 0) return null
            const config = priorityConfig[priority]
            return (
              <Button
                key={priority}
                variant={filter === priority ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(priority)}
                className={cn("text-xs", filter === priority && config.color)}
              >
                {config.label}
                <span className="ml-1 text-muted-foreground">({count})</span>
              </Button>
            )
          })}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            priorityOrder.map((priority) => {
              const items = groupedNotifications[priority]
              if (!items || items.length === 0) return null

              const config = priorityConfig[priority]
              const PriorityIcon = config.icon

              return (
                <div key={priority} className="border-b last:border-b-0">
                  {/* Priority Header */}
                  <div className={cn("px-4 py-2 flex items-center gap-2", config.bg)}>
                    <PriorityIcon className={cn("h-4 w-4", config.color)} />
                    <span className={cn("text-xs font-semibold", config.color)}>
                      {config.label}
                    </span>
                  </div>

                  {/* Items */}
                  {items.map((notification) => {
                    const TypeIcon = typeIcons[notification.type]
                    
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 border-b last:border-b-0 transition-colors",
                          !notification.read && "bg-blue-50/50",
                          "hover:bg-slate-50"
                        )}
                        onClick={() => !notification.read && onMarkRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                            config.bg
                          )}>
                            <TypeIcon className={cn("h-4 w-4", config.color)} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium text-sm">{notification.title}</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDismiss(notification.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                            
                            {notification.patientName && (
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="font-medium">{notification.patientName}</span>
                                {notification.patientRoom && (
                                  <>
                                    <span>•</span>
                                    <span>{notification.patientRoom}</span>
                                  </>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(notification.timestamp)}
                              </div>
                              
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            
                            {notification.actions && notification.actions.length > 0 && (
                              <div className="flex gap-2 mt-3">
                                {notification.actions.map((action, i) => (
                                  <Button
                                    key={i}
                                    size="sm"
                                    variant={action.primary ? 'default' : 'outline'}
                                    className="text-xs h-7"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      action.action()
                                    }}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-slate-50">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View All Notifications
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

