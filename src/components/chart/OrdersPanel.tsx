'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Search,
  Package,
  Syringe,
  FlaskConical,
  ImageIcon,
  Stethoscope,
  Pill,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  Send,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Edit,
  History,
  Loader2,
} from 'lucide-react'
import type { MedicationRequest, ServiceRequest } from '@medplum/fhirtypes'
import { usePatientMedicationRequests, usePatientOrders } from '@/hooks/useFHIRData'
import { useOrderSets, fallbackOrderSets, fallbackSingleOrders, type OrderSet, type OrderSetItem, type SingleOrder } from '@/hooks/useOrderSets'

// Local types
interface PendingOrder {
  id: string
  name: string
  category: string
  source: 'single' | 'set'
  setName?: string
  status: 'pending' | 'submitted' | 'completed'
  addedAt: Date
}

interface OrdersPanelProps {
  patientId: string
}

export function OrdersPanel({ patientId }: OrdersPanelProps) {
  const [orderSearch, setOrderSearch] = useState('')
  const [activeOrderSet, setActiveOrderSet] = useState<string | null>(null)
  const [orderSetSelections, setOrderSetSelections] = useState<Record<string, Record<string, boolean>>>({})
  const [selectedSingleOrders, setSelectedSingleOrders] = useState<string[]>([])
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [submittedOrders, setSubmittedOrders] = useState<PendingOrder[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Labs', 'Medications']))

  // Fetch order sets from FHIR ActivityDefinitions
  const {
    data: fhirOrderSets,
    isLoading: orderSetsLoading
  } = useOrderSets()

  // Use FHIR order sets if available, otherwise fall back to hardcoded
  const orderSets = useMemo(() => {
    if (fhirOrderSets && fhirOrderSets.length > 0) {
      return fhirOrderSets
    }
    return fallbackOrderSets
  }, [fhirOrderSets])

  // Single orders (use fallback for now, could be fetched from FHIR Catalog in future)
  const singleOrders = fallbackSingleOrders

  // FHIR-backed active medication orders (MedicationRequest)
  const {
    data: medicationRequests,
    isLoading: medsLoading,
    isError: medsError,
  } = usePatientMedicationRequests(patientId)

  // FHIR-backed service request orders (labs, imaging, consults, etc.)
  const {
    data: serviceRequests,
    isLoading: ordersLoading,
    isError: ordersError,
  } = usePatientOrders(patientId)

  // Filter orders by search
  const filteredSingleOrders = orderSearch
    ? singleOrders.filter(o => o.name.toLowerCase().includes(orderSearch.toLowerCase()) || o.category.toLowerCase().includes(orderSearch.toLowerCase()))
    : singleOrders

  const filteredOrderSets = orderSearch
    ? orderSets.filter(s => s.name.toLowerCase().includes(orderSearch.toLowerCase()) || s.category.toLowerCase().includes(orderSearch.toLowerCase()))
    : orderSets

  // Order helpers
  const toggleSingleOrder = (orderId: string) => {
    setSelectedSingleOrders(prev =>
      prev.includes(orderId) ? prev.filter(o => o !== orderId) : [...prev, orderId]
    )
  }

  const openOrderSet = (setId: string) => {
    const orderSet = orderSets.find(s => s.id === setId)
    if (orderSet && !orderSetSelections[setId]) {
      const defaults: Record<string, boolean> = {}
      orderSet.items.forEach(item => { defaults[item.id] = item.selected })
      setOrderSetSelections(prev => ({ ...prev, [setId]: defaults }))
    }
    setActiveOrderSet(activeOrderSet === setId ? null : setId)
  }

  const toggleOrderSetItem = (setId: string, itemId: string) => {
    setOrderSetSelections(prev => ({
      ...prev,
      [setId]: { ...prev[setId], [itemId]: !prev[setId]?.[itemId] }
    }))
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const n = new Set(prev)
      n.has(category) ? n.delete(category) : n.add(category)
      return n
    })
  }

  const addToPending = () => {
    const newPending: PendingOrder[] = []

    // Add single orders
    selectedSingleOrders.forEach(orderId => {
      const order = singleOrders.find(o => o.id === orderId)
      if (order) {
        newPending.push({
          id: `${orderId}-${Date.now()}`,
          name: order.name,
          category: order.category,
          source: 'single',
          status: 'pending',
          addedAt: new Date()
        })
      }
    })

    // Add order set items
    Object.entries(orderSetSelections).forEach(([setId, items]) => {
      const orderSet = orderSets.find(s => s.id === setId)
      if (orderSet) {
        Object.entries(items).forEach(([itemId, selected]) => {
          if (selected) {
            const item = orderSet.items.find(i => i.id === itemId)
            if (item) {
              newPending.push({
                id: `${setId}-${itemId}-${Date.now()}`,
                name: item.name,
                category: orderSet.category,
                source: 'set',
                setName: orderSet.name,
                status: 'pending',
                addedAt: new Date()
              })
            }
          }
        })
      }
    })

    setPendingOrders(prev => [...prev, ...newPending])
    setSelectedSingleOrders([])
    setOrderSetSelections({})
    setActiveOrderSet(null)
  }

  const removePendingOrder = (orderId: string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== orderId))
  }

  const submitOrders = () => {
    const submitted = pendingOrders.map(o => ({ ...o, status: 'submitted' as const }))
    setSubmittedOrders(prev => [...submitted, ...prev])
    setPendingOrders([])
  }

  const orderCategories = ['Labs', 'Imaging', 'Medications', 'Consults', 'Procedures']
  const pendingCount = pendingOrders.length + selectedSingleOrders.length +
    Object.values(orderSetSelections).reduce((acc, items) => acc + Object.values(items).filter(Boolean).length, 0)

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {/* Left Panel - Order Selection */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Place Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
                placeholder="Search orders..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
              />
            </div>

            <Tabs defaultValue="sets" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="sets" className="flex-1">Order Sets</TabsTrigger>
                <TabsTrigger value="single" className="flex-1">Single Orders</TabsTrigger>
              </TabsList>

              {/* Order Sets Tab */}
              <TabsContent value="sets" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {filteredOrderSets.map(set => (
                    <button
                      key={set.id}
                      onClick={() => openOrderSet(set.id)}
                      className={`p-3 border rounded-lg text-left hover:bg-blue-50 transition-colors ${activeOrderSet === set.id ? 'bg-blue-100 border-blue-400' : ''
                        }`}
                    >
                      <div className="font-medium text-sm">{set.name}</div>
                      <div className="text-xs text-muted-foreground">{set.category}</div>
                    </button>
                  ))}
                </div>

                {/* Active Order Set Details */}
                {activeOrderSet && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{orderSets.find(s => s.id === activeOrderSet)?.name}</div>
                        <div className="text-xs text-muted-foreground">{orderSets.find(s => s.id === activeOrderSet)?.description}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveOrderSet(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {orderSets.find(s => s.id === activeOrderSet)?.items.map(item => (
                        <div key={item.id} className="flex items-start gap-2 bg-white rounded p-2">
                          <input
                            type="checkbox"
                            checked={orderSetSelections[activeOrderSet]?.[item.id] ?? item.selected}
                            onChange={() => toggleOrderSetItem(activeOrderSet, item.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="text-sm">{item.name}</div>
                            {item.details && <div className="text-xs text-muted-foreground">{item.details}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Single Orders Tab */}
              <TabsContent value="single" className="mt-4 space-y-3">
                {orderCategories.map(category => {
                  const categoryOrders = filteredSingleOrders.filter(o => o.category === category)
                  if (categoryOrders.length === 0) return null

                  const isExpanded = expandedCategories.has(category)
                  const selectedCount = categoryOrders.filter(o => selectedSingleOrders.includes(o.id)).length

                  return (
                    <div key={category} className="border rounded-lg">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          {category === 'Labs' && <FlaskConical className="h-4 w-4" />}
                          {category === 'Imaging' && <ImageIcon className="h-4 w-4" />}
                          {category === 'Medications' && <Pill className="h-4 w-4" />}
                          {category === 'Consults' && <Stethoscope className="h-4 w-4" />}
                          {category === 'Procedures' && <Syringe className="h-4 w-4" />}
                          <span className="font-medium text-sm">{category}</span>
                        </div>
                        {selectedCount > 0 && (
                          <Badge variant="default" className="text-xs">{selectedCount}</Badge>
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 flex flex-wrap gap-1">
                          {categoryOrders.map(order => (
                            <button
                              key={order.id}
                              onClick={() => toggleSingleOrder(order.id)}
                              className={`px-2 py-1 text-xs border rounded transition-colors ${selectedSingleOrders.includes(order.id)
                                ? 'bg-green-100 border-green-400 text-green-800'
                                : 'hover:bg-slate-50'
                                }`}
                            >
                              {selectedSingleOrders.includes(order.id) && <Check className="h-3 w-3 inline mr-1" />}
                              {order.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </TabsContent>
            </Tabs>

            {/* Add to Pending Button */}
            {pendingCount > 0 && (
              <Button onClick={addToPending} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add {pendingCount} to Pending Orders
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Pending, Submitted & Medication Orders */}
        <div className="w-80 space-y-4">
          {/* Pending Orders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Pending Orders
                {pendingOrders.length > 0 && (
                  <Badge variant="outline" className="ml-auto">{pendingOrders.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrders.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No pending orders
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded p-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{order.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.source === 'set' && order.setName ? `From: ${order.setName}` : order.category}
                        </div>
                      </div>
                      <button
                        onClick={() => removePendingOrder(order.id)}
                        className="p-1 hover:bg-amber-100 rounded"
                      >
                        <X className="h-4 w-4 text-amber-700" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {pendingOrders.length > 0 && (
                <Button onClick={submitOrders} className="w-full mt-3 bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4 mr-2" /> Submit Orders
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Submitted Orders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Recently Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submittedOrders.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4">
                  No orders submitted this session
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {submittedOrders.slice(0, 10).map(order => (
                    <div key={order.id} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded p-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{order.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.addedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Service Requests from FHIR (labs, imaging, consults) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading && (
                <div className="text-xs text-muted-foreground py-2">
                  Loading orders…
                </div>
              )}
              {ordersError && !ordersLoading && (
                <div className="text-xs text-red-600 flex items-center gap-1 py-2">
                  <AlertCircle className="h-3 w-3" />
                  Unable to load orders.
                </div>
              )}
              {!ordersLoading && !ordersError && (!serviceRequests || serviceRequests.length === 0) && (
                <div className="text-xs text-muted-foreground py-2">
                  No active orders found.
                </div>
              )}
              {!ordersLoading && !ordersError && serviceRequests && serviceRequests.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {serviceRequests.map((sr: ServiceRequest) => {
                    const name = sr.code?.text || sr.code?.coding?.[0]?.display || 'Order'
                    const priority = sr.priority || 'routine'
                    const authored = sr.authoredOn
                      ? new Date(sr.authoredOn).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : undefined
                    const requester = sr.requester?.display

                    return (
                      <div
                        key={sr.id}
                        className={`border rounded px-2 py-1.5 text-[11px] flex flex-col gap-0.5 ${priority === 'urgent' || priority === 'stat'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-slate-50 border-slate-200'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium truncate">{name}</span>
                          <Badge
                            variant={sr.status === 'active' ? 'default' : 'secondary'}
                            className={`text-[9px] ${priority === 'urgent' || priority === 'stat' ? 'bg-red-600' : ''}`}
                          >
                            {priority === 'urgent' || priority === 'stat' ? priority.toUpperCase() : sr.status || 'active'}
                          </Badge>
                        </div>
                        {requester && (
                          <div className="text-[10px] text-muted-foreground">
                            Ordered by: {requester}
                          </div>
                        )}
                        {authored && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{authored}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active medication orders from FHIR (MedicationRequest) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Pill className="h-4 w-4" />
                Medication Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medsLoading && (
                <div className="text-xs text-muted-foreground py-2">
                  Loading medication orders…
                </div>
              )}
              {medsError && !medsLoading && (
                <div className="text-xs text-red-600 flex items-center gap-1 py-2">
                  <AlertCircle className="h-3 w-3" />
                  Unable to load active medication orders.
                </div>
              )}
              {!medsLoading && !medsError && (!medicationRequests || medicationRequests.length === 0) && (
                <div className="text-xs text-muted-foreground py-2">
                  No active medication orders found for this patient.
                </div>
              )}
              {!medsLoading && !medsError && medicationRequests && medicationRequests.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {medicationRequests.map((mr: MedicationRequest) => {
                    const name =
                      mr.medicationCodeableConcept?.text ||
                      mr.medicationCodeableConcept?.coding?.[0]?.display ||
                      'Medication order'
                    const authored = mr.authoredOn
                      ? new Date(mr.authoredOn).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : undefined
                    const route =
                      mr.dosageInstruction?.[0]?.route?.text ||
                      mr.dosageInstruction?.[0]?.route?.coding?.[0]?.display
                    const freq =
                      mr.dosageInstruction?.[0]?.timing?.code?.text ||
                      mr.dosageInstruction?.[0]?.timing?.repeat?.frequency?.toString()

                    return (
                      <div
                        key={mr.id}
                        className="border border-slate-200 rounded px-2 py-1.5 text-[11px] flex flex-col gap-0.5 bg-slate-50"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium truncate">{name}</span>
                          <Badge
                            variant={mr.status === 'active' ? 'default' : 'secondary'}
                            className="text-[9px]"
                          >
                            {mr.status || 'active'}
                          </Badge>
                        </div>
                        {(route || freq) && (
                          <div className="text-[10px] text-muted-foreground">
                            {route && <span>{route}</span>}
                            {route && freq && <span> • </span>}
                            {freq && <span>{freq}</span>}
                          </div>
                        )}
                        {authored && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{authored}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
