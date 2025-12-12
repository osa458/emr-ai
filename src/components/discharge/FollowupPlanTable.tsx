'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Video, Building, Phone } from 'lucide-react'

export interface FollowupNeed {
  specialty: string
  timeframe: 'within_48_hours' | 'within_1_week' | 'within_2_weeks' | 'within_1_month' | 'prn'
  reason: string
  mode: 'in_person' | 'telehealth' | 'phone' | 'either'
  priority: 'critical' | 'important' | 'routine'
}

interface FollowupPlanTableProps {
  followups: FollowupNeed[]
  onSchedule?: (followup: FollowupNeed) => void
  isScheduling?: boolean
}

const timeframeLabels: Record<string, string> = {
  within_48_hours: '48 hours',
  within_1_week: '1 week',
  within_2_weeks: '2 weeks',
  within_1_month: '1 month',
  prn: 'As needed',
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  important: 'bg-yellow-100 text-yellow-800',
  routine: 'bg-gray-100 text-gray-800',
}

const ModeIcon = ({ mode }: { mode: string }) => {
  switch (mode) {
    case 'telehealth':
      return <Video className="h-4 w-4 text-blue-500" aria-label="Telehealth" />
    case 'in_person':
      return <Building className="h-4 w-4 text-gray-500" aria-label="In-person" />
    case 'phone':
      return <Phone className="h-4 w-4 text-green-500" aria-label="Phone" />
    default:
      return <span className="text-xs text-muted-foreground">Either</span>
  }
}

export function FollowupPlanTable({
  followups,
  onSchedule,
  isScheduling = false,
}: FollowupPlanTableProps) {
  if (!followups || followups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Follow-up Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No follow-up appointments scheduled
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Follow-up Plan ({followups.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Specialty</TableHead>
              <TableHead>Timeframe</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Priority</TableHead>
              {onSchedule && <TableHead><span className="sr-only">Actions</span></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {followups.map((followup, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{followup.specialty}</TableCell>
                <TableCell>{timeframeLabels[followup.timeframe] || followup.timeframe}</TableCell>
                <TableCell className="max-w-xs truncate" title={followup.reason}>
                  {followup.reason}
                </TableCell>
                <TableCell>
                  <ModeIcon mode={followup.mode} />
                </TableCell>
                <TableCell>
                  <Badge className={priorityColors[followup.priority]}>
                    {followup.priority}
                  </Badge>
                </TableCell>
                {onSchedule && (
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSchedule(followup)}
                      disabled={isScheduling}
                    >
                      {isScheduling ? 'Scheduling...' : 'Schedule'}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default FollowupPlanTable
