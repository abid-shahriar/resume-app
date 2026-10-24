import { Download, Eye, LayoutTemplate, Maximize, Minus, Palette, PanelsTopLeft, PenLine, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ComponentType } from 'react'
import { useParams } from 'react-router'
import { ResumePreview, type Zoom } from '@/components/ResumePreview'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/controls'
import { cn } from '@/lib/utils'
import NotFound from '@/pages/NotFound'
import { useResumeStore } from '@/store/resumes'
import { ContentPanel } from './ContentPanel'
import { EditorContext, useEditor, type EditorCtx } from './context'
import { DesignPanel } from './DesignPanel'
import { DownloadDialog, useDownload } from './DownloadDialog'
import { EditorHeader } from './EditorHeader'
import { LayoutPanel } from './LayoutPanel'
import { TemplatesPanel } from './TemplatesPanel'

type PanelId = 'content' | 'templates' | 'design' | 'layout'
type Tab = PanelId | 'preview'

const PANELS: Array<{ id: PanelId; label: string; icon: ComponentType<{ className?: string }>; Component: ComponentType; keepMounted: boolean }> = [
  { id: 'content', label: 'Content', icon: PenLine, Component: ContentPanel, keepMounted: true },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, Component: TemplatesPanel, keepMounted: false },
  { id: 'design', label: 'Design', icon: Palette, Component: DesignPanel, keepMounted: true },
  { id: 'layout', label: 'Layout', icon: PanelsTopLeft, Component: LayoutPanel, keepMounted: true },
]

function useMediaQuery(query: string) {
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

const ZOOM_STEPS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]

function PreviewPane({ isDesktop }: { isDesktop: boolean }) {
  const { id } = useEditor()
  const resume = useResumeStore((s) => s.resumes[id])
  const [zoom, setZoom] = useState<Zoom>('fit')
  const [info, setInfo] = useState({ pages: 1, scale: 1 })
  const download = useDownload()
  const onLayout = useCallback((v: { pages: number; scale: number }) => setInfo(v), [])

  const step = (dir: 1 | -1) => {
    const current = zoom === 'fit' ? info.scale : zoom
    const next = dir === 1 ? ZOOM_STEPS.find((z) => z > current + 0.001) : [...ZOOM_STEPS].reverse().find((z) => z < current - 0.001)
    if (next) setZoom(next)
  }

  return (
    <>
      <div className="absolute inset-0 overflow-auto scrollbar-thin">
        <div className="min-h-full pb-28 pt-6 sm:pt-8 lg:pb-24 lg:pt-10">
          <ResumePreview
            resume={resume}
            zoom={zoom}
            padding={isDesktop ? 48 : 14}
            maxFitScale={isDesktop ? 1.1 : 1}
            onLayout={onLayout}
            sheetName="resume-sheet"
          />
        </div>
      </div>
      <div
        className={cn(
          'absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border bg-surface/90 p-1 shadow-lg backdrop-blur-xl',
          isDesktop ? 'bottom-5' : 'bottom-[calc(76px+env(safe-area-inset-bottom))]',
        )}
      >
        {isDesktop && (
          <>
            <Tooltip content="Zoom out" side="top">
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => step(-1)} aria-label="Zoom out">
                <Minus />
              </Button>
            </Tooltip>
            <Tooltip content={zoom === 'fit' ? 'Fit to width' : 'Reset to fit'} side="top">
              <button
                type="button"
                onClick={() => setZoom('fit')}
                className="flex h-8 min-w-14 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium tabular-nums transition-colors hover:bg-surface-2"
              >
                {zoom === 'fit' && <Maximize className="size-3 text-muted" />}
                {Math.round(info.scale * 100)}%
              </button>
            </Tooltip>
            <Tooltip content="Zoom in" side="top">
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => step(1)} aria-label="Zoom in">
                <Plus />
              </Button>
            </Tooltip>
            <span className="mx-1 h-4 w-px bg-border" />
          </>
        )}
        <span className="px-2.5 text-xs font-medium tabular-nums text-muted">
          {info.pages} {info.pages === 1 ? 'page' : 'pages'}
        </span>
        {!isDesktop && (
          <Button size="sm" className="rounded-full" onClick={() => download(resume)}>
            <Download /> PDF
          </Button>
        )}
      </div>
    </>
  )
}

function DesktopTabs({ tab, onChange }: { tab: PanelId; onChange: (t: PanelId) => void }) {
  return (
    <div className="shrink-0 border-b border-border px-3 pt-2">
      <div className="flex gap-1" role="tablist">
        {PANELS.map((p) => {
          const active = p.id === tab
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(p.id)}
              className={cn(
                'relative flex h-10 flex-1 items-center justify-center gap-2 rounded-t-lg text-[13px] font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted hover:text-foreground',
              )}
            >
              <p.icon className="size-4" />
              {p.label}
              {active && (
                <motion.span
                  layoutId="desktop-tab-indicator"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MobileTabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: Array<{ id: Tab; label: string; icon: ComponentType<{ className?: string }> }> = [
    ...PANELS.map(({ id, label, icon }) => ({ id: id as Tab, label, icon })),
    { id: 'preview', label: 'Preview', icon: Eye },
  ]
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl lg:hidden" aria-label="Editor sections">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {items.map((it) => {
          const active = it.id === tab
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onChange(it.id)}
              aria-current={active ? 'page' : undefined}
              className={cn('relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors', active ? 'text-foreground' : 'text-muted')}
            >
              <span className="relative grid h-7 w-12 place-items-center">
                {active && (
                  <motion.span
                    layoutId="mobile-tab-indicator"
                    className="absolute inset-0 rounded-full bg-accent-soft"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                  />
                )}
                <it.icon className={cn('relative size-[18px] transition-transform duration-300', active && 'scale-110 text-accent-foreground')} />
              </span>
              {it.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function EditorShell() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [rawTab, setTab] = useState<Tab>('content')
  // On desktop the preview is always visible, so there is no preview tab
  const tab: Tab = isDesktop && rawTab === 'preview' ? 'content' : rawTab
  const [visited, setVisited] = useState<Set<PanelId>>(() => new Set(['content']))
  const panel: PanelId = tab === 'preview' ? 'content' : tab
  const { id } = useEditor()
  const download = useDownload()

  const changeTab = useCallback((t: Tab) => {
    setTab(t)
    if (t !== 'preview') setVisited((v) => (v.has(t) ? v : new Set(v).add(t)))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod || e.altKey) return
      const k = e.key.toLowerCase()
      const temporal = useResumeStore.temporal.getState()
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault()
        temporal.undo()
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault()
        temporal.redo()
      } else if (k === 'p') {
        e.preventDefault()
        download(useResumeStore.getState().resumes[id])
      } else if (k === 's') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id, download])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <EditorHeader />
      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            'flex min-h-0 w-full flex-col border-border bg-background lg:w-[440px] lg:border-r xl:w-[500px] 2xl:w-[540px]',
            tab === 'preview' && 'max-lg:hidden',
          )}
        >
          {isDesktop && <DesktopTabs tab={panel} onChange={changeTab} />}
          <div className="relative min-h-0 flex-1">
            {PANELS.map(({ id: pid, Component, keepMounted }) => {
              const active = pid === panel
              const mounted = active || (keepMounted && visited.has(pid))
              if (!mounted) return null
              return (
                <div
                  key={pid}
                  inert={!active}
                  aria-hidden={!active}
                  className={cn(
                    'absolute inset-0 overflow-y-auto overscroll-contain pb-24 scrollbar-thin transition-[opacity,translate] duration-300 ease-[var(--ease-out-expo)] lg:pb-10',
                    active ? 'translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-1.5 opacity-0',
                  )}
                >
                  <div className="mx-auto max-w-2xl">
                    <Component />
                  </div>
                </div>
              )
            })}
          </div>
        </aside>
        <main className={cn('canvas-dots relative min-h-0 flex-1 overflow-hidden', tab !== 'preview' && 'max-lg:hidden')}>
          <PreviewPane isDesktop={isDesktop} />
        </main>
      </div>
      {!isDesktop && <MobileTabBar tab={tab} onChange={changeTab} />}
      <DownloadDialog />
    </div>
  )
}

export default function EditorPage() {
  const { id = '' } = useParams()
  const exists = useResumeStore((s) => !!s.resumes[id])

  useEffect(() => {
    useResumeStore.temporal.getState().clear()
  }, [id])

  useEffect(() => {
    const title = useResumeStore.getState().resumes[id]?.title
    if (title) document.title = `${title} — Vitae`
    return () => {
      document.title = 'Vitae — Free Resume & CV Builder'
    }
  }, [id])

  const ctx = useMemo<EditorCtx>(
    () => ({ id, update: (recipe) => useResumeStore.getState().updateResume(id, recipe) }),
    [id],
  )

  if (!exists) return <NotFound message="This resume doesn't exist or was deleted from this browser." />

  return (
    <EditorContext.Provider value={ctx}>
      <EditorShell key={id} />
    </EditorContext.Provider>
  )
}
