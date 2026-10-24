import { Printer } from 'lucide-react'
import { useCallback, useState } from 'react'
import { create } from 'zustand'
import { printResume } from '@/components/print'
import { Button } from '@/components/ui/button'
import { SwitchRow } from '@/components/ui/controls'
import { Dialog } from '@/components/ui/dialog'
import type { Resume } from '@/lib/types'

const TIP_KEY = 'vitae:pdf-tip-dismissed'
const useDialog = create<{ resume: Resume | null }>(() => ({ resume: null }))

function tipDismissed() {
  try {
    return localStorage.getItem(TIP_KEY) === '1'
  } catch {
    return false
  }
}

/** Returns a function that downloads the resume as PDF (via the print dialog). */
export function useDownload() {
  return useCallback((resume: Resume) => {
    if (tipDismissed()) void printResume(resume)
    else useDialog.setState({ resume })
  }, [])
}

export function DownloadDialog() {
  const resume = useDialog((s) => s.resume)
  const [dontShow, setDontShow] = useState(false)
  const close = () => useDialog.setState({ resume: null })

  const go = () => {
    if (!resume) return
    if (dontShow) {
      try {
        localStorage.setItem(TIP_KEY, '1')
      } catch {
        /* ignore */
      }
    }
    close()
    // Let the dialog close before the (blocking) print dialog opens
    setTimeout(() => void printResume(resume), 220)
  }

  return (
    <Dialog
      open={!!resume}
      onOpenChange={(o) => !o && close()}
      size="md"
      title="Download as PDF"
      description="Your browser's print dialog will open. It creates a crisp PDF with selectable text."
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={go}>
            <Printer /> Open print dialog
          </Button>
        </>
      }
    >
      <ol className="flex flex-col gap-3 text-sm">
        {[
          <>
            Set <b className="font-semibold">Destination</b> to <b className="font-semibold">Save as PDF</b>.
          </>,
          <>
            Keep <b className="font-semibold">Margins</b> on <b className="font-semibold">Default</b> or <b className="font-semibold">None</b> and{' '}
            <b className="font-semibold">Scale</b> at 100%.
          </>,
          <>
            On a phone, tap <b className="font-semibold">Share</b> or <b className="font-semibold">Download</b> in the print preview to save the
            file.
          </>,
        ].map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-foreground">
              {i + 1}
            </span>
            <span className="pt-0.5 text-foreground/85">{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-xl border border-border px-3 py-1.5">
        <SwitchRow label="Don't show this again" checked={dontShow} onCheckedChange={setDontShow} />
      </div>
    </Dialog>
  )
}
