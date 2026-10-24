import { Check } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { ResumeThumb } from '@/components/ResumePreview'
import { SwitchRow } from '@/components/ui/controls'
import { withViewTransition } from '@/lib/transitions'
import type { Resume } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useResumeStore } from '@/store/resumes'
import { withTemplate } from '@/templates/previews'
import { TEMPLATES, type TemplateDef } from '@/templates/registry'
import { useEditor } from './context'

const Option = memo(function Option({
  t,
  resume,
  active,
  keepStyle,
  onPick,
}: {
  t: TemplateDef
  resume: Resume
  active: boolean
  keepStyle: boolean
  onPick: (id: string) => void
}) {
  const preview = useMemo(() => (active ? resume : withTemplate(resume, t.id, keepStyle)), [active, resume, t.id, keepStyle])
  return (
    <button type="button" onClick={() => onPick(t.id)} className="group flex flex-col text-left outline-none" aria-pressed={active}>
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border bg-white transition-[box-shadow,transform,border-color] duration-300 ease-[var(--ease-out-expo)] group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-4 group-focus-visible:ring-accent/30',
          active ? 'border-accent shadow-md ring-2 ring-accent' : 'border-border shadow-xs',
        )}
      >
        <ResumeThumb resume={preview} />
        {active && (
          <span className="absolute right-1.5 top-1.5 grid size-6 animate-scale-in place-items-center rounded-full bg-accent text-white shadow-md">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
        <span className={cn('truncate text-[13px] font-medium', active && 'text-accent-foreground')}>{t.name}</span>
        {t.atsFriendly && <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-subtle">ATS</span>}
      </div>
    </button>
  )
})

export function TemplatesPanel() {
  const { id, update } = useEditor()
  const resume = useResumeStore((s) => s.resumes[id])
  const [keepStyle, setKeepStyle] = useState(false)

  const pick = (templateId: string) => {
    if (templateId === resume.templateId) return
    withViewTransition(() =>
      update((d) => {
        const next = withTemplate(d as Resume, templateId, keepStyle)
        d.templateId = templateId
        d.design = next.design
      }),
    )
  }

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4">
      <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-xs">
        <SwitchRow
          label="Keep my colors & fonts"
          description="Apply only the layout when switching templates"
          checked={keepStyle}
          onCheckedChange={setKeepStyle}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((t) => (
          <Option key={t.id} t={t} resume={resume} active={t.id === resume.templateId} keepStyle={keepStyle} onPick={pick} />
        ))}
      </div>
    </div>
  )
}
