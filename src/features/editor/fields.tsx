import { Bold, Italic, Link2, List, ListOrdered, X } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Tooltip } from '@/components/ui/controls'
import { fieldBase, Textarea } from '@/components/ui/input'
import { LEVEL_LABELS } from '@/lib/sections'
import { cn } from '@/lib/utils'

/* ------------------------------ text editing ------------------------------- */

/** Inserts text at the selection, preserving the browser's native undo stack where possible. */
function insertText(el: HTMLTextAreaElement, text: string) {
  el.focus()
  let ok = false
  try {
    ok = document.execCommand('insertText', false, text)
  } catch {
    ok = false
  }
  if (!ok) {
    el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

function wrapSelection(el: HTMLTextAreaElement, marker: string, placeholder: string) {
  const { selectionStart: s, selectionEnd: e, value } = el
  const selected = value.slice(s, e)
  // Toggle off if already wrapped
  if (
    selected.startsWith(marker) &&
    selected.endsWith(marker) &&
    selected.length >= marker.length * 2
  ) {
    insertText(el, selected.slice(marker.length, selected.length - marker.length))
    el.setSelectionRange(s, e - marker.length * 2)
    return
  }
  const before = value.slice(Math.max(0, s - marker.length), s)
  const after = value.slice(e, e + marker.length)
  if (before === marker && after === marker) {
    el.setSelectionRange(s - marker.length, e + marker.length)
    insertText(el, selected)
    el.setSelectionRange(s - marker.length, e - marker.length)
    return
  }
  const inner = selected || placeholder
  insertText(el, `${marker}${inner}${marker}`)
  el.setSelectionRange(s + marker.length, s + marker.length + inner.length)
}

function toggleList(el: HTMLTextAreaElement, ordered: boolean) {
  const { selectionStart: s, selectionEnd: e, value } = el
  const start = value.lastIndexOf('\n', s - 1) + 1
  let end = value.indexOf('\n', e)
  if (end === -1) end = value.length
  const lines = value.slice(start, end).split('\n')
  const re = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*•]\s+/
  const all = lines.every((l) => re.test(l) || !l.trim())
  const next = lines
    .map((l, i) => {
      const clean = l.replace(/^\s*([-*•]|\d+[.)])\s+/, '')
      if (all) return clean
      if (!l.trim() && lines.length > 1) return l
      return ordered ? `${i + 1}. ${clean}` : `- ${clean}`
    })
    .join('\n')
  el.setSelectionRange(start, end)
  insertText(el, next)
  el.setSelectionRange(start, start + next.length)
}

function insertLink(el: HTMLTextAreaElement) {
  const { selectionStart: s, selectionEnd: e, value } = el
  const selected = value.slice(s, e) || 'link text'
  const text = `[${selected}](https://)`
  insertText(el, text)
  const urlStart = s + selected.length + 3
  el.setSelectionRange(urlStart, urlStart + 8)
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  id,
  minRows = 4,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id?: string
  minRows?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const run = (fn: (el: HTMLTextAreaElement) => void) => {
    const el = ref.current
    if (el) fn(el)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    const mod = e.metaKey || e.ctrlKey
    if (mod && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      wrapSelection(el, '**', 'bold text')
      return
    }
    if (mod && e.key.toLowerCase() === 'i') {
      e.preventDefault()
      wrapSelection(el, '*', 'italic text')
      return
    }
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      insertLink(el)
      return
    }
    if (e.key === 'Enter' && !e.shiftKey && !mod && el.selectionStart === el.selectionEnd) {
      const pos = el.selectionStart
      const lineStart = el.value.lastIndexOf('\n', pos - 1) + 1
      const line = el.value.slice(lineStart, pos)
      const m = /^(\s*)([-*•]|(\d+)[.)])\s+(.*)$/.exec(line)
      if (m) {
        e.preventDefault()
        if (!m[4].trim() && el.value.slice(pos, el.value.indexOf('\n', pos) === -1 ? undefined : el.value.indexOf('\n', pos)).trim() === '') {
          // Empty bullet: end the list
          el.setSelectionRange(lineStart, pos)
          insertText(el, '')
          return
        }
        const marker = m[3] ? `${Number(m[3]) + 1}. ` : `${m[2]} `
        insertText(el, `\n${m[1]}${marker}`)
      }
    }
  }

  const tools = [
    { icon: Bold, label: 'Bold', kbd: 'Ctrl B', fn: (el: HTMLTextAreaElement) => wrapSelection(el, '**', 'bold text') },
    { icon: Italic, label: 'Italic', kbd: 'Ctrl I', fn: (el: HTMLTextAreaElement) => wrapSelection(el, '*', 'italic text') },
    { icon: Link2, label: 'Link', kbd: 'Ctrl K', fn: insertLink },
    { icon: List, label: 'Bullet list', fn: (el: HTMLTextAreaElement) => toggleList(el, false) },
    { icon: ListOrdered, label: 'Numbered list', fn: (el: HTMLTextAreaElement) => toggleList(el, true) },
  ]

  return (
    <div className="group/rte rounded-lg border border-border bg-surface shadow-xs transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15 hover:border-border-strong">
      <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1">
        {tools.map((t) => (
          <Tooltip key={t.label} content={t.kbd ? `${t.label} (${t.kbd})` : t.label} side="top">
            <button
              type="button"
              aria-label={t.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(t.fn)}
              className="grid size-8 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-foreground md:size-7"
            >
              <t.icon className="size-4" />
            </button>
          </Tooltip>
        ))}
        <span className="ml-auto hidden pr-1.5 text-[11px] text-subtle sm:inline">Markdown supported</span>
      </div>
      <Textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={minRows}
        className="min-h-0 rounded-none border-0 bg-transparent shadow-none hover:border-0 focus:ring-0"
      />
    </div>
  )
}

/* -------------------------------- keywords --------------------------------- */

export function KeywordsInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  id?: string
}) {
  const [draft, setDraft] = useState('')
  const add = (raw: string) => {
    const parts = raw
      .split(/[,\n;]/)
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !value.some((v) => v.toLowerCase() === p.toLowerCase()))
    if (parts.length) onChange([...value, ...parts])
    setDraft('')
  }
  return (
    <div
      className={cn(fieldBase, 'flex min-h-10 flex-wrap items-center gap-1.5 px-2 py-1.5 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15 md:min-h-9')}
      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}
    >
      {value.map((k, i) => (
        <span key={`${k}-${i}`} className="inline-flex h-7 animate-scale-in items-center gap-1 rounded-md bg-surface-2 pl-2 pr-1 text-[13px] font-medium md:h-6">
          {k}
          <button
            type="button"
            aria-label={`Remove ${k}`}
            onClick={(e) => {
              e.stopPropagation()
              onChange(value.filter((_, j) => j !== i))
            }}
            className="grid size-5 place-items-center rounded text-muted hover:bg-surface-3 hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => {
          const v = e.target.value
          if (/[,;]/.test(v)) add(v)
          else setDraft(v)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add(draft)
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text')
          if (/[,\n;]/.test(text)) {
            e.preventDefault()
            add(draft + text)
          }
        }}
        placeholder={value.length ? 'Add more…' : placeholder}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 outline-none placeholder:text-subtle md:h-6"
      />
    </div>
  )
}

/* ---------------------------------- level ---------------------------------- */

export function LevelPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1" role="radiogroup" aria-labelledby={id}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={LEVEL_LABELS[n]}
            onClick={() => onChange(value === n ? 0 : n)}
            className={cn(
              'h-8 flex-1 rounded-md transition-all duration-200 md:h-7',
              n <= value ? 'bg-accent' : 'bg-surface-3 hover:bg-border-strong',
            )}
            style={{ transitionDelay: `${n * 15}ms` }}
          />
        ))}
      </div>
      <span id={id} className="w-24 shrink-0 text-right text-xs font-medium text-muted">
        {value ? LEVEL_LABELS[value] : 'Not set'}
      </span>
    </div>
  )
}
