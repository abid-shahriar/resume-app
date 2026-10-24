import { Check, FileDown, LoaderCircle, Printer } from 'lucide-react'
import { useCallback, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { create } from 'zustand'
import { printResume, resumeFileName } from '@/components/print'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/kit'
import { importWithReload } from '@/lib/chunks'
import type { Resume } from '@/lib/types'
import { cn, downloadFile } from '@/lib/utils'

type Method = 'pdf' | 'print'

const METHOD_KEY = 'cvghor:download-method'
const useDialog = create<{ resume: Resume | null; method: Method }>(() => ({ resume: null, method: 'pdf' }))

const loadPdfModule = () => importWithReload(() => import('@/components/pdf'))

function savedMethod(): Method {
  try {
    return localStorage.getItem(METHOD_KEY) === 'print' ? 'print' : 'pdf'
  } catch {
    return 'pdf'
  }
}

function saveMethod(m: Method) {
  try {
    localStorage.setItem(METHOD_KEY, m)
  } catch {
    /* ignore */
  }
}

/** Returns a function that opens the download dialog for a resume. */
export function useDownload() {
  return useCallback((resume: Resume) => {
    void loadPdfModule() // warm up while the dialog opens
    useDialog.setState({ resume, method: savedMethod() })
  }, [])
}

function MethodOption({
  selected,
  onSelect,
  icon,
  title,
  badge,
  children,
}: {
  selected: boolean
  onSelect: () => void
  icon: ReactNode
  title: string
  badge?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-3 focus-visible:ring-ring/50',
        selected ? 'border-primary bg-primary-soft/60 ring-1 ring-primary' : 'border-border hover:border-border-strong hover:bg-muted/50',
      )}
    >
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-lg transition-colors [&_svg]:size-[18px]',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {badge && (
            <span className="rounded-full bg-primary-soft px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary-soft-foreground">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">{children}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  )
}

export function DownloadDialog() {
  const resume = useDialog((s) => s.resume)
  const method = useDialog((s) => s.method)
  const setMethod = (m: Method) => useDialog.setState({ method: m })
  const [busy, setBusy] = useState(false)
  const job = useRef(0)

  const close = () => {
    job.current++ // a running export finishes silently
    setBusy(false)
    useDialog.setState({ resume: null })
  }

  const print = (r: Resume) => {
    close()
    // Let the dialog close before the (blocking) print dialog opens
    setTimeout(() => void printResume(r), 220)
  }

  const downloadPdf = async (r: Resume) => {
    const id = ++job.current
    setBusy(true)
    try {
      const { createResumePdf } = await loadPdfModule()
      const { blob, filename, pages } = await createResumePdf(r)
      if (id !== job.current) return
      downloadFile(filename, blob, 'application/pdf')
      close()
      toast.success('PDF downloaded', { description: `${filename} · ${pages} page${pages === 1 ? '' : 's'}` })
    } catch (err) {
      if (id !== job.current) return
      setBusy(false)
      console.error(err)
      toast.error('Could not create the PDF', {
        description: 'Try again, or use browser print instead.',
        action: { label: 'Print', onClick: () => print(r) },
      })
    }
  }

  const go = () => {
    if (!resume || busy) return
    saveMethod(method)
    if (method === 'pdf') void downloadPdf(resume)
    else print(resume)
  }

  const filename = resume ? `${resumeFileName(resume)}.pdf` : ''

  return (
    <ResponsiveDialog
      open={!!resume}
      onOpenChange={(o) => !o && close()}
      size="md"
      title="Download resume"
      description={
        <span className="block truncate">
          {filename} · {resume?.design.pageSize === 'letter' ? 'US Letter' : 'A4'}
        </span>
      }
      footer={
        <>
          <Button variant="outline" size="lg" onClick={close}>
            Cancel
          </Button>
          <Button size="lg" onClick={go} disabled={busy} className="min-w-40">
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" /> Creating PDF…
              </>
            ) : method === 'pdf' ? (
              <>
                <FileDown /> Download PDF
              </>
            ) : (
              <>
                <Printer /> Open print dialog
              </>
            )}
          </Button>
        </>
      }
    >
      <div role="radiogroup" aria-label="Download method" className="flex flex-col gap-2.5">
        <MethodOption
          selected={method === 'pdf'}
          onSelect={() => setMethod('pdf')}
          icon={<FileDown />}
          title="PDF file"
          badge="Recommended"
        >
          Saves straight to your device, ready to send or upload. Text stays selectable and links stay clickable.
        </MethodOption>
        <MethodOption selected={method === 'print'} onSelect={() => setMethod('print')} icon={<Printer />} title="Browser print">
          Opens your browser's print dialog to print on paper or save as a PDF.
        </MethodOption>
      </div>

      {method === 'print' && (
        <ol className="mt-4 flex flex-col gap-2.5 rounded-xl bg-muted/60 p-3.5 text-[13px] animate-in fade-in-0 slide-in-from-top-1">
          {[
            <>
              To save a file, set <b className="font-semibold">Destination</b> to <b className="font-semibold">Save as PDF</b>.
            </>,
            <>
              Keep <b className="font-semibold">Margins</b> on <b className="font-semibold">Default</b> or <b className="font-semibold">None</b> and{' '}
              <b className="font-semibold">Scale</b> at 100%.
            </>,
          ].map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-background text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
                {i + 1}
              </span>
              <span className="text-foreground/85">{step}</span>
            </li>
          ))}
        </ol>
      )}
    </ResponsiveDialog>
  )
}
