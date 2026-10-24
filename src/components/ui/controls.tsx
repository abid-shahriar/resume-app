import { Slider as RSlider, Switch as RSwitch, Tooltip as RTooltip } from 'radix-ui'
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  className?: string
  id?: string
  'aria-label'?: string
}) {
  return (
    <RSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-surface-3 transition-colors duration-200 data-[state=checked]:bg-accent',
        className,
      )}
      {...props}
    >
      <RSwitch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-spring)] data-[state=checked]:translate-x-[18px]" />
    </RSwitch.Root>
  )
}

export function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: ReactNode
  description?: ReactNode
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <div className="text-[13px] font-medium text-foreground/90">{label}</div>
        {description && <div className="text-xs text-muted">{description}</div>}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
}: {
  label: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div className="flex flex-col gap-2.5 py-1">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-foreground/90">{label}</span>
        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted">
          {format(value)}
        </span>
      </div>
      <RSlider.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="relative flex h-5 w-full touch-none select-none items-center"
      >
        <RSlider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-surface-3">
          <RSlider.Range className="absolute h-full rounded-full bg-accent" />
        </RSlider.Track>
        <RSlider.Thumb
          aria-label={typeof label === 'string' ? label : undefined}
          className="block size-[18px] rounded-full border border-border-strong bg-white shadow-md outline-none transition-[box-shadow,transform] hover:scale-110 focus-visible:ring-4 focus-visible:ring-[var(--ring)] active:scale-95"
        />
      </RSlider.Root>
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  size = 'md',
}: {
  value: T
  options: Array<{ value: T; label: ReactNode; title?: string }>
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div role="radiogroup" className={cn('relative grid auto-cols-fr grid-flow-col rounded-lg bg-surface-2 p-0.5', className)}>
      {/* Pure-CSS sliding indicator: equal-width columns, so no layout measurement is needed */}
      <span
        aria-hidden
        className="absolute bottom-0.5 left-0.5 top-0.5 rounded-md bg-surface shadow-sm transition-transform duration-300 ease-[var(--ease-out-expo)] dark:bg-surface-3"
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
              'relative z-10 flex items-center justify-center gap-1.5 rounded-md px-2 font-medium transition-colors',
              size === 'sm' ? 'h-7 text-xs' : 'h-8 text-[13px]',
              active ? 'text-foreground' : 'text-muted hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RTooltip.Provider delayDuration={350} skipDelayDuration={150}>
      {children}
    </RTooltip.Provider>
  )
}

export function Tooltip({ content, children, side = 'bottom' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <RTooltip.Root>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={6}
          className="z-[100] select-none rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md animate-scale-in"
        >
          {content}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="ml-auto rounded border border-border bg-surface-2 px-1 font-sans text-[10px] text-muted">{children}</kbd>
  )
}
