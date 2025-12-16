'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePatientTasks } from '@/hooks/useFHIRData'
import { CheckSquare, Clock, User, AlertCircle, CheckCircle2, Circle } from 'lucide-react'
import type { Task } from '@medplum/fhirtypes'

interface TasksPanelProps {
    patientId: string
}

export function TasksPanel({ patientId }: TasksPanelProps) {
    const { data: tasks, isLoading, isError } = usePatientTasks(patientId)

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />
            case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />
            case 'ready': return <Circle className="h-4 w-4 text-yellow-600" />
            case 'requested': return <Circle className="h-4 w-4 text-gray-400" />
            default: return <Circle className="h-4 w-4 text-gray-400" />
        }
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'stat': return 'bg-red-100 text-red-800 border-red-200'
            case 'asap': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'urgent': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'routine': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTaskDescription = (task: Task) => {
        return task.description || task.code?.text || task.code?.coding?.[0]?.display || 'Task'
    }

    const getOwner = (task: Task) => {
        return task.owner?.display || 'Unassigned'
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-14 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (isError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        Failed to load tasks
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Tasks ({tasks?.length || 0})
                </CardTitle>
                <Button size="sm" variant="outline">
                    + Add Task
                </Button>
            </CardHeader>
            <CardContent>
                {tasks && tasks.length > 0 ? (
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                {getStatusIcon(task.status)}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{getTaskDescription(task)}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {getOwner(task)}
                                        </span>
                                        {task.authoredOn && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(task.authoredOn)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {task.priority && (
                                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                        {task.priority}
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">
                        No active tasks
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
