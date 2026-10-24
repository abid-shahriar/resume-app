import { CONTACT_KINDS } from '@/templates/icons'
import { DEFAULT_CUSTOM_LAYOUT, getTemplate, isValidTemplateId, templateDesign } from '@/templates/registry'
import { BASE_DESIGN, createContact, createItem, createSection } from './defaults'
import { SECTION_TYPES } from './sections'
import type { ContactField, CustomLayout, Design, PhotoCrop, Resume, Section, SectionItem } from './types'
import { downloadFile, slugify, uid } from './utils'

const FORMAT = 'vitae-resume'

export function exportResume(resume: Resume) {
  const payload = { format: FORMAT, version: 1, exportedAt: new Date().toISOString(), resume }
  downloadFile(`${slugify(resume.title || resume.basics.name)}.json`, JSON.stringify(payload, null, 2))
}

export function exportAll(resumes: Resume[]) {
  const payload = { format: FORMAT, version: 1, exportedAt: new Date().toISOString(), resumes }
  downloadFile(`vitae-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2))
}

/* ------------------------------- sanitizing -------------------------------- */

const str = (v: unknown, max = 20000) => (typeof v === 'string' ? v.slice(0, max) : typeof v === 'number' ? String(v) : '')
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)
const num = (v: unknown, d: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d

function sanitizeItem(raw: unknown): SectionItem {
  const r = (raw ?? {}) as Record<string, unknown>
  return createItem({
    id: str(r.id, 40) || uid(),
    visible: bool(r.visible, true),
    title: str(r.title, 500),
    subtitle: str(r.subtitle, 500),
    meta: str(r.meta, 300),
    location: str(r.location, 300),
    startDate: str(r.startDate, 60),
    endDate: str(r.endDate, 60),
    current: bool(r.current, false),
    url: str(r.url, 2000),
    description: str(r.description),
    level: Math.round(num(r.level, 0, 0, 5)),
    keywords: Array.isArray(r.keywords) ? r.keywords.map((k) => str(k, 120)).filter(Boolean).slice(0, 60) : [],
  })
}

function sanitizeSection(raw: unknown): Section | null {
  const r = (raw ?? {}) as Record<string, unknown>
  const type = SECTION_TYPES.includes(r.type as never) ? (r.type as Section['type']) : null
  if (!type) return null
  return createSection(type, {
    id: str(r.id, 40) || uid(),
    title: str(r.title, 200) || createSection(type).title,
    visible: bool(r.visible, true),
    column: r.column === 'sidebar' ? 'sidebar' : r.column === 'main' ? 'main' : createSection(type).column,
    content: str(r.content),
    items: Array.isArray(r.items) ? r.items.slice(0, 200).map(sanitizeItem) : [],
  })
}

function sanitizeContact(raw: unknown): ContactField | null {
  const r = (raw ?? {}) as Record<string, unknown>
  const kind = CONTACT_KINDS.includes(r.kind as never) ? (r.kind as ContactField['kind']) : 'custom'
  return { ...createContact(kind, str(r.value, 500), str(r.url, 2000)), id: str(r.id, 40) || uid(), visible: bool(r.visible, true) }
}

export function sanitizeCrop(raw: unknown): PhotoCrop | null {
  const r = raw as { area?: Record<string, unknown>; rotation?: unknown } | null | undefined
  const a = r?.area
  if (!a) return null
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN)
  const area = { x: n(a.x), y: n(a.y), width: n(a.width), height: n(a.height) }
  if (Object.values(area).some(Number.isNaN) || area.width <= 0 || area.height <= 0) return null
  return { area, rotation: num(r?.rotation, 0, -360, 360) }
}

function sanitizeDesign(raw: unknown, templateId: string): Design {
  const base = templateDesign(templateId)
  const r = (raw ?? {}) as Record<string, unknown>
  const out: Design = { ...base }
  for (const key of Object.keys(BASE_DESIGN) as Array<keyof Design>) {
    const v = r[key]
    const d = base[key]
    if (typeof d === 'number' && typeof v === 'number' && Number.isFinite(v)) (out[key] as number) = v
    else if (typeof d === 'boolean' && typeof v === 'boolean') (out[key] as boolean) = v
    else if (typeof d === 'string' && typeof v === 'string' && v.length < 100) (out[key] as string) = v
  }
  out.fontSize = num(out.fontSize, base.fontSize, 6, 16)
  out.lineHeight = num(out.lineHeight, base.lineHeight, 1, 2.2)
  out.nameScale = num(out.nameScale, base.nameScale, 1.2, 5)
  out.marginX = num(out.marginX, base.marginX, 4, 40)
  out.marginY = num(out.marginY, base.marginY, 4, 40)
  out.sidebarWidth = num(out.sidebarWidth, base.sidebarWidth, 20, 50)
  out.photoSize = num(out.photoSize, base.photoSize, 12, 60)
  if (out.pageSize !== 'a4' && out.pageSize !== 'letter') out.pageSize = 'a4'
  return out
}

export function sanitizeResume(raw: unknown): Resume {
  const r = (raw ?? {}) as Record<string, unknown>
  const templateId = isValidTemplateId(r.templateId) ? r.templateId : getTemplate('').id
  const b = (r.basics ?? {}) as Record<string, unknown>
  const photo = str(b.photo, 2_000_000)
  const photoSource = str(b.photoSource, 4_000_000)
  return {
    id: str(r.id, 40) || uid(),
    title: str(r.title, 200) || 'Imported Resume',
    templateId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    basics: {
      name: str(b.name, 200),
      headline: str(b.headline, 300),
      photo: photo.startsWith('data:image/') ? photo : '',
      photoSource: photoSource.startsWith('data:image/') ? photoSource : '',
      photoCrop: sanitizeCrop(b.photoCrop),
      photoVisible: bool(b.photoVisible, true),
      contacts: Array.isArray(b.contacts) ? (b.contacts.map(sanitizeContact).filter(Boolean) as ContactField[]) : [],
    },
    sections: Array.isArray(r.sections) ? (r.sections.map(sanitizeSection).filter(Boolean) as Section[]) : [],
    design: sanitizeDesign(r.design, templateId),
    customLayout: sanitizeCustomLayout(r.customLayout),
  }
}

function sanitizeCustomLayout(raw: unknown): CustomLayout {
  const r = (raw ?? {}) as Record<string, unknown>
  const d = DEFAULT_CUSTOM_LAYOUT
  const oneOf = <T extends string>(v: unknown, opts: readonly T[], fallback: T): T => (opts.includes(v as T) ? (v as T) : fallback)
  return {
    columns: r.columns === 1 || r.columns === 2 ? r.columns : d.columns,
    header: oneOf(r.header, ['standard', 'split', 'banner', 'sidebar', 'top', 'main'] as const, d.header),
    photo: bool(r.photo, d.photo),
    flow: oneOf(r.flow, ['standard', 'timeline', 'labels'] as const, d.flow),
    entry: oneOf(r.entry, ['stacked', 'dateLeft'] as const, d.entry),
    sectionDividers: bool(r.sectionDividers, d.sectionDividers),
    headerDivider: bool(r.headerDivider, d.headerDivider),
    columnDivider: bool(r.columnDivider, d.columnDivider),
    strip: bool(r.strip, d.strip),
  }
}

/* --------------------------- JSON Resume support --------------------------- */
// https://jsonresume.org/schema

type JR = Record<string, any>

function fmtDate(d?: string) {
  if (!d) return ''
  const m = /^(\d{4})-(\d{2})/.exec(d)
  if (!m) return d
  const date = new Date(Number(m[1]), Number(m[2]) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function highlights(desc?: string, list?: string[]) {
  const parts: string[] = []
  if (desc) parts.push(desc)
  if (Array.isArray(list) && list.length) parts.push(list.map((h) => `- ${h}`).join('\n'))
  return parts.join('\n')
}

function fromJsonResume(jr: JR): Resume {
  const b = jr.basics ?? {}
  const contacts: ContactField[] = []
  if (b.email) contacts.push(createContact('email', b.email))
  if (b.phone) contacts.push(createContact('phone', b.phone))
  const loc = [b.location?.city, b.location?.region, b.location?.countryCode].filter(Boolean).join(', ')
  if (loc) contacts.push(createContact('location', loc))
  if (b.url) contacts.push(createContact('website', String(b.url).replace(/^https?:\/\//, ''), b.url))
  for (const p of Array.isArray(b.profiles) ? b.profiles : []) {
    const net = String(p.network ?? '').toLowerCase()
    const kind = (['linkedin', 'github', 'twitter', 'dribbble', 'behance'] as const).find((k) => net.includes(k)) ?? (net === 'x' ? 'twitter' : 'custom')
    contacts.push(createContact(kind, p.username || p.url || p.network || '', p.url || ''))
  }

  const sections: Section[] = []
  if (b.summary) sections.push(createSection('summary', { content: b.summary }))
  const entries = (type: Section['type'], list: JR[] | undefined, map: (x: JR) => Partial<SectionItem>) => {
    if (Array.isArray(list) && list.length) sections.push(createSection(type, { items: list.map((x) => createItem(map(x))) }))
  }
  entries('experience', jr.work, (w) => ({
    title: w.position ?? '',
    subtitle: w.name ?? w.company ?? '',
    location: w.location ?? '',
    startDate: fmtDate(w.startDate),
    endDate: fmtDate(w.endDate),
    current: !!w.startDate && !w.endDate,
    url: w.url ?? '',
    description: highlights(w.summary, w.highlights),
  }))
  entries('education', jr.education, (e) => ({
    title: [e.studyType, e.area].filter(Boolean).join(' in '),
    subtitle: e.institution ?? '',
    meta: e.score ?? '',
    startDate: fmtDate(e.startDate),
    endDate: fmtDate(e.endDate),
    url: e.url ?? '',
    description: Array.isArray(e.courses) && e.courses.length ? `Courses: ${e.courses.join(', ')}` : '',
  }))
  entries('projects', jr.projects, (p) => ({
    title: p.name ?? '',
    subtitle: Array.isArray(p.roles) ? p.roles.join(', ') : '',
    startDate: fmtDate(p.startDate),
    endDate: fmtDate(p.endDate),
    url: p.url ?? '',
    description: highlights(p.description, p.highlights),
    keywords: Array.isArray(p.keywords) ? p.keywords : [],
  }))
  entries('volunteer', jr.volunteer, (v) => ({
    title: v.position ?? '',
    subtitle: v.organization ?? '',
    startDate: fmtDate(v.startDate),
    endDate: fmtDate(v.endDate),
    url: v.url ?? '',
    description: highlights(v.summary, v.highlights),
  }))
  entries('awards', jr.awards, (a) => ({ title: a.title ?? '', subtitle: a.awarder ?? '', startDate: fmtDate(a.date), description: a.summary ?? '' }))
  entries('certifications', jr.certificates, (c) => ({ title: c.name ?? '', subtitle: c.issuer ?? '', startDate: fmtDate(c.date), url: c.url ?? '' }))
  entries('publications', jr.publications, (p) => ({
    title: p.name ?? '',
    subtitle: p.publisher ?? '',
    startDate: fmtDate(p.releaseDate),
    url: p.url ?? '',
    description: p.summary ?? '',
  }))
  const levelMap: Record<string, number> = { beginner: 1, elementary: 2, intermediate: 3, advanced: 4, expert: 5, master: 5, native: 5, fluent: 5 }
  const lvl = (s?: string) => levelMap[String(s ?? '').toLowerCase().split(/\s/)[0]] ?? 0
  entries('skills', jr.skills, (s) => ({ title: s.name ?? '', level: lvl(s.level), keywords: Array.isArray(s.keywords) ? s.keywords : [] }))
  entries('languages', jr.languages, (l) => ({ title: l.language ?? '', subtitle: l.fluency ?? '', level: lvl(l.fluency) }))
  entries('interests', jr.interests, (i) => ({ title: i.name ?? '', keywords: Array.isArray(i.keywords) ? i.keywords : [] }))
  entries('references', jr.references, (r) => ({ title: r.name ?? '', description: r.reference ?? '' }))

  return sanitizeResume({
    title: b.name ? `${b.name}'s Resume` : 'Imported Resume',
    templateId: 'onyx',
    basics: { name: b.name ?? '', headline: b.label ?? '', photo: '', photoVisible: true, contacts },
    sections,
  })
}

/** Parses an uploaded file. Supports Vitae exports (single or backup) and JSON Resume. */
export async function parseImport(file: File): Promise<Resume[]> {
  if (file.size > 10 * 1024 * 1024) throw new Error('File is too large.')
  let data: any
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (data?.format === FORMAT) {
    if (Array.isArray(data.resumes)) return data.resumes.map(sanitizeResume)
    if (data.resume) return [sanitizeResume(data.resume)]
  }
  if (data && typeof data === 'object' && ('basics' in data || 'work' in data) && !('sections' in data)) {
    return [fromJsonResume(data)]
  }
  if (data && typeof data === 'object' && 'sections' in data && 'basics' in data) {
    return [sanitizeResume(data)]
  }
  throw new Error('Unrecognized format. Use a Vitae export or a JSON Resume file.')
}
