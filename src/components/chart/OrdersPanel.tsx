'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import type { MedicationRequest } from '@medplum/fhirtypes'
import { usePatientMedicationRequests } from '@/hooks/useFHIRData'

// Types
interface OrderSetItem {
  id: string
  name: string
  selected: boolean
  details?: string
}

interface OrderSet {
  id: string
  name: string
  category: string
  description: string
  items: OrderSetItem[]
}

interface SingleOrder {
  id: string
  name: string
  category: string
  details?: string
}

interface PendingOrder {
  id: string
  name: string
  category: string
  source: 'single' | 'set'
  setName?: string
  status: 'pending' | 'submitted' | 'completed'
  addedAt: Date
}

// Order Sets Data
const orderSets: OrderSet[] = [
  {
    id: 'admission',
    name: 'Admission Order Set',
    category: 'General',
    description: 'Standard admission orders',
    items: [
      { id: 'admit', name: 'Admit to Medicine', selected: true },
      { id: 'attending', name: 'Attending: ***', selected: true },
      { id: 'diagnosis', name: 'Diagnosis: ***', selected: true },
      { id: 'condition', name: 'Condition: Stable', selected: true },
      { id: 'code', name: 'Code Status: Full Code', selected: true },
      { id: 'diet', name: 'Diet: Cardiac', selected: true },
      { id: 'activity', name: 'Activity: Up ad lib', selected: true },
      { id: 'nursing', name: 'Nursing: Vitals q4h', selected: true },
      { id: 'ivf', name: 'IVF: Saline lock', selected: true },
      { id: 'dvt', name: 'DVT ppx: Heparin 5000u SC TID', selected: true },
      { id: 'labs', name: 'Labs: CBC, CMP in AM', selected: true },
    ]
  },
  {
    id: 'diabetes',
    name: 'Diabetes Management',
    category: 'Endocrine',
    description: 'Insulin and glucose management',
    items: [
      { id: 'fsbs', name: 'Fingerstick glucose AC and HS', selected: true },
      { id: 'sliding', name: 'Insulin sliding scale (moderate)', selected: true, details: 'Lispro: 150-200: 2u, 201-250: 4u, 251-300: 6u, 301-350: 8u, >350: 10u + call MD' },
      { id: 'basal', name: 'Basal insulin: Glargine *** units qHS', selected: false },
      { id: 'meal', name: 'Mealtime insulin: Lispro *** units AC', selected: false },
      { id: 'hypogly', name: 'Hypoglycemia protocol', selected: true },
      { id: 'a1c', name: 'HbA1c if not done in 3 months', selected: true },
    ]
  },
  {
    id: 'chf',
    name: 'CHF / Heart Failure',
    category: 'Cardiology',
    description: 'Heart failure management orders',
    items: [
      { id: 'weight', name: 'Daily weights', selected: true },
      { id: 'io', name: 'Strict I/O', selected: true },
      { id: 'fluid', name: 'Fluid restriction: 1.5L/day', selected: true },
      { id: 'sodium', name: 'Low sodium diet (<2g)', selected: true },
      { id: 'lasix', name: 'Furosemide 40mg IV BID', selected: true },
      { id: 'bnp', name: 'BNP daily x 3 days', selected: true },
      { id: 'cmp', name: 'BMP daily', selected: true },
      { id: 'tele', name: 'Telemetry', selected: true },
      { id: 'o2', name: 'O2 to maintain SpO2 > 92%', selected: true },
    ]
  },
  {
    id: 'transfusion',
    name: 'Blood Transfusion',
    category: 'Hematology',
    description: 'PRBC transfusion orders',
    items: [
      { id: 'type', name: 'Type and Screen', selected: true },
      { id: 'prbc', name: 'Transfuse 1 unit PRBC', selected: true },
      { id: 'premeds', name: 'Premedication: Tylenol 650mg PO', selected: false },
      { id: 'lasix_post', name: 'Furosemide 20mg IV after transfusion', selected: false, details: 'For patients at risk of volume overload' },
      { id: 'vitals', name: 'Vitals q15min x 4, then q30min x 2', selected: true },
      { id: 'post_hgb', name: 'Post-transfusion Hgb in 1 hour', selected: true },
    ]
  },
  {
    id: 'ventilator',
    name: 'Ventilator / Intubation',
    category: 'Critical Care',
    description: 'Mechanical ventilation orders',
    items: [
      { id: 'mode', name: 'Mode: AC/VC', selected: true },
      { id: 'vt', name: 'Tidal Volume: 6-8 mL/kg IBW', selected: true },
      { id: 'rr', name: 'Rate: 14', selected: true },
      { id: 'peep', name: 'PEEP: 5', selected: true },
      { id: 'fio2', name: 'FiO2: 100% initially, titrate to SpO2 > 92%', selected: true },
      { id: 'sedation', name: 'Sedation: Propofol gtt', selected: true },
      { id: 'analgesia', name: 'Analgesia: Fentanyl gtt', selected: true },
      { id: 'hob', name: 'HOB > 30 degrees', selected: true },
      { id: 'abg', name: 'ABG in 30 minutes', selected: true },
      { id: 'cxr', name: 'Portable CXR to confirm ETT placement', selected: true },
    ]
  },
  {
    id: 'lvad',
    name: 'LVAD Management',
    category: 'Critical Care',
    description: 'Left ventricular assist device orders',
    items: [
      { id: 'params', name: 'LVAD parameters q4h: Speed, Flow, PI, Power', selected: true },
      { id: 'driveline', name: 'Driveline site care daily', selected: true },
      { id: 'anticoag', name: 'Warfarin for INR goal 2-3', selected: true },
      { id: 'aspirin', name: 'Aspirin 325mg daily', selected: true },
      { id: 'bp', name: 'MAP goal 70-80 mmHg', selected: true },
      { id: 'echo', name: 'Weekly ramp study/echo', selected: false },
      { id: 'labs', name: 'INR, LDH, plasma-free Hgb weekly', selected: true },
    ]
  },
  {
    id: 'ecmo',
    name: 'ECMO Management',
    category: 'Critical Care',
    description: 'Extracorporeal membrane oxygenation',
    items: [
      { id: 'params', name: 'ECMO parameters q1h: Flow, RPM, Sweep', selected: true },
      { id: 'anticoag', name: 'Heparin gtt for PTT 60-80', selected: true },
      { id: 'fibrinogen', name: 'Maintain fibrinogen > 200', selected: true },
      { id: 'hgb', name: 'Maintain Hgb > 8', selected: true },
      { id: 'platelets', name: 'Maintain platelets > 80k', selected: true },
      { id: 'cannula', name: 'Cannula site checks q4h', selected: true },
      { id: 'neuro', name: 'Neuro checks q2h', selected: true },
      { id: 'daily_labs', name: 'Daily: CBC, CMP, LDH, fibrinogen, D-dimer', selected: true },
    ]
  },
  {
    id: 'sepsis',
    name: 'Sepsis Bundle',
    category: 'Infectious Disease',
    description: 'Sepsis 3-hour and 6-hour bundles',
    items: [
      { id: 'lactate', name: 'Lactate level STAT', selected: true },
      { id: 'cultures', name: 'Blood cultures x 2 before antibiotics', selected: true },
      { id: 'abx', name: 'Broad-spectrum antibiotics within 1 hour', selected: true, details: 'Vancomycin + Zosyn (or per local antibiogram)' },
      { id: 'fluid', name: '30 mL/kg crystalloid for hypotension or lactate ≥ 4', selected: true },
      { id: 'pressors', name: 'Vasopressors if fluid-refractory hypotension', selected: false, details: 'Norepinephrine first-line' },
      { id: 'repeat_lactate', name: 'Repeat lactate if initial > 2', selected: true },
      { id: 'procalc', name: 'Procalcitonin', selected: true },
    ]
  },
]

// Single Orders Data
const singleOrders: SingleOrder[] = [
  // Labs
  { id: 'cbc', name: 'CBC with Differential', category: 'Labs' },
  { id: 'cmp', name: 'Comprehensive Metabolic Panel', category: 'Labs' },
  { id: 'bmp', name: 'Basic Metabolic Panel', category: 'Labs' },
  { id: 'lfts', name: 'Liver Function Tests', category: 'Labs' },
  { id: 'lipid', name: 'Lipid Panel', category: 'Labs' },
  { id: 'tsh', name: 'TSH', category: 'Labs' },
  { id: 'hba1c', name: 'Hemoglobin A1c', category: 'Labs' },
  { id: 'bnp', name: 'BNP', category: 'Labs' },
  { id: 'trop', name: 'Troponin', category: 'Labs' },
  { id: 'pt_inr', name: 'PT/INR', category: 'Labs' },
  { id: 'ptt', name: 'PTT', category: 'Labs' },
  { id: 'ua', name: 'Urinalysis', category: 'Labs' },
  { id: 'ucx', name: 'Urine Culture', category: 'Labs' },
  { id: 'bcx', name: 'Blood Cultures x 2', category: 'Labs' },
  { id: 'abg', name: 'Arterial Blood Gas', category: 'Labs' },
  { id: 'lactate', name: 'Lactate', category: 'Labs' },
  { id: 'procalc', name: 'Procalcitonin', category: 'Labs' },
  { id: 'mg', name: 'Magnesium', category: 'Labs' },
  { id: 'phos', name: 'Phosphorus', category: 'Labs' },
  // Imaging
  { id: 'cxr', name: 'Chest X-Ray', category: 'Imaging' },
  { id: 'ct_head', name: 'CT Head without contrast', category: 'Imaging' },
  { id: 'ct_chest', name: 'CT Chest with contrast', category: 'Imaging' },
  { id: 'ct_abd', name: 'CT Abdomen/Pelvis with contrast', category: 'Imaging' },
  { id: 'cta_pe', name: 'CTA Chest for PE', category: 'Imaging' },
  { id: 'echo', name: 'Echocardiogram', category: 'Imaging' },
  { id: 'us_abd', name: 'Ultrasound Abdomen', category: 'Imaging' },
  { id: 'us_doppler', name: 'Lower Extremity Doppler', category: 'Imaging' },
  // Medications
  { id: 'ivf_ns', name: 'Normal Saline 1L IV', category: 'Medications' },
  { id: 'ivf_lr', name: 'Lactated Ringers 1L IV', category: 'Medications' },
  { id: 'lasix_iv', name: 'Furosemide 40mg IV', category: 'Medications' },
  { id: 'lasix_po', name: 'Furosemide 40mg PO', category: 'Medications' },
  { id: 'tylenol', name: 'Acetaminophen 650mg PO PRN', category: 'Medications' },
  { id: 'morphine', name: 'Morphine 2mg IV PRN', category: 'Medications' },
  { id: 'zofran', name: 'Ondansetron 4mg IV PRN', category: 'Medications' },
  { id: 'protonix', name: 'Pantoprazole 40mg IV daily', category: 'Medications' },
  { id: 'heparin_ppx', name: 'Heparin 5000u SC TID', category: 'Medications' },
  { id: 'lovenox', name: 'Enoxaparin 40mg SC daily', category: 'Medications' },
  // Consults
  { id: 'cards', name: 'Cardiology Consult', category: 'Consults' },
  { id: 'gi', name: 'GI Consult', category: 'Consults' },
  { id: 'neph', name: 'Nephrology Consult', category: 'Consults' },
  { id: 'pulm', name: 'Pulmonology Consult', category: 'Consults' },
  { id: 'id', name: 'Infectious Disease Consult', category: 'Consults' },
  { id: 'surgery', name: 'Surgery Consult', category: 'Consults' },
  { id: 'palliative', name: 'Palliative Care Consult', category: 'Consults' },
  { id: 'pt', name: 'Physical Therapy', category: 'Consults' },
  { id: 'ot', name: 'Occupational Therapy', category: 'Consults' },
  { id: 'sw', name: 'Social Work', category: 'Consults' },
  // Procedures
  { id: 'foley', name: 'Foley Catheter', category: 'Procedures' },
  { id: 'ng', name: 'NG Tube Placement', category: 'Procedures' },
  { id: 'central', name: 'Central Line Placement', category: 'Procedures' },
  { id: 'art_line', name: 'Arterial Line Placement', category: 'Procedures' },
  { id: 'lp', name: 'Lumbar Puncture', category: 'Procedures' },
  { id: 'thoracentesis', name: 'Thoracentesis', category: 'Procedures' },
  { id: 'paracentesis', name: 'Paracentesis', category: 'Procedures' },
]

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

  // FHIR-backed active medication orders (MedicationRequest)
  const {
    data: medicationRequests,
    isLoading: medsLoading,
    isError: medsError,
  } = usePatientMedicationRequests(patientId)
  
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
                      className={`p-3 border rounded-lg text-left hover:bg-blue-50 transition-colors ${
                        activeOrderSet === set.id ? 'bg-blue-100 border-blue-400' : ''
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
                              className={`px-2 py-1 text-xs border rounded transition-colors ${
                                selectedSingleOrders.includes(order.id)
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
