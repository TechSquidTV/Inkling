import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Copy, Plus, Trash, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth, APIError } from '@/lib/api'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface APIKey {
  id: number
  prefix: string
  created_at: string
  last_used?: string
  name?: string
}

export function ApiKeys() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const auth = useAuth()

  const fetchKeys = useCallback(async () => {
    try {
      const data = await fetchWithAuth<{ keys: APIKey[] }>('/api/keys', {
        token: auth.token,
      })
      setKeys(data.keys)
    } catch {
      toast.error('Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }, [auth.token])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  async function createKey() {
    setIsCreating(true)
    try {
      const data = await fetchWithAuth<{ key: string }>('/api/keys', {
        method: 'POST',
        token: auth.token,
        body: JSON.stringify({ name: newKeyName }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      setNewKey(data.key)
      toast.success('API Key created successfully')
      fetchKeys()
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to create API key')
      }
    } finally {
      setIsCreating(false)
    }
  }

  async function revokeKey(id: number) {
    if (
      !confirm(
        'Are you sure you want to revoke this key? This action cannot be undone.'
      )
    )
      return

    try {
      await fetchWithAuth(`/api/keys/${id}`, {
        method: 'DELETE',
        token: auth.token,
      })

      toast.success('API Key revoked')
      setKeys(keys.filter((k) => k.id !== id))
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to revoke API key')
      }
    }
  }

  function handleCopy() {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      toast.success('Copied to clipboard')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage your API keys for programmatic access.
            </CardDescription>
          </div>
          <Drawer
            open={isDrawerOpen}
            onOpenChange={(open) => {
              setIsDrawerOpen(open)
              if (!open) {
                setNewKey(null)
                setNewKeyName('')
              }
            }}
          >
            <DrawerTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create New Key
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Create API Key</DrawerTitle>
                  <DrawerDescription>
                    Generate a new key to access the API.
                  </DrawerDescription>
                </DrawerHeader>

                <div className="p-4 pb-0">
                  {newKey ? (
                    <div className="space-y-4">
                      <div className="bg-muted rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-sm break-all">
                            {newKey}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-md bg-amber-500/10 p-3 text-amber-500">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <p className="text-sm">
                          Copy this key now. You won't be able to see it again!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Key Name (Optional)</Label>
                        <Input
                          id="name"
                          placeholder="e.g., CI/CD Pipeline"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <DrawerFooter>
                  {newKey ? (
                    <DrawerClose asChild>
                      <Button>Done</Button>
                    </DrawerClose>
                  ) : (
                    <Button onClick={createKey} disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Key'}
                    </Button>
                  )}
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground py-4 text-center">
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="text-muted-foreground rounded-md border border-dashed py-8 text-center">
            <p>No API keys found.</p>
            <p className="text-sm">Create one to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">
                    {key.name || 'Unnamed Key'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {key.prefix}***
                  </TableCell>
                  <TableCell>
                    {new Date(key.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => revokeKey(key.id)}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Revoke</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
