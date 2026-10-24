import { AlignCenter, AlignLeft, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ColorInput, ColorSwatches } from '@/components/ui/color'
import { Segmented, Slider, SwitchRow } from '@/components/ui/controls'
import { Field, Input, Select } from '@/components/ui/input'
import { FONTS } from '@/lib/fonts'
import type { Design, HeadingStyle, SidebarTone, SkillStyle } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getTemplate, templateDesign } from '@/templates/registry'
import { useEditor, useEditorSelect } from './context'

function Group({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        {action}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
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
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.fonts.map((f) => (
                <option key={f.family} value={f.family}>
                  {f.family}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      )}
    </Field>
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
  const bar = <span className="h-1 w-8 rounded-full" style={{ background: style === 'filled' ? '#fff' : style === 'bar' || style === 'dot' ? 'var(--foreground)' : accent }} />
  switch (style) {
    case 'line':
      return (
        <span className="flex w-full items-center gap-1.5">
          {bar}
          <span className="h-px flex-1 opacity-40" style={{ background: accent }} />
        </span>
      )
    case 'underline':
      return <span className="flex w-full border-b-[1.5px] pb-1" style={{ borderColor: accent }}>{bar}</span>
    case 'bar':
      return <span className="flex w-full border-l-[3px] pl-1.5" style={{ borderColor: accent }}>{bar}</span>
    case 'filled':
      return <span className="inline-flex rounded-sm px-1.5 py-1" style={{ background: accent }}>{bar}</span>
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
      return <span className="inline-flex border-[1.5px] px-1.5 py-0.5" style={{ borderColor: accent }}>{bar}</span>
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

export function DesignPanel() {
  const { update } = useEditor()
  const design = useEditorSelect((r) => r.design)
  const templateId = useEditorSelect((r) => r.templateId)
  const template = getTemplate(templateId)
  const set = <K extends keyof Design>(key: K, value: Design[K]) => update((d) => void (d.design[key] = value))

  const reset = () =>
    update((d) => {
      d.design = { ...templateDesign(templateId), pageSize: d.design.pageSize, presentLabel: d.design.presentLabel }
    })

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      <Group
        title="Color"
        action={
          <Button variant="subtle" size="xs" onClick={reset}>
            <RotateCcw className="size-3.5" /> Reset all
          </Button>
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
                  design.pageColor === c && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
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
        <Slider label="Font size" value={design.fontSize} min={7.5} max={13} step={0.25} onChange={(v) => set('fontSize', v)} format={(v) => `${v}pt`} />
        <Slider label="Line height" value={design.lineHeight} min={1.1} max={2} step={0.05} onChange={(v) => set('lineHeight', v)} format={(v) => v.toFixed(2)} />
        <Slider label="Name size" value={design.nameScale} min={1.6} max={4.6} step={0.1} onChange={(v) => set('nameScale', v)} format={(v) => `${v.toFixed(1)}×`} />
      </Group>

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
                design.headingStyle === h.value ? 'border-accent bg-accent-soft/50' : 'border-border hover:border-border-strong',
              )}
            >
              <span className="flex h-5 w-full items-center justify-center px-1">
                <HeadingPreview style={h.value} accent={design.accent} />
              </span>
              <span className="text-[11px] font-medium text-muted">{h.label}</span>
            </button>
          ))}
        </div>
        <SwitchRow label="Uppercase headings" checked={design.headingUppercase} onCheckedChange={(v) => set('headingUppercase', v)} />
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] font-medium text-foreground/90">Heading alignment</span>
          <Segmented
            size="sm"
            className="w-28"
            value={design.headingAlign}
            onChange={(v) => set('headingAlign', v)}
            options={[
              { value: 'left', label: <AlignLeft className="size-4" />, title: 'Left' },
              { value: 'center', label: <AlignCenter className="size-4" />, title: 'Center' },
            ]}
          />
        </div>
      </Group>

      <Group title="Header">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] font-medium text-foreground/90">Alignment</span>
          <Segmented
            size="sm"
            className="w-28"
            value={design.headerAlign}
            onChange={(v) => set('headerAlign', v)}
            options={[
              { value: 'left', label: <AlignLeft className="size-4" />, title: 'Left' },
              { value: 'center', label: <AlignCenter className="size-4" />, title: 'Center' },
            ]}
          />
        </div>
        <SwitchRow label="Contact icons" checked={design.showIcons} onCheckedChange={(v) => set('showIcons', v)} />
        <SwitchRow label="Underline links" checked={design.underlineLinks} onCheckedChange={(v) => set('underlineLinks', v)} />
        {template.photo && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] font-medium text-foreground/90">Photo shape</span>
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
            </div>
            <Slider label="Photo size" value={design.photoSize} min={16} max={50} step={1} onChange={(v) => set('photoSize', v)} format={(v) => `${v}mm`} />
          </>
        )}
      </Group>

      {template.layout === 'sidebar' && (
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
                    design.sidebarTone === t.value ? 'border-accent ring-2 ring-accent/30' : 'border-border-strong',
                  )}
                >
                  <span className="h-full w-[38%] border-r border-black/5" style={{ background: toneSwatch(t.value, design.accent) }} />
                  <span className="h-full flex-1 bg-white" />
                </span>
                <span className="text-[11px] font-medium text-muted">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] font-medium text-foreground/90">Position</span>
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
          </div>
          <Slider label="Width" value={design.sidebarWidth} min={24} max={45} step={1} onChange={(v) => set('sidebarWidth', v)} format={(v) => `${v}%`} />
        </Group>
      )}

      <Group title="Skills & languages">
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
      </Group>

      <Group title="Page & spacing">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] font-medium text-foreground/90">Paper size</span>
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
        </div>
        {template.layout === 'classic' && (
          <SwitchRow
            label="Side-by-side lists"
            description="Place skills, languages & interests next to each other"
            checked={design.inlineLists}
            onCheckedChange={(v) => set('inlineLists', v)}
          />
        )}
        <Slider label="Side margins" value={design.marginX} min={6} max={30} step={1} onChange={(v) => set('marginX', v)} format={(v) => `${v}mm`} />
        <Slider label="Top & bottom margins" value={design.marginY} min={6} max={30} step={1} onChange={(v) => set('marginY', v)} format={(v) => `${v}mm`} />
        <Slider label="Section spacing" value={design.sectionGap} min={4} max={30} step={1} onChange={(v) => set('sectionGap', v)} format={(v) => `${v}pt`} />
        <Slider label="Entry spacing" value={design.itemGap} min={2} max={20} step={1} onChange={(v) => set('itemGap', v)} format={(v) => `${v}pt`} />
      </Group>

      <Group title="Wording">
        <Field label="Label for ongoing dates" hint="Shown instead of an end date, e.g. “Present”, “Now”, “Heute”.">
          {(id) => <Input id={id} value={design.presentLabel} maxLength={30} onChange={(e) => set('presentLabel', e.target.value)} />}
        </Field>
      </Group>
    </div>
  )
}
