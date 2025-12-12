'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertOctagon,
} from 'lucide-react'
import {
  checkAllInteractions,
  getSeverityColor,
  type InteractionCheckResult,
  type DrugInteraction,
  type DrugAllergyAlert,
} from '@/lib/drug-interactions'

interface DrugInteractionCheckerProps {
  medications: string[]
  allergies: Array<{ allergen: string; severity: string }>
  onInteractionsFound?: (result: InteractionCheckResult) => void
  autoCheck?: boolean
}

export function DrugInteractionChecker({
  medications,
  allergies,
  onInteractionsFound,
  autoCheck = true,
}: DrugInteractionCheckerProps) {
  const [result, setResult] = useState<InteractionCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [expandedInteractions, setExpandedInteractions] = useState<Set<number>>(new Set())
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set())

  const runCheck = () => {
    setIsChecking(true)
    // Simulate async check (in production, this might call an external API)
    setTimeout(() => {
      const checkResult = checkAllInteractions(medications, allergies)
      setResult(checkResult)
      onInteractionsFound?.(checkResult)
      setIsChecking(false)
    }, 500)
  }

  useEffect(() => {
    if (autoCheck && medications.length > 0) {
      runCheck()
    }
  }, [medications, allergies, autoCheck])

  const toggleInteraction = (index: number) => {
    const newExpanded = new Set(expandedInteractions)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedInteractions(newExpanded)
  }

  const toggleAlert = (index: number) => {
    const newExpanded = new Set(expandedAlerts)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedAlerts(newExpanded)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'contraindicated':
        return <XCircle className="h-5 w-5 text-purple-600" />
      case 'major':
      case 'danger':
        return <AlertOctagon className="h-5 w-5 text-red-600" />
      case 'moderate':
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
  }

  if (medications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-5 w-5" />
            Drug Interaction Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No medications to check for interactions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-5 w-5" />
          Drug Interaction Check
        </CardTitle>
        <Button variant="outline" size="sm" onClick={runCheck} disabled={isChecking}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Re-check'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {!result ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary */}
            {!result.hasInteractions && !result.hasAllergyAlerts ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">No Interactions Found</AlertTitle>
                <AlertDescription className="text-green-700">
                  No drug-drug interactions or allergy alerts detected for current
                  medications.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert
                className={
                  result.hasSevereInteractions || result.hasAllergyAlerts
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }
              >
                <AlertTriangle
                  className={`h-4 w-4 ${
                    result.hasSevereInteractions || result.hasAllergyAlerts
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}
                />
                <AlertTitle
                  className={
                    result.hasSevereInteractions || result.hasAllergyAlerts
                      ? 'text-red-800'
                      : 'text-yellow-800'
                  }
                >
                  {result.allergyAlerts.length > 0 && 'Allergy Alert! '}
                  {result.drugInteractions.length} Drug Interaction
                  {result.drugInteractions.length !== 1 ? 's' : ''} Found
                </AlertTitle>
                <AlertDescription
                  className={
                    result.hasSevereInteractions || result.hasAllergyAlerts
                      ? 'text-red-700'
                      : 'text-yellow-700'
                  }
                >
                  Review the interactions below before proceeding.
                </AlertDescription>
              </Alert>
            )}

            {/* Allergy Alerts */}
            {result.allergyAlerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-700 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Allergy Alerts ({result.allergyAlerts.length})
                </h4>
                {result.allergyAlerts.map((alert, index) => (
                  <Collapsible
                    key={index}
                    open={expandedAlerts.has(index)}
                    onOpenChange={() => toggleAlert(index)}
                  >
                    <div
                      className={`rounded-lg border p-3 ${getSeverityColor(alert.severity)}`}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(alert.severity)}
                            <span className="font-medium">{alert.drug}</span>
                            <span className="text-sm">→</span>
                            <span className="font-medium">{alert.allergen} allergy</span>
                            {alert.crossReactivity && (
                              <Badge variant="outline" className="text-xs">
                                Cross-reactivity
                              </Badge>
                            )}
                          </div>
                          {expandedAlerts.has(index) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 mt-2 border-t">
                        <p className="text-sm mb-2">{alert.description}</p>
                        <p className="text-sm font-medium">
                          Recommendation: {alert.recommendation}
                        </p>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}

            {/* Drug-Drug Interactions */}
            {result.drugInteractions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Drug-Drug Interactions ({result.drugInteractions.length})
                </h4>
                {result.drugInteractions.map((interaction, index) => (
                  <Collapsible
                    key={index}
                    open={expandedInteractions.has(index)}
                    onOpenChange={() => toggleInteraction(index)}
                  >
                    <div
                      className={`rounded-lg border p-3 ${getSeverityColor(interaction.severity)}`}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(interaction.severity)}
                            <span className="font-medium">{interaction.drug1}</span>
                            <span className="text-sm">+</span>
                            <span className="font-medium">{interaction.drug2}</span>
                            <Badge
                              className={getSeverityColor(interaction.severity)}
                              variant="outline"
                            >
                              {interaction.severity.toUpperCase()}
                            </Badge>
                          </div>
                          {expandedInteractions.has(index) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 mt-2 border-t space-y-2">
                        <p className="text-sm">
                          <strong>Effect:</strong> {interaction.description}
                        </p>
                        <p className="text-sm">
                          <strong>Clinical Impact:</strong> {interaction.clinicalEffect}
                        </p>
                        <p className="text-sm font-medium">
                          <strong>Recommendation:</strong> {interaction.recommendation}
                        </p>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground text-right">
              Last checked: {new Date(result.timestamp).toLocaleTimeString()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default DrugInteractionChecker
