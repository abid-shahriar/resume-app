import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Copy,
  Ellipsis,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { memo, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Tip } from '@/components/kit'
import { createItem } from '@/lib/defaults'
import { stripMarkdown } from '@/lib/markdown'
import { itemLabel, SECTION_CONFIG } from '@/lib/sections'
import type { Section, SectionItem } from '@/lib/types'
import { arrayMove, cn, uid } from '@/lib/utils'
import { resolveTemplate } from '@/templates/registry'
import { useEditor, useEditorSelect } from './context'
import { DragHandle, SortableList, useSortableItem } from './dnd'
import { RichTextEditor } from './fields'
import { ItemEditor } from './ItemEditor'
import { SECTION_ICONS } from './sectionIcons'

const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
}

function itemSummary(item: SectionItem, section: Section) {
  const cfg = SECTION_CONFIG[section.type]
  const parts: string[] = []
  if (item.title.trim() && item.subtitle.trim()) parts.push(item.subtitle.trim())
  if (cfg.fields.includes('dates')) {
    const end = item.current ? 'Present' : item.endDate
    const d = [item.startDate, end].filter(Boolean).join(' – ')
    if (d) parts.push(d)
  } else if (cfg.fields.includes('date') && item.startDate) parts.push(item.startDate)
  if (!parts.length && item.keywords.length) parts.push(item.keywords.join(', '))
  if (!parts.length && item.description) parts.push(stripMarkdown(item.description).slice(0, 80))
  return parts.join(' · ')
}

const ItemRow = memo(function ItemRow({
  item,
  section,
  open,
  onToggle,
}: {
  item: SectionItem
  section: Section
  open: boolean
  onToggle: () => void
}) {
  const { update } = useEditor()
  const { setNodeRef, style, handleProps, isDragging } = useSortableItem(item.id)

  const patch = (p: Partial<SectionItem>) =>
    update((d) => {
      const s = d.sections.find((x) => x.id === section.id)
      const it = s?.items.find((x) => x.id === item.id)
      if (it) Object.assign(it, p)
    })

  const remove = () => {
    const index = section.items.findIndex((x) => x.id === item.id)
    const snapshot = item
    update((d) => {
      const s = d.sections.find((x) => x.id === section.id)
      if (s) s.items = s.items.filter((x) => x.id !== item.id)
    })
    toast(`Removed “${itemLabel(snapshot, section.type)}”`, {
      action: {
        label: 'Undo',
        onClick: () =>
          update((d) => {
            const s = d.sections.find((x) => x.id === section.id)
            if (s && !s.items.some((x) => x.id === snapshot.id)) s.items.splice(index, 0, snapshot)
          }),
      },
    })
  }

  const duplicate = () =>
    update((d) => {
      const s = d.sections.find((x) => x.id === section.id)
      if (!s) return
      const index = s.items.findIndex((x) => x.id === item.id)
      s.items.splice(index + 1, 0, { ...structuredClone(item), id: uid() })
    })

  const summary = itemSummary(item, section)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-card transition-[box-shadow,border-color] duration-200',
        isDragging ? 'border-primary shadow-lg' : open ? 'border-border-strong shadow-sm' : 'border-border',
        !item.visible && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-1 py-1 pl-1 pr-1.5">
        <DragHandle {...handleProps} />
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 flex-col items-start py-1.5 text-left" aria-expanded={open}>
          <span className={cn('w-full truncate text-[13px] font-medium', !item.title.trim() && 'text-muted-foreground')}>
            {itemLabel(item, section.type)}
          </span>
          {summary && <span className="w-full truncate text-xs text-muted-foreground">{summary}</span>}
        </button>
        <Tip content={item.visible ? 'Hide from resume' : 'Show on resume'}>
          <Button variant="subtle" size="icon-sm" onClick={() => patch({ visible: !item.visible })} aria-label={item.visible ? 'Hide entry' : 'Show entry'}>
            {item.visible ? <Eye /> : <EyeOff />}
          </Button>
        </Tip>
        <Menu>
          <MenuTrigger render={<Button variant="subtle" size="icon-sm" aria-label="Entry actions" />}>
            <Ellipsis />
          </MenuTrigger>
          <MenuContent>
            <MenuItem icon={<Copy />} onSelect={duplicate}>
              Duplicate
            </MenuItem>
            <MenuItem icon={<Trash2 />} danger onSelect={remove}>
              Delete
            </MenuItem>
          </MenuContent>
        </Menu>
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? 'Collapse' : 'Expand'}
          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <ChevronDown className={cn('size-4 transition-transform duration-300', open && 'rotate-180')} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div {...collapse} className="overflow-hidden">
            <div className="border-t border-border p-3 sm:p-4">
              <ItemEditor item={item} type={section.type} onChange={patch} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export const SectionCard = memo(function SectionCard({ sectionId, autoOpen }: { sectionId: string; autoOpen?: boolean }) {
  const { update } = useEditor()
  const section = useEditorSelect((r) => r.sections.find((s) => s.id === sectionId))
  const isTwoColumn = useEditorSelect((r) => resolveTemplate(r).layout === 'sidebar')
  const [open, setOpen] = useState(!!autoOpen)
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState('')
  const { setNodeRef, style, handleProps, isDragging } = useSortableItem(sectionId)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (autoOpen) rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [autoOpen])

  if (!section) return null
  const cfg = SECTION_CONFIG[section.type]
  const Icon = SECTION_ICONS[section.type]
  const count = section.items.length

  const mutate = (fn: (s: Section) => void) =>
    update((d) => {
      const s = d.sections.find((x) => x.id === sectionId)
      if (s) fn(s as Section)
    })

  const addItem = () => {
    const item = createItem()
    mutate((s) => {
      s.items.push(item)
    })
    setOpen(true)
    setOpenItem(item.id)
  }

  const removeSection = () => {
    let index = -1
    const snapshot = section
    update((d) => {
      index = d.sections.findIndex((x) => x.id === sectionId)
      d.sections.splice(index, 1)
    })
    toast(`Deleted “${snapshot.title}” section`, {
      action: {
        label: 'Undo',
        onClick: () =>
          update((d) => {
            if (!d.sections.some((x) => x.id === snapshot.id)) d.sections.splice(Math.max(0, index), 0, snapshot)
          }),
      },
    })
  }

  const commitTitle = () => {
    const t = title.trim()
    if (t) mutate((s) => void (s.title = t))
    setRenaming(false)
  }

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        rootRef.current = el
      }}
      style={style}
      className={cn(
        'rounded-xl border bg-card transition-[box-shadow,border-color] duration-200',
        isDragging ? 'border-primary shadow-lg' : 'border-border shadow-xs',
      )}
    >
      <div className="flex items-center gap-1 p-1.5 pr-2">
        <DragHandle {...handleProps} label={`Drag ${section.title} section`} />
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground', !section.visible && 'opacity-50')}>
          <Icon className="size-4" />
        </span>
        {renaming ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-1 pl-1"
            onSubmit={(e) => {
              e.preventDefault()
              commitTitle()
            }}
          >
            <input
              autoFocus
              data-native-undo
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => e.key === 'Escape' && setRenaming(false)}
              className="h-8 min-w-0 flex-1 rounded-md border border-primary bg-card px-2 font-medium outline-none ring-4 ring-primary/15 md:text-sm"
              aria-label="Section title"
            />
            <Button type="submit" size="icon-sm" variant="ghost" aria-label="Save title" onMouseDown={(e) => e.preventDefault()}>
              <Check />
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-1.5 text-left"
            aria-expanded={open}
          >
            <span className={cn('truncate font-medium', !section.visible && 'text-muted-foreground line-through decoration-1')}>{section.title}</span>
            {cfg.kind !== 'text' && (
              <span className="shrink-0 rounded-full bg-muted px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">{count}</span>
            )}
            {isTwoColumn && section.column === 'sidebar' && (
              <span className="hidden shrink-0 rounded-full bg-primary-soft px-1.5 text-[11px] font-medium text-primary-soft-foreground sm:inline">
                Sidebar
              </span>
            )}
          </button>
        )}
        <Tip content={section.visible ? 'Hide section' : 'Show section'}>
          <Button
            variant="subtle"
            size="icon"
            onClick={() => mutate((s) => void (s.visible = !s.visible))}
            aria-label={section.visible ? 'Hide section' : 'Show section'}
          >
            {section.visible ? <Eye /> : <EyeOff />}
          </Button>
        </Tip>
        <Menu>
          <MenuTrigger render={<Button variant="subtle" size="icon" aria-label="Section actions" />}>
            <Ellipsis />
          </MenuTrigger>
          <MenuContent>
            <MenuItem
              icon={<Pencil />}
              onSelect={() => {
                setTitle(section.title)
                setRenaming(true)
              }}
            >
              Rename
            </MenuItem>
            {cfg.kind !== 'text' && (
              <MenuItem icon={<Plus />} onSelect={addItem}>
                {cfg.addLabel}
              </MenuItem>
            )}
            <MenuItem
              icon={<ArrowLeftRight />}
              onSelect={() => mutate((s) => void (s.column = s.column === 'main' ? 'sidebar' : 'main'))}
            >
              Move to {section.column === 'main' ? 'sidebar' : 'main column'}
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash2 />} danger onSelect={removeSection}>
              Delete section
            </MenuItem>
          </MenuContent>
        </Menu>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Collapse section' : 'Expand section'}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <ChevronDown className={cn('size-4 transition-transform duration-300 ease-[var(--ease-out-expo)]', open && 'rotate-180')} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div {...collapse} className="overflow-hidden">
            <div className="border-t border-border p-3">
              {cfg.kind === 'text' ? (
                <RichTextEditor
                  value={section.content}
                  onChange={(v) => mutate((s) => void (s.content = v))}
                  placeholder="Two or three sentences about who you are, what you do best and what you're looking for."
                  minRows={5}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {count === 0 && (
                    <p className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">
                      Nothing here yet.
                    </p>
                  )}
                  <SortableList
                    ids={section.items.map((i) => i.id)}
                    onMove={(from, to) => mutate((s) => void (s.items = arrayMove(s.items, from, to)))}
                  >
                    {section.items.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        section={section}
                        open={openItem === item.id}
                        onToggle={() => setOpenItem((o) => (o === item.id ? null : item.id))}
                      />
                    ))}
                  </SortableList>
                  <Button variant="outline" size="lg" onClick={addItem} className="mt-1 w-full border-dashed">
                    <Plus /> {cfg.addLabel}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
