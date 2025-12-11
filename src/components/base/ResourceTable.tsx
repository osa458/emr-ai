'use client'

import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Resource } from '@medplum/fhirtypes'

// Column definition
export interface ColumnDef<T extends Resource> {
  id: string
  header: string
  accessor: keyof T | ((row: T) => any)
  cell?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

// Table actions
export interface RowAction<T extends Resource> {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: (row: T) => void
  variant?: 'default' | 'destructive'
  condition?: (row: T) => boolean
}

export interface ResourceTableProps<T extends Resource> {
  data: T[]
  columns: ColumnDef<T>[]
  actions?: RowAction<T>[]
  onRowClick?: (row: T) => void
  isLoading?: boolean
  emptyMessage?: string
  // Pagination
  pageSize?: number
  totalCount?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  // Sorting
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (field: string, direction: 'asc' | 'desc') => void
  // Selection
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  // Styling
  className?: string
  compact?: boolean
}

export function ResourceTable<T extends Resource>({
  data,
  columns,
  actions = [],
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  pageSize = 10,
  totalCount,
  currentPage = 1,
  onPageChange,
  sortField,
  sortDirection = 'asc',
  onSort,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  className = '',
  compact = false
}: ResourceTableProps<T>) {
  const [localSort, setLocalSort] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null)

  // Get cell value
  const getCellValue = (row: T, column: ColumnDef<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row)
    }
    return row[column.accessor]
  }

  // Handle sorting
  const handleSort = (columnId: string) => {
    const column = columns.find(c => c.id === columnId)
    if (!column?.sortable) return

    const newDirection = sortField === columnId && sortDirection === 'asc' ? 'desc' : 'asc'
    
    if (onSort) {
      onSort(columnId, newDirection)
    } else {
      setLocalSort({ field: columnId, direction: newDirection })
    }
  }

  // Apply local sorting if no external sort handler
  const sortedData = useMemo(() => {
    if (!localSort || onSort) return data
    
    const column = columns.find(c => c.id === localSort.field)
    if (!column) return data

    // Inline getCellValue to avoid dependency warning
    const getVal = (row: T, col: ColumnDef<T>) => {
      if (typeof col.accessor === 'function') {
        return col.accessor(row)
      }
      return row[col.accessor]
    }

    return [...data].sort((a, b) => {
      const aVal = getVal(a, column)
      const bVal = getVal(b, column)
      
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      const comparison = aVal < bVal ? -1 : 1
      return localSort.direction === 'asc' ? comparison : -comparison
    })
  }, [data, localSort, columns, onSort])

  // Get active sort state
  const activeSortField = sortField || localSort?.field
  const activeSortDirection = sortField ? sortDirection : localSort?.direction

  // Handle row selection
  const handleSelectAll = () => {
    if (!onSelectionChange) return
    if (selectedIds.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map(row => row.id || '').filter(Boolean))
    }
  }

  const handleSelectRow = (rowId: string) => {
    if (!onSelectionChange) return
    if (selectedIds.includes(rowId)) {
      onSelectionChange(selectedIds.filter(id => id !== rowId))
    } else {
      onSelectionChange([...selectedIds, rowId])
    }
  }

  // Pagination
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : Math.ceil(data.length / pageSize)
  const showPagination = onPageChange || data.length > pageSize

  // Render cell content
  const renderCell = (row: T, column: ColumnDef<T>) => {
    const value = getCellValue(row, column)
    
    if (column.cell) {
      return column.cell(value, row)
    }

    // Default rendering for common types
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>
    }
    if (typeof value === 'boolean') {
      return value ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>
    }
    if (value instanceof Date) {
      return value.toLocaleDateString()
    }
    if (typeof value === 'object') {
      // Handle FHIR types
      if ('display' in value) return value.display
      if ('text' in value) return value.text
      if ('value' in value) return value.value
      return JSON.stringify(value)
    }
    return String(value)
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.id}
                  className={`px-4 ${compact ? 'py-2' : 'py-3'} text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-slate-100' : ''
                  }`}
                  style={{ width: column.width, textAlign: column.align }}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && (
                      <span className="text-slate-400">
                        {activeSortField === column.id ? (
                          activeSortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="w-20 px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-slate-50'} ${
                    selectedIds.includes(row.id || '') ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="w-10 px-3 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id || '')}
                        onChange={() => handleSelectRow(row.id || '')}
                        className="rounded border-slate-300"
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td
                      key={column.id}
                      className={`px-4 ${compact ? 'py-2' : 'py-3'} text-sm`}
                      style={{ textAlign: column.align }}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {actions.filter(a => !a.condition || a.condition(row)).slice(0, 3).map(action => (
                          <Button
                            key={action.id}
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${action.variant === 'destructive' ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : ''}`}
                            onClick={() => action.onClick(row)}
                            title={action.label}
                          >
                            {action.icon || <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount || data.length)} of {totalCount || data.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Pre-built column definitions for common FHIR resources
export const patientColumns: ColumnDef<any>[] = [
  { id: 'name', header: 'Name', accessor: (row) => row.name?.[0]?.family ? `${row.name[0].given?.[0] || ''} ${row.name[0].family}` : 'Unknown', sortable: true },
  { id: 'birthDate', header: 'DOB', accessor: 'birthDate', sortable: true },
  { id: 'gender', header: 'Gender', accessor: 'gender', cell: (v) => <Badge variant="outline">{v}</Badge> },
  { id: 'identifier', header: 'MRN', accessor: (row) => row.identifier?.[0]?.value || '—' }
]

export const encounterColumns: ColumnDef<any>[] = [
  { id: 'status', header: 'Status', accessor: 'status', cell: (v) => {
    const colors: Record<string, string> = { 'in-progress': 'bg-green-100 text-green-800', 'finished': 'bg-slate-100', 'cancelled': 'bg-red-100 text-red-800' }
    return <Badge className={colors[v] || ''}>{v}</Badge>
  }, sortable: true },
  { id: 'class', header: 'Class', accessor: (row) => row.class?.display || row.class?.code },
  { id: 'type', header: 'Type', accessor: (row) => row.type?.[0]?.text || row.type?.[0]?.coding?.[0]?.display },
  { id: 'period', header: 'Date', accessor: (row) => row.period?.start ? new Date(row.period.start).toLocaleDateString() : '—', sortable: true }
]

export const appointmentColumns: ColumnDef<any>[] = [
  { id: 'status', header: 'Status', accessor: 'status', cell: (v) => {
    const colors: Record<string, string> = { 'booked': 'bg-blue-100 text-blue-800', 'fulfilled': 'bg-green-100 text-green-800', 'cancelled': 'bg-red-100 text-red-800', 'noshow': 'bg-amber-100 text-amber-800' }
    return <Badge className={colors[v] || ''}>{v}</Badge>
  }},
  { id: 'start', header: 'Date/Time', accessor: (row) => row.start ? new Date(row.start).toLocaleString() : '—', sortable: true },
  { id: 'serviceType', header: 'Service', accessor: (row) => row.serviceType?.[0]?.text || row.serviceType?.[0]?.coding?.[0]?.display },
  { id: 'description', header: 'Description', accessor: 'description' }
]

export const documentColumns: ColumnDef<any>[] = [
  { id: 'type', header: 'Type', accessor: (row) => row.type?.text || row.type?.coding?.[0]?.display },
  { id: 'status', header: 'Status', accessor: 'status', cell: (v) => <Badge variant={v === 'current' ? 'default' : 'secondary'}>{v}</Badge> },
  { id: 'date', header: 'Date', accessor: 'date', cell: (v) => v ? new Date(v).toLocaleDateString() : '—', sortable: true },
  { id: 'author', header: 'Author', accessor: (row) => row.author?.[0]?.display || '—' }
]

// Common actions
export const viewAction = <T extends Resource>(onClick: (row: T) => void): RowAction<T> => ({
  id: 'view',
  label: 'View',
  icon: <Eye className="h-4 w-4" />,
  onClick
})

export const editAction = <T extends Resource>(onClick: (row: T) => void): RowAction<T> => ({
  id: 'edit',
  label: 'Edit',
  icon: <Edit className="h-4 w-4" />,
  onClick
})

export const deleteAction = <T extends Resource>(onClick: (row: T) => void): RowAction<T> => ({
  id: 'delete',
  label: 'Delete',
  icon: <Trash2 className="h-4 w-4" />,
  onClick,
  variant: 'destructive'
})
