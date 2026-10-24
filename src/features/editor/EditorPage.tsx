import { ChevronLeft, Download, LayoutTemplate, Palette, PanelsTopLeft, PenLine, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ComponentType, type CSSProperties } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { create } from 'zustand'
import { useIsDesktop } from '@/components/kit'
import { ZoomablePreview } from '@/components/ZoomablePreview'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerSwipeArea, DrawerTitle } from '@/components/ui/drawer'
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

function DesktopPreview() {
  const { id } = useEditor()
  const resume = useResumeStore((s) => s.resumes[id])
  return <ZoomablePreview resume={resume} padding={48} maxFitScale={1.1} className="absolute inset-0" innerClassName="pb-24 pt-10" />
}

/**
 * Phone/tablet preview: a side sheet that follows the finger. Swipe left on the
 * edge handle (or anywhere along the right edge) to pull it in, swipe right to
 * put it away. Tapping the handle opens it too.
 */
function PreviewDrawer() {
  const { id } = useEditor()
  const resume = useResumeStore((s) => s.resumes[id])
  const open = usePreviewDrawer((s) => s.open)
  const setOpen = usePreviewDrawer((s) => s.setOpen)
  const [pages, setPages] = useState(1)
  const download = useDownload()
  const onLayout = useCallback((v: { pages: number }) => setPages(v.pages), [])

  return (
    <Drawer open={open} onOpenChange={(o) => setOpen(o)} swipeDirection="right" showSwipeHandle>
      {/* Thin invisible strip along the edge, between the header and the tab bar */}
      <DrawerSwipeArea className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] right-0 top-14 z-30 w-3 data-open:pointer-events-none" />
      <DrawerSwipeArea
        role="button"
        tabIndex={0}
        aria-label="Open preview"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        className="group fixed right-0 top-1/2 z-40 -translate-y-1/2 cursor-pointer pl-3 outline-none transition-opacity duration-200 data-open:pointer-events-none data-open:opacity-0"
      >
        <span className="flex h-32 w-8 flex-col items-center justify-center gap-2.5 rounded-l-2xl border border-r-0 border-border bg-background/90 text-muted-foreground shadow-[0_6px_24px_-6px_var(--shadow-color)] backdrop-blur-xl transition-[width,color] group-hover:text-foreground group-focus-visible:ring-3 group-focus-visible:ring-ring/50 group-data-swiping:w-10">
          <span className="h-8 w-1 rounded-full bg-primary/70" />
          <span className="text-[11px] font-semibold tracking-wide [writing-mode:vertical-rl] rotate-180">Preview</span>
          <ChevronLeft className="size-4" />
        </span>
      </DrawerSwipeArea>
      <DrawerContent
        className="bg-canvas pt-[env(safe-area-inset-top)]"
        style={{ '--drawer-content-width': 'min(calc(100% - 0.75rem), 40rem)' } as CSSProperties}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background/95 py-2.5 pl-1 pr-3">
          <div className="min-w-0 flex-1">
            <DrawerTitle className="text-sm font-semibold">Preview</DrawerTitle>
            <p className="text-xs text-muted-foreground">
              {pages} {pages === 1 ? 'page' : 'pages'} · Pinch to zoom
            </p>
          </div>
          <Button onClick={() => download(resume)}>
            <Download /> PDF
          </Button>
          <DrawerClose render={<Button variant="subtle" size="icon-lg" aria-label="Close preview" />}>
            <X />
          </DrawerClose>
        </div>
        {open && (
          <ZoomablePreview
            resume={resume}
            padding={10}
            maxFitScale={1}
            onLayout={onLayout}
            className="canvas-dots min-h-0 flex-1"
            innerClassName="pb-24 pt-4"
          />
        )}
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
    if (title) document.title = `${title} — CvGhor`
  }, [title])
  useEffect(
    () => () => {
      document.title = 'CvGhor — Free Resume & CV Builder'
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
