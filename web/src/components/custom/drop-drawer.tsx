/**
 * DropDrawer - Responsive Dropdown/Drawer Component
 *
 * A custom composite component that provides adaptive UI based on screen size:
 * - Desktop/Tablet: Renders as a dropdown menu
 * - Mobile: Renders as a bottom drawer
 *
 * This provides a consistent API while optimizing for different form factors.
 * Use this instead of standalone Dropdown or Drawer when you want responsive behavior.
 */
'use client'

import * as React from 'react'
import { AnimatePresence, motion, type Transition } from 'motion/react'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import { Check } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

type DropDrawerContextType = {
  isMobile: boolean
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const DropDrawerContext = React.createContext<DropDrawerContextType>({
  isMobile: false,
  isOpen: false,
  setIsOpen: () => { },
})

const useDropDrawerContext = () => {
  const context = React.useContext(DropDrawerContext)
  if (!context) {
    throw new Error(
      'DropDrawer components cannot be rendered outside the DropDrawer Context'
    )
  }
  return context
}

type DropDrawerProps = {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function DropDrawer({
  children,
  open,
  defaultOpen,
  onOpenChange,
}: DropDrawerProps) {
  const isMobile = useIsMobile()
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)

  const isOpen = open ?? internalOpen
  const setIsOpen = React.useCallback(
    (newOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [open, onOpenChange]
  )

  const DropdownComponent = isMobile ? Drawer : DropdownMenu

  return (
    <DropDrawerContext.Provider value={{ isMobile, isOpen, setIsOpen }}>
      <DropdownComponent
        data-slot="drop-drawer"
        open={isOpen}
        onOpenChange={setIsOpen}
        {...(isMobile && { autoFocus: true })}
      >
        {children}
      </DropdownComponent>
    </DropDrawerContext.Provider>
  )
}

type DropDrawerTriggerProps =
  | React.ComponentProps<typeof DrawerTrigger>
  | React.ComponentProps<typeof DropdownMenuTrigger>

function DropDrawerTrigger({
  className,
  children,
  ...props
}: DropDrawerTriggerProps) {
  const { isMobile } = useDropDrawerContext()
  const TriggerComponent = isMobile ? DrawerTrigger : DropdownMenuTrigger

  return (
    <TriggerComponent
      data-slot="drop-drawer-trigger"
      className={className}
      {...props}
    >
      {children}
    </TriggerComponent>
  )
}

type DropDrawerContentProps = {
  className?: string
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  transition?: Transition
}

function DropDrawerContent({
  className,
  children,
  align = 'end',
  side,
  sideOffset = 4,
  transition,
  ...props
}: DropDrawerContentProps) {
  const { isMobile } = useDropDrawerContext()

  if (isMobile) {
    return (
      <DrawerContent
        data-slot="drop-drawer-content"
        className={cn(className, 'max-h-[80vh] w-full! rounded-none!')}
        {...props}
      >
        <DrawerHeader className="sr-only">
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[60vh] w-full overflow-y-auto pb-4">
          {children}
        </div>
      </DrawerContent>
    )
  }

  return (
    <DropdownMenuContent
      data-slot="drop-drawer-content"
      align={align}
      side={side}
      sideOffset={sideOffset}
      transition={transition}
      className={cn(
        'bg-popover text-popover-foreground z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[220px] overflow-y-auto rounded-md border p-1 shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </DropdownMenuContent>
  )
}

type DropDrawerItemProps = {
  className?: string
  children: React.ReactNode
  onSelect?: (event: Event) => void
  onClick?: React.MouseEventHandler<HTMLDivElement>
  icon?: React.ReactNode
  variant?: 'default' | 'destructive'
  inset?: boolean
  disabled?: boolean
}

function DropDrawerItem({
  className,
  children,
  onSelect,
  onClick,
  icon,
  variant = 'default',
  inset,
  disabled,
  ...props
}: DropDrawerItemProps) {
  const { isMobile } = useDropDrawerContext()

  // Check if this item is inside a group
  const isInGroup = React.useCallback(
    (element: HTMLElement | null): boolean => {
      if (!element) return false
      let parent = element.parentElement
      while (parent) {
        if (parent.hasAttribute('data-drop-drawer-group')) {
          return true
        }
        parent = parent.parentElement
      }
      return false
    },
    []
  )

  const itemRef = React.useRef<HTMLDivElement>(null)
  const [isInsideGroup, setIsInsideGroup] = React.useState(false)

  React.useEffect(() => {
    if (!isMobile) return
    const timer = setTimeout(() => {
      if (itemRef.current) {
        setIsInsideGroup(isInGroup(itemRef.current))
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [isInGroup, isMobile])

  if (isMobile) {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return
      if (onClick) onClick(e)
      if (onSelect) onSelect(e as unknown as Event)
    }

    const content = (
      <motion.div
        ref={itemRef}
        data-slot="drop-drawer-item"
        data-variant={variant}
        data-inset={inset}
        data-disabled={disabled}
        whileTap={{ scale: 0.98 }}
        role="menuitem"
        className={cn(
          'active:bg-sidebar-accent flex cursor-pointer items-center justify-between px-6 py-4 transition-colors',
          !isInsideGroup && 'border-b last:border-0',
          isInsideGroup && 'py-3.5',
          inset && 'pl-10',
          variant === 'destructive' && 'text-destructive dark:text-destructive',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        onClick={handleClick}
        aria-disabled={disabled}
        {...props}
      >
        <div className="flex items-center gap-2">{children}</div>
        {icon && <div className="shrink-0" aria-hidden="true">{icon}</div>}
      </motion.div>
    )

    return <DrawerClose asChild>{content}</DrawerClose>
  }

  return (
    <DropdownMenuItem
      data-slot="drop-drawer-item"
      inset={inset}
      variant={variant}
      disabled={disabled}
      className={className}
      onSelect={
        onSelect as unknown as React.ComponentProps<
          typeof DropdownMenuItem
        >['onSelect']
      }
      {...props}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">{children}</div>
        {icon && <div aria-hidden="true">{icon}</div>}
      </div>
    </DropdownMenuItem>
  )
}

type DropDrawerCheckboxItemProps = React.ComponentProps<
  typeof DropdownMenuCheckboxItem
>

function DropDrawerCheckboxItem({
  className,
  children,
  checked,
  onCheckedChange,
  ...props
}: DropDrawerCheckboxItemProps) {
  const { isMobile } = useDropDrawerContext()

  if (isMobile) {
    return (
      <div
        data-slot="drop-drawer-checkbox-item"
        className={cn(
          'active:bg-sidebar-accent flex cursor-pointer items-center justify-between border-b px-6 py-4 transition-colors last:border-0',
          checked && 'bg-sidebar-accent',
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        <div className="flex items-center gap-2">{children}</div>
        {checked && <Check aria-hidden="true" className="h-4 w-4" />}
      </div>
    )
  }

  return (
    <DropdownMenuCheckboxItem
      data-slot="drop-drawer-checkbox-item"
      className={className}
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...props}
    >
      {children}
    </DropdownMenuCheckboxItem>
  )
}

type DropDrawerSeparatorProps = {
  className?: string
}

function DropDrawerSeparator({
  className,
  ...props
}: DropDrawerSeparatorProps) {
  const { isMobile } = useDropDrawerContext()

  if (isMobile) {
    return null
  }

  return (
    <DropdownMenuSeparator
      data-slot="drop-drawer-separator"
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  )
}

type DropDrawerLabelProps = {
  className?: string
  children: React.ReactNode
}

function DropDrawerLabel({
  className,
  children,
  ...props
}: DropDrawerLabelProps) {
  const { isMobile } = useDropDrawerContext()

  if (isMobile) {
    return (
      <DrawerHeader className="p-0">
        <DrawerTitle
          data-slot="drop-drawer-label"
          className={cn(
            'text-muted-foreground px-4 py-2 text-sm font-medium',
            className
          )}
          {...props}
        >
          {children}
        </DrawerTitle>
      </DrawerHeader>
    )
  }

  return (
    <DropdownMenuLabel
      data-slot="drop-drawer-label"
      className={cn('px-2 py-1.5 text-sm font-medium', className)}
      {...props}
    >
      {children}
    </DropdownMenuLabel>
  )
}

type DropDrawerGroupProps = {
  className?: string
  children: React.ReactNode
}

function DropDrawerGroup({
  className,
  children,
  ...props
}: DropDrawerGroupProps) {
  const { isMobile } = useDropDrawerContext()

  const childrenWithSeparators = React.useMemo(() => {
    if (!isMobile) return children

    const childArray = React.Children.toArray(children)
    const filteredChildren = childArray.filter(
      (child) =>
        React.isValidElement(child) && child.type !== DropDrawerSeparator
    )

    return filteredChildren.flatMap((child, index) => {
      if (index === filteredChildren.length - 1) return [child]
      return [
        child,
        <div
          key={`separator-${index}`}
          className="bg-border h-px"
          aria-hidden="true"
        />,
      ]
    })
  }, [children, isMobile])

  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          data-drop-drawer-group
          data-slot="drop-drawer-group"
          role="group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('my-4 overflow-hidden border-y', className)}
          {...props}
        >
          {childrenWithSeparators}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <DropdownMenuGroup
      data-drop-drawer-group
      data-slot="drop-drawer-group"
      className={className}
      {...props}
    >
      {children}
    </DropdownMenuGroup>
  )
}

export {
  DropDrawer,
  DropDrawerContent,
  DropDrawerGroup,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerSeparator,
  DropDrawerTrigger,
  DropDrawerCheckboxItem,
  useDropDrawerContext,
}
