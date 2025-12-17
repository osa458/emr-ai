'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Stethoscope, Search, Clock, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react'
import { useAllEncounters } from '@/hooks/useFHIRData'
import type { Encounter as FHIREncounter } from '@medplum/fhirtypes'

// Helper to extract display values from FHIR Encounter
function getPatientName(encounter: FHIREncounter): string {
  return encounter.subject?.display || encounter.subject?.reference?.split('/')[1] || 'Unknown Patient'
}

function getPatientId(encounter: FHIREncounter): string | null {
  const ref = encounter.subject?.reference
  if (ref?.startsWith('Patient/')) {
    return ref.replace('Patient/', '')
  }
  return null
}

function getPractitionerName(encounter: FHIREncounter): string {
  const participant = encounter.participant?.find(p => 
    p.type?.some(t => t.coding?.some(c => c.code === 'ATND' || c.code === 'primary'))
  ) || encounter.participant?.[0]
  return participant?.individual?.display || participant?.individual?.reference?.split('/')[1] || '—'
}

function getEncounterType(encounter: FHIREncounter): string {
  return encounter.class?.display || encounter.class?.code || encounter.type?.[0]?.text || encounter.type?.[0]?.coding?.[0]?.display || '—'
}

function getEncounterReason(encounter: FHIREncounter): string {
  return encounter.reasonCode?.[0]?.text || 
    encounter.reasonCode?.[0]?.coding?.[0]?.display || 
    encounter.type?.[0]?.text ||
    '—'
}

function getDiagnosis(encounter: FHIREncounter): string {
  return encounter.diagnosis?.[0]?.condition?.display ||
    encounter.diagnosis?.[0]?.condition?.reference?.split('/')[1] ||
    ''
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

function calculateDuration(encounter: FHIREncounter): string {
  if (!encounter.period?.start) return '—'
  const start = new Date(encounter.period.start)
  const end = encounter.period.end ? new Date(encounter.period.end) : new Date()
  const diffMs = end.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins} min`
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours} hr`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''}`
}

const statusConfig: Record<string, { label: string; class: string }> = {
  planned: { label: 'Planned', class: 'badge-status badge-info' },
  arrived: { label: 'Arrived', class: 'badge-status badge-info' },
  triaged: { label: 'Triaged', class: 'badge-status badge-info' },
  'in-progress': { label: 'In Progress', class: 'badge-status badge-warning' },
  onleave: { label: 'On Leave', class: 'badge-status badge-warning' },
  finished: { label: 'Finished', class: 'badge-status badge-success' },
  cancelled: { label: 'Cancelled', class: 'badge-status badge-error' },
  'entered-in-error': { label: 'Error', class: 'badge-status badge-error' },
  unknown: { label: 'Unknown', class: 'badge-status' },
}

export default function EncountersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedEncounter, setSelectedEncounter] = useState<FHIREncounter | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch } = useAllEncounters({ 
    status: statusFilter !== 'all' ? statusFilter : undefined,
    _count: 100 
  })
  
  const encounters = data?.encounters || []
  const total = data?.total || 0

  // Client-side search filter
  const filteredEncounters = encounters.filter(e => {
    if (!searchTerm) return true
    const patientName = getPatientName(e).toLowerCase()
    const practitioner = getPractitionerName(e).toLowerCase()
    const reason = getEncounterReason(e).toLowerCase()
    const search = searchTerm.toLowerCase()
    return patientName.includes(search) || practitioner.includes(search) || reason.includes(search)
  })

  const handleView = (enc: FHIREncounter) => {
    setSelectedEncounter(enc)
    setViewDialogOpen(true)
  }

  const getStatusConfig = (status?: string) => {
    return statusConfig[status || 'unknown'] || statusConfig.unknown
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-4 w-4 text-primary"/>
          <h1 className="text-sm font-semibold">Encounters</h1>
          <span className="text-xs text-muted-foreground">
            ({isLoading ? '...' : `${filteredEncounters.length} of ${total}`})
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search patient, practitioner..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-9 h-9 input-sharp" 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="arrived">Arrived</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="finished">Finished</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
          Clear filters
        </Button>
      </div>

      {isError && (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load encounters: {(error as Error)?.message || 'Unknown error'}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="ml-auto">
            Retry
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="table-sharp">
          <thead className="sticky top-0 bg-background">
            <tr>
              <th>Patient</th>
              <th>Practitioner</th>
              <th>Type</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><Skeleton className="h-4 w-24" /></td>
                  <td><Skeleton className="h-4 w-28" /></td>
                  <td><Skeleton className="h-4 w-20" /></td>
                  <td><Skeleton className="h-4 w-32" /></td>
                  <td><Skeleton className="h-4 w-16" /></td>
                  <td><Skeleton className="h-4 w-24" /></td>
                  <td><Skeleton className="h-4 w-20" /></td>
                  <td><Skeleton className="h-4 w-12" /></td>
                </tr>
              ))
            ) : filteredEncounters.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No encounters match your search' : 'No encounters found in Aidbox'}
                </td>
              </tr>
            ) : (
              filteredEncounters.map((enc) => {
                const patientId = getPatientId(enc)
                return (
                  <tr key={enc.id}>
                    <td className="font-medium">
                      {patientId ? (
                        <Link href={`/patients/${patientId}`} className="hover:underline text-primary">
                          {getPatientName(enc)}
                        </Link>
                      ) : (
                        getPatientName(enc)
                      )}
                    </td>
                    <td className="text-muted-foreground">{getPractitionerName(enc)}</td>
                    <td className="capitalize">{getEncounterType(enc)}</td>
                    <td className="text-muted-foreground">{formatDate(enc.period?.start)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {calculateDuration(enc)}
                      </span>
                    </td>
                    <td>{getEncounterReason(enc)}</td>
                    <td>
                      <span className={getStatusConfig(enc.status).class}>
                        {getStatusConfig(enc.status).label}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="action-link" onClick={() => handleView(enc)}>View</span>
                        {patientId && (
                          <Link href={`/patients/${patientId}`} className="action-link inline-flex items-center gap-1">
                            Chart <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View Encounter Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Encounter Details</DialogTitle>
            <DialogDescription>{selectedEncounter?.id}</DialogDescription>
          </DialogHeader>
          {selectedEncounter && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Patient</Label>
                  <p className="text-sm font-medium">{getPatientName(selectedEncounter)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Practitioner</Label>
                  <p className="text-sm">{getPractitionerName(selectedEncounter)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Type / Class</Label>
                  <p className="text-sm capitalize">{getEncounterType(selectedEncounter)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <span className={getStatusConfig(selectedEncounter.status).class}>
                    {getStatusConfig(selectedEncounter.status).label}
                  </span>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Start Date</Label>
                  <p className="text-sm">{formatDate(selectedEncounter.period?.start)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Duration</Label>
                  <p className="text-sm">{calculateDuration(selectedEncounter)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Reason</Label>
                <p className="text-sm">{getEncounterReason(selectedEncounter)}</p>
              </div>
              {getDiagnosis(selectedEncounter) && (
                <div>
                  <Label className="text-muted-foreground text-xs">Diagnosis</Label>
                  <p className="text-sm">{getDiagnosis(selectedEncounter)}</p>
                </div>
              )}
              {selectedEncounter.serviceProvider?.display && (
                <div>
                  <Label className="text-muted-foreground text-xs">Service Provider</Label>
                  <p className="text-sm">{selectedEncounter.serviceProvider.display}</p>
                </div>
              )}
              {selectedEncounter.location?.[0]?.location?.display && (
                <div>
                  <Label className="text-muted-foreground text-xs">Location</Label>
                  <p className="text-sm">{selectedEncounter.location[0].location.display}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            {selectedEncounter && getPatientId(selectedEncounter) && (
              <Link href={`/patients/${getPatientId(selectedEncounter)}`}>
                <Button>Open Patient Chart</Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
