'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  Receipt,
  ClipboardList,
  Video,
  Activity,
  Search,
  Mic,
  MicOff,
  Bell,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Encounters', href: '/encounters', icon: Stethoscope },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Invoices', href: '/invoices', icon: Receipt },
  { name: 'Forms', href: '/forms', icon: ClipboardList },
  { name: 'Telemedicine', href: '/telemedicine', icon: Video },
  { name: 'Triage', href: '/triage', icon: Activity },
]

interface TopNavigationProps {
  onCommandPaletteOpen: () => void
  onVoiceToggle: () => void
  isVoiceActive: boolean
  onNotificationsOpen: () => void
  notificationCount: number
}

export function TopNavigation({
  onCommandPaletteOpen,
  onVoiceToggle,
  isVoiceActive,
  onNotificationsOpen,
  notificationCount,
}: TopNavigationProps) {
  const pathname = usePathname()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  const modKey = isMac ? '⌘' : 'Ctrl'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-slate-900 border-b border-slate-700">
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold text-white">EMR AI</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Command Palette Trigger */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCommandPaletteOpen}
            className="hidden sm:flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800 px-3"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search...</span>
            <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-slate-700 rounded">
              {modKey}K
            </kbd>
          </Button>

          {/* Voice Command */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onVoiceToggle}
            className={cn(
              'text-slate-400 hover:text-white hover:bg-slate-800',
              isVoiceActive && 'text-red-400 bg-red-900/20 hover:bg-red-900/30'
            )}
            title={isVoiceActive ? 'Voice active - say "Hey EMR"' : 'Enable voice commands'}
          >
            {isVoiceActive ? (
              <Mic className="h-4 w-4 animate-pulse" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onNotificationsOpen}
            className="relative text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Button>

          {/* User Menu */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 ml-2"
          >
            <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white">
              DS
            </div>
            <span className="hidden md:inline text-sm">Dr. Smith</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </header>
  )
}

