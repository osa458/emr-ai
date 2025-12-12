'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Activity,
  Heart,
  Clipboard,
  LogOut,
  Star,
  Flag,
  Folder,
  Bookmark,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronRight,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  PatientList,
  getPatientLists,
  createPatientList,
  updatePatientList,
  deletePatientList,
  LIST_COLORS,
  LIST_ICONS,
} from '@/lib/patientLists'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  'user-check': UserCheck,
  'user-plus': UserPlus,
  'alert-triangle': AlertTriangle,
  activity: Activity,
  heart: Heart,
  clipboard: Clipboard,
  'log-out': LogOut,
  star: Star,
  flag: Flag,
  folder: Folder,
  bookmark: Bookmark,
}

interface PatientListsSidebarProps {
  selectedListId: string | null
  onSelectList: (listId: string) => void
  patientCounts: Record<string, number>
}

export function PatientListsSidebar({
  selectedListId,
  onSelectList,
  patientCounts,
}: PatientListsSidebarProps) {
  const [lists, setLists] = useState<PatientList[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingList, setEditingList] = useState<PatientList | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  // New list form state
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [newListColor, setNewListColor] = useState(LIST_COLORS[0].value)
  const [newListIcon, setNewListIcon] = useState(LIST_ICONS[0])

  // Load lists on mount to avoid hydration mismatch
  useEffect(() => {
    setLists(getPatientLists())
    setMounted(true)
  }, [])

  const handleCreateList = () => {
    if (!newListName.trim()) return

    const newList = createPatientList({
      name: newListName.trim(),
      description: newListDescription.trim() || undefined,
      color: newListColor,
      icon: newListIcon,
      patientIds: [],
    })

    setLists([...lists, newList])
    setIsCreateOpen(false)
    resetForm()
  }

  const handleUpdateList = () => {
    if (!editingList || !newListName.trim()) return

    const updated = updatePatientList(editingList.id, {
      name: newListName.trim(),
      description: newListDescription.trim() || undefined,
      color: newListColor,
      icon: newListIcon,
    })

    if (updated) {
      setLists(lists.map((l) => (l.id === updated.id ? updated : l)))
    }

    setEditingList(null)
    resetForm()
  }

  const handleDeleteList = (listId: string) => {
    if (deletePatientList(listId)) {
      setLists(lists.filter((l) => l.id !== listId))
      if (selectedListId === listId) {
        onSelectList('all-patients')
      }
    }
  }

  const openEditDialog = (list: PatientList) => {
    setNewListName(list.name)
    setNewListDescription(list.description || '')
    setNewListColor(list.color)
    setNewListIcon(list.icon)
    setEditingList(list)
  }

  const resetForm = () => {
    setNewListName('')
    setNewListDescription('')
    setNewListColor(LIST_COLORS[0].value)
    setNewListIcon(LIST_ICONS[0])
  }

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const defaultLists = filteredLists.filter((l) => l.isDefault)
  const customLists = filteredLists.filter((l) => !l.isDefault)

  // Prevent hydration mismatch by not rendering lists until mounted
  if (!mounted) {
    return (
      <div className="w-64 bg-white border-r h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg mb-3">Patient Lists</h2>
          <div className="h-9 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-r h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-3">Patient Lists</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto">
        {/* Default Lists */}
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
            Default Lists
          </div>
          {defaultLists.map((list) => (
            <ListItem
              key={list.id}
              list={list}
              isSelected={selectedListId === list.id}
              count={list.id === 'all-patients' ? patientCounts['all'] : patientCounts[list.id] ?? list.patientIds.length}
              onSelect={() => onSelectList(list.id)}
              onEdit={() => openEditDialog(list)}
              onDelete={() => handleDeleteList(list.id)}
            />
          ))}
        </div>

        {/* Custom Lists */}
        <div className="p-2 border-t">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              My Lists
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {customLists.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              <p>No custom lists yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-1"
              >
                Create your first list
              </Button>
            </div>
          ) : (
            customLists.map((list) => (
              <ListItem
                key={list.id}
                list={list}
                isSelected={selectedListId === list.id}
                count={patientCounts[list.id] ?? list.patientIds.length}
                onSelect={() => onSelectList(list.id)}
                onEdit={() => openEditDialog(list)}
                onDelete={() => handleDeleteList(list.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingList}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingList(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingList ? 'Edit List' : 'Create New List'}
            </DialogTitle>
            <DialogDescription>
              {editingList
                ? 'Update your patient list settings'
                : 'Create a custom list to organize your patients'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., ICU Patients, Follow Up"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="Brief description of this list"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {LIST_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewListColor(color.value)}
                    className={cn(
                      'h-8 w-8 rounded-full transition-all',
                      newListColor === color.value && 'ring-2 ring-offset-2 ring-slate-400'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon</label>
              <div className="flex flex-wrap gap-2">
                {LIST_ICONS.map((iconName) => {
                  const Icon = iconMap[iconName] || Folder
                  return (
                    <button
                      key={iconName}
                      onClick={() => setNewListIcon(iconName)}
                      className={cn(
                        'h-9 w-9 rounded-md border flex items-center justify-center transition-all',
                        newListIcon === iconName
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview</label>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50">
                <div
                  className="h-8 w-8 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: newListColor }}
                >
                  {(() => {
                    const Icon = iconMap[newListIcon] || Folder
                    return <Icon className="h-4 w-4" />
                  })()}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {newListName || 'List Name'}
                  </div>
                  {newListDescription && (
                    <div className="text-xs text-muted-foreground">
                      {newListDescription}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false)
                setEditingList(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingList ? handleUpdateList : handleCreateList}
              disabled={!newListName.trim()}
            >
              {editingList ? 'Save Changes' : 'Create List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// List Item Component
function ListItem({
  list,
  isSelected,
  count,
  onSelect,
  onEdit,
  onDelete,
}: {
  list: PatientList
  isSelected: boolean
  count: number
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const Icon = iconMap[list.icon] || Folder

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors',
        isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'
      )}
      onClick={onSelect}
    >
      <div
        className="h-7 w-7 rounded-md flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: list.color }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{list.name}</div>
      </div>

      <Badge variant="secondary" className="text-xs h-5 px-1.5">
        {count}
      </Badge>

      {!list.isDefault && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

