import { Slot } from 'radix-ui'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary/88 active:bg-primary/80',
  accent: 'bg-accent text-white shadow-sm hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface-2 text-foreground hover:bg-surface-3 active:bg-surface-3',
  outline:
    'border border-border bg-surface text-foreground shadow-xs hover:bg-surface-2 hover:border-border-strong active:bg-surface-3',
  ghost: 'text-foreground hover:bg-surface-2 active:bg-surface-3',
  subtle: 'text-muted hover:text-foreground hover:bg-surface-2 active:bg-surface-3',
  danger: 'bg-danger text-white shadow-sm hover:brightness-110 active:brightness-95',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
} as const

const sizes = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-md',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
  xl: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  icon: 'size-9 rounded-lg',
  'icon-sm': 'size-8 rounded-lg',
  'icon-xs': 'size-7 rounded-md',
} as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', asChild, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow,filter,transform] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
})
