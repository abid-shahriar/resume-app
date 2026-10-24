import { createContext, Fragment, useContext } from 'react'
import { RichText, safeUrl } from '@/lib/markdown'
import { SECTION_CONFIG } from '@/lib/sections'
import type { Design, Resume, Section, SectionItem } from '@/lib/types'
import { contactHref, CONTACT_META } from './icons'
import type { EntryKind, TemplateDef } from './registry'

export interface ResumeCtx {
  resume: Resume
  design: Design
  template: TemplateDef
}

const Ctx = createContext<ResumeCtx | null>(null)
export const ResumeProvider = Ctx.Provider

export function useResumeCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useResumeCtx must be used inside ResumeProvider')
  return ctx
}

type Region = 'main' | 'sidebar'

/* ---------------------------------- helpers --------------------------------- */

export function hasContent(section: Section): boolean {
  if (!section.visible) return false
  const kind = SECTION_CONFIG[section.type].kind
  if (kind === 'text') return !!section.content.trim()
  // List sections (skills, languages…) only render items that have a name or keywords
  if (kind === 'list') return section.items.some((i) => i.visible && (i.title.trim() || i.keywords.length))
  return section.items.some((i) => i.visible && (i.title.trim() || i.subtitle.trim() || i.description.trim() || i.keywords.length))
}

export function visibleSections(resume: Resume, column?: Region) {
  return resume.sections.filter((s) => hasContent(s) && (!column || s.column === column))
}

export function dateRange(item: SectionItem, presentLabel: string, single = false): string {
  const start = item.startDate.trim()
  if (single) return start
  const end = item.current ? presentLabel : item.endDate.trim()
  if (start && end) return start === end ? start : `${start} – ${end}`
  return start || end
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/* --------------------------------- elements --------------------------------- */

export function Name({ className }: { className?: string }) {
  const { resume } = useResumeCtx()
  if (!resume.basics.name.trim()) return null
  return <h1 className={className ? `rs-name ${className}` : 'rs-name'}>{resume.basics.name}</h1>
}

export function Headline({ className }: { className?: string }) {
  const { resume } = useResumeCtx()
  if (!resume.basics.headline.trim()) return null
  return <p className={className ? `rs-headline ${className}` : 'rs-headline'}>{resume.basics.headline}</p>
}

export function Photo({ className }: { className?: string }) {
  const { resume, design, template } = useResumeCtx()
  const { photo, photoVisible, name } = resume.basics
  if (!template.photo || !photoVisible) return null
  if (!photo && !name.trim()) return null
  return (
    <div className={className ? `rs-photo ${className}` : 'rs-photo'} data-shape={design.photoShape}>
      {photo ? <img src={photo} alt="" /> : <span className="rs-monogram">{initials(name)}</span>}
    </div>
  )
}

export function Contacts({ layout = 'inline', className }: { layout?: 'inline' | 'stack'; className?: string }) {
  const { resume, design } = useResumeCtx()
  const items = resume.basics.contacts.filter((c) => c.visible && c.value.trim())
  if (!items.length) return null
  return (
    <ul className={`rs-contacts ${className ?? ''}`} data-layout={layout} data-icons={design.showIcons ? 'on' : 'off'}>
      {items.map((c) => {
        const meta = CONTACT_META[c.kind] ?? CONTACT_META.custom
        const Icon = meta.icon
        const href = contactHref(c.kind, c.value, c.url)
        const body = (
          <>
            {design.showIcons && <Icon className="rs-icon" size="1em" strokeWidth={2} aria-hidden />}
            <span>{c.value}</span>
          </>
        )
        return (
          <li key={c.id}>
            {href ? (
              <a href={href} target="_blank" rel="noreferrer">
                {body}
              </a>
            ) : (
              body
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function SectionHeading({ title }: { title: string }) {
  const { design } = useResumeCtx()
  return (
    <h2 className="rs-heading" data-style={design.headingStyle}>
      <span className="rs-heading-text">{title}</span>
    </h2>
  )
}

function Keywords({ keywords }: { keywords: string[] }) {
  const list = keywords.filter((k) => k.trim())
  if (!list.length) return null
  return (
    <ul className="rs-chips rs-entry-keywords">
      {list.map((k, i) => (
        <li key={i} className="rs-chip">
          {k}
        </li>
      ))}
    </ul>
  )
}

function TitleLink({ title, url }: { title: string; url: string }) {
  const href = url.trim() ? safeUrl(url) : undefined
  if (!href) return <>{title}</>
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {title}
    </a>
  )
}

export function Entry({ item, section, kind = 'stacked' }: { item: SectionItem; section: Section; kind?: EntryKind }) {
  const { design } = useResumeCtx()
  const cfg = SECTION_CONFIG[section.type]
  const single = cfg.fields.includes('date')
  const dates = cfg.fields.includes('dates') || single ? dateRange(item, design.presentLabel, single) : ''
  const showLocation = cfg.fields.includes('location') && item.location.trim()
  const subParts = [item.subtitle.trim(), cfg.fields.includes('meta') ? item.meta.trim() : ''].filter(Boolean)
  const title = item.title.trim()
  const keywords = cfg.fields.includes('keywords') ? item.keywords : []

  if (kind === 'dateLeft') {
    return (
      <article className="rs-entry rs-entry-dl">
        <div className="rs-entry-side">
          {dates && <div className="rs-entry-date">{dates}</div>}
          {showLocation && <div className="rs-entry-loc">{item.location}</div>}
        </div>
        <div className="rs-entry-body">
          {title && (
            <h3 className="rs-entry-title">
              <TitleLink title={title} url={item.url} />
            </h3>
          )}
          {subParts.length > 0 && <div className="rs-entry-sub">{subParts.join(' · ')}</div>}
          <RichText text={item.description} className="rs-entry-desc" />
          <Keywords keywords={keywords} />
        </div>
      </article>
    )
  }

  return (
    <article className="rs-entry">
      <div className="rs-entry-head">
        {title ? (
          <h3 className="rs-entry-title">
            <TitleLink title={title} url={item.url} />
          </h3>
        ) : (
          <span />
        )}
        {dates && <div className="rs-entry-date">{dates}</div>}
      </div>
      {(subParts.length > 0 || showLocation) && (
        <div className="rs-entry-subrow">
          <div className="rs-entry-sub">{subParts.join(' · ')}</div>
          {showLocation && <div className="rs-entry-loc">{item.location}</div>}
        </div>
      )}
      <RichText text={item.description} className="rs-entry-desc" />
      <Keywords keywords={keywords} />
    </article>
  )
}

function Level({ level, style }: { level: number; style: 'bars' | 'dots' }) {
  if (!level) return null
  if (style === 'bars') {
    return (
      <span className="rs-level-bar" role="img" aria-label={`${level} out of 5`}>
        <span style={{ width: `${(level / 5) * 100}%` }} />
      </span>
    )
  }
  return (
    <span className="rs-level-dots" role="img" aria-label={`${level} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} data-on={n <= level ? '' : undefined} />
      ))}
    </span>
  )
}

/** Groups consecutive items that have no keywords so they can render inline together. */
function groupItems(items: SectionItem[]) {
  const groups: Array<{ simple: boolean; items: SectionItem[] }> = []
  for (const it of items) {
    const simple = !it.keywords.length
    const last = groups[groups.length - 1]
    if (last && last.simple && simple) last.items.push(it)
    else groups.push({ simple, items: [it] })
  }
  return groups
}

export function ListSection({ section }: { section: Section }) {
  const { design } = useResumeCtx()
  const items = section.items.filter((i) => i.visible && (i.title.trim() || i.keywords.length))
  const style = design.skillStyle
  const isLang = section.type === 'languages'
  const isInterests = section.type === 'interests'

  if (isLang) {
    if (style === 'bars' || style === 'dots') {
      return (
        <div className="rs-levels">
          {items.map((it) => (
            <div key={it.id} className="rs-level-row">
              <div className="rs-level-label">
                <span className="rs-level-name">{it.title}</span>
                {it.subtitle && <span className="rs-level-note">{it.subtitle}</span>}
              </div>
              <Level level={it.level} style={style} />
            </div>
          ))}
        </div>
      )
    }
    if (style === 'tags') {
      return (
        <ul className="rs-chips">
          {items.map((it) => (
            <li key={it.id} className="rs-chip">
              {it.title}
              {it.subtitle && <span className="rs-chip-note"> · {it.subtitle}</span>}
            </li>
          ))}
        </ul>
      )
    }
    return (
      <p className="rs-inline-list">
        {items.map((it, i) => (
          <Fragment key={it.id}>
            {i > 0 && <span className="rs-sep">, </span>}
            <strong>{it.title}</strong>
            {it.subtitle && <span className="rs-muted"> ({it.subtitle})</span>}
          </Fragment>
        ))}
      </p>
    )
  }

  if (style === 'text' || (isInterests && style !== 'tags')) {
    return (
      <div className="rs-textlist">
        {groupItems(items).map((g, gi) =>
          g.simple ? (
            <p key={gi} className="rs-inline-list">
              {g.items.map((it) => it.title).join(', ')}
            </p>
          ) : (
            g.items.map((it) => (
              <p key={it.id} className="rs-inline-list">
                {it.title && <strong>{it.title}: </strong>}
                {it.keywords.join(', ')}
              </p>
            ))
          ),
        )}
      </div>
    )
  }

  if (style === 'bars' || style === 'dots') {
    return (
      <div className="rs-levels">
        {items.map((it) => (
          <div key={it.id} className="rs-level-row">
            <div className="rs-level-label">
              <span className="rs-level-name">{it.title}</span>
            </div>
            <Level level={it.level} style={style} />
            {it.keywords.length > 0 && <div className="rs-level-keywords">{it.keywords.join(', ')}</div>}
          </div>
        ))}
      </div>
    )
  }

  // tags
  return (
    <div className="rs-taglist">
      {groupItems(items).map((g, gi) =>
        g.simple ? (
          <ul key={gi} className="rs-chips">
            {g.items.map((it) => (
              <li key={it.id} className="rs-chip">
                {it.title}
              </li>
            ))}
          </ul>
        ) : (
          g.items.map((it) => (
            <div key={it.id} className="rs-tag-group">
              {it.title && <div className="rs-tag-group-title">{it.title}</div>}
              <ul className="rs-chips">
                {it.keywords.map((k, i) => (
                  <li key={i} className="rs-chip">
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ),
      )}
    </div>
  )
}

export function SectionBody({ section, entryKind }: { section: Section; entryKind?: EntryKind }) {
  const { template } = useResumeCtx()
  const cfg = SECTION_CONFIG[section.type]
  if (cfg.kind === 'text') return <RichText text={section.content} className="rs-summary" />
  if (cfg.kind === 'list') return <ListSection section={section} />
  const kind = entryKind ?? template.entry
  return (
    <div className="rs-entries">
      {section.items
        .filter((i) => i.visible)
        .map((item) => (
          <Entry key={item.id} item={item} section={section} kind={kind} />
        ))}
    </div>
  )
}

export function SectionView({
  section,
  region = 'main',
  entryKind,
}: {
  section: Section
  region?: Region
  entryKind?: EntryKind
}) {
  return (
    <section className="rs-section" data-type={section.type} data-section-id={section.id}>
      <SectionHeading title={section.title} />
      <SectionBody section={section} entryKind={region === 'sidebar' ? 'stacked' : entryKind} />
    </section>
  )
}

export function Sections({ sections, region = 'main' }: { sections: Section[]; region?: Region }) {
  return (
    <>
      {sections.map((s) => (
        <SectionView key={s.id} section={s} region={region} />
      ))}
    </>
  )
}

/** Groups runs of 2–3 consecutive list sections (skills, languages…) into rows. */
function groupListRuns(sections: Section[]): Array<Section | Section[]> {
  const out: Array<Section | Section[]> = []
  let run: Section[] = []
  const flush = () => {
    if (run.length >= 2) out.push(run)
    else out.push(...run)
    run = []
  }
  for (const s of sections) {
    if (SECTION_CONFIG[s.type].kind === 'list') {
      run.push(s)
      if (run.length === 3) flush()
    } else {
      flush()
      out.push(s)
    }
  }
  flush()
  return out
}

/** Single-column flow that optionally places short list sections side by side. */
export function FlowSections({ sections }: { sections: Section[] }) {
  const { design } = useResumeCtx()
  if (!design.inlineLists) return <Sections sections={sections} />
  return (
    <>
      {groupListRuns(sections).map((g) =>
        Array.isArray(g) ? (
          <div
            key={g.map((s) => s.id).join('-')}
            className="rs-section-row"
            style={{ gridTemplateColumns: g.map((s) => (s.type === 'skills' ? '1.5fr' : '1fr')).join(' ') }}
          >
            {g.map((s) => (
              <SectionView key={s.id} section={s} />
            ))}
          </div>
        ) : (
          <SectionView key={g.id} section={g} />
        ),
      )}
    </>
  )
}
