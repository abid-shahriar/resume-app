import { Monitor, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useTheme, type ThemePref } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Tooltip } from './ui/controls'

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path d="M9 9.5h3.2l3.8 10.2 3.8-10.2H23L17.6 23h-3.2z" className="fill-primary-foreground" />
        <circle cx="23.5" cy="22" r="2" fill="#8b7cff" />
      </svg>
      {!compact && <span className="text-[17px]">Vitae</span>}
    </span>
  )
}

const ORDER: ThemePref[] = ['system', 'light', 'dark']

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
  return (
    <Tooltip content={`Theme: ${theme}`}>
      <Button variant="subtle" size="icon-sm" onClick={() => setTheme(next)} aria-label={`Switch theme (current: ${theme})`}>
        <Icon />
      </Button>
    </Tooltip>
  )
}

export function SiteHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="mr-auto rounded-lg outline-offset-4" aria-label="Vitae home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/templates">Templates</Link>
          </Button>
          <ThemeToggle />
          {right}
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <Logo compact />
          <span>Free forever. Your data stays in your browser.</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/templates" className="hover:text-foreground">
            Templates
          </Link>
          <Link to="/" className="hover:text-foreground">
            My resumes
          </Link>
        </div>
      </div>
    </footer>
  )
}
