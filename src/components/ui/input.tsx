import {
  forwardRef,
  useId,
  useLayoutEffect,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export const fieldBase =
  'w-full rounded-lg border border-border bg-surface px-3 text-foreground shadow-xs outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(fieldBase, 'h-10 md:h-9', className)} {...props} />
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, autoGrow = true, value, ...props },
  forwarded,
) {
  const inner = useRef<HTMLTextAreaElement | null>(null)
  useLayoutEffect(() => {
    const el = inner.current
    if (!el || !autoGrow) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value, autoGrow])
  return (
    <textarea
      ref={(el) => {
        inner.current = el
        if (typeof forwarded === 'function') forwarded(el)
        else if (forwarded) forwarded.current = el
      }}
      value={value}
      className={cn(fieldBase, 'min-h-24 resize-none py-2 leading-relaxed', className)}
      {...props}
    />
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(fieldBase, 'h-10 appearance-none pr-9 md:h-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  )
})

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-[13px] font-medium text-foreground/80', className)} {...props} />
}

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
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      {children(fieldId)}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
