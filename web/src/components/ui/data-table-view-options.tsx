'use client'

import { type Table } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import {
  DropDrawer,
  DropDrawerTrigger,
  DropDrawerContent,
  DropDrawerCheckboxItem,
} from '@/components/custom/drop-drawer'
import { IconChevronDown, IconLayoutColumns } from '@tabler/icons-react'

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropDrawer>
      <DropDrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <IconLayoutColumns className="mr-2 h-4 w-4" />
          Customize Columns
          <IconChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropDrawerTrigger>
      <DropDrawerContent align="end" className="w-[150px]">
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropDrawerCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropDrawerCheckboxItem>
            )
          })}
      </DropDrawerContent>
    </DropDrawer>
  )
}
