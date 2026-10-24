import { Monitor, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useTheme, type ThemePref } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Tip } from './kit'

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-foreground" />
        <path d="M16 7.5 24 14v8.8a1.7 1.7 0 0 1-1.7 1.7H9.7A1.7 1.7 0 0 1 8 22.8V14z" className="fill-background" />
        <circle cx="12.4" cy="17.3" r="1.9" fill="#2cc4b4" />
        <rect x="15.4" y="15.6" width="5.4" height="1.5" rx=".75" className="fill-foreground" />
        <rect x="15.4" y="18.2" width="3.6" height="1.5" rx=".75" className="fill-foreground" />
        <rect x="10.5" y="21.1" width="10.3" height="1.5" rx=".75" className="fill-foreground opacity-50" />
      </svg>
      {!compact && (
        <span className="text-[17px]">
          Cv<span className="text-primary">Ghor</span>
        </span>
      )}
    </span>
  )
}

const ORDER: ThemePref[] = ['system', 'light', 'dark']

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
  return (
    <Tip content={`Theme: ${theme}`}>
      <Button variant="subtle" size="icon" onClick={() => setTheme(next)} aria-label={`Switch theme (current: ${theme})`}>
        <Icon />
      </Button>
    </Tip>
  )
}

export function SiteHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="mr-auto rounded-lg outline-offset-4" aria-label="CvGhor home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1">
          <Button render={<Link to="/templates" />} nativeButton={false} variant="ghost" className="hidden sm:inline-flex">
            Templates
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
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
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
