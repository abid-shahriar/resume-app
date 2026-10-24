import { DropdownMenu as RMenu, Popover as RPopover } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Menu = RMenu.Root
export const MenuTrigger = RMenu.Trigger

const panel =
  'z-50 min-w-48 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg outline-none data-[side=bottom]:origin-top data-[side=top]:origin-bottom data-[state=open]:animate-scale-in'

export function MenuContent({
  className,
  align = 'end',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof RMenu.Content>) {
  return (
    <RMenu.Portal>
      <RMenu.Content align={align} sideOffset={sideOffset} collisionPadding={8} className={cn(panel, className)} {...props} />
    </RMenu.Portal>
  )
}

export function MenuItem({
  className,
  icon,
  danger,
  children,
  shortcut,
  ...props
}: ComponentProps<typeof RMenu.Item> & { icon?: ReactNode; danger?: boolean; shortcut?: ReactNode }) {
  return (
    <RMenu.Item
      className={cn(
        'flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-surface-2 data-[disabled]:opacity-50 md:h-8 [&_svg]:size-4 [&_svg]:shrink-0',
        danger ? 'text-danger data-[highlighted]:bg-danger-soft' : 'text-foreground [&_svg]:text-muted',
        className,
      )}
      {...props}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {shortcut && <span className="text-[11px] text-subtle">{shortcut}</span>}
    </RMenu.Item>
  )
}

export function MenuSeparator() {
  return <RMenu.Separator className="-mx-1 my-1 h-px bg-border" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <RMenu.Label className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">{children}</RMenu.Label>
}

export const Popover = RPopover.Root
export const PopoverTrigger = RPopover.Trigger
export const PopoverClose = RPopover.Close

export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof RPopover.Content>) {
  return (
    <RPopover.Portal>
      <RPopover.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(panel, 'p-3', className)}
        {...props}
      />
    </RPopover.Portal>
  )
}
