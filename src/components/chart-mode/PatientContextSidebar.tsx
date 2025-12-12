'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Shield,
  Zap,
  FlaskConical,
  Pill,
  Heart,
  ImageIcon,
  FileText,
  Droplets,
  Camera,
  Upload,
  TrendingUp,
  TrendingDown,
  Clock,
  ClipboardList,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PatientData {
  id: string
  name: string
  age: number
  gender: string
  mrn: string
  location: string
  admitDate: string
  photo?: string
  codeStatus: 'Full' | 'DNR' | 'DNI' | 'Comfort'
  isolation?: string
  fallRisk: 'Low' | 'Moderate' | 'High'
  allergies: Array<{ name: string; severity: 'high' | 'moderate' | 'low'; reaction?: string }>
  problems: string[]
  keyLabs: Array<{ name: string; value: string; unit: string; status: 'high' | 'low' | 'normal'; trend?: 'up' | 'down' }>
  cultures: Array<{ type: string; status: 'pending' | 'positive' | 'negative'; result?: string }>
  imaging: Array<{ type: string; date: string; finding: string }>
  medications: number
  vitals: { bp: string; hr: number; temp: string; spo2: number; rr: number }
  io: { input: number; output: number }
}

interface PatientContextSidebarProps {
  patient: PatientData
  onPhotoUpload?: (file: File) => void
  acuity: 'critical' | 'high' | 'moderate' | 'stable'
  onHandoffClick?: () => void
  onMobileQRClick?: () => void
}

// Hover panel component with fixed positioning to avoid overflow clipping
function HoverPanel({ 
  children, 
  content,
  className 
}: { 
  children: React.ReactNode
  content: React.ReactNode
  className?: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      // Position to the right of the sidebar (sidebar is 192px / 12rem wide)
      setPosition({
        top: Math.min(rect.top, window.innerHeight - 300), // Prevent going off bottom
        left: 192 + 8, // sidebar width + small gap
      })
    }
    setIsHovered(true)
  }

  return (
    <div 
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <div 
          className={cn(
            "fixed min-w-[280px] max-w-[320px] bg-white border rounded-lg shadow-2xl p-3 animate-in fade-in-0 zoom-in-95 duration-150",
            className
          )}
          style={{
            top: position.top,
            left: position.left,
            zIndex: 9999,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// Sparkline component for trends
function Sparkline({ trend }: { trend?: 'up' | 'down' }) {
  if (!trend) return null
  return trend === 'up' ? (
    <TrendingUp className="h-3 w-3 text-red-500" />
  ) : (
    <TrendingDown className="h-3 w-3 text-blue-500" />
  )
}

export function PatientContextSidebar({ patient, onPhotoUpload, acuity, onHandoffClick, onMobileQRClick }: PatientContextSidebarProps) {
  const acuityColors = {
    critical: 'border-l-red-500 bg-red-500',
    high: 'border-l-orange-500 bg-orange-500',
    moderate: 'border-l-yellow-500 bg-yellow-500',
    stable: 'border-l-green-500 bg-green-500',
  }

  const acuityLabels = {
    critical: 'CRITICAL',
    high: 'HIGH',
    moderate: 'MODERATE',
    stable: 'STABLE',
  }

  const daysSinceAdmit = Math.floor(
    (Date.now() - new Date(patient.admitDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-48 bg-slate-50 border-r border-slate-200 overflow-y-auto">
      {/* Acuity Indicator */}
      <div className={cn("h-1", acuityColors[acuity])} />
      
      {/* Patient Header */}
      <div className="p-3 border-b border-slate-200">
        {/* Photo */}
        <div className="flex items-center gap-3 mb-2">
          <div className="relative group">
            {patient.photo ? (
              <img 
                src={patient.photo} 
                alt={patient.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                <Camera className="h-5 w-5 text-slate-400" />
              </div>
            )}
            {onPhotoUpload && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Upload className="h-4 w-4 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => e.target.files?.[0] && onPhotoUpload(e.target.files[0])}
                />
              </label>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{patient.name}</div>
            <div className="text-xs text-muted-foreground">
              {patient.age}y {patient.gender.charAt(0).toUpperCase()} • {patient.mrn}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{patient.location}</span>
          <span className="text-muted-foreground">Day {daysSinceAdmit + 1}</span>
        </div>

        {/* Acuity Badge */}
        <div className={cn(
          "mt-2 text-center text-xs font-bold py-1 rounded text-white",
          acuityColors[acuity]
        )}>
          {acuityLabels[acuity]}
        </div>
      </div>

      {/* Allergies Section */}
      <HoverPanel
        content={
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Allergies
            </div>
            {patient.allergies.map((allergy, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={cn(
                  "h-2 w-2 rounded-full mt-1.5 flex-shrink-0",
                  allergy.severity === 'high' ? 'bg-red-500' :
                  allergy.severity === 'moderate' ? 'bg-yellow-500' : 'bg-blue-500'
                )} />
                <div>
                  <div className="text-sm font-medium">{allergy.name}</div>
                  {allergy.reaction && (
                    <div className="text-xs text-muted-foreground">{allergy.reaction}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        }
      >
        <div className="px-3 py-2 border-b border-slate-200 hover:bg-slate-100 cursor-pointer">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium">Allergies</span>
            <span className="text-xs text-muted-foreground">({patient.allergies.length})</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {patient.allergies.slice(0, 2).map((a, i) => (
              <span 
                key={i}
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  a.severity === 'high' ? 'bg-red-100 text-red-700' :
                  a.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                )}
              >
                {a.name}
              </span>
            ))}
          </div>
        </div>
      </HoverPanel>

      {/* Quick Info Section */}
      <HoverPanel
        content={
          <div className="space-y-2">
            <div className="font-semibold text-sm">Quick Info</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Code Status:</span>
                <span className="ml-1 font-medium">{patient.codeStatus}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fall Risk:</span>
                <span className={cn(
                  "ml-1 font-medium",
                  patient.fallRisk === 'High' ? 'text-red-600' :
                  patient.fallRisk === 'Moderate' ? 'text-yellow-600' : 'text-green-600'
                )}>{patient.fallRisk}</span>
              </div>
              {patient.isolation && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Isolation:</span>
                  <span className="ml-1 font-medium">{patient.isolation}</span>
                </div>
              )}
            </div>
          </div>
        }
      >
        <div className="px-3 py-2 border-b border-slate-200 hover:bg-slate-100 cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium">Code: {patient.codeStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className={cn(
              "h-4 w-4",
              patient.fallRisk === 'High' ? 'text-red-500' :
              patient.fallRisk === 'Moderate' ? 'text-yellow-500' : 'text-green-500'
            )} />
            <span className="text-xs">Fall: {patient.fallRisk}</span>
          </div>
        </div>
      </HoverPanel>

      {/* Problems Section */}
      <HoverPanel
        content={
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Active Problems
            </div>
            <ul className="space-y-1">
              {patient.problems.map((problem, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  {problem}
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <div className="px-3 py-2 border-b border-slate-200 hover:bg-slate-100 cursor-pointer">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-medium">Problems</span>
            <span className="text-xs text-muted-foreground">({patient.problems.length})</span>
          </div>
        </div>
      </HoverPanel>

      {/* Labs Section */}
      <HoverPanel
        content={
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-purple-500" />
              Key Labs
              <span className="text-xs text-muted-foreground ml-auto">2h ago</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {patient.keyLabs.map((lab, i) => (
                <div key={i} className="text-sm flex items-center gap-1">
                  <span className="text-muted-foreground">{lab.name}</span>
                  <span className={cn(
                    "font-medium",
                    lab.status === 'high' ? 'text-red-600' :
                    lab.status === 'low' ? 'text-blue-600' : ''
                  )}>
                    {lab.value}
                    {lab.status !== 'normal' && (lab.status === 'high' ? '↑' : '↓')}
                  </span>
                  <Sparkline trend={lab.trend} />
                </div>
              ))}
            </div>
            <Button variant="link" size="sm" className="p-0 h-auto text-xs">
              View All Labs →
            </Button>
          </div>
        }
      >
        <div className="px-3 py-2 border-b border-slate-200 hover:bg-slate-100 cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium">Labs</span>
            <span className="text-xs text-red-600 font-medium ml-auto">
              {patient.keyLabs.filter(l => l.status !== 'normal').length} abnl
            </span>
          </div>
          <div className="space-y-0.5">
            {patient.keyLabs.filter(l => l.status !== 'normal').slice(0, 2).map((lab, i) => (
              <div key={i} className="text-xs flex items-center gap-1">
                <span className="text-muted-foreground">{lab.name}</span>
                <span className={cn(
                  "font-medium",
                  lab.status === 'high' ? 'text-red-600' : 'text-blue-600'
                )}>
                  {lab.value}{lab.status === 'high' ? '↑' : '↓'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </HoverPanel>

      {/* Cultures Section */}
      <HoverPanel
        content={
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Droplets className="h-4 w-4 text-green-500" />
              Cultures
            </div>
            {patient.cultures.map((culture, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  culture.status === 'pending' ? 'bg-yellow-500' :
                  culture.status === 'positive' ? 'bg-red-500' : 'bg-green-500'
                )} />
                <span className="font-medium">{culture.type}</span>
                <span className="text-muted-foreground">
                  {culture.status === 'pending' ? 'Pending' : culture.result}
                </span>
              </div>
            ))}
          </div>
        }
      >
        <div className="px-3 py-2 border-b border-slate-200 hover:bg-slate-100 cursor-pointer">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium">Cultures</span>
            {patient.cultures.some(c => c.status === 'pending') && (
              <span className="text-xs text-yellow-600 ml-auto">
                {patient.cultures.filter(c => c.status === 'pending').length} pend
              </span>
            )}
          </div>
        </div>
      </HoverPanel>

      {/* Imaging Section */}
      <HoverPanel
        content={
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-blue-500" />
              Recent Imaging
            </div>
            {patient.imaging.map((img, i) => (
              <div key={i} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{img.type}</span>
                  <span className="text-muted-foreground text-xs">{img.date}</span>
                </div>
                <p className="text-xs text-muted-foreground">{img.finding}</p>
              </div>
            ))}
          </div>
        }
      >
        <div className="px-3 py-2 border-b border-slate-200 hover:bg-slate-100 cursor-pointer">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium">Imaging</span>
            <span className="text-xs text-muted-foreground">({patient.imaging.length})</span>
          </div>
        </div>
      </HoverPanel>

      {/* Medications Section */}
      <div className="px-3 py-2 border-b border-slate-200 hover:bg-slate-100 cursor-pointer">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-medium">Meds</span>
          <span className="text-xs text-muted-foreground">({patient.medications})</span>
        </div>
      </div>

      {/* Vitals Section */}
      <HoverPanel
        content={
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Vital Signs
              <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                <Clock className="h-3 w-3" /> 30 min ago
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">BP:</span> {patient.vitals.bp}</div>
              <div><span className="text-muted-foreground">HR:</span> {patient.vitals.hr} bpm</div>
              <div><span className="text-muted-foreground">Temp:</span> {patient.vitals.temp}</div>
              <div><span className="text-muted-foreground">SpO2:</span> {patient.vitals.spo2}%</div>
              <div><span className="text-muted-foreground">RR:</span> {patient.vitals.rr}/min</div>
            </div>
          </div>
        }
      >
        <div className="px-3 py-2 border-b border-slate-200 hover:bg-slate-100 cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium">Vitals</span>
          </div>
          <div className="text-xs text-muted-foreground">
            BP {patient.vitals.bp} • HR {patient.vitals.hr}
          </div>
        </div>
      </HoverPanel>

      {/* I/O Section */}
      <div className="px-3 py-2 border-b border-slate-200 hover:bg-slate-100 cursor-pointer">
        <div className="flex items-center gap-2 mb-1">
          <Droplets className="h-4 w-4 text-cyan-500" />
          <span className="text-xs font-medium">I/O</span>
        </div>
        <div className="text-xs">
          <span className={cn(
            "font-medium",
            patient.io.input - patient.io.output > 0 ? 'text-blue-600' : 'text-amber-600'
          )}>
            {patient.io.input - patient.io.output > 0 ? '+' : ''}{patient.io.input - patient.io.output} mL
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-3 mt-auto space-y-2">
        {onHandoffClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onHandoffClick}
            className="w-full justify-start gap-2 text-xs"
          >
            <ClipboardList className="h-4 w-4" />
            Handoff
          </Button>
        )}
        {onMobileQRClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMobileQRClick}
            className="w-full justify-start gap-2 text-xs"
          >
            <Smartphone className="h-4 w-4" />
            Mobile QR
          </Button>
        )}
      </div>
    </aside>
  )
}

