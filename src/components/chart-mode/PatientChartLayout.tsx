'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TopNavigation } from './TopNavigation'
import { PatientContextSidebar } from './PatientContextSidebar'
import { CommandPalette } from './CommandPalette'
import { VoiceCommand } from './VoiceCommand'
import { SmartNotifications } from './SmartNotifications'
import { HandoffGenerator } from './HandoffGenerator'
import { MobileQRCode } from './MobileQRCode'
import { AIInsightStrip, generateSampleInsights } from './AIInsightStrip'
import { cn } from '@/lib/utils'

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
  attendingPhysician: string
  diagnosis: string[]
  keyUpdates: string[]
  overnightTasks: string[]
}

interface PatientChartLayoutProps {
  patient: PatientData
  children: React.ReactNode
  currentUserId?: string
}

type Notification = {
  id: string
  priority: 'critical' | 'high' | 'routine' | 'info'
  title: string
  message: string
  timestamp: Date
  patientName?: string
  patientRoom?: string
  type: 'lab' | 'vitals' | 'medication' | 'message' | 'system' | 'consult'
  read: boolean
  actions?: Array<{
    label: string
    action: () => void
    primary?: boolean
  }>
}

export function PatientChartLayout({ patient, children, currentUserId = 'current-user' }: PatientChartLayoutProps) {
  const router = useRouter()
  
  // State for all modal/panel toggles
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isHandoffOpen, setIsHandoffOpen] = useState(false)
  const [isMobileQROpen, setIsMobileQROpen] = useState(false)
  const [isAIStripCollapsed, setIsAIStripCollapsed] = useState(false)

  // Sample notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      priority: 'critical',
      title: 'Critical Lab Result',
      message: 'K+ 6.1 - Requires immediate attention',
      timestamp: new Date(Date.now() - 2 * 60000),
      patientName: patient.name,
      patientRoom: patient.location,
      type: 'lab',
      read: false,
      actions: [
        { label: 'View Labs', action: () => {}, primary: true },
        { label: 'Order EKG', action: () => {} },
      ],
    },
    {
      id: '2',
      priority: 'high',
      title: 'Blood Culture Positive',
      message: 'Gram positive cocci in clusters identified',
      timestamp: new Date(Date.now() - 15 * 60000),
      patientName: 'Sarah Williams',
      patientRoom: 'Rm 305',
      type: 'lab',
      read: false,
      actions: [
        { label: 'View Results', action: () => {}, primary: true },
        { label: 'Adjust Abx', action: () => {} },
      ],
    },
    {
      id: '3',
      priority: 'routine',
      title: 'CT Results Available',
      message: 'CT Abdomen/Pelvis results ready for review',
      timestamp: new Date(Date.now() - 60 * 60000),
      patientName: 'John Smith',
      type: 'lab',
      read: true,
    },
  ])

  // AI Insights
  const [aiInsights, setAiInsights] = useState(() => generateSampleInsights(patient))

  // Calculate acuity based on patient data
  const calculateAcuity = useCallback((): 'critical' | 'high' | 'moderate' | 'stable' => {
    const abnormalLabs = patient.keyLabs.filter((l) => l.status !== 'normal').length
    const hasPendingCultures = patient.cultures.some((c) => c.status === 'pending')
    const hasPositiveCultures = patient.cultures.some((c) => c.status === 'positive')
    
    if (abnormalLabs >= 3 || hasPositiveCultures) return 'critical'
    if (abnormalLabs >= 2 || hasPendingCultures) return 'high'
    if (abnormalLabs >= 1) return 'moderate'
    return 'stable'
  }, [patient])

  const acuity = calculateAcuity()

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Voice command handler
  const handleVoiceCommand = (command: string, action: { type: string; params?: Record<string, string> }) => {
    console.log('Voice command received:', command, action)
    // Handle different action types
    switch (action.type) {
      case 'order_lab':
        router.push(`/patients/${patient.id}?tab=orders&type=lab&test=${action.params?.test}`)
        break
      case 'handoff':
        setIsHandoffOpen(true)
        break
      // Add more handlers as needed
    }
  }

  // Notification handlers
  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // AI insight handlers
  const handleDismissInsight = (id: string) => {
    setAiInsights((prev) => prev.filter((i) => i.id !== id))
  }

  const handleInsightFeedback = (id: string, helpful: boolean) => {
    console.log('Insight feedback:', id, helpful)
    // In production, send to analytics
  }

  // Photo upload handler
  const handlePhotoUpload = (file: File) => {
    // In production, upload to storage
    console.log('Photo uploaded:', file.name)
  }

  const unreadNotificationCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Navigation */}
      <TopNavigation
        onCommandPaletteOpen={() => setIsCommandPaletteOpen(true)}
        onVoiceToggle={() => setIsVoiceActive(!isVoiceActive)}
        isVoiceActive={isVoiceActive}
        onNotificationsOpen={() => setIsNotificationsOpen(true)}
        notificationCount={unreadNotificationCount}
      />

      {/* Patient Context Sidebar */}
      <PatientContextSidebar
        patient={patient}
        acuity={acuity}
        onPhotoUpload={handlePhotoUpload}
        onHandoffClick={() => setIsHandoffOpen(true)}
        onMobileQRClick={() => setIsMobileQROpen(true)}
      />

      {/* Main Content */}
      <main className={cn(
        "pt-14 pl-48 pb-16 min-h-screen",
        "transition-all duration-300"
      )}>
        {/* Page Content - directly without header bar */}
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Voice Command Indicator */}
      <VoiceCommand
        isActive={isVoiceActive}
        onToggle={() => setIsVoiceActive(!isVoiceActive)}
        onCommand={handleVoiceCommand}
        patientName={patient.name}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        patientId={patient.id}
        patientName={patient.name}
      />

      {/* Smart Notifications */}
      <SmartNotifications
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDismiss={handleDismissNotification}
      />

      {/* Handoff Generator */}
      <HandoffGenerator
        isOpen={isHandoffOpen}
        onClose={() => setIsHandoffOpen(false)}
        patient={{
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          mrn: patient.mrn,
          location: patient.location,
          admitDate: patient.admitDate,
          codeStatus: patient.codeStatus,
          attendingPhysician: patient.attendingPhysician || 'Dr. Smith',
          diagnosis: patient.diagnosis || patient.problems,
          allergies: patient.allergies.map(a => a.name),
          keyUpdates: patient.keyUpdates || ['Cr improved 2.4 → 2.1', 'Tolerating PO, IVF weaned'],
          overnightTasks: patient.overnightTasks || [
            'Recheck BMP at 6am',
            'Monitor UOP goal >0.5 mL/kg/hr',
            'Call if Cr >3.0 or K >5.5',
          ],
        }}
      />

      {/* Mobile QR Code */}
      <MobileQRCode
        isOpen={isMobileQROpen}
        onClose={() => setIsMobileQROpen(false)}
        patientId={patient.id}
        patientName={patient.name}
      />

      {/* AI Insight Strip */}
      <AIInsightStrip
        patientId={patient.id}
        insights={aiInsights}
        onDismiss={handleDismissInsight}
        onFeedback={handleInsightFeedback}
        isCollapsed={isAIStripCollapsed}
        onToggleCollapse={() => setIsAIStripCollapsed(!isAIStripCollapsed)}
      />
    </div>
  )
}

