import { Field } from '@/components/kit'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { SECTION_CONFIG } from '@/lib/sections'
import type { SectionItem, SectionType } from '@/lib/types'
import { KeywordsInput, LevelPicker, RichTextEditor } from './fields'

export function ItemEditor({
  item,
  type,
  onChange,
}: {
  item: SectionItem
  type: SectionType
  onChange: (patch: Partial<SectionItem>) => void
}) {
  const cfg = SECTION_CONFIG[type]
  const has = (f: (typeof cfg.fields)[number]) => cfg.fields.includes(f)
  const label = (f: keyof typeof cfg.labels, d: string) => cfg.labels[f] ?? d
  const ph = (f: keyof typeof cfg.placeholders) => cfg.placeholders[f]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {has('title') && (
        <Field label={label('title', 'Title')} className={has('subtitle') ? '' : 'sm:col-span-2'}>
          {(id) => <Input id={id} value={item.title} placeholder={ph('title')} onChange={(e) => onChange({ title: e.target.value })} />}
        </Field>
      )}
      {has('subtitle') && (
        <Field label={label('subtitle', 'Subtitle')}>
          {(id) => (
            <Input id={id} value={item.subtitle} placeholder={ph('subtitle')} onChange={(e) => onChange({ subtitle: e.target.value })} />
          )}
        </Field>
      )}
      {has('meta') && (
        <Field label={label('meta', 'Detail')}>
          {(id) => <Input id={id} value={item.meta} placeholder={ph('meta')} onChange={(e) => onChange({ meta: e.target.value })} />}
        </Field>
      )}
      {has('location') && (
        <Field label={label('location', 'Location')} className={has('meta') ? '' : 'sm:col-span-2'}>
          {(id) => (
            <Input id={id} value={item.location} placeholder={ph('location') ?? 'City, Country'} onChange={(e) => onChange({ location: e.target.value })} />
          )}
        </Field>
      )}
      {has('dates') && (
        <>
          <Field label="Start date">
            {(id) => <Input id={id} value={item.startDate} placeholder="e.g. Mar 2021" onChange={(e) => onChange({ startDate: e.target.value })} />}
          </Field>
          <Field label="End date">
            {(id) => (
              <Input
                id={id}
                value={item.current ? '' : item.endDate}
                disabled={item.current}
                placeholder={item.current ? 'Present' : 'e.g. Jun 2024'}
                onChange={(e) => onChange({ endDate: e.target.value })}
              />
            )}
          </Field>
          <label className="flex cursor-pointer items-center gap-2.5 sm:col-span-2">
            <Switch checked={item.current} onCheckedChange={(v) => onChange({ current: v })} />
            <span className="text-[13px] font-medium text-foreground/80">
              {type === 'education' ? 'I currently study here' : type === 'experience' || type === 'volunteer' ? 'I currently work here' : 'Ongoing'}
            </span>
          </label>
        </>
      )}
      {has('date') && (
        <Field label={label('date', 'Date')}>
          {(id) => <Input id={id} value={item.startDate} placeholder="e.g. 2023" onChange={(e) => onChange({ startDate: e.target.value })} />}
        </Field>
      )}
      {has('url') && (
        <Field label={label('url', 'Link')} className={has('date') ? '' : 'sm:col-span-2'}>
          {(id) => (
            <Input
              id={id}
              type="url"
              inputMode="url"
              value={item.url}
              placeholder="https://"
              onChange={(e) => onChange({ url: e.target.value })}
            />
          )}
        </Field>
      )}
      {has('level') && (
        <Field label={label('level', 'Level')} className="sm:col-span-2">
          {() => <LevelPicker value={item.level} onChange={(level) => onChange({ level })} />}
        </Field>
      )}
      {has('keywords') && (
        <Field label={label('keywords', 'Keywords')} className="sm:col-span-2" hint="Press Enter or comma to add">
          {(id) => (
            <KeywordsInput id={id} value={item.keywords} placeholder={ph('keywords') ?? 'Add keywords'} onChange={(keywords) => onChange({ keywords })} />
          )}
        </Field>
      )}
      {has('description') && (
        <Field label={label('description', 'Description')} className="sm:col-span-2">
          {(id) => (
            <RichTextEditor
              id={id}
              value={item.description}
              onChange={(description) => onChange({ description })}
              placeholder="Describe your impact. Start lines with “- ” for bullet points."
            />
          )}
        </Field>
      )}
    </div>
  )
}
