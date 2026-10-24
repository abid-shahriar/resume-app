import { Dialog as RDialog } from 'radix-ui'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

/**
 * Responsive dialog: centered modal on desktop, bottom sheet on mobile.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = 'md',
  trigger,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  trigger?: ReactNode
}) {
  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-5xl' }[size]
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=closed]:animate-[fade-out_150ms_ease-in_both] data-[state=open]:animate-fade-in" />
        <RDialog.Content
          className={cn(
            'fixed z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden border border-border bg-surface shadow-lg outline-none',
            'inset-x-0 bottom-0 rounded-t-2xl data-[state=closed]:animate-[sheet-out_200ms_ease-in_both] data-[state=open]:animate-[sheet-in_380ms_var(--ease-out-expo)_both]',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:data-[state=closed]:animate-[dialog-out_150ms_ease-in_both] sm:data-[state=open]:animate-[dialog-in_280ms_var(--ease-out-expo)_both]',
            width,
            className,
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong sm:hidden" />
          <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
            <div className="min-w-0">
              <RDialog.Title className="text-base font-semibold tracking-tight">{title}</RDialog.Title>
              {description ? (
                <RDialog.Description className="mt-1 text-sm text-muted">{description}</RDialog.Description>
              ) : (
                <RDialog.Description className="sr-only">{typeof title === 'string' ? title : 'Dialog'}</RDialog.Description>
              )}
            </div>
            <RDialog.Close asChild>
              <Button variant="subtle" size="icon-sm" aria-label="Close" className="-mr-2 -mt-1">
                <X />
              </Button>
            </RDialog.Close>
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 scrollbar-thin sm:px-6">{children}</div>}
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface-2/50 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
              {footer}
            </div>
          )}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}

export const DialogClose = RDialog.Close
