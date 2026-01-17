import { Button } from '@/components/ui/button'
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerGroup,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerSeparator,
  DropDrawerTrigger,
} from '@/components/custom/drop-drawer'
import { useTheme } from '@/components/theme-provider'
import { Sun, Moon, Laptop } from 'lucide-react'

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropDrawer>
      <DropDrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropDrawerTrigger>
      <DropDrawerContent align="end" className="min-w-32">
        <DropDrawerLabel>Appearance</DropDrawerLabel>
        <DropDrawerSeparator />
        <DropDrawerGroup>
          <DropDrawerItem onSelect={() => setTheme('light')}>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropDrawerItem>
          <DropDrawerItem onSelect={() => setTheme('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropDrawerItem>
          <DropDrawerItem onSelect={() => setTheme('system')}>
            <Laptop className="mr-2 h-4 w-4" />
            System
          </DropDrawerItem>
        </DropDrawerGroup>
      </DropDrawerContent>
    </DropDrawer>
  )
}
