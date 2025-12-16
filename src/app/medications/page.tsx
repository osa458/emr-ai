'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Pill, Package, AlertTriangle, Plus, ArrowDownUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface MedicationCatalogItem {
  id: string
  name: string
  ndcCode: string
  rxCui?: string | null
  form?: string | null
  strength?: string | null
  active: boolean
}

interface MedicationInventoryItem {
  id: string
  location: string
  lotNumber?: string | null
  expiresAt?: string | null
  quantityOnHand: number
  reorderLevel: number
  catalog: MedicationCatalogItem
}

export default function MedicationsPage() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState<MedicationInventoryItem[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MedicationInventoryItem | null>(null)
  const [quantityDelta, setQuantityDelta] = useState<number>(0)
  const [adjustReason, setAdjustReason] = useState<string>('')

  const loadInventory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/medications/inventory?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        const data: MedicationInventoryItem[] = json.data
        setInventory(data)
        const locs = Array.from(new Set(data.map((i) => i.location))).sort()
        setLocations(locs)
      }
    } catch (err) {
      console.error('Failed to load medication inventory', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredInventory =
    locationFilter === 'all'
      ? inventory
      : inventory.filter((item) => item.location === locationFilter)

  const lowStockItems = filteredInventory.filter(
    (item) => item.reorderLevel > 0 && item.quantityOnHand <= item.reorderLevel
  )

  const handleOpenAdjust = (item: MedicationInventoryItem) => {
    setSelectedItem(item)
    setQuantityDelta(0)
    setAdjustReason('')
    setAdjustDialogOpen(true)
  }

  const handleSubmitAdjust = async () => {
    if (!selectedItem || !quantityDelta) {
      setAdjustDialogOpen(false)
      return
    }

    try {
      const res = await fetch('/api/medications/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedItem.id,
          quantityDelta,
          reason: adjustReason || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setAdjustDialogOpen(false)
        void loadInventory()
      } else {
        console.error('Failed to adjust inventory', json.error)
      }
    } catch (err) {
      console.error('Failed to adjust inventory', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Pill className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold">Medications</h1>
          <span className="text-xs text-muted-foreground">
            ({filteredInventory.length} inventory entries)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name or NDC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void loadInventory()
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters / summary */}
      <div className="flex items-center justify-between px-4 py-2 gap-3 text-xs border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Location:</span>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-7 rounded border border-border bg-background px-2 text-xs"
          >
            <option value="all">All</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          {loading && <span className="text-muted-foreground">Loading…</span>}
        </div>
        <div className="flex items-center gap-2">
          {lowStockItems.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 text-amber-800 border-amber-300">
              <AlertTriangle className="h-3 w-3" />
              Low stock: {lowStockItems.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medication</TableHead>
              <TableHead>NDC</TableHead>
              <TableHead>Form / Strength</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Lot / Expiry</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
              <TableHead className="text-right">Reorder</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-xs text-muted-foreground">
                  No medication inventory records found. Inventory will appear here after you create
                  stock entries via the backend or future pharmacy tools.
                </TableCell>
              </TableRow>
            )}
            {filteredInventory.map((item) => {
              const isLow =
                item.reorderLevel > 0 && item.quantityOnHand <= item.reorderLevel
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">{item.catalog.name}</span>
                      {item.catalog.rxCui && (
                        <span className="text-[10px] text-muted-foreground">
                          RxCUI: {item.catalog.rxCui}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[11px]">
                    {item.catalog.ndcCode}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.catalog.form || '—'}
                    {item.catalog.strength && (
                      <span className="text-muted-foreground"> • {item.catalog.strength}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      {item.location}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.lotNumber && (
                      <div className="text-[11px]">Lot: {item.lotNumber}</div>
                    )}
                    {item.expiresAt && (
                      <div className="text-[11px] text-muted-foreground">
                        Expires:{' '}
                        {new Date(item.expiresAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                    {!item.lotNumber && !item.expiresAt && <span>—</span>}
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium">
                    {item.quantityOnHand}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {item.reorderLevel || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleOpenAdjust(item)}
                    >
                      <ArrowDownUp className="h-3 w-3" />
                    </Button>
                    {isLow && (
                      <div className="mt-1 flex justify-end">
                        <Badge
                          variant="outline"
                          className="text-[9px] border-amber-300 text-amber-800"
                        >
                          Low
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Adjust inventory dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogDescription className="text-xs">
              Use a positive number to receive stock, or a negative number to record a dispense or
              correction.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="text-xs">
                <div className="font-medium">{selectedItem.catalog.name}</div>
                <div className="text-muted-foreground">
                  {selectedItem.catalog.ndcCode} • {selectedItem.location}
                </div>
                <div className="mt-1 text-muted-foreground">
                  Current on hand: {selectedItem.quantityOnHand}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Quantity change</Label>
                <Input
                  type="number"
                  value={quantityDelta || ''}
                  onChange={(e) => setQuantityDelta(parseInt(e.target.value || '0', 10) || 0)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Reason (optional)</Label>
                <Input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received shipment, dispensed for inpatient meds, correction"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAdjustDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSubmitAdjust} disabled={!quantityDelta}>
              Save adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


