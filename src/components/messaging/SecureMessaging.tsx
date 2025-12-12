'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Send,
  Paperclip,
  Search,
  Plus,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  User,
  Users,
} from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

export interface Message {
  id: string
  threadId: string
  senderId: string
  senderName: string
  senderRole: string
  content: string
  timestamp: string
  status: 'sending' | 'sent' | 'delivered' | 'read'
  attachments?: Array<{ name: string; url: string }>
  isUrgent?: boolean
}

export interface MessageThread {
  id: string
  subject: string
  participants: Array<{ id: string; name: string; role: string }>
  patientId?: string
  patientName?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isUrgent?: boolean
}

interface SecureMessagingProps {
  currentUserId: string
  currentUserName: string
  threads: MessageThread[]
  onSendMessage?: (threadId: string, content: string, isUrgent?: boolean) => Promise<void>
  onCreateThread?: (subject: string, participantIds: string[], patientId?: string) => Promise<string>
  onMarkRead?: (threadId: string) => void
  getMessages?: (threadId: string) => Promise<Message[]>
}

const statusIcons = {
  sending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export function SecureMessaging({
  currentUserId,
  currentUserName,
  threads,
  onSendMessage,
  onCreateThread,
  onMarkRead,
  getMessages,
}: SecureMessagingProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedThread = threads.find(t => t.id === selectedThreadId)

  useEffect(() => {
    if (selectedThreadId && getMessages) {
      setIsLoading(true)
      getMessages(selectedThreadId)
        .then(setMessages)
        .finally(() => setIsLoading(false))
      onMarkRead?.(selectedThreadId)
    }
  }, [selectedThreadId, getMessages, onMarkRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThreadId || !onSendMessage) return

    setIsSending(true)
    try {
      await onSendMessage(selectedThreadId, newMessage, isUrgent)
      setNewMessage('')
      setIsUrgent(false)
      // Optimistically add message
      setMessages(prev => [...prev, {
        id: `temp-${Date.now()}`,
        threadId: selectedThreadId,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: 'Provider',
        content: newMessage,
        timestamp: new Date().toISOString(),
        status: 'sending',
        isUrgent,
      }])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const filteredThreads = threads.filter(t =>
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Thread List */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-3 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
              {totalUnread > 0 && (
                <Badge className="bg-red-500">{totalUnread}</Badge>
              )}
            </h2>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No messages
            </div>
          ) : (
            filteredThreads.map(thread => (
              <div
                key={thread.id}
                className={`p-3 border-b cursor-pointer hover:bg-gray-100 transition-colors ${
                  selectedThreadId === thread.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
                onClick={() => setSelectedThreadId(thread.id)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {thread.patientName ? getInitials(thread.patientName) : <Users className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium truncate ${thread.unreadCount > 0 ? 'text-black' : 'text-gray-700'}`}>
                        {thread.subject}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(thread.lastMessageTime)}
                      </span>
                    </div>
                    {thread.patientName && (
                      <div className="text-xs text-blue-600">
                        Re: {thread.patientName}
                      </div>
                    )}
                    <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-muted-foreground'}`}>
                      {thread.lastMessage}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {thread.isUrgent && (
                        <Badge className="bg-red-100 text-red-800 text-xs">Urgent</Badge>
                      )}
                      {thread.unreadCount > 0 && (
                        <Badge className="bg-blue-500 text-xs">{thread.unreadCount}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col bg-white">
        {!selectedThread ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="p-3 border-b">
              <h3 className="font-semibold">{selectedThread.subject}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {selectedThread.participants.map(p => p.name).join(', ')}
              </div>
              {selectedThread.patientName && (
                <div className="text-sm text-blue-600 mt-1">
                  <User className="h-3 w-3 inline mr-1" />
                  Patient: {selectedThread.patientName}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground">No messages yet</div>
              ) : (
                messages.map(message => {
                  const isOwn = message.senderId === currentUserId
                  const StatusIcon = statusIcons[message.status]
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                        {!isOwn && (
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(message.senderName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {message.senderName}
                            </span>
                          </div>
                        )}
                        <div
                          className={`rounded-lg p-3 ${
                            isOwn
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          } ${message.isUrgent ? 'border-2 border-red-400' : ''}`}
                        >
                          {message.isUrgent && (
                            <div className={`flex items-center gap-1 text-xs mb-1 ${isOwn ? 'text-red-200' : 'text-red-600'}`}>
                              <AlertCircle className="h-3 w-3" />
                              URGENT
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isOwn ? 'justify-end' : ''}`}>
                          <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
                          {isOwn && <StatusIcon className={`h-3 w-3 ${message.status === 'read' ? 'text-blue-500' : ''}`} />}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose */}
            <div className="p-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant={isUrgent ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setIsUrgent(!isUrgent)}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {isUrgent ? 'Urgent' : 'Mark Urgent'}
                </Button>
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  rows={2}
                  className="resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SecureMessaging
