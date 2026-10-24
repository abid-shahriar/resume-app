import { AlignCenter, AlignLeft, LockKeyhole, RotateCcw, WandSparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { ColorInput, ColorSwatches } from '@/components/color-picker'
import { Field, Segmented, SliderField, SwitchRow } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '@/components/ui/native-select'
import { FONTS } from '@/lib/fonts'
import type { CustomLayout, Design, HeaderKind, HeadingStyle, Resume, SectionFlow, SidebarTone, SkillStyle } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toCustom } from '@/templates/previews'
import { CUSTOM_TEMPLATE_ID, resolveTemplate, templateDesign } from '@/templates/registry'
import { useEditor, useEditorSelect } from './context'

function Group({ title, children, action, description }: { title: string; children: ReactNode; action?: ReactNode; description?: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] font-medium text-foreground/90">{label}</span>
      {children}
    </div>
  )
}

function FontSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const groups = [
    { label: 'Sans-serif', fonts: FONTS.filter((f) => f.category === 'sans') },
    { label: 'Serif', fonts: FONTS.filter((f) => f.category === 'serif') },
    { label: 'Monospace', fonts: FONTS.filter((f) => f.category === 'mono') },
  ]
  return (
    <Field label={label}>
      {(id) => (
        <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
          {groups.map((g) => (
            <NativeSelectOptGroup key={g.label} label={g.label}>
              {g.fonts.map((f) => (
                <NativeSelectOption key={f.family} value={f.family}>
                  {f.family}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
          ))}
        </NativeSelect>
      )}
    </Field>
  )
}

/* ------------------------------ visual pickers ------------------------------ */

function TileGroup<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
}: {
  value: T
  options: Array<{ value: T; label: string; preview: ReactNode }>
  onChange: (v: T) => void
  columns?: 2 | 3 | 4
}) {
  return (
    <div className={cn('grid gap-2', { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[columns])} role="radiogroup">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => !active && onChange(o.value)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border p-2 outline-none transition-[border-color,background-color] focus-visible:ring-3 focus-visible:ring-ring/50',
              active ? 'border-primary bg-primary-soft/60' : 'border-border hover:border-border-strong',
            )}
          >
            <span className="relative block h-14 w-11 overflow-hidden rounded-[3px] bg-background shadow-xs ring-1 ring-foreground/10">{o.preview}</span>
            <span className={cn('text-center text-[11px] font-medium leading-tight', active ? 'text-primary-soft-foreground' : 'text-muted-foreground')}>
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Tiny schematic building blocks for layout tiles. */
const Ln = ({ w = 'w-full', strong }: { w?: string; strong?: boolean }) => (
  <span className={cn('block h-[2px] rounded-full', w, strong ? 'bg-foreground/55' : 'bg-foreground/20')} />
)
const Lines = ({ n = 4 }: { n?: number }) => (
  <span className="flex flex-col gap-[3px]">
    {Array.from({ length: n }, (_, i) => (
      <Ln key={i} w={i % 3 === 2 ? 'w-2/3' : 'w-full'} />
    ))}
  </span>
)
const Dot = ({ className }: { className?: string }) => <span className={cn('block size-2 rounded-full bg-primary/60', className)} />

function OneColumnHeader({ kind }: { kind: HeaderKind }) {
  if (kind === 'banner')
    return (
      <span className="flex h-full flex-col">
        <span className="flex h-4 items-center gap-1 bg-primary/70 px-1">
          <span className="block h-[3px] w-5 rounded-full bg-white/90" />
        </span>
        <span className="p-1.5">
          <Lines n={5} />
        </span>
      </span>
    )
  if (kind === 'split')
    return (
      <span className="flex h-full flex-col gap-1.5 p-1.5">
        <span className="flex justify-between gap-1">
          <span className="flex w-1/2 flex-col gap-[3px]">
            <Ln strong />
            <Ln w="w-2/3" />
          </span>
          <span className="flex w-1/3 flex-col items-end gap-[2px]">
            <Ln />
            <Ln />
            <Ln />
          </span>
        </span>
        <Lines n={4} />
      </span>
    )
  return (
    <span className="flex h-full flex-col gap-1.5 p-1.5">
      <span className="flex items-center gap-1">
        <Dot />
        <span className="flex flex-1 flex-col gap-[3px]">
          <Ln strong />
          <Ln w="w-2/3" />
        </span>
      </span>
      <Lines n={4} />
    </span>
  )
}

function TwoColumnHeader({ kind }: { kind: HeaderKind }) {
  const sidebar = (withHeader: boolean) => (
    <span className="flex w-[38%] flex-col gap-[3px] bg-primary/15 p-1">
      {withHeader && <Dot className="mb-0.5 self-center" />}
      <Ln />
      <Ln w="w-2/3" />
      <Ln />
    </span>
  )
  const main = (withHeader: boolean) => (
    <span className="flex flex-1 flex-col gap-[3px] p-1">
      {withHeader && <Ln strong />}
      <Lines n={withHeader ? 4 : 5} />
    </span>
  )
  if (kind === 'top' || kind === 'banner')
    return (
      <span className="flex h-full flex-col">
        <span className={cn('flex h-3.5 items-center px-1', kind === 'banner' && 'bg-primary/70')}>
          <span className={cn('block h-[3px] w-6 rounded-full', kind === 'banner' ? 'bg-white/90' : 'bg-foreground/55')} />
        </span>
        <span className="flex flex-1">
          {sidebar(false)}
          {main(false)}
        </span>
      </span>
    )
  return (
    <span className="flex h-full">
      {sidebar(kind === 'sidebar')}
      {main(kind === 'main')}
    </span>
  )
}

function FlowPreview({ flow }: { flow: SectionFlow }) {
  if (flow === 'timeline')
    return (
      <span className="flex h-full flex-col gap-1.5 p-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex gap-1">
            <span className="w-2.5">
              <Ln />
            </span>
            <span className="relative w-[2px] bg-foreground/20">
              <span className="absolute -left-[2px] top-0 size-[6px] rounded-full bg-primary/70" />
            </span>
            <span className="flex flex-1 flex-col gap-[3px]">
              <Ln strong />
              <Ln w="w-2/3" />
            </span>
          </span>
        ))}
      </span>
    )
  if (flow === 'labels')
    return (
      <span className="flex h-full flex-col gap-1.5 p-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex gap-1">
            <span className="w-2.5 pt-px">
              <span className="block h-[2px] w-full rounded-full bg-primary/70" />
            </span>
            <span className="flex flex-1 flex-col gap-[3px]">
              <Ln />
              <Ln w="w-2/3" />
            </span>
          </span>
        ))}
      </span>
    )
  return (
    <span className="flex h-full flex-col gap-1.5 p-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex flex-col gap-[3px]">
          <span className="block h-[2px] w-1/3 rounded-full bg-primary/70" />
          <Ln />
        </span>
      ))}
    </span>
  )
}

const HEADING_STYLES: Array<{ value: HeadingStyle; label: string }> = [
  { value: 'line', label: 'Line' },
  { value: 'underline', label: 'Underline' },
  { value: 'bar', label: 'Bar' },
  { value: 'filled', label: 'Filled' },
  { value: 'tint', label: 'Tint' },
  { value: 'plain', label: 'Plain' },
  { value: 'dot', label: 'Dot' },
  { value: 'boxed', label: 'Boxed' },
]

function HeadingPreview({ style, accent }: { style: HeadingStyle; accent: string }) {
  const bar = (
    <span
      className="h-1 w-8 rounded-full"
      style={{ background: style === 'filled' ? '#fff' : style === 'bar' || style === 'dot' ? 'var(--foreground)' : accent }}
    />
  )
  switch (style) {
    case 'line':
      return (
        <span className="flex w-full items-center gap-1.5">
          {bar}
          <span className="h-px flex-1 opacity-40" style={{ background: accent }} />
        </span>
      )
    case 'underline':
      return (
        <span className="flex w-full border-b-[1.5px] pb-1" style={{ borderColor: accent }}>
          {bar}
        </span>
      )
    case 'bar':
      return (
        <span className="flex w-full border-l-[3px] pl-1.5" style={{ borderColor: accent }}>
          {bar}
        </span>
      )
    case 'filled':
      return (
        <span className="inline-flex rounded-sm px-1.5 py-1" style={{ background: accent }}>
          {bar}
        </span>
      )
    case 'tint':
      return (
        <span className="flex w-full rounded-sm px-1.5 py-1" style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)` }}>
          {bar}
        </span>
      )
    case 'plain':
      return <span className="flex w-full">{bar}</span>
    case 'dot':
      return (
        <span className="flex w-full items-center gap-1.5">
          <span className="size-1.5 rounded-[2px]" style={{ background: accent }} />
          {bar}
        </span>
      )
    case 'boxed':
      return (
        <span className="inline-flex border-[1.5px] px-1.5 py-0.5" style={{ borderColor: accent }}>
          {bar}
        </span>
      )
  }
}

const TONES: Array<{ value: SidebarTone; label: string }> = [
  { value: 'accent', label: 'Color' },
  { value: 'dark', label: 'Dark' },
  { value: 'tint', label: 'Tint' },
  { value: 'gray', label: 'Gray' },
  { value: 'plain', label: 'None' },
]

function toneSwatch(tone: SidebarTone, accent: string) {
  switch (tone) {
    case 'accent':
      return accent
    case 'dark':
      return `color-mix(in srgb, ${accent} 9%, #111318)`
    case 'tint':
      return `color-mix(in srgb, ${accent} 12%, #fff)`
    case 'gray':
      return '#f1f1f2'
    case 'plain':
      return '#fff'
  }
}

const PAGE_COLORS = ['#ffffff', '#fdfcf9', '#faf7f2', '#f7f9fc', '#f6f8f6']

const ALIGN_OPTIONS = [
  { value: 'left' as const, label: <AlignLeft className="size-4" />, title: 'Left' },
  { value: 'center' as const, label: <AlignCenter className="size-4" />, title: 'Center' },
]

/* ---------------------------------- panel ---------------------------------- */

function LayoutBuilder({ layout, onChange }: { layout: CustomLayout; onChange: (patch: Partial<CustomLayout>) => void }) {
  const two = layout.columns === 2
  return (
    <>
      <div>
        <div className="mb-2 text-[13px] font-medium text-foreground/80">Columns</div>
        <TileGroup<'1' | '2'>
          columns={2}
          value={two ? '2' : '1'}
          onChange={(v) => onChange(v === '2' ? { columns: 2, header: 'sidebar' } : { columns: 1, header: 'standard' })}
          options={[
            { value: '1', label: 'One column', preview: <OneColumnHeader kind="standard" /> },
            { value: '2', label: 'Two columns', preview: <TwoColumnHeader kind="sidebar" /> },
          ]}
        />
      </div>
      <div>
        <div className="mb-2 text-[13px] font-medium text-foreground/80">Header</div>
        {two ? (
          <TileGroup<HeaderKind>
            columns={4}
            value={layout.header}
            onChange={(header) => onChange({ header })}
            options={[
              { value: 'sidebar', label: 'In sidebar', preview: <TwoColumnHeader kind="sidebar" /> },
              { value: 'top', label: 'Full width', preview: <TwoColumnHeader kind="top" /> },
              { value: 'banner', label: 'Banner', preview: <TwoColumnHeader kind="banner" /> },
              { value: 'main', label: 'In main', preview: <TwoColumnHeader kind="main" /> },
            ]}
          />
        ) : (
          <TileGroup<HeaderKind>
            value={layout.header}
            onChange={(header) => onChange({ header })}
            options={[
              { value: 'standard', label: 'Standard', preview: <OneColumnHeader kind="standard" /> },
              { value: 'split', label: 'Split', preview: <OneColumnHeader kind="split" /> },
              { value: 'banner', label: 'Banner', preview: <OneColumnHeader kind="banner" /> },
            ]}
          />
        )}
      </div>
      {!two && (
        <div>
          <div className="mb-2 text-[13px] font-medium text-foreground/80">Sections</div>
          <TileGroup<SectionFlow>
            value={layout.flow}
            onChange={(flow) => onChange({ flow })}
            options={[
              { value: 'standard', label: 'Stacked', preview: <FlowPreview flow="standard" /> },
              { value: 'timeline', label: 'Timeline', preview: <FlowPreview flow="timeline" /> },
              { value: 'labels', label: 'Side labels', preview: <FlowPreview flow="labels" /> },
            ]}
          />
        </div>
      )}
      {(two || layout.flow !== 'timeline') && (
        <Row label="Dates">
          <Segmented
            size="sm"
            className="w-44"
            value={layout.entry}
            onChange={(entry) => onChange({ entry })}
            options={[
              { value: 'stacked', label: 'Right' },
              { value: 'dateLeft', label: 'Left column' },
            ]}
          />
        </Row>
      )}
      <SwitchRow label="Profile photo" description="Show a photo or your initials" checked={layout.photo} onCheckedChange={(photo) => onChange({ photo })} />
      <div className="-my-1 h-px bg-border" />
      <SwitchRow label="Lines between sections" checked={layout.sectionDividers} onCheckedChange={(sectionDividers) => onChange({ sectionDividers })} />
      {layout.header !== 'banner' && (
        <SwitchRow label="Line under header" checked={layout.headerDivider} onCheckedChange={(headerDivider) => onChange({ headerDivider })} />
      )}
      {two && <SwitchRow label="Line between columns" checked={layout.columnDivider} onCheckedChange={(columnDivider) => onChange({ columnDivider })} />}
      <SwitchRow label="Accent edge strip" description="A thin color bar along the left edge" checked={layout.strip} onCheckedChange={(strip) => onChange({ strip })} />
    </>
  )
}

export function DesignPanel() {
  const { update } = useEditor()
  const design = useEditorSelect((r) => r.design)
  const templateId = useEditorSelect((r) => r.templateId)
  const layout = useEditorSelect((r) => r.customLayout)
  const isCustom = templateId === CUSTOM_TEMPLATE_ID
  // Primitive selectors (resolveTemplate builds a new object for custom layouts)
  const templateName = useEditorSelect((r) => resolveTemplate(r).name)
  const hasPhoto = useEditorSelect((r) => resolveTemplate(r).photo)
  const twoColumn = useEditorSelect((r) => resolveTemplate(r).layout === 'sidebar')
  const classic = useEditorSelect((r) => resolveTemplate(r).layout === 'classic')
  const set = <K extends keyof Design>(key: K, value: Design[K]) => update((d) => void (d.design[key] = value))

  const reset = () =>
    update((d) => {
      d.design = { ...templateDesign(d.templateId), pageSize: d.design.pageSize, presentLabel: d.design.presentLabel }
    })

  const unlock = () => {
    update((d) => {
      const next = toCustom(d as Resume)
      d.templateId = next.templateId
      d.customLayout = next.customLayout
    })
    toast.success('Custom layout unlocked', { description: 'Your design is unchanged. Every option is now available.' })
  }

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      {isCustom ? (
        <Group
          title="Layout"
          description="Build your own structure. Changes show up instantly."
          action={
            <Button variant="subtle" size="sm" onClick={reset}>
              <RotateCcw /> Reset style
            </Button>
          }
        >
          <LayoutBuilder layout={layout} onChange={(patch) => update((d) => void Object.assign(d.customLayout, patch))} />
        </Group>
      ) : (
        <section className="flex gap-3 rounded-xl border border-primary/25 bg-primary-soft/50 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <LockKeyhole className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-semibold">{templateName} keeps its layout</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Colors, fonts and spacing are yours to change. For columns, lines, headings and more, unlock a custom layout. It starts
              from exactly this design.
            </p>
            <Button size="sm" className="mt-3" onClick={unlock}>
              <WandSparkles /> Customize layout
            </Button>
          </div>
        </section>
      )}

      <Group
        title="Color"
        action={
          !isCustom && (
            <Button variant="subtle" size="sm" onClick={reset}>
              <RotateCcw /> Reset
            </Button>
          )
        }
      >
        <ColorSwatches value={design.accent} onChange={(v) => set('accent', v)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Accent">{() => <ColorInput value={design.accent} onChange={(v) => set('accent', v)} label="Accent color" />}</Field>
          <Field label="Text">{() => <ColorInput value={design.textColor} onChange={(v) => set('textColor', v)} label="Text color" />}</Field>
        </div>
        <div>
          <div className="mb-2 text-[13px] font-medium text-foreground/80">Paper</div>
          <div className="flex items-center gap-2">
            {PAGE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('pageColor', c)}
                aria-label={`Paper color ${c}`}
                aria-pressed={design.pageColor === c}
                className={cn(
                  'size-8 rounded-full border border-border-strong transition-transform hover:scale-110',
                  design.pageColor === c && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </Group>

      <Group title="Typography">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FontSelect label="Headings" value={design.headingFont} onChange={(v) => set('headingFont', v)} />
          <FontSelect label="Body" value={design.bodyFont} onChange={(v) => set('bodyFont', v)} />
        </div>
        <SliderField label="Font size" value={design.fontSize} min={7.5} max={13} step={0.25} onChange={(v) => set('fontSize', v)} format={(v) => `${v}pt`} />
        <SliderField label="Line height" value={design.lineHeight} min={1.1} max={2} step={0.05} onChange={(v) => set('lineHeight', v)} format={(v) => v.toFixed(2)} />
        <SliderField label="Name size" value={design.nameScale} min={1.6} max={4.6} step={0.1} onChange={(v) => set('nameScale', v)} format={(v) => `${v.toFixed(1)}×`} />
      </Group>

      {isCustom && (
        <Group title="Section headings">
          <div className="grid grid-cols-4 gap-2">
            {HEADING_STYLES.map((h) => (
              <button
                key={h.value}
                type="button"
                onClick={() => set('headingStyle', h.value)}
                aria-pressed={design.headingStyle === h.value}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-2 pt-3 transition-[border-color,background-color]',
                  design.headingStyle === h.value ? 'border-primary bg-primary-soft/60' : 'border-border hover:border-border-strong',
                )}
              >
                <span className="flex h-5 w-full items-center justify-center px-1">
                  <HeadingPreview style={h.value} accent={design.accent} />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">{h.label}</span>
              </button>
            ))}
          </div>
          <SwitchRow label="Uppercase headings" checked={design.headingUppercase} onCheckedChange={(v) => set('headingUppercase', v)} />
          <Row label="Heading alignment">
            <Segmented size="sm" className="w-28" value={design.headingAlign} onChange={(v) => set('headingAlign', v)} options={ALIGN_OPTIONS} />
          </Row>
          <Row label="Header alignment">
            <Segmented size="sm" className="w-28" value={design.headerAlign} onChange={(v) => set('headerAlign', v)} options={ALIGN_OPTIONS} />
          </Row>
        </Group>
      )}

      {isCustom && twoColumn && (
        <Group title="Sidebar">
          <div className="grid grid-cols-5 gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set('sidebarTone', t.value)}
                aria-pressed={design.sidebarTone === t.value}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    'flex h-11 w-full overflow-hidden rounded-lg border transition-[box-shadow,border-color]',
                    design.sidebarTone === t.value ? 'border-primary ring-2 ring-primary/30' : 'border-border-strong',
                  )}
                >
                  <span className="h-full w-[38%] border-r border-black/5" style={{ background: toneSwatch(t.value, design.accent) }} />
                  <span className="h-full flex-1 bg-white" />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">{t.label}</span>
              </button>
            ))}
          </div>
          <Row label="Position">
            <Segmented
              size="sm"
              className="w-36"
              value={design.sidebarSide}
              onChange={(v) => set('sidebarSide', v)}
              options={[
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
              ]}
            />
          </Row>
          <SliderField label="Width" value={design.sidebarWidth} min={24} max={45} step={1} onChange={(v) => set('sidebarWidth', v)} format={(v) => `${v}%`} />
        </Group>
      )}

      <Group title="Details">
        <div>
          <div className="mb-2 text-[13px] font-medium text-foreground/80">Skills & languages</div>
          <Segmented<SkillStyle>
            value={design.skillStyle}
            onChange={(v) => set('skillStyle', v)}
            options={[
              { value: 'tags', label: 'Tags' },
              { value: 'bars', label: 'Bars' },
              { value: 'dots', label: 'Dots' },
              { value: 'text', label: 'Text' },
            ]}
          />
        </div>
        <SwitchRow label="Contact icons" checked={design.showIcons} onCheckedChange={(v) => set('showIcons', v)} />
        <SwitchRow label="Underline links" checked={design.underlineLinks} onCheckedChange={(v) => set('underlineLinks', v)} />
        {isCustom && classic && (
          <SwitchRow
            label="Side-by-side lists"
            description="Place skills, languages & interests next to each other"
            checked={design.inlineLists}
            onCheckedChange={(v) => set('inlineLists', v)}
          />
        )}
        {hasPhoto && (
          <>
            <Row label="Photo shape">
              <Segmented
                size="sm"
                className="w-48"
                value={design.photoShape}
                onChange={(v) => set('photoShape', v)}
                options={[
                  { value: 'circle', label: 'Circle' },
                  { value: 'rounded', label: 'Rounded' },
                  { value: 'square', label: 'Square' },
                ]}
              />
            </Row>
            <SliderField label="Photo size" value={design.photoSize} min={16} max={50} step={1} onChange={(v) => set('photoSize', v)} format={(v) => `${v}mm`} />
          </>
        )}
      </Group>

      <Group title="Page & spacing">
        <Row label="Paper size">
          <Segmented
            size="sm"
            className="w-40"
            value={design.pageSize}
            onChange={(v) => set('pageSize', v)}
            options={[
              { value: 'a4', label: 'A4' },
              { value: 'letter', label: 'US Letter' },
            ]}
          />
        </Row>
        <SliderField label="Side margins" value={design.marginX} min={6} max={30} step={1} onChange={(v) => set('marginX', v)} format={(v) => `${v}mm`} />
        <SliderField label="Top & bottom margins" value={design.marginY} min={6} max={30} step={1} onChange={(v) => set('marginY', v)} format={(v) => `${v}mm`} />
        <SliderField label="Section spacing" value={design.sectionGap} min={4} max={30} step={1} onChange={(v) => set('sectionGap', v)} format={(v) => `${v}pt`} />
        <SliderField label="Entry spacing" value={design.itemGap} min={2} max={20} step={1} onChange={(v) => set('itemGap', v)} format={(v) => `${v}pt`} />
      </Group>

      <Group title="Wording">
        <Field label="Label for ongoing dates" hint="Shown instead of an end date, e.g. “Present”, “Now”, “Heute”.">
          {(id) => <Input id={id} value={design.presentLabel} maxLength={30} onChange={(e) => set('presentLabel', e.target.value)} />}
        </Field>
      </Group>
    </div>
  )
}
