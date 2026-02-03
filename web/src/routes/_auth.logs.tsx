import { createFileRoute } from '@tanstack/react-router'
import { AnsiLogViewer } from '@/components/features/logs/ansi-log-viewer'
import { LogStatusIndicator } from '@/components/features/logs/log-status-indicator'
import { useLogStream } from '@/hooks/use-log-stream'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
} from '@/components/animate-ui/components/animate/tabs'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { IconTerminal } from '@tabler/icons-react'

export const Route = createFileRoute('/_auth/logs')({
  component: LogsPage,
})

const LOG_TABS = [
  {
    value: 'application',
    label: 'Application',
    title: 'Application Logs',
    description: 'Live output from the Go backend',
  },
  {
    value: 'docker',
    label: 'Docker',
    title: 'Docker Compose Logs',
    description: 'Consolidated container logs',
  },
]

function LogTab({ tab }: { tab: (typeof LOG_TABS)[0] }) {
  const { logs, status, error } = useLogStream(tab.value)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start space-y-0 pb-2">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{tab.title}</CardTitle>
            <div className="flex items-center gap-2">
              <LogStatusIndicator status={status} />
              <IconTerminal className="text-muted-foreground h-4 w-4" />
            </div>
          </div>
          <CardDescription>{tab.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <AnsiLogViewer logs={logs || 'Waiting for logs...'} />
        {error && <div className="text-destructive mt-2 text-sm">{error}</div>}
      </CardContent>
    </Card>
  )
}

function LogsPage() {
  return (
    <DashboardLayout
      title="System Logs"
      description="Real-time application and container logs."
    >
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="application" className="w-full">
          <div className="mb-4 flex items-center justify-between">
            <TabsList>
              {LOG_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContents>
            {LOG_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <LogTab tab={tab} />
              </TabsContent>
            ))}
          </TabsContents>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
