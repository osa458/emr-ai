'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserCog, Search, Mail, Phone, RefreshCw, AlertCircle } from 'lucide-react'
import { useAllPractitioners } from '@/hooks/useFHIRData'
import type { Practitioner as FHIRPractitioner } from '@medplum/fhirtypes'

// Helper functions to extract display values from FHIR Practitioner
function getPractitionerName(practitioner: FHIRPractitioner): string {
  const name = practitioner.name?.[0]
  if (!name) return practitioner.id || 'Unknown'
  const parts = []
  if (name.prefix?.length) parts.push(name.prefix.join(' '))
  if (name.given?.length) parts.push(name.given.join(' '))
  if (name.family) parts.push(name.family)
  if (name.suffix?.length) parts.push(name.suffix.join(' '))
  return parts.join(' ') || name.text || practitioner.id || 'Unknown'
}

function getEmail(practitioner: FHIRPractitioner): string {
  const email = practitioner.telecom?.find(t => t.system === 'email')
  return email?.value || '—'
}

function getPhone(practitioner: FHIRPractitioner): string {
  const phone = practitioner.telecom?.find(t => t.system === 'phone')
  return phone?.value || '—'
}

function getIdentifier(practitioner: FHIRPractitioner, type: string): string {
  const identifier = practitioner.identifier?.find(i => 
    i.type?.coding?.some(c => c.code === type) || i.system?.includes(type.toLowerCase())
  )
  return identifier?.value || '—'
}

function getQualification(practitioner: FHIRPractitioner): string {
  const qual = practitioner.qualification?.[0]
  return qual?.code?.text || qual?.code?.coding?.[0]?.display || '—'
}

export default function PractitionersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPractitioner, setSelectedPractitioner] = useState<FHIRPractitioner | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch } = useAllPractitioners({
    name: searchTerm || undefined,
    _count: 100
  })

  const practitioners = data?.practitioners || []
  const total = data?.total || 0

  const handleView = (practitioner: FHIRPractitioner) => {
    setSelectedPractitioner(practitioner)
    setViewDialogOpen(true)
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border/50">
        <div className="flex items-center gap-2">
          <UserCog className="h-3 w-3 text-primary"/>
          <h1 className="text-xs font-semibold">Practitioners</h1>
          <span className="text-xs text-muted-foreground">
            ({isLoading ? '...' : `${practitioners.length} of ${total}`})
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search practitioners..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-9 h-9 input-sharp" 
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
          Clear filters
        </Button>
      </div>

      {isError && (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load practitioners: {(error as Error)?.message || 'Unknown error'}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="ml-auto">
            Retry
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="table-sharp">
          <thead className="sticky top-0 bg-background">
            <tr>
              <th>Name</th>
              <th>Qualification</th>
              <th>Contact</th>
              <th>NPI</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><Skeleton className="h-4 w-32" /></td>
                  <td><Skeleton className="h-4 w-24" /></td>
                  <td><Skeleton className="h-4 w-40" /></td>
                  <td><Skeleton className="h-4 w-24" /></td>
                  <td><Skeleton className="h-4 w-16" /></td>
                  <td><Skeleton className="h-4 w-12" /></td>
                </tr>
              ))
            ) : practitioners.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No practitioners match your search' : 'No practitioners found in Aidbox'}
                </td>
              </tr>
            ) : (
              practitioners.map((p: FHIRPractitioner) => (
                <tr key={p.id}>
                  <td className="font-medium">{getPractitionerName(p)}</td>
                  <td><span className="badge-status badge-info">{getQualification(p)}</span></td>
                  <td>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />{getEmail(p)}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />{getPhone(p)}
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{getIdentifier(p, 'NPI')}</td>
                  <td>
                    <span className={p.active !== false ? 'badge-status badge-success' : 'badge-status badge-error'}>
                      {p.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="action-link" onClick={() => handleView(p)}>View</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Practitioner Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPractitioner ? getPractitionerName(selectedPractitioner) : ''}</DialogTitle>
            <DialogDescription>{selectedPractitioner ? getQualification(selectedPractitioner) : ''}</DialogDescription>
          </DialogHeader>
          {selectedPractitioner && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="text-sm">{getEmail(selectedPractitioner)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="text-sm">{getPhone(selectedPractitioner)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">NPI</Label>
                  <p className="text-sm">{getIdentifier(selectedPractitioner, 'NPI')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <p className="text-sm capitalize">{selectedPractitioner.active !== false ? 'Active' : 'Inactive'}</p>
                </div>
                {selectedPractitioner.gender && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Gender</Label>
                    <p className="text-sm capitalize">{selectedPractitioner.gender}</p>
                  </div>
                )}
                {selectedPractitioner.birthDate && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Birth Date</Label>
                    <p className="text-sm">{selectedPractitioner.birthDate}</p>
                  </div>
                )}
              </div>
              {selectedPractitioner.address?.[0] && (
                <div>
                  <Label className="text-muted-foreground text-xs">Address</Label>
                  <p className="text-sm">
                    {selectedPractitioner.address[0].line?.join(', ')}<br />
                    {selectedPractitioner.address[0].city}, {selectedPractitioner.address[0].state} {selectedPractitioner.address[0].postalCode}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
