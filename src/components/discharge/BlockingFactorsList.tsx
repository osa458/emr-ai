'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Stethoscope, FileSearch, Users, Truck } from 'lucide-react'

interface BlockingFactor {
  factor: string
  category: 'clinical' | 'workup' | 'social' | 'logistical'
  details: string
  estimatedResolutionTime?: string
  responsibleParty?: string
}

interface BlockingFactorsListProps {
  factors: BlockingFactor[]
}

export function BlockingFactorsList({ factors }: BlockingFactorsListProps) {
  if (factors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <AlertTriangle className="h-5 w-5" />
            No Blocking Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All discharge criteria appear to be met.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'clinical':
        return {
          icon: Stethoscope,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          badgeClass: 'bg-red-100 text-red-800',
          label: 'Clinical',
        }
      case 'workup':
        return {
          icon: FileSearch,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          badgeClass: 'bg-orange-100 text-orange-800',
          label: 'Workup',
        }
      case 'social':
        return {
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          badgeClass: 'bg-blue-100 text-blue-800',
          label: 'Social',
        }
      case 'logistical':
        return {
          icon: Truck,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          badgeClass: 'bg-purple-100 text-purple-800',
          label: 'Logistical',
        }
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          badgeClass: 'bg-gray-100 text-gray-800',
          label: 'Other',
        }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Blocking Factors ({factors.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {factors.map((factor, idx) => {
            const config = getCategoryConfig(factor.category)
            const Icon = config.icon

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${config.bgColor}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="font-medium text-sm">{factor.factor}</span>
                  </div>
                  <Badge variant="outline" className={config.badgeClass}>
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {factor.details}
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {factor.estimatedResolutionTime && (
                    <span>⏱️ {factor.estimatedResolutionTime}</span>
                  )}
                  {factor.responsibleParty && (
                    <span>👤 {factor.responsibleParty}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
