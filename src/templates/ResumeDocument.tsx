import { memo, useEffect, type CSSProperties, type Ref } from 'react'
import { fontStack, loadFonts } from '@/lib/fonts'
import type { Design, Resume } from '@/lib/types'
import { getTemplate } from './registry'
import {
  Contacts,
  FlowSections,
  Headline,
  Name,
  Photo,
  ResumeProvider,
  Sections,
  useResumeCtx,
  visibleSections,
} from './shared'
import './resume.css'

/* ---------------------------------- headers --------------------------------- */

function StandardHeader({ className = '' }: { className?: string }) {
  const { design } = useResumeCtx()
  return (
    <header className={`rs-header rs-header-standard ${className}`} data-align={design.headerAlign}>
      <Photo />
      <div className="rs-header-text">
        <Name />
        <Headline />
        <Contacts layout="inline" />
      </div>
    </header>
  )
}

function SplitHeader() {
  return (
    <header className="rs-header rs-header-split">
      <Photo />
      <div className="rs-header-text">
        <Name />
        <Headline />
      </div>
      <Contacts layout="stack" className="rs-contacts-right" />
    </header>
  )
}

function SidebarHeader() {
  const { design } = useResumeCtx()
  return (
    <header className="rs-header rs-header-sidebar" data-align={design.headerAlign}>
      <Photo />
      <div className="rs-header-text">
        <Name />
        <Headline />
      </div>
      <Contacts layout="stack" />
    </header>
  )
}

function SwissHeader() {
  return (
    <header className="rs-header rs-header-swiss">
      <Name />
      <div className="rs-swiss-row">
        <div className="rs-swiss-label">
          <Photo />
        </div>
        <div className="rs-swiss-meta">
          <Headline />
          <Contacts layout="inline" />
        </div>
      </div>
    </header>
  )
}

/* ---------------------------------- layouts --------------------------------- */

function ClassicLayout() {
  const { resume, template } = useResumeCtx()
  const sections = visibleSections(resume)
  return (
    <>
      {template.header === 'banner' && <StandardHeader className="rs-header-banner" />}
      <div className="rs-content">
        {template.header === 'split' ? <SplitHeader /> : template.header !== 'banner' && <StandardHeader />}
        <FlowSections sections={sections} />
      </div>
    </>
  )
}

function SidebarLayout() {
  const { resume, template } = useResumeCtx()
  const main = visibleSections(resume, 'main')
  const side = visibleSections(resume, 'sidebar')
  const h = template.header
  return (
    <>
      {h === 'banner' && <StandardHeader className="rs-header-banner" />}
      {h === 'top' && <StandardHeader className="rs-header-top" />}
      <div className="rs-cols">
        <aside className="rs-aside">
          {h === 'sidebar' && <SidebarHeader />}
          <Sections sections={side} region="sidebar" />
        </aside>
        <main className="rs-main">
          {(h === 'main' || h === 'standard' || h === 'split') && <StandardHeader />}
          <Sections sections={main} />
        </main>
      </div>
    </>
  )
}

function TimelineLayout() {
  const { resume } = useResumeCtx()
  return (
    <div className="rs-content">
      <StandardHeader />
      <Sections sections={visibleSections(resume)} />
    </div>
  )
}

function SwissLayout() {
  const { resume } = useResumeCtx()
  return (
    <div className="rs-content">
      <SwissHeader />
      <Sections sections={visibleSections(resume)} />
    </div>
  )
}

const LAYOUTS = {
  classic: ClassicLayout,
  sidebar: SidebarLayout,
  timeline: TimelineLayout,
  swiss: SwissLayout,
}

/* --------------------------------- document --------------------------------- */

export function designVars(d: Design): CSSProperties {
  return {
    '--accent': d.accent,
    '--text': d.textColor,
    '--page': d.pageColor,
    '--font-h': fontStack(d.headingFont),
    '--font-b': fontStack(d.bodyFont),
    '--fs': `${d.fontSize}pt`,
    '--lh': d.lineHeight,
    '--name-scale': d.nameScale,
    '--mx': `${d.marginX}mm`,
    '--my': `${d.marginY}mm`,
    '--sgap': `${d.sectionGap}pt`,
    '--igap': `${d.itemGap}pt`,
    '--sw': `${d.sidebarWidth}%`,
    '--photo': `${d.photoSize}mm`,
  } as CSSProperties
}

export interface ResumeDocumentProps {
  resume: Resume
  /** Number of pages the sheet should visually fill on screen */
  pages?: number
  innerRef?: Ref<HTMLDivElement>
  className?: string
}

export const ResumeDocument = memo(function ResumeDocument({ resume, pages = 1, innerRef, className }: ResumeDocumentProps) {
  const template = getTemplate(resume.templateId)
  const design = resume.design
  const Layout = LAYOUTS[template.layout]

  useEffect(() => {
    loadFonts([design.headingFont, design.bodyFont])
  }, [design.headingFont, design.bodyFont])

  return (
    <ResumeProvider value={{ resume, design, template }}>
      <div
        className={className ? `rs-page ${className}` : 'rs-page'}
        data-layout={template.layout}
        data-header={template.header}
        data-entry={template.entry}
        data-tone={template.layout === 'sidebar' ? design.sidebarTone : undefined}
        data-side={design.sidebarSide}
        data-size={design.pageSize}
        data-hcase={design.headingUppercase ? 'upper' : 'normal'}
        data-halign={design.headingAlign}
        data-ul={design.underlineLinks ? 'on' : 'off'}
        style={{ ...designVars(design), '--pages': pages } as CSSProperties}
      >
        <div className="rs-page-bg" aria-hidden />
        {template.layout === 'sidebar' && <div className="rs-stripe" aria-hidden />}
        {template.strip && <div className="rs-strip" aria-hidden />}
        <div className="rs-inner" ref={innerRef}>
          <Layout />
        </div>
      </div>
    </ResumeProvider>
  )
})

export const PAGE_SIZES_PX = {
  // CSS pixels at 96dpi
  a4: { width: (210 / 25.4) * 96, height: (297 / 25.4) * 96 },
  letter: { width: 8.5 * 96, height: 11 * 96 },
} as const
