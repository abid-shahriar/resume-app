import { Download, Eye, LayoutTemplate, Maximize, Minus, Palette, PanelsTopLeft, PenLine, Plus, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState, type ComponentType, type CSSProperties } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { create } from 'zustand'
import { Tip, useIsDesktop } from '@/components/kit'
import { ResumePreview, type Zoom } from '@/components/ResumePreview'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import NotFound from '@/pages/NotFound'
import { redo, undo, useResumeStore } from '@/store/resumes'
import { ContentPanel } from './ContentPanel'
import { EditorContext, useEditor, type EditorCtx } from './context'
import { DesignPanel } from './DesignPanel'
import { DownloadDialog, useDownload } from './DownloadDialog'
import { EditorHeader } from './EditorHeader'
import { LayoutPanel } from './LayoutPanel'
import { TemplatesPanel } from './TemplatesPanel'

type PanelId = 'content' | 'templates' | 'design' | 'layout'

const PANELS: Array<{ id: PanelId; label: string; icon: ComponentType<{ className?: string }>; Component: ComponentType; keepMounted: boolean }> = [
  { id: 'content', label: 'Content', icon: PenLine, Component: ContentPanel, keepMounted: true },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, Component: TemplatesPanel, keepMounted: false },
  { id: 'design', label: 'Design', icon: Palette, Component: DesignPanel, keepMounted: true },
  { id: 'layout', label: 'Layout', icon: PanelsTopLeft, Component: LayoutPanel, keepMounted: true },
]
const PANEL_IDS = PANELS.map((p) => p.id)

/** Mobile preview drawer state. */
const usePreviewDrawer = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

const ZOOM_STEPS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]

function DesktopPreview() {
  const { id } = useEditor()
  const resume = useResumeStore((s) => s.resumes[id])
  const [zoom, setZoom] = useState<Zoom>('fit')
  const [info, setInfo] = useState({ pages: 1, scale: 1 })
  const onLayout = useCallback((v: { pages: number; scale: number }) => setInfo(v), [])

  const step = (dir: 1 | -1) => {
    const current = zoom === 'fit' ? info.scale : zoom
    const next = dir === 1 ? ZOOM_STEPS.find((z) => z > current + 0.001) : [...ZOOM_STEPS].reverse().find((z) => z < current - 0.001)
    if (next) setZoom(next)
  }

  return (
    <>
      <div className="absolute inset-0 overflow-auto scrollbar-thin">
        <div className="min-h-full pb-24 pt-10">
          <ResumePreview resume={resume} zoom={zoom} padding={48} maxFitScale={1.1} onLayout={onLayout} />
        </div>
      </div>
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border bg-popover/90 p-1 shadow-lg backdrop-blur-xl">
        <Tip content="Zoom out" side="top">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => step(-1)} aria-label="Zoom out">
            <Minus />
          </Button>
        </Tip>
        <Tip content={zoom === 'fit' ? 'Fit to width' : 'Reset to fit'} side="top">
          <button
            type="button"
            onClick={() => setZoom('fit')}
            className="flex h-8 min-w-14 items-center justify-center gap-1 rounded-full px-2 text-xs font-medium tabular-nums transition-colors hover:bg-muted"
          >
            {zoom === 'fit' && <Maximize className="size-3 text-muted-foreground" />}
            {Math.round(info.scale * 100)}%
          </button>
        </Tip>
        <Tip content="Zoom in" side="top">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => step(1)} aria-label="Zoom in">
            <Plus />
          </Button>
        </Tip>
        <span className="mx-1 h-4 w-px bg-border" />
        <span className="px-2.5 text-xs font-medium tabular-nums text-muted-foreground">
          {info.pages} {info.pages === 1 ? 'page' : 'pages'}
        </span>
      </div>
    </>
  )
}

/** Phone/tablet preview: a swipe-to-dismiss bottom drawer over the editor. */
function PreviewDrawer() {
  const { id } = useEditor()
  const resume = useResumeStore((s) => s.resumes[id])
  const open = usePreviewDrawer((s) => s.open)
  const setOpen = usePreviewDrawer((s) => s.setOpen)
  const [pages, setPages] = useState(1)
  const download = useDownload()
  const onLayout = useCallback((v: { pages: number }) => setPages(v.pages), [])

  return (
    <Drawer open={open} onOpenChange={(o) => setOpen(o)} showSwipeHandle>
      <DrawerContent
        className="bg-canvas"
        style={{ '--drawer-height': 'calc(100dvh - 1.25rem)', '--drawer-content-max-height': 'none' } as CSSProperties}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 pb-2.5 pt-1">
          <div className="min-w-0 flex-1">
            <DrawerTitle className="text-sm font-semibold">Preview</DrawerTitle>
            <p className="text-xs text-muted-foreground">
              {pages} {pages === 1 ? 'page' : 'pages'} · Swipe down to close
            </p>
          </div>
          <Button onClick={() => download(resume)}>
            <Download /> PDF
          </Button>
          <DrawerClose render={<Button variant="subtle" size="icon-lg" aria-label="Close preview" />}>
            <X />
          </DrawerClose>
        </div>
        <div className="canvas-dots min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          {open && <ResumePreview resume={resume} padding={12} maxFitScale={1} onLayout={onLayout} />}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function DesktopTabs({ tab, onChange }: { tab: PanelId; onChange: (t: PanelId) => void }) {
  const index = PANEL_IDS.indexOf(tab)
  return (
    <div className="shrink-0 border-b border-border px-3 pt-2">
      <div className="relative grid grid-cols-4" role="tablist">
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
                'flex h-10 items-center justify-center gap-2 rounded-t-lg text-[13px] font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <p.icon className="size-4" />
              {p.label}
            </button>
          )
        })}
        {/* Sliding underline: equal-width tabs, pure CSS transform */}
        <span
          aria-hidden
          className="absolute -bottom-px left-0 h-0.5 w-1/4 px-3 transition-transform duration-300 ease-[var(--ease-out-expo)]"
          style={{ transform: `translateX(${index * 100}%)` }}
        >
          <span className="block h-full rounded-full bg-primary" />
        </span>
      </div>
    </div>
  )
}

function MobileTabBar({ tab, onChange }: { tab: PanelId; onChange: (t: PanelId) => void }) {
  const index = PANEL_IDS.indexOf(tab)
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl" aria-label="Editor sections">
      <div className="relative mx-auto grid h-16 max-w-lg grid-cols-4">
        <span
          aria-hidden
          className="absolute left-0 top-2 flex h-7 w-1/4 justify-center transition-transform duration-300 ease-[var(--ease-out-expo)]"
          style={{ transform: `translateX(${index * 100}%)` }}
        >
          <span className="block h-full w-14 rounded-full bg-primary-soft" />
        </span>
        {PANELS.map((p) => {
          const active = p.id === tab
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <span className="grid h-7 place-items-center">
                <p.icon className={cn('size-[18px] transition-transform duration-300', active && 'scale-110 text-primary-soft-foreground')} />
              </span>
              {p.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function PreviewFab() {
  const open = usePreviewDrawer((s) => s.open)
  const setOpen = usePreviewDrawer((s) => s.setOpen)
  return (
    <AnimatePresence>
      {!open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 8 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.875rem)] right-4 z-40"
        >
          <Button size="xl" className="rounded-full px-5 shadow-lg" onClick={() => setOpen(true)}>
            <Eye /> Preview
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function EditorShell() {
  const isDesktop = useIsDesktop()
  const [params] = useSearchParams()
  const [tab, setTab] = useState<PanelId>(() => {
    const t = params.get('tab') as PanelId | null
    return t && PANEL_IDS.includes(t) ? t : 'content'
  })
  const [visited, setVisited] = useState<Set<PanelId>>(() => new Set<PanelId>(['content', tab]))
  const { id } = useEditor()
  const download = useDownload()

  const changeTab = useCallback((t: PanelId) => {
    setTab(t)
    setVisited((v) => (v.has(t) ? v : new Set(v).add(t)))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod || e.altKey) return
      const k = e.key.toLowerCase()
      const isUndo = k === 'z' && !e.shiftKey
      const isRedo = (k === 'z' && e.shiftKey) || k === 'y'
      // Fields holding local drafts (dialogs, keyword/rename inputs) keep the browser's native text undo
      const target = e.target instanceof Element ? e.target : null
      if ((isUndo || isRedo) && target?.closest('[role="dialog"], [data-native-undo]')) return
      if (isUndo) {
        e.preventDefault()
        undo()
      } else if (isRedo) {
        e.preventDefault()
        redo()
      } else if (k === 'p') {
        e.preventDefault()
        download(useResumeStore.getState().resumes[id])
      } else if (k === 's') {
        e.preventDefault() // everything is saved automatically
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id, download])

  // The mobile preview drawer doesn't exist in the desktop layout
  useEffect(() => {
    if (isDesktop) usePreviewDrawer.getState().setOpen(false)
  }, [isDesktop])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <EditorHeader />
      <div className="flex min-h-0 flex-1">
        <aside className="flex min-h-0 w-full flex-col border-border bg-background lg:w-[440px] lg:border-r xl:w-[500px] 2xl:w-[540px]">
          {isDesktop && <DesktopTabs tab={tab} onChange={changeTab} />}
          <div className="relative min-h-0 flex-1">
            {PANELS.map(({ id: pid, Component, keepMounted }) => {
              const active = pid === tab
              const mounted = active || (keepMounted && visited.has(pid))
              if (!mounted) return null
              return (
                <div
                  key={pid}
                  inert={!active}
                  aria-hidden={!active}
                  className={cn(
                    // Panels stay mounted and keep their own scroll position
                    'absolute inset-0 overflow-y-auto overscroll-contain scrollbar-thin transition-[opacity,translate] duration-300 ease-[var(--ease-out-expo)]',
                    isDesktop ? 'pb-10' : 'pb-[calc(9rem+env(safe-area-inset-bottom))]',
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
        {isDesktop && (
          <main className="canvas-dots relative min-h-0 flex-1 overflow-hidden">
            <DesktopPreview />
          </main>
        )}
      </div>
      {!isDesktop && (
        <>
          <MobileTabBar tab={tab} onChange={changeTab} />
          <PreviewFab />
          <PreviewDrawer />
        </>
      )}
      <DownloadDialog />
    </div>
  )
}

export default function EditorPage() {
  const { id = '' } = useParams()
  const exists = useResumeStore((s) => !!s.resumes[id])
  const title = useResumeStore((s) => s.resumes[id]?.title)

  useEffect(() => {
    useResumeStore.temporal.getState().clear()
    usePreviewDrawer.getState().setOpen(false)
  }, [id])

  useEffect(() => {
    if (title) document.title = `${title} — Vitae`
  }, [title])
  useEffect(
    () => () => {
      document.title = 'Vitae — Free Resume & CV Builder'
    },
    [],
  )

  const ctx = useMemo<EditorCtx>(() => ({ id, update: (recipe) => useResumeStore.getState().updateResume(id, recipe) }), [id])

  if (!exists) return <NotFound message="This resume doesn't exist or was deleted from this browser." />

  return (
    <EditorContext.Provider value={ctx}>
      <EditorShell key={id} />
    </EditorContext.Provider>
  )
}
