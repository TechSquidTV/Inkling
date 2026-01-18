'use client'

import * as React from 'react'
import {
  type ColumnDef,
  flexRender,
  useReactTable, // Kept for ReturnType
  type TableMeta,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DraggableRow } from '@/components/custom/data-table/draggable-row'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data?: TData[] // Optional/Ignored but kept for prop shape compatibility if needed
  enableSorting?: boolean
  enableRowSelection?: boolean
  meta?: TableMeta<TData>
  onReorder?: (newOrder: TData[]) => void
}

export function DataTable<TData, TValue>({
  table,
  columns,
  onReorder,
  handleDragEnd,
}: DataTableProps<TData, TValue> & {
  table: ReturnType<typeof useReactTable<TData>>
  handleDragEnd?: (event: DragEndEvent) => void
}) {
  // Dnd Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  // Data for SortableContext
  // The table instance holds the current data (in filtered/sorted state or core state)
  // For DnD we usually want the *current view* rows.
  const rows = table.getRowModel().rows
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => rows.map((row) => (row.original as { id: UniqueIdentifier }).id),
    [rows]
  )

  const TableContent = (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className="bg-muted/50 hover:bg-muted/75"
          >
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {onReorder ? (
          <SortableContext
            items={dataIds}
            strategy={verticalListSortingStrategy}
          >
            {table.getRowModel().rows?.length ? (
              table
                .getRowModel()
                .rows.map((row) => <DraggableRow key={row.id} row={row} />)
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </SortableContext>
        ) : (
          <>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </>
        )}
      </TableBody>
    </Table>
  )

  if (onReorder) {
    return (
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <div className="rounded-md border overflow-hidden">{TableContent}</div>
      </DndContext>
    )
  }

  return <div className="rounded-md border overflow-hidden">{TableContent}</div>
}
