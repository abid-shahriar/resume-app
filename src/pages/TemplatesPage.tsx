import { ArrowRight, Check, WandSparkles, X, ZoomIn } from 'lucide-react'
import { stagger, useAnimate } from 'motion/react'
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ResumeThumb } from '@/components/ResumePreview'
import { SiteFooter, SiteHeader } from '@/components/site'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ZoomablePreview } from '@/components/ZoomablePreview'
import { ResponsiveDialog, SwitchRow, useMediaQuery } from '@/components/kit'
import { cn } from '@/lib/utils'
import { useResumeStore } from '@/store/resumes'
import { templatePreview } from '@/templates/previews'
import { CUSTOM_TEMPLATE_ID, getTemplate, TEMPLATE_MAP, TEMPLATES, type TemplateDef } from '@/templates/registry'

const CUSTOM_DEF = getTemplate(CUSTOM_TEMPLATE_ID)

const FILTERS = ['All', 'Professional', 'Modern', 'Creative', 'Minimal', 'ATS-friendly', 'Two-column', 'Photo'] as const
type Filter = (typeof FILTERS)[number]

export function templateTags(t: TemplateDef): string[] {
  const tags: string[] = []
  if (t.atsFriendly) tags.push('ATS-friendly')
  if (t.layout === 'sidebar') tags.push('Two-column')
  if (t.photo) tags.push('Photo')
  return tags
}

function matches(t: TemplateDef, f: Filter) {
  if (f === 'All') return true
  if (f === 'ATS-friendly') return t.atsFriendly
  if (f === 'Two-column') return t.layout === 'sidebar'
  if (f === 'Photo') return t.photo
  return t.category === f
}

export const TemplateCard = memo(function TemplateCard({
  t,
  onSelect,
  active,
  eager,
  badge,
}: {
  t: TemplateDef
  onSelect: (t: TemplateDef) => void
  active?: boolean
  eager?: boolean
  badge?: string
}) {
  const preview = templatePreview(t.id)
  return (
    <button
      type="button"
      onClick={() => onSelect(t)}
      className="group flex w-full flex-col text-left outline-none"
      aria-label={`Preview ${t.name} template`}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-white shadow-sm transition-[box-shadow,transform,border-color] duration-300 ease-[var(--ease-out-expo)] group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:ring-4 group-focus-visible:ring-primary/30',
          active ? 'border-primary ring-2 ring-primary' : 'border-border',
        )}
      >
        <ResumeThumb resume={preview} eager={eager} />
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/45 via-black/0 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-stone-900 shadow-md transition-transform duration-300 group-hover:translate-y-0">
            Preview <ArrowRight className="size-3.5" />
          </span>
        </div>
        {active && (
          <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
        {badge && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground shadow-md">
            <WandSparkles className="size-3" /> {badge}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 px-0.5">
        <span className="font-medium">{t.name}</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: t.design.accent }} />
          <span className="text-xs text-muted-foreground">{t.category}</span>
        </span>
      </div>
    </button>
  )
})

/** Filter pills with a sliding highlight positioned from the active pill's box (scroll-safe, no layout projection). */
function FilterPills({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    const measure = () => {
      const el = row.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (el) setBox({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(row)
    // Re-measure once web fonts settle (pill widths depend on them)
    void document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [value])

  return (
    <div className="no-scrollbar -mx-4 mt-8 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <div ref={rowRef} className="relative flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {box && (
          <span
            aria-hidden
            className="absolute top-0 h-9 rounded-full bg-primary transition-[transform,width] duration-[400ms] ease-[var(--ease-out-expo)]"
            style={{ width: box.width, transform: `translateX(${box.left}px)` }}
          />
        )}
        {FILTERS.map((f) => {
          const active = value === f
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={(e) => {
                if (active) return
                onChange(f)
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
              }}
              className={cn(
                'relative h-9 shrink-0 rounded-full px-4 text-[13px] font-medium transition-colors duration-300',
                active ? 'text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
                !box && active && 'bg-primary',
              )}
            >
              {f}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Phone template sheet: a full-height preview you can swipe sideways to browse
 * the other templates in the current filter (scroll snap, one per slide).
 */
function TemplateCarousel({
  list,
  selected,
  onChange,
  onZoom,
}: {
  list: TemplateDef[]
  selected: TemplateDef
  onChange: (t: TemplateDef) => void
  onZoom: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const previews = useMemo(() => list.map((t) => templatePreview(t.id)), [list])
  const index = Math.max(0, list.findIndex((t) => t.id === selected.id))
  const initialIndex = useRef(index)

  // Start on the tapped template (instant, before paint)
  useLayoutEffect(() => {
    const el = ref.current
    if (el) el.scrollLeft = initialIndex.current * el.clientWidth
  }, [])

  const onScroll = () => {
    const el = ref.current
    if (!el || !el.clientWidth) return
    const t = list[Math.round(el.scrollLeft / el.clientWidth)]
    if (t && t.id !== selected.id) onChange(t)
  }

  return (
    <div className="-mx-4">
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {list.map((t, i) => (
          <div key={t.id} className="flex w-full shrink-0 snap-center justify-center px-4" aria-hidden={i !== index}>
            <button
              type="button"
              onClick={onZoom}
              tabIndex={i === index ? 0 : -1}
              aria-label={`Zoom into ${t.name}`}
              className="group relative h-[min(52dvh,520px)] aspect-[210/297] max-w-full overflow-hidden rounded-md shadow-[var(--shadow-paper)] ring-1 ring-black/5"
            >
              <ResumeThumb resume={previews[i]} priority={Math.abs(i - index) <= 1} />
              <span className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                <ZoomIn className="size-4" />
              </span>
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs font-medium tabular-nums text-muted-foreground">
        {index + 1} / {list.length} · Swipe to browse, tap to zoom
      </p>
    </div>
  )
}

export default function TemplatesPage() {
  const [params] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('All')
  const [selected, setSelected] = useState<TemplateDef | null>(() => {
    const t = params.get('t') ?? ''
    return t === CUSTOM_TEMPLATE_ID ? CUSTOM_DEF : (TEMPLATE_MAP[t] ?? null)
  })
  const [withSample, setWithSample] = useState(true)
  const createResume = useResumeStore((s) => s.createResume)
  const navigate = useNavigate()
  const visibleIds = useMemo(() => new Set(TEMPLATES.filter((t) => matches(t, filter)).map((t) => t.id)), [filter])
  // What the phone sheet can swipe through: the gallery's current selection
  const browseList = useMemo(() => {
    const list = TEMPLATES.filter((t) => visibleIds.has(t.id))
    return filter === 'All' ? [CUSTOM_DEF, ...list] : list
  }, [filter, visibleIds])
  const wide = useMediaQuery('(min-width: 640px)')
  const selectedPreview = useMemo(() => (selected ? templatePreview(selected.id) : null), [selected])
  const [zoomed, setZoomed] = useState(false)
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const firstRender = useRef(true)

  // Cards stay mounted (only hidden), so thumbnails never re-render. After a
  // filter change, the visible set eases in with a short stagger.
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const cards = Array.from(scope.current?.querySelectorAll<HTMLElement>('[data-card]:not([hidden])') ?? [])
    if (!cards.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    cards.forEach((c) => (c.style.opacity = '0'))
    const controls = animate(
      cards,
      { opacity: [0, 1], y: [14, 0] },
      { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: stagger(0.035, { startDelay: 0.02 }) },
    )
    return () => controls.stop()
  }, [filter, animate, scope])

  const select = useCallback((t: TemplateDef) => setSelected(t), [])

  const use = (t: TemplateDef) => {
    const id = createResume({ templateId: t.id, sample: withSample })
    setSelected(null)
    // Custom layouts open on the Design tab, where the layout builder lives
    navigate(t.id === CUSTOM_TEMPLATE_ID ? `/edit/${id}?tab=design` : `/edit/${id}`)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <div className="max-w-2xl animate-fade-up">
          <p className="text-sm font-medium text-primary-soft-foreground">{TEMPLATES.length} templates</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Choose a template to start</h1>
          <p className="mt-3 text-muted-foreground text-balance">
            Every template is fully customizable. Switch anytime without losing a word of your content.
          </p>
        </div>

        <FilterPills value={filter} onChange={setFilter} />

        <div ref={scope} className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          <div data-card hidden={filter !== 'All'}>
            <TemplateCard t={CUSTOM_DEF} onSelect={select} eager badge="Build your own" />
          </div>
          {TEMPLATES.map((t) => (
            <div key={t.id} data-card hidden={!visibleIds.has(t.id)}>
              <TemplateCard t={t} onSelect={select} eager />
            </div>
          ))}
        </div>
        {visibleIds.size === 0 && <p className="py-16 text-center text-muted-foreground">No templates match this filter.</p>}
      </main>
      <SiteFooter />

      <ResponsiveDialog
        open={!!selected}
        onOpenChange={(o) => {
          if (o) return
          setSelected(null)
          setZoomed(false)
        }}
        size="xl"
        title={selected ? (selected.id === CUSTOM_TEMPLATE_ID ? 'Custom layout' : `${selected.name} template`) : ''}
        description={selected && <span className="line-clamp-2 sm:line-clamp-none">{selected.description}</span>}
        footer={
          !wide &&
          selected && (
            <>
              <SwitchRow label="Start with example content" checked={withSample} onCheckedChange={setWithSample} className="px-0.5" />
              <Button size="xl" onClick={() => use(selected)} className="w-full">
                {selected.id === CUSTOM_TEMPLATE_ID ? 'Start building' : 'Use this template'} <ArrowRight />
              </Button>
            </>
          )
        }
      >
        {selected && !wide && (
          <TemplateCarousel
            list={browseList.some((t) => t.id === selected.id) ? browseList : [selected]}
            selected={selected}
            onChange={setSelected}
            onZoom={() => setZoomed(true)}
          />
        )}
        {selected && wide && (
          <div className="grid gap-6 md:grid-cols-[1fr_280px]">
            <ZoomablePreview
              key={selected.id}
              resume={selectedPreview!}
              padding={24}
              maxFitScale={0.8}
              className="canvas-dots h-[min(68dvh,720px)] overflow-hidden rounded-xl border border-border bg-canvas"
              innerClassName="pb-20 pt-6"
            />
            <div className="flex flex-col gap-5 md:pt-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-soft-foreground">
                  {selected.category}
                </span>
                {templateTags(selected).map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Headings</dt>
                  <dd className="font-medium">{selected.design.headingFont}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Body</dt>
                  <dd className="font-medium">{selected.design.bodyFont}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Layout</dt>
                  <dd className="font-medium capitalize">{selected.layout === 'sidebar' ? 'Two columns' : selected.layout}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Accent</dt>
                  <dd className="flex items-center gap-1.5 font-medium">
                    <span className="size-3 rounded-full" style={{ background: selected.design.accent }} />
                    {selected.design.accent}
                  </dd>
                </div>
              </dl>
              <div className="rounded-xl border border-border p-3">
                <SwitchRow
                  label="Start with example content"
                  description="Edit a filled-in resume instead of a blank one"
                  checked={withSample}
                  onCheckedChange={setWithSample}
                />
              </div>
              <Button size="xl" onClick={() => use(selected)} className="w-full">
                {selected.id === CUSTOM_TEMPLATE_ID ? 'Start building' : 'Use this template'} <ArrowRight />
              </Button>
            </div>
          </div>
        )}
      </ResponsiveDialog>

      {/* Phones: full-screen, pinch-zoomable view of the template */}
      <Dialog open={zoomed && !!selectedPreview && !wide} onOpenChange={(o) => !o && setZoomed(false)}>
        <DialogContent
          showCloseButton={false}
          className="inset-0 top-0 left-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-canvas p-0 ring-0 sm:max-w-none"
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background/95 py-2.5 pl-4 pr-2 pt-[max(0.625rem,env(safe-area-inset-top))]">
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-sm font-semibold">{selected?.name}</DialogTitle>
              <DialogDescription className="text-xs">Pinch or double-tap to zoom</DialogDescription>
            </div>
            <DialogClose render={<Button variant="subtle" size="icon-lg" aria-label="Close" />}>
              <X />
            </DialogClose>
          </div>
          {selectedPreview && (
            <ZoomablePreview
              key={selected?.id}
              resume={selectedPreview}
              padding={10}
              maxFitScale={1}
              className="canvas-dots min-h-0 flex-1"
              innerClassName="pb-24 pt-4"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
