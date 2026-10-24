/**
 * Direct PDF export, no print dialog.
 *
 * The resume is rendered off-screen at its real page width, page breaks are
 * chosen so no text line, entry or image is cut, and each page is rasterized
 * with the browser's own renderer (snapdom) at ~290 dpi. On top of every page
 * image goes an invisible text layer and link annotations, so the PDF stays
 * selectable, searchable, ATS-readable and clickable.
 *
 * Loaded on demand (dynamic import) so the libraries never weigh on startup.
 */
import { snapdom } from '@zumer/snapdom'
import { jsPDF } from 'jspdf'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { loadFonts, waitForFonts } from '@/lib/fonts'
import type { Resume } from '@/lib/types'
import { PAGE_SIZES_PX, ResumeDocument } from '@/templates/ResumeDocument'
import { resumeFileName } from './print'

/** Output pixels per CSS pixel (96 dpi × 3 ≈ 288 dpi) */
const SCALE = 3
const JPEG_QUALITY = 0.94
const MM_PER_PX = 25.4 / 96
const PX_PER_PT = 96 / 72
/** Boxes taller than this are containers; their children decide the breaks */
const SMALL_BOX = 64
const MAX_PAGES = 30

const PAGE_MM = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
} as const

type Span = [start: number, end: number]

interface TextRun {
  text: string
  x: number
  y: number
  width: number
  height: number
  fontPx: number
}

interface LinkBox {
  url: string
  x: number
  y: number
  width: number
  height: number
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

/* ------------------------------- measuring --------------------------------- */

function isPainted(cs: CSSStyleDeclaration) {
  const transparent = (c: string) => c === 'transparent' || /rgba?\(.*,\s*0\)$/.test(c)
  if (!transparent(cs.backgroundColor) || cs.backgroundImage !== 'none') return true
  return (['Top', 'Right', 'Bottom', 'Left'] as const).some(
    (s) => parseFloat(cs.getPropertyValue(`border-${s.toLowerCase()}-width`)) > 0 && !transparent(cs.getPropertyValue(`border-${s.toLowerCase()}-color`)),
  )
}

/**
 * Vertical spans (relative to the page top) that a page break must not cross.
 * `hard`: text lines, images, small painted or leaf boxes. `soft`: blocks we'd
 * rather keep whole (entries, rows, a heading with the start of its section).
 */
function measureBreakSpans(page: HTMLElement) {
  const top = page.getBoundingClientRect().top
  const hard: Span[] = []
  const soft: Span[] = []
  const add = (list: Span[], r: { top: number; bottom: number }) => {
    if (r.bottom - r.top > 0.5) list.push([r.top - top, r.bottom - top])
  }

  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue?.trim()) continue
    range.selectNodeContents(n)
    for (const r of range.getClientRects()) add(hard, r)
  }

  const skip = new Set(['rs-page-bg', 'rs-stripe', 'rs-strip', 'rs-inner'])
  for (const el of page.querySelectorAll<HTMLElement>('*')) {
    if ([...el.classList].some((c) => skip.has(c))) continue
    const r = el.getBoundingClientRect()
    if (!r.height) continue
    if (el instanceof HTMLImageElement || el instanceof SVGSVGElement) {
      add(hard, r)
      continue
    }
    if (el instanceof SVGElement) continue
    if (r.height <= SMALL_BOX && (el.childElementCount === 0 || isPainted(getComputedStyle(el)))) add(hard, r)
    if (el.matches('.rs-entry, .rs-level-row, .rs-section-row')) add(soft, r)
    if (el.matches('.rs-heading')) {
      // Keep a heading with the first lines of what follows it
      const next = el.nextElementSibling?.getBoundingClientRect()
      add(soft, { top: r.top, bottom: next ? Math.min(next.bottom, r.bottom + 48) : r.bottom })
    }
  }
  return { hard, soft }
}

/** Merges overlapping spans (touching spans stay separate: a cut may fall between them). */
function merge(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a[0] - b[0])
  const out: Span[] = []
  for (const [s, e] of sorted) {
    const last = out[out.length - 1]
    if (last && s < last[1] - 0.25) last[1] = Math.max(last[1], e)
    else out.push([s, e])
  }
  return out
}

/** Lowest break position in (lo, hi] that doesn't cross a span, centred in its gap; null if none. */
function findBreak(spans: Span[], lo: number, hi: number): number | null {
  const i = spans.findIndex(([s, e]) => s < hi && e > hi)
  if (i === -1) return hi
  const prevEnd = i > 0 ? spans[i - 1][1] : -Infinity
  const gapStart = Math.max(prevEnd, lo)
  const gapEnd = spans[i][0]
  if (gapEnd <= lo) return null
  return gapStart + (gapEnd - gapStart) / 2
}

/** Splits the document into page slices [top, bottom) in CSS px. */
function paginate(page: HTMLElement, pageH: number, marginY: number) {
  const docH = page.offsetHeight
  if (docH <= pageH + 0.5) return [[0, Math.min(docH, pageH)] as Span]

  const { hard, soft } = measureBreakSpans(page)
  const hardM = merge(hard)
  const allM = merge([...hard, ...soft])
  const contentEnd = hard.reduce((m, [, e]) => Math.max(m, e), 0)

  const slices: Span[] = []
  let start = 0
  while (slices.length < MAX_PAGES) {
    const first = slices.length === 0
    const room = first ? pageH - marginY : pageH - 2 * marginY
    const limit = start + room
    if (contentEnd <= limit + 0.5) {
      slices.push([start, Math.min(docH, start + (first ? pageH : pageH - marginY))])
      break
    }
    const lo = start + 1
    const soft = findBreak(allM, lo, limit)
    const hardCut = findBreak(hardM, lo, limit)
    // Prefer keeping blocks whole unless that leaves the page mostly empty
    let cut = soft !== null && soft - start >= room * 0.6 ? soft : hardCut
    if (cut === null || cut - start < room * 0.25) cut = limit
    slices.push([start, cut])
    start = cut
  }
  return slices
}

/* ------------------------------- text layer -------------------------------- */

/** The standard PDF fonts only cover Latin-1; map typography and drop the rest. */
function pdfSafe(s: string) {
  return s
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/[•·‧]/g, '-')
    .replace(/…/g, '...')
    .replace(/[   ]/g, ' ')
    .replace(/[^ -~¡-ÿ]/g, '')
}

/** Visible text as runs of words that share a line, with their boxes. */
function measureText(page: HTMLElement): TextRun[] {
  const origin = page.getBoundingClientRect()
  const runs: TextRun[] = []
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const value = n.nodeValue ?? ''
    if (!value.trim() || !n.parentElement) continue
    const fontPx = parseFloat(getComputedStyle(n.parentElement).fontSize) || 12
    let run: TextRun | null = null
    for (const m of value.matchAll(/\S+/g)) {
      range.setStart(n, m.index)
      range.setEnd(n, m.index + m[0].length)
      const r = range.getClientRects()[0]
      if (!r || !r.width) continue
      const box = { x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height }
      if (run && Math.abs(run.y - box.y) < box.height * 0.5) {
        run.text += ' ' + m[0]
        run.width = box.x + box.width - run.x
      } else {
        if (run) runs.push(run)
        run = { text: m[0], ...box, fontPx }
      }
    }
    if (run) runs.push(run)
  }
  return runs
}

function measureLinks(page: HTMLElement): LinkBox[] {
  const origin = page.getBoundingClientRect()
  const links: LinkBox[] = []
  for (const a of page.querySelectorAll('a[href]')) {
    const url = a.getAttribute('href') ?? ''
    if (!/^(https?:|mailto:|tel:)/i.test(url)) continue
    for (const r of a.getClientRects()) {
      if (r.width && r.height) links.push({ url, x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height })
    }
  }
  return links
}

/* --------------------------------- export ---------------------------------- */

async function mountOffscreen(resume: Resume) {
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none;z-index:-1;'
  document.body.appendChild(host)
  const root = createRoot(host)
  flushSync(() => root.render(<ResumeDocument resume={resume} />))
  const cleanup = () => {
    root.unmount()
    host.remove()
  }

  const { headingFont, bodyFont } = resume.design
  await Promise.race([loadFonts([headingFont, bodyFont]), wait(4000)])
  await waitForFonts([headingFont, bodyFont], 4000)
  await Promise.all(Array.from(host.querySelectorAll('img'), (img) => img.decode().catch(() => null)))
  await frames()

  const page = host.querySelector<HTMLElement>('.rs-page')
  if (!page) {
    cleanup()
    throw new Error('Could not render the resume.')
  }
  return { page, cleanup }
}

export async function createResumePdf(resume: Resume): Promise<{ blob: Blob; filename: string; pages: number }> {
  const size = resume.design.pageSize === 'letter' ? 'letter' : 'a4'
  const px = PAGE_SIZES_PX[size]
  const mm = PAGE_MM[size]
  const marginY = (resume.design.marginY / 25.4) * 96
  const { page, cleanup } = await mountOffscreen(resume)

  try {
    const slices = paginate(page, px.height, marginY)
    const runs = measureText(page)
    const links = measureLinks(page)
    const capture = await snapdom(page, {
      scale: 1,
      dpr: 1,
      embedFonts: true,
      fontStylesheetDomains: ['fonts.googleapis.com', 'fonts.gstatic.com'],
      backgroundColor: resume.design.pageColor,
    })
    const { contentX, contentY } = capture.meta

    const pdf = new jsPDF({ unit: 'mm', format: [mm.width, mm.height], orientation: 'portrait', compress: true })
    const name = resume.basics.name.trim()
    pdf.setProperties({
      title: name ? `${name} - Resume` : resume.title,
      author: name,
      subject: 'Resume',
      creator: 'CvGhor (cvghor.vercel.app)',
    })
    pdf.setFont('helvetica', 'normal')

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(px.width * SCALE)
    canvas.height = Math.round(px.height * SCALE)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')

    for (let i = 0; i < slices.length; i++) {
      const [top, bottom] = slices[i]
      const offset = i === 0 ? 0 : marginY
      const slice = await capture.toCanvas({
        crop: { x: contentX, y: contentY + top, width: px.width, height: bottom - top },
        scale: SCALE,
        dpr: 1,
      })

      ctx.fillStyle = resume.design.pageColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const dy = offset * SCALE
      const dh = (bottom - top) * SCALE
      // Breaks fall in blank rows, so stretching the edge rows continues the
      // backgrounds (sidebar, stripes, rules) into the page margins.
      if (dy > 0) ctx.drawImage(slice, 0, 0, slice.width, 1, 0, 0, canvas.width, dy)
      ctx.drawImage(slice, 0, 0, slice.width, slice.height, 0, dy, canvas.width, dh)
      const rest = canvas.height - (dy + dh)
      if (rest > 0.5) ctx.drawImage(slice, 0, slice.height - 1, slice.width, 1, 0, dy + dh, canvas.width, rest)

      if (i > 0) pdf.addPage([mm.width, mm.height], 'portrait')
      pdf.addImage(canvas.toDataURL('image/jpeg', JPEG_QUALITY), 'JPEG', 0, 0, mm.width, mm.height, undefined, 'FAST')

      const toPage = (y: number) => (y - top + offset) * MM_PER_PX
      for (const run of runs) {
        const mid = run.y + run.height / 2
        if (mid < top || mid >= bottom) continue
        const text = pdfSafe(run.text)
        if (!text.trim()) continue
        pdf.setFontSize(run.fontPx / PX_PER_PT)
        const natural = pdf.getTextWidth(text)
        const target = run.width * MM_PER_PX
        pdf.text(text, run.x * MM_PER_PX, toPage(mid), {
          baseline: 'middle',
          renderingMode: 'invisible',
          horizontalScale: natural > 0 ? Math.min(4, Math.max(0.25, target / natural)) : 1,
        })
      }
      for (const link of links) {
        const mid = link.y + link.height / 2
        if (mid < top || mid >= bottom) continue
        pdf.link(link.x * MM_PER_PX, toPage(link.y), link.width * MM_PER_PX, link.height * MM_PER_PX, { url: link.url })
      }
    }

    return { blob: pdf.output('blob'), filename: `${resumeFileName(resume)}.pdf`, pages: slices.length }
  } finally {
    cleanup()
  }
}
