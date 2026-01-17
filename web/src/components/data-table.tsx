import * as React from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
  IconCheck,
} from '@tabler/icons-react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowId: string, columnId: string, value: unknown) => void
  }
}
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerSeparator,
  DropDrawerTrigger,
  DropDrawerLabel,
  DropDrawerCheckboxItem,
} from '@/components/custom/drop-drawer'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/animate/tabs'

import { type DataTableItem } from '@/components/custom/data-table/schema'
import {
  DragHandle,
  DraggableRow,
} from '@/components/custom/data-table/draggable-row'
import { TableCellViewer } from '@/components/custom/data-table/table-cell-viewer'

const columns: ColumnDef<DataTableItem>[] = [
  {
    id: 'drag',
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'header',
    header: ({ table }) => {
      return (
        <div className="flex items-center gap-2">
          <span>Header</span>
          <Badge variant="secondary" className="bg-muted-foreground/20 px-1">
            {table.getFilteredRowModel().rows.length}
          </Badge>
        </div>
      )
    },
    cell: ({ row, table }) => (
      <TableCellViewer
        item={row.original}
        onUpdate={(columnId, value) => {
          table.options.meta?.updateData(row.id.toString(), columnId, value)
        }}
      />
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row, table }) => {
      const value = row.getValue('type') as string
      const updateType = (newValue: string) => {
        table.options.meta?.updateData(row.id.toString(), 'type', newValue)
        toast.success(`Updated type to ${newValue}`)
      }

      return (
        <DropDrawer>
          <DropDrawerTrigger asChild>
            <Button
              variant="outline"
              className="hover:bg-sidebar-accent h-8 w-fit px-2 font-normal"
            >
              {value}
              <IconChevronDown className="ml-1 size-3 opacity-50" />
            </Button>
          </DropDrawerTrigger>
          <DropDrawerContent className="w-64">
            <DropDrawerLabel>Update Type</DropDrawerLabel>
            {[
              'Table of Contents',
              'Executive Summary',
              'Technical Approach',
              'Design',
              'Capabilities',
              'Focus Documents',
              'Narrative',
              'Cover Page',
            ].map((type) => (
              <DropDrawerItem
                key={type}
                onSelect={() => updateType(type)}
                icon={value === type && <IconCheck className="size-4" />}
              >
                {type}
              </DropDrawerItem>
            ))}
          </DropDrawerContent>
        </DropDrawer>
      )
    },
  },

  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row, table }) => {
      const value = row.getValue('status') as string
      const updateStatus = (newValue: string) => {
        table.options.meta?.updateData(row.id.toString(), 'status', newValue)
        toast.success(`Updated status to ${newValue}`)
      }

      return (
        <DropDrawer>
          <DropDrawerTrigger asChild>
            <Button
              variant="outline"
              className="hover:bg-sidebar-accent h-8 w-fit px-2 font-normal"
            >
              {value}
              <IconChevronDown className="ml-1 size-3 opacity-50" />
            </Button>
          </DropDrawerTrigger>
          <DropDrawerContent className="w-48">
            <DropDrawerLabel>Update Status</DropDrawerLabel>
            {['Done', 'In Progress', 'Not Started'].map((status) => (
              <DropDrawerItem
                key={status}
                onSelect={() => updateStatus(status)}
                icon={value === status && <IconCheck className="size-4" />}
              >
                {status}
              </DropDrawerItem>
            ))}
          </DropDrawerContent>
        </DropDrawer>
      )
    },
  },
  {
    accessorKey: 'target',
    header: 'Target',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="font-normal">
          Jan 14
        </Badge>
        <span className="text-muted-foreground">{row.getValue('target')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'limit',
    header: 'Limit',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="font-normal italic">
          3
        </Badge>
        <span className="text-muted-foreground">{row.getValue('limit')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'reviewer',
    header: 'Reviewer',
    cell: ({ row, table }) => {
      const value = row.getValue('reviewer') as string
      const updateReviewer = (newValue: string) => {
        table.options.meta?.updateData(row.id.toString(), 'reviewer', newValue)
        toast.success(`Assigned to ${newValue}`)
      }

      return (
        <DropDrawer>
          <DropDrawerTrigger asChild>
            <Button
              variant="outline"
              className="hover:bg-sidebar-accent h-8 w-fit px-2 font-normal"
            >
              {value}
              <IconChevronDown className="ml-1 size-3 opacity-50" />
            </Button>
          </DropDrawerTrigger>
          <DropDrawerContent className="w-64">
            <DropDrawerLabel>Assign Reviewer</DropDrawerLabel>
            {['Eddie Lake', 'Jamik Tashpulatov', 'Emily Whalen'].map(
              (reviewer) => (
                <DropDrawerItem
                  key={reviewer}
                  onSelect={() => updateReviewer(reviewer)}
                  icon={value === reviewer && <IconCheck className="size-4" />}
                >
                  {reviewer}
                </DropDrawerItem>
              )
            )}
          </DropDrawerContent>
        </DropDrawer>
      )
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <DropDrawer>
          <DropDrawerTrigger asChild>
            <Button variant="ghost" className="size-8 p-0">
              <span className="sr-only">Open menu</span>
              <IconDotsVertical className="size-4" />
            </Button>
          </DropDrawerTrigger>
          <DropDrawerContent align="end">
            <DropDrawerLabel>Actions</DropDrawerLabel>
            <DropDrawerItem
              onSelect={() => navigator.clipboard.writeText(row.id)}
            >
              Copy row ID
            </DropDrawerItem>
            <DropDrawerSeparator />
            <DropDrawerItem>View customer</DropDrawerItem>
            <DropDrawerItem>View payment details</DropDrawerItem>
          </DropDrawerContent>
        </DropDrawer>
      )
    },
  },
]

export function DataTable({ data: initialData }: { data: DataTableItem[] }) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [view, setView] = React.useState('outline')
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      updateData: (rowId: string, columnId: string, value: unknown) => {
        setData((old) =>
          old.map((row) => {
            if (row.id.toString() === rowId) {
              return {
                ...row,
                [columnId]: value,
              }
            }
            return row
          })
        )
      },
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs value={view} onValueChange={setView} className="flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2 lg:px-6">
        <DropDrawer>
          <DropDrawerTrigger asChild>
            <Button variant="outline" size="sm" className="@4xl/main:hidden">
              <span className="capitalize">{view.replace('-', ' ')}</span>
              <IconChevronDown className="ml-2 size-4" />
            </Button>
          </DropDrawerTrigger>
          <DropDrawerContent className="w-56">
            <DropDrawerLabel>Select View</DropDrawerLabel>
            <DropDrawerItem
              onSelect={() => setView('outline')}
              icon={view === 'outline' && <IconCheck className="size-4" />}
            >
              Outline
            </DropDrawerItem>
            <DropDrawerItem
              onSelect={() => setView('past-performance')}
              icon={
                view === 'past-performance' && <IconCheck className="size-4" />
              }
            >
              Past Performance
            </DropDrawerItem>
            <DropDrawerItem
              onSelect={() => setView('key-personnel')}
              icon={
                view === 'key-personnel' && <IconCheck className="size-4" />
              }
            >
              Key Personnel
            </DropDrawerItem>
            <DropDrawerItem
              onSelect={() => setView('focus-documents')}
              icon={
                view === 'focus-documents' && <IconCheck className="size-4" />
              }
            >
              Focus Documents
            </DropDrawerItem>
          </DropDrawerContent>
        </DropDrawer>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropDrawer>
            <DropDrawerTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropDrawerTrigger>
            <DropDrawerContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== 'undefined' &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropDrawerCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropDrawerCheckboxItem>
                  )
                })}
            </DropDrawerContent>
          </DropDrawer>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContents>
        <TabsContent
          value="outline"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="overflow-hidden rounded-lg border">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-1">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            className="bg-muted h-10 px-4 text-xs font-medium tracking-wider uppercase"
                          >
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
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows?.length ? (
                      table
                        .getRowModel()
                        .rows.map((row) => (
                          <DraggableRow key={row.id} row={row} />
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
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </div>
          <div className="flex items-center justify-between border-t py-4">
            <div className="text-muted-foreground flex-1 text-sm">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center gap-6 lg:gap-8">
              <div className="flex items-center gap-2">
                <p className="hidden text-sm font-medium lg:block">
                  Rows per page
                </p>
                <DropDrawer>
                  <DropDrawerTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 w-[70px] justify-between"
                    >
                      {table.getState().pagination.pageSize}
                      <IconChevronDown />
                    </Button>
                  </DropDrawerTrigger>
                  <DropDrawerContent className="w-32">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <DropDrawerItem
                        key={pageSize}
                        onSelect={() => table.setPageSize(Number(pageSize))}
                        icon={
                          table.getState().pagination.pageSize ===
                            Number(pageSize) && <IconCheck className="size-4" />
                        }
                      >
                        {pageSize}
                      </DropDrawerItem>
                    ))}
                  </DropDrawerContent>
                </DropDrawer>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <IconChevronsLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <IconChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <IconChevronRight />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <IconChevronsRight />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent
          value="past-performance"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        <TabsContent
          value="key-personnel"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
        <TabsContent
          value="focus-documents"
          className="flex flex-col px-4 lg:px-6"
        >
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
        </TabsContent>
      </TabsContents>
    </Tabs>
  )
}
