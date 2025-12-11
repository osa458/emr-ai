'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Minus,
  ChevronRight,
  Zap,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface RiskFactor {
  factor: string
  severity: 'critical' | 'high' | 'moderate'
  details: string
  trend?: 'worsening' | 'stable' | 'improving'
}

interface QuickWin {
  action: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
  timeToComplete: string
}

interface TriagePatientCardProps {
  patientId: string
  patientName: string
  location: string
  riskLevel: 'critical' | 'high' | 'moderate' | 'low'
  riskScore: number
  riskFactors: RiskFactor[]
  quickWins: QuickWin[]
  keyUpdates: string[]
  onViewChart?: () => void
}

export function TriagePatientCard({
  patientId,
  patientName,
  location,
  riskLevel,
  riskScore,
  riskFactors,
  quickWins,
  keyUpdates,
}: TriagePatientCardProps) {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'critical':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          badgeClass: 'bg-red-600 text-white',
          textColor: 'text-red-700',
        }
      case 'high':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          badgeClass: 'bg-orange-500 text-white',
          textColor: 'text-orange-700',
        }
      case 'moderate':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          badgeClass: 'bg-yellow-500 text-white',
          textColor: 'text-yellow-700',
        }
      case 'low':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          badgeClass: 'bg-green-500 text-white',
          textColor: 'text-green-700',
        }
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'worsening':
        return <TrendingUp className="h-3 w-3 text-red-500" />
      case 'improving':
        return <TrendingDown className="h-3 w-3 text-green-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-400" />
    }
  }

  const config = getRiskConfig()

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{patientName}</h3>
              <Badge className={config.badgeClass}>
                {riskLevel.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{location}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{riskScore}</div>
            <div className="text-xs text-muted-foreground">Risk Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Factors
            </h4>
            <div className="space-y-1">
              {riskFactors.slice(0, 3).map((factor, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  {getTrendIcon(factor.trend)}
                  <span className={factor.severity === 'critical' ? 'text-red-700 font-medium' : ''}>
                    {factor.factor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <div>
            <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Quick Wins
            </h4>
            <div className="space-y-1">
              {quickWins.slice(0, 2).map((win, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm bg-white/50 p-2 rounded">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="flex-1">{win.action}</span>
                  <span className="text-xs text-muted-foreground">{win.timeToComplete}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Updates */}
        {keyUpdates.length > 0 && (
          <div className="text-sm">
            <span className="font-medium">Updates: </span>
            <span className="text-muted-foreground">
              {keyUpdates.slice(0, 2).join('; ')}
            </span>
          </div>
        )}

        {/* View Chart Button */}
        <Link href={`/patients/${patientId}`}>
          <Button variant="outline" className="w-full" size="sm">
            View Chart
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
