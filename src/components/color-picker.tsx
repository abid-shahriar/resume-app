import { Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export const ACCENT_PRESETS = [
  '#0f172a',
  '#334155',
  '#1e3a8a',
  '#2563eb',
  '#0369a1',
  '#0e7490',
  '#0f766e',
  '#15803d',
  '#4f6f52',
  '#a16207',
  '#b7862f',
  '#c2410c',
  '#9a3412',
  '#dc2626',
  '#be123c',
  '#db2777',
  '#7c3aed',
  '#6d28d9',
  '#4f46e5',
  '#111111',
]

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

function normalize(hex: string) {
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return '#' + hex.slice(1).split('').map((c) => c + c).join('')
  }
  return hex.toLowerCase()
}

export function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)
  // Follow external changes (swatches, undo) without an effect
  if (value !== synced) {
    setSynced(value)
    setDraft(value)
  }
  return (
    <div className="flex items-center gap-2">
      <label
        className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border shadow-xs"
        style={{ background: value }}
        title={label ?? 'Pick a color'}
      >
        <input
          type="color"
          value={normalize(HEX.test(value) ? value : '#000000')}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label={label ?? 'Pick a color'}
        />
      </label>
      <input
        value={draft}
        onChange={(e) => {
          const v = e.target.value.trim()
          setDraft(v)
          const withHash = v.startsWith('#') ? v : `#${v}`
          if (HEX.test(withHash)) onChange(normalize(withHash))
        }}
        onBlur={() => setDraft(value)}
        spellCheck={false}
        className="h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 font-mono uppercase text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 md:text-[13px]"
        aria-label={`${label ?? 'Color'} hex value`}
      />
    </div>
  )
}

export function ColorSwatches({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const current = value.toLowerCase()
  return (
    <div className="flex flex-wrap gap-2">
      {ACCENT_PRESETS.map((c) => {
        const active = c === current
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`Use color ${c}`}
            aria-pressed={active}
            className={cn(
              'relative grid size-8 place-items-center rounded-full transition-transform md:size-7 duration-200 ease-[var(--ease-spring)] hover:scale-110 active:scale-95',
              active && 'ring-2 ring-offset-2 ring-offset-card',
            )}
            style={{ background: c, ['--tw-ring-color' as string]: c }}
          >
            {active && <Check className="size-3.5 text-white" strokeWidth={3} />}
          </button>
        )
      })}
    </div>
  )
}
