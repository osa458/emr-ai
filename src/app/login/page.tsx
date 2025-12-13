'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, Loader2, User, KeyRound } from 'lucide-react'

const demoAccounts = [
  { email: 'physician@demo.com', role: 'Physician', name: 'Dr. Sarah Johnson' },
  { email: 'nurse@demo.com', role: 'Nurse', name: 'Nancy Williams, RN' },
  { email: 'casemanager@demo.com', role: 'Case Manager', name: 'Carol Smith, LCSW' },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: demoEmail,
        password: 'demo123',
        redirect: false,
        callbackUrl,
      })

      if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('Demo login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">EMR AI</CardTitle>
          <CardDescription>Sign in to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  className="w-full rounded-md border pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="physician@demo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  className="w-full rounded-md border pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-md p-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="border-t pt-4">
            <p className="text-sm text-center text-muted-foreground mb-3">
              Quick demo login:
            </p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <div
                  key={account.email}
                  className="w-full flex items-center justify-between rounded-md border p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <div className="font-medium text-sm">{account.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {account.role}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isLoading}
                    onClick={() => handleDemoLogin(account.email)}
                  >
                    Login
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Demo password for all accounts: <code>demo123</code>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
