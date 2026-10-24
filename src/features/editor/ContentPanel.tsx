import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/kit'
import { createSection } from '@/lib/defaults'
import { SECTION_CONFIG, SECTION_TYPES } from '@/lib/sections'
import type { SectionType } from '@/lib/types'
import { arrayMove } from '@/lib/utils'
import { useResumeStore } from '@/store/resumes'
import { resolveTemplate } from '@/templates/registry'
import { BasicsCard } from './BasicsCard'
import { useEditor } from './context'
import { SortableList } from './dnd'
import { SectionCard } from './SectionCard'
import { SECTION_ICONS } from './sectionIcons'

export function AddSectionDialog({ open, onOpenChange, onAdded }: { open: boolean; onOpenChange: (o: boolean) => void; onAdded: (id: string) => void }) {
  const { id, update } = useEditor()
  const existing = useResumeStore(useShallow((s) => s.resumes[id]?.sections.map((x) => x.type) ?? []))
  const isTwoColumn = useResumeStore((s) => (s.resumes[id] ? resolveTemplate(s.resumes[id]).layout === 'sidebar' : false))

  const add = (type: SectionType) => {
    const section = createSection(type)
    update((d) => {
      d.sections.push(section)
    })
    onOpenChange(false)
    onAdded(section.id)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Add a section" description="Pick a section type. You can rename it afterwards." size="lg">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SECTION_TYPES.map((type) => {
          const cfg = SECTION_CONFIG[type]
          const Icon = SECTION_ICONS[type]
          const used = existing.includes(type) && type !== 'custom'
          return (
            <button
              key={type}
              type="button"
              onClick={() => add(type)}
              className="group flex items-center gap-3 rounded-xl border border-border p-3 text-left transition-[border-color,background-color,transform] duration-200 hover:border-primary hover:bg-primary-soft/40 active:scale-[0.98]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium">
                  {cfg.label}
                  {used && <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">Added</span>}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{cfg.description}</span>
              </span>
              {isTwoColumn && cfg.defaultColumn === 'sidebar' && (
                <span className="hidden text-[10px] font-medium uppercase tracking-wide text-subtle sm:block">Sidebar</span>
              )}
            </button>
          )
        })}
      </div>
    </ResponsiveDialog>
  )
}

export function ContentPanel() {
  const { id, update } = useEditor()
  const ids = useResumeStore(useShallow((s) => s.resumes[id]?.sections.map((x) => x.id) ?? []))
  const [adding, setAdding] = useState(false)
  const [justAdded, setJustAdded] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      <BasicsCard />
      <div className="mt-2 flex items-center justify-between px-1">
        <h2 className="text-xs font-medium uppercase tracking-wider text-subtle">Sections</h2>
        <span className="text-xs text-muted-foreground">Drag to reorder</span>
      </div>
      <div className="flex flex-col gap-2">
        <SortableList ids={ids} onMove={(from, to) => update((d) => void (d.sections = arrayMove(d.sections, from, to)))}>
          {ids.map((sid) => (
            <SectionCard key={sid} sectionId={sid} autoOpen={sid === justAdded} />
          ))}
        </SortableList>
      </div>
      <Button variant="outline" size="xl" className="mt-1 border-dashed" onClick={() => setAdding(true)}>
        <Plus /> Add section
      </Button>
      <AddSectionDialog open={adding} onOpenChange={setAdding} onAdded={setJustAdded} />
    </div>
  )
}
