'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-4">
              <ShieldX className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
