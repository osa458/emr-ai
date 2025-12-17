'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  
  // Check if we're on a patient chart page (e.g., /patients/[patientId])
  // These pages use PatientChartLayout which has its own sidebar and navigation
  const isPatientChartPage = pathname.match(/^\/patients\/[^/]+$/) || 
                              pathname.match(/^\/patients\/[^/]+\//)

  // Patient chart pages render their own full layout via PatientChartLayout
  if (isPatientChartPage) {
    return <>{children}</>
  }

  // Regular pages use the standard sidebar layout
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 p-4 pt-16 lg:pt-6 lg:p-6">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:p-2 focus:rounded">
          Skip to main content
        </a>
        <div id="main-content">
          {children}
        </div>
      </main>
    </div>
  )
}




