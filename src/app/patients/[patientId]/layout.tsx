'use client'

import { usePathname } from 'next/navigation'

// This layout removes the default sidebar for patient chart pages
// The PatientChartLayout component provides its own navigation
export default function PatientChartRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="chart-mode-layout">
      {/* 
        Override the parent layout's sidebar by using CSS to hide it
        and make the chart layout take full width
      */}
      <style jsx global>{`
        /* Hide the main sidebar when in chart mode */
        .chart-mode-layout {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: #f1f5f9;
        }
        
        /* The main layout's sidebar and main area are hidden behind this */
      `}</style>
      {children}
    </div>
  )
}

