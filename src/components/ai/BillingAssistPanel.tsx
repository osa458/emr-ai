'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DollarSign,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import type { BillingAssistOutput } from '@/lib/llm/schemas'

interface BillingAssistPanelProps {
  encounterId: string
}

const categoryColors: Record<string, string> = {
  principal_diagnosis: 'bg-blue-100 text-blue-800',
  mcc: 'bg-red-100 text-red-800',
  cc: 'bg-orange-100 text-orange-800',
  secondary_diagnosis: 'bg-gray-100 text-gray-800',
  procedure: 'bg-purple-100 text-purple-800',
}

export function BillingAssistPanel({ encounterId }: BillingAssistPanelProps) {
  const [result, setResult] = useState<BillingAssistOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchBillingAssist = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/ai/billing-assist/${encounterId}`)
      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('Billing assist error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchBillingAssist()
  }, [encounterId])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Billing Assist
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBillingAssist}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {result && (
          <>
            {/* CMI Impact */}
            {result.cmiImpact && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">
                    CMI Impact Opportunity
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-700">
                      {result.cmiImpact.currentEstimate}
                    </div>
                    <div className="text-sm text-gray-500">Current CMI</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {result.cmiImpact.potentialWithSuggestions}
                    </div>
                    <div className="text-sm text-gray-500">Potential CMI</div>
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  {result.cmiImpact.explanation}
                </p>
              </div>
            )}

            {/* Suggested Codes */}
            <div>
              <h3 className="font-semibold mb-2">Suggested Codes</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.suggestedCodes.map((code, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono font-medium">
                        {code.code}
                      </TableCell>
                      <TableCell>
                        <div>{code.description}</div>
                        {code.documentationTip && (
                          <div className="text-xs text-blue-600 mt-1">
                            💡 {code.documentationTip}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            categoryColors[code.category || 'secondary_diagnosis']
                          }
                        >
                          {code.category?.replace('_', ' ') || 'secondary'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        {code.evidence.map((e, j) => (
                          <div key={j}>
                            <span className="font-medium">{e.source}:</span>{' '}
                            {e.quote}
                          </div>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Missing Documentation */}
            {result.missingDocumentation.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Documentation Opportunities
                </h3>
                <div className="space-y-3">
                  {result.missingDocumentation.map((doc, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-orange-200 bg-orange-50 p-3"
                    >
                      <div className="font-medium text-orange-800">
                        {doc.codeAtRisk}
                      </div>
                      <p className="text-sm text-orange-700 mt-1">
                        <strong>Missing:</strong> {doc.whatIsMissing}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        <strong>Add:</strong> &ldquo;{doc.suggestedAddition}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance Warnings */}
            {result.complianceWarnings.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <h3 className="font-semibold mb-2 text-yellow-800">
                  Compliance Notes
                </h3>
                <ul className="text-sm text-yellow-700 list-disc pl-4">
                  {result.complianceWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
