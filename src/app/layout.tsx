import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Sidebar } from '@/components/layout/Sidebar'
import { FontSizeManager } from '@/components/FontSizeManager'
import { MainLayout } from '@/components/layout/MainLayout'
import { Toaster } from '@/components/ui/toaster'

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
          <FontSizeManager />
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
