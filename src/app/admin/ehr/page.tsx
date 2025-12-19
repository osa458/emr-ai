'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Link2, RefreshCw, PlusCircle } from 'lucide-react'

type EhrVendor = 'epic' | 'eclinicalworks'

type TenantDto = {
  id: string
  slug: string
  name: string
}

type EhrConnectionDto = {
  id: string
  vendor: 'EPIC' | 'ECLINICALWORKS'
  issuer: string | null
  fhirBaseUrl: string
  clientId: string
  scopes: string | null
  createdAt: string
  tenant: TenantDto
  connected?: boolean
}

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export default function EhrIntegrationsAdminPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()

  const userRole = (session?.user as unknown as { role?: string })?.role
  if (status === 'authenticated' && userRole !== 'admin') {
    redirect('/')
  }

  const [connections, setConnections] = useState<EhrConnectionDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [vendor, setVendor] = useState<EhrVendor>('epic')
  const [tenantSlug, setTenantSlug] = useState('default')
  const [issuer, setIssuer] = useState('')
  const [fhirBaseUrl, setFhirBaseUrl] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [scopes, setScopes] = useState('')

  useEffect(() => {
    const connected = searchParams.get('connected')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (errorParam) {
      setError(errorDescription ? `${errorParam}: ${errorDescription}` : errorParam)
    } else if (connected === '1') {
      setSuccess('EHR connected')
    }
  }, [searchParams])

  const canCreate = useMemo(() => {
    return !!fhirBaseUrl && !!clientId && !!tenantSlug
  }, [clientId, fhirBaseUrl, tenantSlug])

  const fetchConnections = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ehr/connections')
      const json = (await res.json()) as ApiResponse<EhrConnectionDto[]>
      if (!res.ok || !json.success) {
        setError(!json.success ? json.error : 'Failed to load connections')
        setConnections([])
        return
      }

      setConnections(json.data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load connections')
      setConnections([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && userRole === 'admin') {
      fetchConnections()
    }
  }, [status, userRole])

  const onCreate = async () => {
    if (!canCreate) return

    setIsCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/ehr/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor,
          tenantSlug,
          issuer: issuer || undefined,
          fhirBaseUrl,
          clientId,
          clientSecret: clientSecret || undefined,
          scopes: scopes || undefined,
        }),
      })

      const json = (await res.json()) as ApiResponse<EhrConnectionDto>

      if (!res.ok || !json.success) {
        setError(!json.success ? json.error : 'Failed to create connection')
        return
      }

      setSuccess('Connection saved')
      setIssuer('')
      setFhirBaseUrl('')
      setClientId('')
      setClientSecret('')
      setScopes('')
      await fetchConnections()
    } catch (e: any) {
      setError(e?.message || 'Failed to create connection')
    } finally {
      setIsCreating(false)
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className="flex-1 flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Link2 className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold">EHR Integrations</h1>
          <span className="text-xs text-muted-foreground">
            Manage Epic / eClinicalWorks connection metadata
          </span>
        </div>

        <Button size="sm" variant="outline" onClick={fetchConnections} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="px-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Vendor</label>
                <Select value={vendor} onValueChange={(v) => setVendor(v as EhrVendor)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="epic">Epic</SelectItem>
                    <SelectItem value="eclinicalworks">eClinicalWorks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Tenant</label>
                <Input
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  placeholder="default"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium">FHIR Base URL *</label>
                <Input
                  value={fhirBaseUrl}
                  onChange={(e) => setFhirBaseUrl(e.target.value)}
                  placeholder="https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium">Issuer (SMART `iss`)</label>
                <Input
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="https://fhir.epic.com/interconnect-fhir-oauth"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Client ID *</label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="your-smart-client-id"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Client Secret</label>
                <Input
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="(optional / confidential clients)"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium">Scopes</label>
                <Input
                  value={scopes}
                  onChange={(e) => setScopes(e.target.value)}
                  placeholder="launch/patient openid fhirUser patient/*.read"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onCreate} disabled={!canCreate || isCreating}>
                <PlusCircle className="h-4 w-4 mr-1" />
                {isCreating ? 'Saving…' : 'Save Connection'}
              </Button>

              {error && <span className="text-[11px] text-red-600">{error}</span>}
              {!error && success && <span className="text-[11px] text-emerald-700">{success}</span>}
            </div>

            <div className="text-[11px] text-muted-foreground">
              This stores connection metadata in your app database. Next step is adding SMART authorization flow
              (standalone launch) per connection.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Existing Connections</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-xs text-muted-foreground">Loading…</div>
            ) : connections.length === 0 ? (
              <div className="text-xs text-muted-foreground">No connections yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>FHIR Base</TableHead>
                    <TableHead>Issuer</TableHead>
                    <TableHead>Client ID</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {c.tenant.slug}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className="text-[10px]">
                          {c.vendor === 'EPIC' ? 'Epic' : 'eClinicalWorks'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.connected ? (
                          <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-800">
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Not connected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Button
                          size="sm"
                          variant={c.connected ? 'outline' : 'default'}
                          onClick={() => {
                            window.location.href = `/api/ehr/authorize?connectionId=${encodeURIComponent(c.id)}`
                          }}
                        >
                          {c.connected ? 'Reconnect' : 'Connect'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs max-w-[260px] truncate" title={c.fhirBaseUrl}>
                        {c.fhirBaseUrl}
                      </TableCell>
                      <TableCell className="text-xs max-w-[240px] truncate" title={c.issuer || ''}>
                        {c.issuer || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate" title={c.clientId}>
                        {c.clientId}
                      </TableCell>
                      <TableCell className="text-xs max-w-[220px] truncate" title={c.scopes || ''}>
                        {c.scopes || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(c.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
