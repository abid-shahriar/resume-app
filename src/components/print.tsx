import { createPortal, flushSync } from 'react-dom'
import { toast } from 'sonner'
import { create } from 'zustand'
import { loadFonts, waitForFonts } from '@/lib/fonts'
import type { Resume } from '@/lib/types'
import { slugify } from '@/lib/utils'
import { ResumeDocument } from '@/templates/ResumeDocument'

const usePrintJob = create<{ resume: Resume | null }>(() => ({ resume: null }))

function getRoot() {
  let el = document.getElementById('print-root')
  if (!el) {
    el = document.createElement('div')
    el.id = 'print-root'
    document.body.appendChild(el)
  }
  return el
}

/**
 * Prints (and therefore lets the user "Save as PDF") the given resume with
 * crisp, selectable vector text. Only the resume is visible in print.
 */
export async function printResume(resume: Resume) {
  const { headingFont, bodyFont, pageSize } = resume.design
  loadFonts([headingFont, bodyFont])

  const style = document.createElement('style')
  style.id = 'print-page-style'
  style.textContent = `@page { size: ${pageSize === 'letter' ? 'letter' : 'A4'}; margin: 0; }`
  document.getElementById('print-page-style')?.remove()
  document.head.appendChild(style)

  const prevTitle = document.title
  document.title = slugify(resume.basics.name || resume.title).replace(/-/g, '_') + '_Resume'

  flushSync(() => usePrintJob.setState({ resume }))
  await waitForFonts([headingFont, bodyFont], 3000)
  // Wait for images (photo) to decode
  const imgs = Array.from(getRoot().querySelectorAll('img'))
  await Promise.all(imgs.map((img) => (img.complete ? null : img.decode().catch(() => null))))
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    document.title = prevTitle
    usePrintJob.setState({ resume: null })
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  try {
    window.print()
  } catch {
    toast.error('Printing is not available in this browser.')
    cleanup()
    return
  }
  // Some mobile browsers return immediately and never fire afterprint.
  setTimeout(cleanup, 60_000)
}

/** Dev-only: mounts a resume for print without opening the dialog (used for headless PDF checks). */
export function mountForPrintTest(resume: Resume) {
  const style = document.createElement('style')
  style.id = 'print-page-style'
  style.textContent = `@page { size: ${resume.design.pageSize === 'letter' ? 'letter' : 'A4'}; margin: 0; }`
  document.head.appendChild(style)
  loadFonts([resume.design.headingFont, resume.design.bodyFont])
  usePrintJob.setState({ resume })
}

export function PrintHost() {
  const resume = usePrintJob((s) => s.resume)
  if (!resume) return null
  return createPortal(<ResumeDocument resume={resume} />, getRoot())
}
