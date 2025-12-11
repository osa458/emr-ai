'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, RefreshCw, Filter, Download } from 'lucide-react'
import type { AuditEvent } from '@/lib/audit'

const actionColors: Record<string, string> = {
  login: 'bg-green-100 text-green-800',
  logout: 'bg-gray-100 text-gray-800',
  view_patient: 'bg-blue-100 text-blue-800',
  view_patient_chart: 'bg-blue-100 text-blue-800',
  edit_note: 'bg-yellow-100 text-yellow-800',
  create_note: 'bg-yellow-100 text-yellow-800',
  use_diagnostic_assist: 'bg-purple-100 text-purple-800',
  use_billing_assist: 'bg-purple-100 text-purple-800',
  generate_discharge_instructions: 'bg-purple-100 text-purple-800',
  view_triage: 'bg-blue-100 text-blue-800',
}

export default function AuditLogPage() {
  const { data: session, status } = useSession()
  const [logs, setLogs] = useState<AuditEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  // Redirect non-admins
  const userRole = (session?.user as unknown as { role?: string })?.role
  if (status === 'authenticated' && userRole !== 'admin') {
    redirect('/')
  }

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/audit?limit=100')
      const data = await response.json()
      if (data.success) {
        setLogs(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && userRole === 'admin') {
      fetchLogs()
    }
  }, [status, userRole])

  const filteredLogs = filter
    ? logs.filter(
        (log) =>
          log.action.includes(filter) ||
          log.userName.toLowerCase().includes(filter.toLowerCase()) ||
          log.resource.includes(filter)
      )
    : logs

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all user actions for compliance and security
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by action, user, or resource..."
              className="flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <Button variant="ghost" size="sm" onClick={() => setFilter('')}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{logs.length}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action.includes('ai')).length}
            </div>
            <div className="text-sm text-muted-foreground">AI Interactions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {new Set(logs.map((l) => l.userId)).size}
            </div>
            <div className="text-sm text-muted-foreground">Unique Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.action === 'login').length}
            </div>
            <div className="text-sm text-muted-foreground">Logins</div>
          </CardContent>
        </Card>
      </div>

      {/* Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Activity ({filteredLogs.length} events)
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {isLoading ? 'Loading...' : 'No audit events found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.userName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {log.userRole}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}
                    >
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.resource}
                    {log.resourceId && (
                      <span className="text-muted-foreground">
                        /{log.resourceId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
