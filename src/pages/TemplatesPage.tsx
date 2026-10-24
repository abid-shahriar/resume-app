import { ArrowRight, Check } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { ResumeThumb } from '@/components/ResumePreview'
import { SiteFooter, SiteHeader } from '@/components/site'
import { Button } from '@/components/ui/button'
import { SwitchRow } from '@/components/ui/controls'
import { Dialog } from '@/components/ui/dialog'
import { withViewTransition } from '@/lib/transitions'
import { cn } from '@/lib/utils'
import { useResumeStore } from '@/store/resumes'
import { templatePreview } from '@/templates/previews'
import { TEMPLATES, type TemplateDef } from '@/templates/registry'

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

export function TemplateCard({ t, onSelect, active, eager }: { t: TemplateDef; onSelect: () => void; active?: boolean; eager?: boolean }) {
  const preview = templatePreview(t.id)
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full flex-col text-left outline-none"
      aria-label={`Preview ${t.name} template`}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-white shadow-sm transition-[box-shadow,transform,border-color] duration-300 ease-[var(--ease-out-expo)] group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:ring-4 group-focus-visible:ring-accent/30',
          active ? 'border-accent ring-2 ring-accent' : 'border-border',
        )}
      >
        <ResumeThumb resume={preview} eager={eager} />
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/45 via-black/0 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-stone-900 shadow-md transition-transform duration-300 group-hover:translate-y-0">
            Preview <ArrowRight className="size-3.5" />
          </span>
        </div>
        {active && (
          <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-accent text-white shadow-md">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 px-0.5">
        <span className="font-medium">{t.name}</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: t.design.accent }} />
          <span className="text-xs text-muted">{t.category}</span>
        </span>
      </div>
    </button>
  )
}

export default function TemplatesPage() {
  const [filter, setFilter] = useState<Filter>('All')
  const [selected, setSelected] = useState<TemplateDef | null>(null)
  const [withSample, setWithSample] = useState(true)
  const createResume = useResumeStore((s) => s.createResume)
  const navigate = useNavigate()
  const visibleIds = useMemo(() => new Set(TEMPLATES.filter((t) => matches(t, filter)).map((t) => t.id)), [filter])

  const use = (t: TemplateDef) => {
    const id = createResume({ templateId: t.id, sample: withSample })
    setSelected(null)
    navigate(`/edit/${id}`)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <div className="max-w-2xl animate-fade-up">
          <p className="text-sm font-medium text-accent-foreground">{TEMPLATES.length} templates</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Choose a template to start</h1>
          <p className="mt-3 text-muted text-balance">
            Every template is fully customizable. Switch anytime without losing a word of your content.
          </p>
        </div>

        <div className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => filter !== f && withViewTransition(() => setFilter(f))}
              className={cn(
                'relative h-9 shrink-0 rounded-full px-4 text-[13px] font-medium transition-colors',
                filter === f ? 'text-primary-foreground' : 'bg-surface-2 text-muted hover:text-foreground',
              )}
            >
              {filter === f && (
                <span className="absolute inset-0 rounded-full bg-primary" style={{ viewTransitionName: 'tpl-filter-pill' }} />
              )}
              <span className="relative">{f}</span>
            </button>
          ))}
        </div>

        {/* All cards stay mounted (hidden when filtered out) so thumbnails never re-render;
            the reflow is animated with a View Transition. */}
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              hidden={!visibleIds.has(t.id)}
              style={{ viewTransitionName: `tpl-${t.id}`, viewTransitionClass: 'tpl-card' } as CSSProperties}
            >
              <TemplateCard t={t} onSelect={() => setSelected(t)} eager />
            </div>
          ))}
        </div>
        {visibleIds.size === 0 && <p className="py-16 text-center text-muted">No templates match this filter.</p>}
      </main>
      <SiteFooter />

      <Dialog
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        size="xl"
        title={selected ? `${selected.name} template` : ''}
        description={selected?.description}
      >
        {selected && (
          <div className="grid gap-6 md:grid-cols-[1fr_280px]">
            <div className="overflow-hidden rounded-xl border border-border bg-canvas p-3 sm:p-6">
              <div className="mx-auto max-w-[520px] overflow-hidden rounded shadow-[var(--shadow-paper)]">
                <ResumeThumb resume={templatePreview(selected.id)} />
              </div>
            </div>
            <div className="flex flex-col gap-5 md:pt-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  {selected.category}
                </span>
                {templateTags(selected).map((tag) => (
                  <span key={tag} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
                    {tag}
                  </span>
                ))}
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Headings</dt>
                  <dd className="font-medium">{selected.design.headingFont}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Body</dt>
                  <dd className="font-medium">{selected.design.bodyFont}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Layout</dt>
                  <dd className="font-medium capitalize">{selected.layout === 'sidebar' ? 'Two columns' : selected.layout}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Accent</dt>
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
              <Button size="lg" onClick={() => use(selected)} className="w-full">
                Use this template <ArrowRight />
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
