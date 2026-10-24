export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'awards'
  | 'publications'
  | 'volunteer'
  | 'references'
  | 'interests'
  | 'custom'

export type Column = 'main' | 'sidebar'

export interface SectionItem {
  id: string
  visible: boolean
  /** Position, degree, skill, project name… */
  title: string
  /** Company, school, issuer… */
  subtitle: string
  /** Small extra detail such as GPA or proficiency label */
  meta: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  url: string
  /** Lightweight markdown: **bold**, *italic*, [link](url), "- " bullets */
  description: string
  /** 0 = not set, 1..5 */
  level: number
  keywords: string[]
}

export interface Section {
  id: string
  type: SectionType
  title: string
  visible: boolean
  column: Column
  /** Free text content (used by the summary section) */
  content: string
  items: SectionItem[]
}

export type ContactKind =
  | 'email'
  | 'phone'
  | 'location'
  | 'website'
  | 'linkedin'
  | 'github'
  | 'twitter'
  | 'dribbble'
  | 'behance'
  | 'portfolio'
  | 'birthday'
  | 'nationality'
  | 'custom'

export interface ContactField {
  id: string
  kind: ContactKind
  value: string
  /** Optional explicit link. Derived from the value when empty. */
  url: string
  visible: boolean
}

export interface Basics {
  name: string
  headline: string
  photo: string
  photoVisible: boolean
  contacts: ContactField[]
}

export type HeadingStyle = 'line' | 'underline' | 'bar' | 'filled' | 'tint' | 'plain' | 'dot' | 'boxed'
export type SkillStyle = 'tags' | 'bars' | 'dots' | 'text'
export type SidebarTone = 'accent' | 'dark' | 'tint' | 'gray' | 'plain'
export type PageSize = 'a4' | 'letter'
export type PhotoShape = 'circle' | 'rounded' | 'square'
export type Align = 'left' | 'center'

export interface Design {
  accent: string
  textColor: string
  pageColor: string
  headingFont: string
  bodyFont: string
  /** Base font size in pt */
  fontSize: number
  lineHeight: number
  /** Name size multiplier relative to the base font size */
  nameScale: number
  pageSize: PageSize
  /** Page margins in mm */
  marginX: number
  marginY: number
  /** Spacing in pt */
  sectionGap: number
  itemGap: number
  headingStyle: HeadingStyle
  headingUppercase: boolean
  headingAlign: Align
  headerAlign: Align
  skillStyle: SkillStyle
  sidebarTone: SidebarTone
  sidebarSide: 'left' | 'right'
  /** Percentage of page width */
  sidebarWidth: number
  showIcons: boolean
  photoShape: PhotoShape
  /** Photo size in mm */
  photoSize: number
  underlineLinks: boolean
  /** Single-column layouts: place consecutive skills/languages/interests side by side */
  inlineLists: boolean
  presentLabel: string
}

export interface Resume {
  id: string
  title: string
  templateId: string
  createdAt: number
  updatedAt: number
  basics: Basics
  sections: Section[]
  design: Design
}
