import type { SectionItem, SectionType } from './types'

export type ItemField =
  | 'title'
  | 'subtitle'
  | 'meta'
  | 'location'
  | 'dates'
  | 'date'
  | 'url'
  | 'level'
  | 'keywords'
  | 'description'

export interface SectionConfig {
  type: SectionType
  label: string
  description: string
  /** Renders items as compact list (skills, languages…) instead of entries */
  kind: 'text' | 'entries' | 'list'
  defaultColumn: 'main' | 'sidebar'
  fields: ItemField[]
  labels: Partial<Record<ItemField, string>>
  placeholders: Partial<Record<ItemField, string>>
  addLabel: string
}

export const SECTION_CONFIG: Record<SectionType, SectionConfig> = {
  summary: {
    type: 'summary',
    label: 'Summary',
    description: 'A short professional profile',
    kind: 'text',
    defaultColumn: 'main',
    fields: [],
    labels: {},
    placeholders: {},
    addLabel: '',
  },
  experience: {
    type: 'experience',
    label: 'Experience',
    description: 'Jobs, internships, freelance work',
    kind: 'entries',
    defaultColumn: 'main',
    fields: ['title', 'subtitle', 'location', 'dates', 'url', 'description'],
    labels: { title: 'Position', subtitle: 'Company', location: 'Location', url: 'Website' },
    placeholders: { title: 'Senior Product Designer', subtitle: 'Acme Inc.', location: 'Berlin, Germany' },
    addLabel: 'Add experience',
  },
  education: {
    type: 'education',
    label: 'Education',
    description: 'Degrees, schools, courses',
    kind: 'entries',
    defaultColumn: 'main',
    fields: ['title', 'subtitle', 'meta', 'location', 'dates', 'url', 'description'],
    labels: { title: 'Degree / Field of study', subtitle: 'School', meta: 'Grade / GPA', location: 'Location', url: 'Website' },
    placeholders: { title: 'B.Sc. Computer Science', subtitle: 'University of Toronto', meta: 'GPA 3.9 / 4.0' },
    addLabel: 'Add education',
  },
  skills: {
    type: 'skills',
    label: 'Skills',
    description: 'Hard and soft skills with levels',
    kind: 'list',
    defaultColumn: 'sidebar',
    fields: ['title', 'level', 'keywords'],
    labels: { title: 'Skill or category', level: 'Level', keywords: 'Keywords' },
    placeholders: { title: 'Frontend', keywords: 'React, TypeScript, CSS' },
    addLabel: 'Add skill',
  },
  projects: {
    type: 'projects',
    label: 'Projects',
    description: 'Side projects, open source, case studies',
    kind: 'entries',
    defaultColumn: 'main',
    fields: ['title', 'subtitle', 'dates', 'url', 'description', 'keywords'],
    labels: { title: 'Project name', subtitle: 'Role / Short description', url: 'Link', keywords: 'Technologies' },
    placeholders: { title: 'Open-source design system', subtitle: 'Creator & maintainer', keywords: 'React, Storybook' },
    addLabel: 'Add project',
  },
  certifications: {
    type: 'certifications',
    label: 'Certifications',
    description: 'Licenses and certificates',
    kind: 'entries',
    defaultColumn: 'main',
    fields: ['title', 'subtitle', 'date', 'url', 'description'],
    labels: { title: 'Certificate', subtitle: 'Issuer', date: 'Date', url: 'Credential URL' },
    placeholders: { title: 'AWS Certified Solutions Architect', subtitle: 'Amazon Web Services' },
    addLabel: 'Add certification',
  },
  languages: {
    type: 'languages',
    label: 'Languages',
    description: 'Spoken languages and fluency',
    kind: 'list',
    defaultColumn: 'sidebar',
    fields: ['title', 'subtitle', 'level'],
    labels: { title: 'Language', subtitle: 'Fluency', level: 'Level' },
    placeholders: { title: 'Spanish', subtitle: 'Professional working proficiency' },
    addLabel: 'Add language',
  },
  awards: {
    type: 'awards',
    label: 'Awards',
    description: 'Honors, prizes, recognition',
    kind: 'entries',
    defaultColumn: 'main',
    fields: ['title', 'subtitle', 'date', 'url', 'description'],
    labels: { title: 'Award', subtitle: 'Awarded by', date: 'Date', url: 'Link' },
    placeholders: { title: 'Employee of the Year', subtitle: 'Acme Inc.' },
    addLabel: 'Add award',
  },
  publications: {
    type: 'publications',
    label: 'Publications',
    description: 'Papers, articles, books, talks',
    kind: 'entries',
    defaultColumn: 'main',
    fields: ['title', 'subtitle', 'date', 'url', 'description'],
    labels: { title: 'Title', subtitle: 'Publisher / Venue', date: 'Date', url: 'Link' },
    placeholders: { title: 'Designing for Trust', subtitle: 'Smashing Magazine' },
    addLabel: 'Add publication',
  },
  volunteer: {
    type: 'volunteer',
    label: 'Volunteering',
    description: 'Community and non-profit work',
    kind: 'entries',
    defaultColumn: 'main',
    fields: ['title', 'subtitle', 'location', 'dates', 'url', 'description'],
    labels: { title: 'Role', subtitle: 'Organization', location: 'Location', url: 'Website' },
    placeholders: { title: 'Mentor', subtitle: 'Code for Good' },
    addLabel: 'Add volunteering',
  },
  references: {
    type: 'references',
    label: 'References',
    description: 'People who can vouch for you',
    kind: 'entries',
    defaultColumn: 'main',
    fields: ['title', 'subtitle', 'url', 'description'],
    labels: { title: 'Name', subtitle: 'Position & company', url: 'Email or link', description: 'Contact details / note' },
    placeholders: { title: 'Jane Cooper', subtitle: 'Engineering Manager, Acme' },
    addLabel: 'Add reference',
  },
  interests: {
    type: 'interests',
    label: 'Interests',
    description: 'Hobbies and passions',
    kind: 'list',
    defaultColumn: 'sidebar',
    fields: ['title', 'keywords'],
    labels: { title: 'Interest', keywords: 'Details' },
    placeholders: { title: 'Photography', keywords: 'Film, Street' },
    addLabel: 'Add interest',
  },
  custom: {
    type: 'custom',
    label: 'Custom section',
    description: 'Anything else, your way',
    kind: 'entries',
    defaultColumn: 'main',
    fields: ['title', 'subtitle', 'location', 'dates', 'url', 'description', 'keywords'],
    labels: { title: 'Title', subtitle: 'Subtitle', location: 'Location', url: 'Link', keywords: 'Tags' },
    placeholders: { title: 'Title', subtitle: 'Subtitle' },
    addLabel: 'Add entry',
  },
}

export const SECTION_TYPES = Object.keys(SECTION_CONFIG) as SectionType[]

export const LEVEL_LABELS = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert']

export function itemLabel(item: SectionItem, type: SectionType): string {
  const t = item.title.trim()
  if (t) return t
  if (item.subtitle.trim()) return item.subtitle.trim()
  return `Untitled ${SECTION_CONFIG[type].label.toLowerCase().replace(/s$/, '')}`
}
