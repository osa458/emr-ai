'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Eye, Edit, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Collaborator {
  id: string
  name: string
  role: 'physician' | 'nurse' | 'pharmacist' | 'specialist' | 'resident'
  avatar?: string
  color: string
  activity: 'viewing' | 'editing' | 'idle'
  currentTab?: string
  lastActive: Date
  isCurrentUser?: boolean
}

interface CollaborativeCursorsProps {
  patientId: string
  currentUserId: string
  collaborators: Collaborator[]
  onMessageUser: (userId: string) => void
}

const roleColors: Record<string, string> = {
  physician: '#3B82F6', // blue
  nurse: '#10B981', // green
  pharmacist: '#8B5CF6', // purple
  specialist: '#F59E0B', // amber
  resident: '#06B6D4', // cyan
}

const activityIcons = {
  viewing: Eye,
  editing: Edit,
  idle: Clock,
}

function formatLastActive(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  return `${Math.floor(diffMins / 60)}h ago`
}

export function CollaborativeCursors({
  patientId,
  currentUserId,
  collaborators,
  onMessageUser,
}: CollaborativeCursorsProps) {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const activeCollaborators = collaborators.filter(
    (c) => c.id !== currentUserId && c.activity !== 'idle'
  )
  const idleCollaborators = collaborators.filter(
    (c) => c.id !== currentUserId && c.activity === 'idle'
  )

  const displayedCollaborators = isExpanded
    ? [...activeCollaborators, ...idleCollaborators]
    : activeCollaborators.slice(0, 4)

  const hiddenCount = isExpanded
    ? 0
    : Math.max(0, activeCollaborators.length - 4) + idleCollaborators.length

  return (
    <div className="relative flex items-center">
      {/* Avatar Stack */}
      <div className="flex items-center -space-x-2">
        {displayedCollaborators.map((user) => {
          const ActivityIcon = activityIcons[user.activity]
          
          return (
            <div
              key={user.id}
              className="relative"
              onMouseEnter={() => setHoveredUser(user.id)}
              onMouseLeave={() => setHoveredUser(null)}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'h-8 w-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-transform hover:scale-110 hover:z-10',
                  user.activity === 'editing' && 'ring-2 ring-offset-1 ring-offset-slate-900'
                )}
                style={{ 
                  backgroundColor: user.color || roleColors[user.role],
                  ringColor: user.activity === 'editing' ? '#22C55E' : undefined,
                }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Activity indicator */}
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 flex items-center justify-center',
                  user.activity === 'viewing' && 'bg-green-500',
                  user.activity === 'editing' && 'bg-yellow-500 animate-pulse',
                  user.activity === 'idle' && 'bg-slate-400'
                )}
              />

              {/* Hover Card */}
              {hoveredUser === user.id && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-lg shadow-xl border p-3 z-50 animate-in fade-in-0 zoom-in-95">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                      style={{ backgroundColor: user.color || roleColors[user.role] }}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <ActivityIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="capitalize">{user.activity}</span>
                      {user.currentTab && (
                        <span className="text-muted-foreground">: {user.currentTab} tab</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatLastActive(user.lastActive)}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 text-xs"
                    onClick={() => onMessageUser(user.id)}
                  >
                    <MessageSquare className="h-3 w-3 mr-2" />
                    Message
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {/* Hidden count badge */}
        {hiddenCount > 0 && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-medium text-white hover:bg-slate-600 transition-colors"
          >
            +{hiddenCount}
          </button>
        )}

        {/* Collapse button */}
        {isExpanded && (activeCollaborators.length > 4 || idleCollaborators.length > 0) && (
          <button
            onClick={() => setIsExpanded(false)}
            className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-medium text-white hover:bg-slate-600 transition-colors"
          >
            ←
          </button>
        )}
      </div>

      {/* Currently editing indicator */}
      {activeCollaborators.some((c) => c.activity === 'editing') && (
        <div className="ml-3 flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
          <Edit className="h-3 w-3" />
          <span>Editing</span>
        </div>
      )}
    </div>
  )
}

// Hook to simulate real-time collaborators (in production, use WebSocket/Supabase Realtime)
export function useCollaborators(patientId: string, currentUserId: string) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])

  useEffect(() => {
    // Simulate collaborators joining/leaving
    const mockCollaborators: Collaborator[] = [
      {
        id: '1',
        name: 'Dr. Emily Lee',
        role: 'physician',
        color: '#3B82F6',
        activity: 'viewing',
        currentTab: 'Labs',
        lastActive: new Date(Date.now() - 2 * 60000),
      },
      {
        id: '2',
        name: 'RN Johnson',
        role: 'nurse',
        color: '#10B981',
        activity: 'editing',
        currentTab: 'Notes',
        lastActive: new Date(),
      },
      {
        id: '3',
        name: 'Pharm. Chen',
        role: 'pharmacist',
        color: '#8B5CF6',
        activity: 'viewing',
        currentTab: 'Meds',
        lastActive: new Date(Date.now() - 5 * 60000),
      },
    ]

    setCollaborators(mockCollaborators)

    // Simulate activity changes
    const interval = setInterval(() => {
      setCollaborators((prev) =>
        prev.map((c) => ({
          ...c,
          lastActive: Math.random() > 0.7 ? new Date() : c.lastActive,
          activity: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'editing' : 'viewing') : c.activity,
        }))
      )
    }, 10000)

    return () => clearInterval(interval)
  }, [patientId])

  return collaborators
}

