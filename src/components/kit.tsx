/**
 * App-level composites built on shadcn/ui primitives (src/components/ui).
 * Keeps screens terse: labelled fields, switch rows, slider rows, segmented
 * controls, tooltips, a responsive dialog (drawer on phones) and menu helpers.
 */
import {
  useId,
  useSyncExternalStore,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/* --------------------------------- media ---------------------------------- */

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const DESKTOP_QUERY = '(min-width: 1024px)'
export const useIsDesktop = () => useMediaQuery(DESKTOP_QUERY)

/* --------------------------------- fields --------------------------------- */

export function Field({
  label,
  hint,
  className,
  children,
  id,
}: {
  label: ReactNode
  hint?: ReactNode
  className?: string
  id?: string
  children: (id: string) => ReactNode
}) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <Label htmlFor={fieldId} className="text-[13px] text-foreground/80">
        {label}
      </Label>
      {children(fieldId)}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  label: ReactNode
  description?: ReactNode
  checked: boolean
  onCheckedChange: (v: boolean) => void
  className?: string
}) {
  return (
    <label className={cn('flex cursor-pointer items-center justify-between gap-4 py-1', className)}>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-foreground/90">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={(v) => onCheckedChange(v)} />
    </label>
  )
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-foreground/90">{label}</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">{format(value)}</span>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? (v as readonly number[])[0] : (v as number))}
        className="py-1.5"
      />
    </div>
  )
}

/** Equal-width segmented control with a pure-CSS sliding indicator (no layout measurement). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  size = 'md',
  label,
}: {
  value: T
  options: Array<{ value: T; label: ReactNode; title?: string }>
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
  label?: string
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div role="radiogroup" aria-label={label} className={cn('relative grid auto-cols-fr grid-flow-col rounded-lg bg-muted p-0.5', className)}>
      <span
        aria-hidden
        className="absolute bottom-0.5 left-0.5 top-0.5 rounded-md bg-background shadow-sm ring-1 ring-foreground/5 transition-transform duration-300 ease-[var(--ease-out-expo)] dark:bg-accent"
        style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            aria-label={o.title}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 rounded-md px-2 font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
              size === 'sm' ? 'h-7 text-xs' : 'h-8 text-[13px]',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------- tooltip --------------------------------- */

/** Tooltip around a single interactive element (rendered via Base UI's `render`). */
export function Tip({
  content,
  children,
  side = 'bottom',
}: {
  content: ReactNode
  children: ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  )
}

/* --------------------------- responsive dialog ---------------------------- */

const DIALOG_WIDTH = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-5xl' } as const

/** Centered dialog on larger screens, swipeable bottom drawer on phones. */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: keyof typeof DIALOG_WIDTH
  className?: string
}) {
  const wide = useMediaQuery('(min-width: 640px)')

  if (wide) {
    return (
      <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
        <DialogContent className={cn('flex max-h-[90dvh] flex-col gap-0 p-0', DIALOG_WIDTH[size], className)}>
          <DialogHeader className="px-5 pb-3 pt-5 pr-12">
            <DialogTitle className="text-base font-semibold tracking-tight">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 scrollbar-thin">{children}</div>}
          {footer && <DialogFooter className="mx-0 mb-0 px-5 py-3">{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={(o) => onOpenChange(o)} showSwipeHandle>
      <DrawerContent className={className}>
        <DrawerHeader className="pb-3 text-left">
          <DrawerTitle className="font-semibold tracking-tight">{title}</DrawerTitle>
          {description && <DrawerDescription className="text-left">{description}</DrawerDescription>}
        </DrawerHeader>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>}
        {footer && (
          <DrawerFooter className="border-t pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] [&>button]:h-10">{footer}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}

/* ---------------------------------- menu ---------------------------------- */

export const Menu = DropdownMenu
export const MenuTrigger = DropdownMenuTrigger
export const MenuSeparator = DropdownMenuSeparator

export function MenuContent({ className, align = 'end', ...props }: ComponentProps<typeof DropdownMenuContent>) {
  return <DropdownMenuContent align={align} className={cn('w-auto min-w-48', className)} {...props} />
}

export function MenuItem({
  icon,
  danger,
  shortcut,
  children,
  onSelect,
  className,
  ...props
}: Omit<ComponentProps<typeof DropdownMenuItem>, 'onClick'> & {
  icon?: ReactNode
  danger?: boolean
  shortcut?: ReactNode
  onSelect?: () => void
}) {
  return (
    <DropdownMenuItem
      variant={danger ? 'destructive' : 'default'}
      onClick={() => onSelect?.()}
      className={cn('h-9 gap-2.5 px-2 text-[13px] md:h-8', !danger && '[&_svg]:text-muted-foreground', className)}
      {...props}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {shortcut && <DropdownMenuShortcut className="tracking-normal">{shortcut}</DropdownMenuShortcut>}
    </DropdownMenuItem>
  )
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">{children}</div>
}
