'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Trash2, GripVertical, Save, Eye, Copy, 
  Settings, ChevronDown, ChevronRight, Sparkles, 
  Type, AlignLeft, List, ToggleLeft, Calendar, Hash
} from 'lucide-react'
import type { Questionnaire, QuestionnaireItem } from '@medplum/fhirtypes'

export interface QuestionnaireBuilderProps {
  questionnaire?: Questionnaire
  onSave?: (questionnaire: Questionnaire) => void
  onPreview?: (questionnaire: Questionnaire) => void
  className?: string
}

type ItemType = 'string' | 'text' | 'choice' | 'boolean' | 'date' | 'integer' | 'decimal' | 'group' | 'display'

const itemTypeConfig: Record<ItemType, { icon: React.ReactNode; label: string; description: string }> = {
  string: { icon: <Type className="h-4 w-4" />, label: 'Short Text', description: 'Single line text input' },
  text: { icon: <AlignLeft className="h-4 w-4" />, label: 'Long Text', description: 'Multi-line text area' },
  choice: { icon: <List className="h-4 w-4" />, label: 'Choice', description: 'Single or multiple choice' },
  boolean: { icon: <ToggleLeft className="h-4 w-4" />, label: 'Yes/No', description: 'Boolean checkbox' },
  date: { icon: <Calendar className="h-4 w-4" />, label: 'Date', description: 'Date picker' },
  integer: { icon: <Hash className="h-4 w-4" />, label: 'Number', description: 'Whole number' },
  decimal: { icon: <Hash className="h-4 w-4" />, label: 'Decimal', description: 'Decimal number' },
  group: { icon: <ChevronRight className="h-4 w-4" />, label: 'Group', description: 'Group of items' },
  display: { icon: <Type className="h-4 w-4" />, label: 'Display Text', description: 'Read-only text' }
}

interface BuilderItem extends QuestionnaireItem {
  _id: string
  _expanded?: boolean
}

export function QuestionnaireBuilder({
  questionnaire: initialQuestionnaire,
  onSave,
  onPreview,
  className = ''
}: QuestionnaireBuilderProps) {
  const [title, setTitle] = useState(initialQuestionnaire?.title || 'New Questionnaire')
  const [description, setDescription] = useState(initialQuestionnaire?.description || '')
  const [status, setStatus] = useState<'draft' | 'active' | 'retired'>(
    (initialQuestionnaire?.status as any) || 'draft'
  )
  const [items, setItems] = useState<BuilderItem[]>(() => 
    (initialQuestionnaire?.item || []).map((item, i) => ({ ...item, _id: `item-${i}` }))
  )
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showItemPicker, setShowItemPicker] = useState(false)

  // Generate unique ID
  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Add new item
  const addItem = useCallback((type: ItemType, parentId?: string) => {
    const newItem: BuilderItem = {
      _id: generateId(),
      linkId: `q${items.length + 1}`,
      type,
      text: `New ${itemTypeConfig[type].label}`,
      required: false,
      _expanded: true
    }

    if (type === 'choice') {
      newItem.answerOption = [
        { valueString: 'Option 1' },
        { valueString: 'Option 2' },
        { valueString: 'Option 3' }
      ]
    }

    if (parentId) {
      setItems(prev => prev.map(item => {
        if (item._id === parentId) {
          return { ...item, item: [...(item.item || []), newItem] }
        }
        return item
      }))
    } else {
      setItems(prev => [...prev, newItem])
    }
    
    setSelectedItemId(newItem._id)
    setShowItemPicker(false)
  }, [items.length])

  // Update item
  const updateItem = useCallback((itemId: string, updates: Partial<BuilderItem>) => {
    setItems(prev => prev.map(item => 
      item._id === itemId ? { ...item, ...updates } : item
    ))
  }, [])

  // Delete item
  const deleteItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item._id !== itemId))
    if (selectedItemId === itemId) {
      setSelectedItemId(null)
    }
  }, [selectedItemId])

  // Move item
  const moveItem = useCallback((itemId: string, direction: 'up' | 'down') => {
    setItems(prev => {
      const index = prev.findIndex(item => item._id === itemId)
      if (index === -1) return prev
      if (direction === 'up' && index === 0) return prev
      if (direction === 'down' && index === prev.length - 1) return prev

      const newItems = [...prev]
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      ;[newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]]
      return newItems
    })
  }, [])

  // Build questionnaire object
  const buildQuestionnaire = (): Questionnaire => {
    const cleanItems = (items: BuilderItem[]): QuestionnaireItem[] => {
      return items.map(({ _id, _expanded, ...item }) => {
        if (item.item) {
          return { ...item, item: cleanItems(item.item as BuilderItem[]) }
        }
        return item
      })
    }

    return {
      resourceType: 'Questionnaire',
      id: initialQuestionnaire?.id,
      status,
      title,
      description,
      item: cleanItems(items)
    }
  }

  // Handle save
  const handleSave = () => {
    onSave?.(buildQuestionnaire())
  }

  // Handle preview
  const handlePreview = () => {
    onPreview?.(buildQuestionnaire())
  }

  // Selected item for editing
  const selectedItem = items.find(item => item._id === selectedItemId)

  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {/* Left panel - Item list */}
      <div className="col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 w-full"
                  placeholder="Questionnaire Title"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-sm text-muted-foreground bg-transparent border-0 focus:outline-none focus:ring-0 w-full mt-1"
                  placeholder="Description (optional)"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="retired">Retired</option>
                </select>
                <Button variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Items list */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedItemId(item._id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedItemId === item._id ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <span className="text-muted-foreground">
                      {itemTypeConfig[item.type as ItemType]?.icon}
                    </span>
                    <span className="flex-1 font-medium">{item.text}</span>
                    {item.required && <Badge variant="destructive" className="text-[10px]">Required</Badge>}
                    <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500"
                      onClick={(e) => { e.stopPropagation(); deleteItem(item._id) }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No items yet. Click &quot;Add Item&quot; to get started.
                </div>
              )}
            </div>

            {/* Add item button */}
            <div className="mt-4 relative">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowItemPicker(!showItemPicker)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
              
              {showItemPicker && (
                <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg p-2">
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(itemTypeConfig) as [ItemType, typeof itemTypeConfig[ItemType]][]).map(([type, config]) => (
                      <button
                        key={type}
                        onClick={() => addItem(type)}
                        className="flex flex-col items-center gap-1 p-3 rounded hover:bg-slate-100 text-center"
                      >
                        {config.icon}
                        <span className="text-xs font-medium">{config.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right panel - Item editor */}
      <div>
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Item Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItem ? (
              <div className="space-y-4">
                {/* Link ID */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Link ID</label>
                  <input
                    type="text"
                    value={selectedItem.linkId}
                    onChange={(e) => updateItem(selectedItem._id, { linkId: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded text-sm mt-1"
                  />
                </div>

                {/* Question text */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Question Text</label>
                  <input
                    type="text"
                    value={selectedItem.text || ''}
                    onChange={(e) => updateItem(selectedItem._id, { text: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded text-sm mt-1"
                  />
                </div>

                {/* Required */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={selectedItem.required || false}
                    onChange={(e) => updateItem(selectedItem._id, { required: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="required" className="text-sm">Required</label>
                </div>

                {/* Max length for text types */}
                {(selectedItem.type === 'string' || selectedItem.type === 'text') && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Max Length</label>
                    <input
                      type="number"
                      value={selectedItem.maxLength || ''}
                      onChange={(e) => updateItem(selectedItem._id, { maxLength: parseInt(e.target.value) || undefined })}
                      className="w-full px-2 py-1.5 border rounded text-sm mt-1"
                      placeholder="No limit"
                    />
                  </div>
                )}

                {/* Answer options for choice */}
                {selectedItem.type === 'choice' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Options</label>
                    <div className="space-y-2 mt-1">
                      {(selectedItem.answerOption || []).map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={opt.valueString || ''}
                            onChange={(e) => {
                              const newOptions = [...(selectedItem.answerOption || [])]
                              newOptions[i] = { valueString: e.target.value }
                              updateItem(selectedItem._id, { answerOption: newOptions })
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => {
                              const newOptions = (selectedItem.answerOption || []).filter((_, idx) => idx !== i)
                              updateItem(selectedItem._id, { answerOption: newOptions })
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          const newOptions = [...(selectedItem.answerOption || []), { valueString: `Option ${(selectedItem.answerOption?.length || 0) + 1}` }]
                          updateItem(selectedItem._id, { answerOption: newOptions })
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Option
                      </Button>
                    </div>
                  </div>
                )}

                {/* AI Suggestion */}
                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-purple-600">
                    <Sparkles className="h-4 w-4" />
                    AI: Suggest options
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Select an item to edit its properties
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
