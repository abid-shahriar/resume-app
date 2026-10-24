import {
  closestCorners,
  DndContext,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowLeftRight, Eye, EyeOff, Info } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tip } from '@/components/kit'
import type { Column, Section } from '@/lib/types'
import { arrayMove, cn } from '@/lib/utils'
import { resolveTemplate } from '@/templates/registry'
import { hasContent } from '@/templates/shared'
import { useEditor, useEditorSelect } from './context'
import { DragHandle, useDndSensors, useSortableItem } from './dnd'
import { SECTION_ICONS } from './sectionIcons'

function LayoutCard({ section, overlay, twoCol }: { section: Section; overlay?: boolean; twoCol: boolean }) {
  return overlay ? <LayoutCardView section={section} overlay twoCol={twoCol} /> : <SortableLayoutCard section={section} twoCol={twoCol} />
}

function SortableLayoutCard({ section, twoCol }: { section: Section; twoCol: boolean }) {
  const sortable = useSortableItem(section.id)
  return <LayoutCardView section={section} twoCol={twoCol} sortable={sortable} />
}

function LayoutCardView({
  section,
  overlay,
  twoCol,
  sortable,
}: {
  section: Section
  overlay?: boolean
  twoCol: boolean
  sortable?: ReturnType<typeof useSortableItem>
}) {
  const { update } = useEditor()
  const { setNodeRef, style, handleProps, isDragging } = sortable ?? { setNodeRef: undefined, style: undefined, handleProps: {}, isDragging: false }
  const Icon = SECTION_ICONS[section.type]
  const empty = !hasContent({ ...section, visible: true })
  const mutate = (fn: (s: Section) => void) =>
    update((d) => {
      const s = d.sections.find((x) => x.id === section.id)
      if (s) fn(s as Section)
    })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 rounded-lg border bg-card py-1 pl-1 pr-1.5 transition-[box-shadow,border-color,opacity]',
        overlay ? 'rotate-[1.5deg] border-primary shadow-lg' : 'border-border shadow-xs',
        isDragging && !overlay && 'opacity-30',
        !section.visible && 'bg-muted',
      )}
    >
      <DragHandle {...handleProps} />
      <Icon className={cn('size-4 shrink-0 text-muted-foreground', !section.visible && 'opacity-50')} />
      <span className={cn('min-w-0 flex-1 truncate pl-1.5 text-[13px] font-medium', !section.visible && 'text-muted-foreground line-through')}>
        {section.title}
      </span>
      {empty && section.visible && (
        <Tip content="Empty sections are not shown">
          <span className="rounded bg-muted px-1 text-[10px] font-medium text-subtle">Empty</span>
        </Tip>
      )}
      {!twoCol && (
        <Tip content={`Placed in ${section.column === 'main' ? 'main column' : 'sidebar'} for two-column templates`}>
          <Button
            variant="subtle"
            size="icon-sm"
            onClick={() => mutate((s) => void (s.column = s.column === 'main' ? 'sidebar' : 'main'))}
            aria-label="Toggle column"
          >
            <ArrowLeftRight />
          </Button>
        </Tip>
      )}
      <Button
        variant="subtle"
        size="icon-sm"
        onClick={() => mutate((s) => void (s.visible = !s.visible))}
        aria-label={section.visible ? 'Hide section' : 'Show section'}
      >
        {section.visible ? <Eye /> : <EyeOff />}
      </Button>
    </div>
  )
}

function ColumnDrop({ id, title, sections, twoCol }: { id: Column; title: string; sections: Section[]; twoCol: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${id}` })
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium uppercase tracking-wider text-subtle">{title}</span>
        <span className="text-xs tabular-nums text-subtle">{sections.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-28 flex-col gap-1.5 rounded-xl border border-dashed p-1.5 transition-colors',
          isOver ? 'border-primary bg-primary-soft/40' : 'border-border bg-muted/40',
        )}
      >
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((s) => (
            <LayoutCard key={s.id} section={s} twoCol={twoCol} />
          ))}
        </SortableContext>
        {sections.length === 0 && <div className="grid flex-1 place-items-center py-6 text-xs text-muted-foreground">Drop sections here</div>}
      </div>
    </div>
  )
}

export function LayoutPanel() {
  const { update } = useEditor()
  const sections = useEditorSelect((r) => r.sections)
  // Select primitives: resolveTemplate builds a new object for custom layouts
  const twoCol = useEditorSelect((r) => resolveTemplate(r).layout === 'sidebar')
  const templateName = useEditorSelect((r) => resolveTemplate(r).name)
  const side = useEditorSelect((r) => r.design.sidebarSide)
  const sensors = useDndSensors()
  const [activeId, setActiveId] = useState<string | null>(null)

  const colOf = (id: string): Column | null => {
    if (id.startsWith('col:')) return id.slice(4) as Column
    return sections.find((s) => s.id === id)?.column ?? null
  }

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!twoCol || !over) return
    const a = String(active.id)
    const o = String(over.id)
    const from = colOf(a)
    const to = colOf(o)
    if (!from || !to || from === to) return
    update((d) => {
      const idx = d.sections.findIndex((s) => s.id === a)
      if (idx === -1) return
      d.sections[idx].column = to
      if (!o.startsWith('col:')) {
        const overIdx = d.sections.findIndex((s) => s.id === o)
        if (overIdx !== -1) d.sections = arrayMove(d.sections, idx, overIdx)
      }
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return
    const a = String(active.id)
    const o = String(over.id)
    if (a === o || o.startsWith('col:')) return
    update((d) => {
      const from = d.sections.findIndex((s) => s.id === a)
      const to = d.sections.findIndex((s) => s.id === o)
      if (from !== -1 && to !== -1) d.sections = arrayMove(d.sections, from, to)
    })
  }

  const active = activeId ? sections.find((s) => s.id === activeId) : null
  const main = sections.filter((s) => s.column === 'main')
  const sidebar = sections.filter((s) => s.column === 'sidebar')

  const columns = twoCol
    ? side === 'left'
      ? [
          { id: 'sidebar' as Column, title: 'Sidebar', list: sidebar },
          { id: 'main' as Column, title: 'Main', list: main },
        ]
      : [
          { id: 'main' as Column, title: 'Main', list: main },
          { id: 'sidebar' as Column, title: 'Sidebar', list: sidebar },
        ]
    : []

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4">
      <div className="flex gap-3 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          {twoCol ? (
            <>
              <span className="font-medium text-foreground">{templateName}</span> has two columns. Drag sections to reorder them or move them
              between the main column and the sidebar.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{templateName}</span> uses a single column. Drag to reorder. Use{' '}
              <ArrowLeftRight className="inline size-3.5" /> to choose where a section goes in two-column layouts.
            </>
          )}
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {twoCol ? (
          <div className={cn('grid gap-3', side === 'left' ? 'grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]' : 'grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]')}>
            {columns.map((c) => (
              <ColumnDrop key={c.id} id={c.id} title={c.title} sections={c.list} twoCol />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((s) => (
                <LayoutCard key={s.id} section={s} twoCol={false} />
              ))}
            </SortableContext>
          </div>
        )}
        <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {active ? <LayoutCard section={active} overlay twoCol={twoCol} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
