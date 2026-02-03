import { ChartAreaInteractive } from '@/components/features/dashboard/chart-area-interactive'
import { DataTable } from '@/components/ui/data-table'
import { SectionCards } from '@/components/features/dashboard/section-cards'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/animate/tabs'
import {
  DropDrawer,
  DropDrawerTrigger,
  DropDrawerContent,
  DropDrawerLabel,
  DropDrawerItem,
} from '@/components/custom/drop-drawer'
import { IconChevronDown, IconCheck, IconPlus } from '@tabler/icons-react'

import initialData from './data.json'
import { columns } from './-components/columns'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTableViewOptions } from '@/components/ui/data-table-view-options'

export const Route = createFileRoute('/_auth/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const [view, setView] = useState('outline')

  // Helper to update the hook's local state
  const tableDataUpdater = (
    rowId: string,
    columnId: string,
    value: unknown
  ) => {
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
  }

  // Handle reorder from drag and drop
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleReorder = (newData: any[]) => {
    // setData(newData) provided by hook handles local state
    // but if we need to sync with server/parent, do it here.
    console.log('Reorder happened', newData.length)
  }

  const { table, setData, handleDragEnd } = useDataTable({
    data: initialData,
    columns,
    meta: { updateData: tableDataUpdater },
    onReorder: handleReorder,
  })

  return (
    <DashboardLayout title="Dashboard" description="Overview of your activity.">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>

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
                  view === 'past-performance' && (
                    <IconCheck className="size-4" />
                  )
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
            <DataTableViewOptions table={table} />

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
            <DataTable
              table={table}
              columns={columns}
              onReorder={handleReorder}
              handleDragEnd={handleDragEnd}
            />
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
    </DashboardLayout>
  )
}
