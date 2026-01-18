import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type TableMeta,
} from '@tanstack/react-table'
import * as React from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { type DragEndEvent } from '@dnd-kit/core'

interface UseDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  enableSorting?: boolean
  enableRowSelection?: boolean
  meta?: TableMeta<TData>
  onReorder?: (newOrder: TData[]) => void
}

export function useDataTable<TData, TValue>({
  columns,
  data: initialData,
  enableRowSelection = true,
  meta,
  onReorder,
}: UseDataTableProps<TData, TValue>) {
  const [data, setData] = React.useState<TData[]>(initialData || [])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      ...meta,
      // If meta provided updateData, wrap it or pass it.
      // For Reorder:
      updateData: meta?.updateData ?? (() => {}),
    },
    getRowId: (row) =>
      (row as { id?: string | number }).id?.toString() ||
      (row as { uid?: string | number }).uid?.toString() ||
      JSON.stringify(row),
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!active || !over || active.id === over.id) return

    const dataIds = data.map((d) => (d as { id: string | number }).id)
    const oldIndex = dataIds.indexOf(active.id)
    const newIndex = dataIds.indexOf(over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newData = arrayMove(data, oldIndex, newIndex)
      setData(newData)
      onReorder?.(newData)
    }
  }

  return { table, data, setData, handleDragEnd }
}
