import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Sidebar } from '@/components/layout/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EMR AI - AI-Augmented Electronic Medical Records',
  description: 'AI-powered clinical decision support system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-gray-50 p-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
