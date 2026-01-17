'use client'

import { IconChevronDown, IconCheck, IconTrendingUp } from '@tabler/icons-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerTrigger,
  DropDrawerLabel,
} from '@/components/custom/drop-drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { type DataTableItem } from './schema'

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--primary)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

export function TableCellViewer({
  item,
  onUpdate,
}: {
  item: DataTableItem
  onUpdate?: (columnId: string, value: unknown) => void
}) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="text-foreground w-fit px-0 text-left font-normal"
        >
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>
            Showing total visitors for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{' '}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Header</Label>
              <Input
                id="header"
                defaultValue={item.header}
                onChange={(e) => onUpdate?.('header', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <DropDrawer>
                  <DropDrawerTrigger asChild>
                    <Button
                      variant="outline"
                      id="type"
                      className="w-full justify-between font-normal"
                    >
                      {item.type || 'Select a type'}
                      <IconChevronDown className="size-4 opacity-50" />
                    </Button>
                  </DropDrawerTrigger>
                  <DropDrawerContent className="w-64">
                    <DropDrawerLabel>Select Type</DropDrawerLabel>
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
                        onSelect={() => onUpdate?.('type', type)}
                        icon={
                          item.type === type && <IconCheck className="size-4" />
                        }
                      >
                        {type}
                      </DropDrawerItem>
                    ))}
                  </DropDrawerContent>
                </DropDrawer>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <DropDrawer>
                  <DropDrawerTrigger asChild>
                    <Button
                      variant="outline"
                      id="status"
                      className="w-full justify-between font-normal"
                    >
                      {item.status || 'Select a status'}
                      <IconChevronDown className="size-4 opacity-50" />
                    </Button>
                  </DropDrawerTrigger>
                  <DropDrawerContent className="w-48">
                    <DropDrawerLabel>Select Status</DropDrawerLabel>
                    {['Done', 'In Progress', 'Not Started'].map((status) => (
                      <DropDrawerItem
                        key={status}
                        onSelect={() => onUpdate?.('status', status)}
                        icon={
                          item.status === status && (
                            <IconCheck className="size-4" />
                          )
                        }
                      >
                        {status}
                      </DropDrawerItem>
                    ))}
                  </DropDrawerContent>
                </DropDrawer>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="target">Target</Label>
                <Input
                  id="target"
                  defaultValue={item.target}
                  onChange={(e) => onUpdate?.('target', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  defaultValue={item.limit}
                  onChange={(e) => onUpdate?.('limit', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Reviewer</Label>
              <DropDrawer>
                <DropDrawerTrigger asChild>
                  <Button
                    variant="outline"
                    id="reviewer"
                    className="w-full justify-between font-normal"
                  >
                    {item.reviewer || 'Select a reviewer'}
                    <IconChevronDown className="size-4 opacity-50" />
                  </Button>
                </DropDrawerTrigger>
                <DropDrawerContent className="w-64">
                  <DropDrawerLabel>Select Reviewer</DropDrawerLabel>
                  {['Eddie Lake', 'Jamik Tashpulatov', 'Emily Whalen'].map(
                    (reviewer) => (
                      <DropDrawerItem
                        key={reviewer}
                        onSelect={() => onUpdate?.('reviewer', reviewer)}
                        icon={
                          item.reviewer === reviewer && (
                            <IconCheck className="size-4" />
                          )
                        }
                      >
                        {reviewer}
                      </DropDrawerItem>
                    )
                  )}
                </DropDrawerContent>
              </DropDrawer>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
