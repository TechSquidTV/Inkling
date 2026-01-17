import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { Trash2, Shield, User, MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { fetchWithAuth, APIError } from '@/lib/api'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerSeparator,
  DropDrawerTrigger,
  DropDrawerLabel,
} from '@/components/custom/drop-drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/animate-ui/components/radix/alert-dialog'
import { IconChevronDown, IconCheck } from '@tabler/icons-react'

interface UserData {
  id: number
  email: string
  name: string
  role: 'admin' | 'user'
  created_at: string
}

export function UsersTable() {
  const [users, setUsers] = useState<UserData[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null)
  const auth = useAuth()

  const fetchUsers = useCallback(async () => {
    try {
      const data = await fetchWithAuth<{ users: UserData[]; total: number }>(
        '/api/admin/users',
        {
          token: auth.token,
        }
      )
      setUsers(data.users || [])
      setTotal(data.total)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [auth.token])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const updateRole = async (userId: number, newRole: string) => {
    try {
      await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'PUT',
        token: auth.token,
        body: JSON.stringify({ role: newRole }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast.success(`User role updated to ${newRole}`)
      fetchUsers()
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to update user role')
      }
    }
  }

  const deleteUser = async () => {
    if (!userToDelete) return
    try {
      await fetchWithAuth(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        token: auth.token,
      })
      toast.success('User deleted')
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (error) {
      if (error instanceof APIError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to delete user')
      }
    }
  }

  const columns: ColumnDef<UserData>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.original.email}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const isCurrentUser = auth.user?.id === row.original.id
        return (
          <DropDrawer>
            <DropDrawerTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-28 justify-between"
                disabled={isCurrentUser}
              >
                <Badge
                  variant={
                    row.original.role === 'admin' ? 'default' : 'secondary'
                  }
                  className="gap-1 px-1.5"
                >
                  {row.original.role === 'admin' ? (
                    <Shield className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {row.original.role}
                </Badge>
                <IconChevronDown className="size-4 opacity-50" />
              </Button>
            </DropDrawerTrigger>
            <DropDrawerContent align="start" className="w-40">
              <DropDrawerLabel>Select Role</DropDrawerLabel>
              <DropDrawerItem
                onClick={() => updateRole(row.original.id, 'admin')}
                icon={
                  row.original.role === 'admin' && (
                    <IconCheck className="size-4" />
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Admin
                </div>
              </DropDrawerItem>
              <DropDrawerItem
                onClick={() => updateRole(row.original.id, 'user')}
                icon={
                  row.original.role === 'user' && (
                    <IconCheck className="size-4" />
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  User
                </div>
              </DropDrawerItem>
            </DropDrawerContent>
          </DropDrawer>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const isCurrentUser = auth.user?.id === row.original.id
        return (
          <DropDrawer>
            <DropDrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropDrawerTrigger>
            <DropDrawerContent align="end">
              <DropDrawerItem
                onClick={() => {
                  navigator.clipboard.writeText(row.original.email)
                  toast.success('Email copied')
                }}
              >
                Copy email
              </DropDrawerItem>
              <DropDrawerSeparator />
              <DropDrawerItem
                variant="destructive"
                disabled={isCurrentUser}
                onClick={() => {
                  setUserToDelete(row.original)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete user
              </DropDrawerItem>
            </DropDrawerContent>
          </DropDrawer>
        )
      },
    },
  ]

  const table = useReactTable({
    data: users,
    columns,
    state: { columnFilters, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            Loading users...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and roles. Total: {total} users
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search by name or email..."
              className="max-w-sm"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
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
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action
              cannot be undone. All of their data including API keys will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
