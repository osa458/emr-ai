'use client'

import { useState } from 'react'
import { Pill, DownloadCloud } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CatalogItem {
  id: string
  name: string
  ndcCode: string
  rxCui?: string | null
  form?: string | null
  strength?: string | null
  active: boolean
}

export default function MedicationsAdminPage() {
  const [ndc, setNdc] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [lastImported, setLastImported] = useState<CatalogItem | null>(null)

  const handleImport = async () => {
    if (!ndc) return
    setIsImporting(true)
    setStatus(null)
    setLastImported(null)
    try {
      const res = await fetch('/api/medications/catalog/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ndcCode: ndc }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setLastImported(json.data as CatalogItem)
        setStatus('success')
      } else {
        setStatus(json.error || 'Unable to import medication from Aidbox')
      }
    } catch (err: any) {
      setStatus(err?.message || 'Unexpected error during import')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Pill className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold">Medications Admin</h1>
          <span className="text-xs text-muted-foreground">
            Import catalog entries from Aidbox Medication
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs">
        <p className="text-muted-foreground">
          This tool looks up a FHIR <code>Medication</code> in Aidbox by NDC and creates or updates
          a matching entry in the local <code>MedicationCatalog</code>. Inventory entries can then
          reference this catalog so your warehouse is tied directly to the FDA / Aidbox drug list.
        </p>

        <div className="border rounded-lg p-4 space-y-3 max-w-lg">
          <div className="space-y-1">
            <label htmlFor="ndc" className="text-xs font-medium">
              NDC code
            </label>
            <Input
              id="ndc"
              placeholder="e.g. 0002-8215-01"
              value={ndc}
              onChange={(e) => setNdc(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!ndc || isImporting}
            >
              <DownloadCloud className="h-4 w-4 mr-1" />
              {isImporting ? 'Importing…' : 'Import from Aidbox'}
            </Button>
            {status && status !== 'success' && (
              <span className="text-[11px] text-red-600">{status}</span>
            )}
          </div>

          {lastImported && (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-800">
                  Imported
                </Badge>
                <span className="font-medium text-xs truncate">
                  {lastImported.name}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                NDC: {lastImported.ndcCode}
                {lastImported.form && ` • ${lastImported.form}`}
                {lastImported.strength && ` • ${lastImported.strength}`}
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Tip: after importing catalog entries here, you can manage stock levels per location on the{' '}
          <code>Medications</code> page (inventory view) and still search/order medications from the
          full Aidbox list in the ordering UI.
        </p>
      </div>
    </div>
  )
}



