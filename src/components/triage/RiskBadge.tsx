'use client'

import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react'

type RiskLevel = 'critical' | 'high' | 'moderate' | 'low'

interface RiskBadgeProps {
  level: RiskLevel
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function RiskBadge({ level, showIcon = true, size = 'md' }: RiskBadgeProps) {
  const config = {
    critical: {
      className: 'bg-red-600 text-white hover:bg-red-700',
      icon: AlertTriangle,
      label: 'Critical',
    },
    high: {
      className: 'bg-orange-500 text-white hover:bg-orange-600',
      icon: AlertCircle,
      label: 'High',
    },
    moderate: {
      className: 'bg-yellow-500 text-white hover:bg-yellow-600',
      icon: Info,
      label: 'Moderate',
    },
    low: {
      className: 'bg-green-500 text-white hover:bg-green-600',
      icon: CheckCircle,
      label: 'Low',
    },
  }

  const { className, icon: Icon, label } = config[level]

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <Badge className={`${className} ${sizeClasses[size]} inline-flex items-center gap-1`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      {label}
    </Badge>
  )
}
