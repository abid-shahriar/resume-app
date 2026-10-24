import { Check, WandSparkles } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { SwitchRow } from '@/components/kit'
import { ResumeThumb } from '@/components/ResumePreview'
import type { Resume } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useResumeStore } from '@/store/resumes'
import { toCustom, withTemplate } from '@/templates/previews'
import { CUSTOM_TEMPLATE_ID, TEMPLATES } from '@/templates/registry'
import { useEditor } from './context'

const Option = memo(function Option({
  id,
  name,
  badge,
  resume,
  active,
  keepStyle,
  onPick,
}: {
  id: string
  name: string
  badge?: React.ReactNode
  resume: Resume
  active: boolean
  keepStyle: boolean
  onPick: (id: string) => void
}) {
  const preview = useMemo(() => (active ? resume : withTemplate(resume, id, keepStyle)), [active, resume, id, keepStyle])
  return (
    <button type="button" onClick={() => onPick(id)} className="group flex flex-col text-left outline-none" aria-pressed={active}>
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border bg-white transition-[box-shadow,transform,border-color] duration-300 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-3 group-focus-visible:ring-ring/50',
          active ? 'border-primary shadow-md ring-2 ring-primary' : 'border-border shadow-xs',
        )}
      >
        <ResumeThumb resume={preview} />
        {active && (
          <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-md animate-in fade-in-0 zoom-in-75">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
        <span className={cn('truncate text-[13px] font-medium', active && 'text-primary')}>{name}</span>
        {badge}
      </div>
    </button>
  )
})

export function TemplatesPanel() {
  const { id, update } = useEditor()
  const resume = useResumeStore((s) => s.resumes[id])
  const [keepStyle, setKeepStyle] = useState(false)
  const isCustom = resume.templateId === CUSTOM_TEMPLATE_ID
  const customPreview = useMemo(() => toCustom(resume), [resume])

  const pick = (templateId: string) => {
    if (templateId === resume.templateId) return
    update((d) => {
      const next = withTemplate(d as Resume, templateId, keepStyle)
      d.templateId = next.templateId
      d.design = next.design
      d.customLayout = next.customLayout
    })
  }

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4">
      <button
        type="button"
        onClick={() => pick(CUSTOM_TEMPLATE_ID)}
        aria-pressed={isCustom}
        className={cn(
          'flex items-center gap-3 rounded-xl border p-3 text-left outline-none transition-[border-color,background-color] focus-visible:ring-3 focus-visible:ring-ring/50',
          isCustom ? 'border-primary bg-primary-soft/60' : 'border-border bg-card hover:border-border-strong',
        )}
      >
        <span className="w-12 shrink-0 overflow-hidden rounded-md border border-border bg-white shadow-xs">
          <ResumeThumb resume={isCustom ? resume : customPreview} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold">
            <WandSparkles className="size-3.5 text-primary" /> Custom layout
            {isCustom && <span className="rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">Active</span>}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {isCustom
              ? 'Columns, header, photo, lines and headings are all editable in Design.'
              : 'Start from your current design and unlock every layout option.'}
          </span>
        </span>
      </button>

      <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xs">
        <SwitchRow
          label="Keep my colors & fonts"
          description="Apply only the layout when switching templates"
          checked={keepStyle}
          onCheckedChange={setKeepStyle}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((t) => (
          <Option
            key={t.id}
            id={t.id}
            name={t.name}
            badge={t.atsFriendly && <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-subtle">ATS</span>}
            resume={resume}
            active={t.id === resume.templateId}
            keepStyle={keepStyle}
            onPick={pick}
          />
        ))}
      </div>
    </div>
  )
}
