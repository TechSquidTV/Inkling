import { type ColumnDef, type RowData } from '@tanstack/react-table'
import {
  IconChevronDown,
  IconCheck,
  IconDotsVertical,
} from '@tabler/icons-react'
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
} from '@/components/custom/drop-drawer'

import { type DataTableItem } from '@/components/custom/data-table/schema'
import { DragHandle } from '@/components/custom/data-table/draggable-row'
import { TableCellViewer } from '@/components/custom/data-table/table-cell-viewer'

// Module augmentation for TableMeta
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowId: string, columnId: string, value: unknown) => void
  }
}

export const columns: ColumnDef<DataTableItem>[] = [
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
