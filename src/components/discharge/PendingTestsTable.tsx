'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FlaskConical, AlertCircle } from 'lucide-react'

interface PendingTest {
  testName: string
  orderedDate?: string
  expectedResultDate?: string
  criticalForDischarge: boolean
}

interface PendingTestsTableProps {
  tests: PendingTest[]
}

export function PendingTestsTable({ tests }: PendingTestsTableProps) {
  if (tests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Pending Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No pending tests. All results are in.
          </p>
        </CardContent>
      </Card>
    )
  }

  const criticalCount = tests.filter(t => t.criticalForDischarge).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Pending Tests ({tests.length})
          </CardTitle>
          {criticalCount > 0 && (
            <Badge variant="destructive">
              {criticalCount} Critical
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test Name</TableHead>
              <TableHead>Ordered</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead className="text-right">Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map((test, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {test.criticalForDischarge && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {test.testName}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {test.orderedDate || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {test.expectedResultDate || 'TBD'}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={test.criticalForDischarge ? 'destructive' : 'secondary'}
                  >
                    {test.criticalForDischarge ? 'Critical' : 'Routine'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
