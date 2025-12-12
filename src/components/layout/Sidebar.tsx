'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  Users,
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Stethoscope,
  Activity,
  FileText,
  User,
  Calendar,
  Video,
  FileEdit,
  UserPlus,
  Menu,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Admit Patient', href: '/patients/admit', icon: UserPlus },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Telemedicine', href: '/telemedicine', icon: Video },
  { name: 'Morning Triage', href: '/triage', icon: Activity },
  { name: 'Discharge Planning', href: '/discharge-planning', icon: ClipboardList },
  { name: 'Form Builder', href: '/admin/forms', icon: FileEdit },
  { name: 'Audit Log', href: '/admin/audit', icon: FileText, adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const userRole = (session?.user as unknown as { role?: string })?.role

  const filteredNav = navigation.filter((item) => {
    if (item.adminOnly && userRole !== 'admin') return false
    return true
  })

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-slate-900 text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col bg-slate-900 transition-transform duration-300 lg:relative lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
      <div className="flex h-16 items-center px-6">
        <Stethoscope className="h-8 w-8 text-blue-400" />
        <span className="ml-3 text-xl font-bold text-white">EMR AI</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeMobile}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-slate-700 p-4">
        {session?.user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
                <User className="h-4 w-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-slate-400 capitalize">{userRole}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            <User className="mr-3 h-5 w-5" />
            Sign in
          </Link>
        )}
      </div>
      </div>
    </>
  )
}
