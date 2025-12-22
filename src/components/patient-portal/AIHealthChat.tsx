'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Bot,
    User,
    Send,
    Loader2,
    AlertTriangle,
    Heart,
    RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    isEmergency?: boolean
}

interface AIHealthChatProps {
    accessToken: string
    patientName?: string
    className?: string
}

export function AIHealthChat({
    accessToken,
    patientName,
    className = '',
}: AIHealthChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `Hello${patientName ? `, ${patientName}` : ''}! 👋 I'm your AI Health Companion. I'm here to help you understand your health information and answer general health questions.

How can I help you today? You can ask me about:
• Your lab results and what they mean
• Your medications and their purpose
• General wellness tips
• When to seek medical care

*Remember: I'm here to help, but I'm not a replacement for your doctor. For medical emergencies, always call 911.*`,
            timestamp: new Date(),
        },
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/patient-portal/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.slice(-10),
                }),
            })

            const data = await response.json()

            if (data.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date(),
                    isEmergency: data.isEmergency,
                }])
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'I apologize, but I encountered an error. Please try again.',
                    timestamp: new Date(),
                }])
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I apologize, but I couldn\'t connect to the server. Please check your connection and try again.',
                timestamp: new Date(),
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <Card className={cn('flex flex-col h-[600px]', className)}>
            <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        AI Health Companion
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                        <Heart className="h-3 w-3 mr-1 text-red-500" />
                        Personalized for You
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                'flex gap-3',
                                msg.role === 'user' ? 'flex-row-reverse' : ''
                            )}
                        >
                            <div className={cn(
                                'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                                msg.role === 'user' ? 'bg-primary' : 'bg-muted'
                            )}>
                                {msg.role === 'user' ? (
                                    <User className="h-4 w-4 text-primary-foreground" />
                                ) : (
                                    <Bot className="h-4 w-4" />
                                )}
                            </div>
                            <div className={cn(
                                'rounded-lg p-3 max-w-[80%]',
                                msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : msg.isEmergency
                                        ? 'bg-red-50 border border-red-200'
                                        : 'bg-muted'
                            )}>
                                {msg.isEmergency && (
                                    <div className="flex items-center gap-2 mb-2 text-red-600 font-medium">
                                        <AlertTriangle className="h-4 w-4" />
                                        Emergency Alert
                                    </div>
                                )}
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                <div className={cn(
                                    'text-xs mt-1',
                                    msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                )}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="rounded-lg p-3 bg-muted">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="mt-4 flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me about your health..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    This AI assistant provides general health information only.
                    Always consult your healthcare provider for medical advice.
                </p>
            </CardContent>
        </Card>
    )
}
