import {
  ArrowRight,
  Copy,
  Download,
  Ellipsis,
  FileDown,
  GripVertical,
  LayoutTemplate,
  Palette,
  Pencil,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ResumeThumb } from '@/components/ResumePreview'
import { SiteFooter, SiteHeader } from '@/components/site'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu'
import { exportAll, exportResume, parseImport } from '@/lib/io'
import type { Resume } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'
import { useResumeList, useResumeStore } from '@/store/resumes'
import { templatePreview } from '@/templates/previews'
import { getTemplate, TEMPLATES } from '@/templates/registry'
import { TemplateCard } from './TemplatesPage'

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: `${TEMPLATES.length} crafted templates`,
    text: 'From classic Harvard to bold creative layouts. Switch instantly, your content stays put.',
  },
  {
    icon: GripVertical,
    title: 'Drag & drop everything',
    text: 'Reorder sections, entries and contact fields. Move sections between columns with a drag.',
  },
  {
    icon: Palette,
    title: 'Total design control',
    text: 'Colors, 28 fonts, spacing, heading styles, skill meters, photo shapes and more.',
  },
  {
    icon: FileDown,
    title: 'Pixel-perfect PDF',
    text: 'Vector text that stays sharp and selectable, ready for applicant tracking systems.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    text: 'No account, no server, no tracking. Everything is saved locally in your browser.',
  },
  {
    icon: Smartphone,
    title: 'Works on your phone',
    text: 'A touch-first editor that feels native, so you can polish your resume anywhere.',
  },
]

function HeroArt() {
  const picks = ['aurora', 'harvard', 'horizon']
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[560px] sm:h-[420px]" aria-hidden>
      <div className="absolute inset-x-10 bottom-0 top-10 rounded-[40px] bg-gradient-to-br from-accent/25 via-accent/5 to-transparent blur-3xl" />
      {picks.map((id, i) => {
        const pos = [
          'left-[4%] top-[14%] -rotate-[7deg] w-[38%]',
          'left-1/2 top-0 z-10 w-[44%] -translate-x-1/2',
          'right-[4%] top-[14%] rotate-[7deg] w-[38%]',
        ][i]
        return (
          <div
            key={id}
            className={`absolute ${pos} animate-fade-up`}
            style={{ animationDelay: `${150 + i * 120}ms` }}
          >
            <div className="animate-float" style={{ animationDelay: `${i * -2}s` }}>
              <div className="overflow-hidden rounded-md shadow-[var(--shadow-paper)] ring-1 ring-black/5">
                <ResumeThumb resume={templatePreview(id)} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ResumeCard({ resume, index }: { resume: Resume; index: number }) {
  const navigate = useNavigate()
  const duplicate = useResumeStore((s) => s.duplicateResume)
  const remove = useResumeStore((s) => s.deleteResume)
  const restore = useResumeStore((s) => s.restoreResume)
  const update = useResumeStore((s) => s.updateResume)
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(resume.title)

  const onDelete = () => {
    const snapshot = resume
    remove(resume.id)
    toast(`Deleted “${snapshot.title}”`, {
      action: { label: 'Undo', onClick: () => restore(snapshot) },
      duration: 6000,
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <Link
        to={`/edit/${resume.id}`}
        className="block overflow-hidden rounded-xl border border-border bg-white shadow-sm outline-none transition-[box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-accent/30"
        aria-label={`Open ${resume.title}`}
      >
        <ResumeThumb resume={resume} />
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <div className="truncate font-medium">{resume.title}</div>
          <div className="mt-0.5 truncate text-xs text-muted">
            {getTemplate(resume.templateId).name} · Edited {formatRelativeTime(resume.updatedAt)}
          </div>
        </div>
        <Menu>
          <MenuTrigger asChild>
            <Button variant="subtle" size="icon-sm" aria-label="Resume actions" className="-mr-1.5 shrink-0">
              <Ellipsis />
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem icon={<Pencil />} onSelect={() => navigate(`/edit/${resume.id}`)}>
              Open editor
            </MenuItem>
            <MenuItem
              icon={<Pencil />}
              onSelect={() => {
                setTitle(resume.title)
                setRenaming(true)
              }}
            >
              Rename
            </MenuItem>
            <MenuItem
              icon={<Copy />}
              onSelect={() => {
                duplicate(resume.id)
                toast.success('Resume duplicated')
              }}
            >
              Duplicate
            </MenuItem>
            <MenuItem icon={<Download />} onSelect={() => exportResume(resume)}>
              Export JSON
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash2 />} danger onSelect={onDelete}>
              Delete
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>

      <Dialog
        open={renaming}
        onOpenChange={setRenaming}
        size="sm"
        title="Rename resume"
        footer={
          <>
            <Button variant="outline" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
            <Button type="submit" form={`rename-${resume.id}`}>
              Save
            </Button>
          </>
        }
      >
        <form
          id={`rename-${resume.id}`}
          onSubmit={(e) => {
            e.preventDefault()
            update(resume.id, (d) => {
              d.title = title.trim() || 'Untitled Resume'
            })
            setRenaming(false)
          }}
        >
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Resume name" />
        </form>
      </Dialog>
    </motion.div>
  )
}

export default function HomePage() {
  const resumes = useResumeList()
  const addResume = useResumeStore((s) => s.addResume)
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const list = await parseImport(file)
      const ids = list.map((r) => addResume(r))
      toast.success(ids.length === 1 ? 'Resume imported' : `${ids.length} resumes imported`)
      if (ids.length === 1) navigate(`/edit/${ids[0]}`)
    } catch (err) {
      toast.error('Import failed', { description: (err as Error).message })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        right={
          <Button asChild size="sm" className="ml-1">
            <Link to="/templates">
              <Plus className="sm:hidden" />
              <span className="hidden sm:inline">Create resume</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        }
      />
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-20">
            <div className="text-center lg:text-left">
              <div className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-xs">
                <span className="size-1.5 rounded-full bg-success" />
                100% free · No sign-up · Private
              </div>
              <h1
                className="mt-5 animate-fade-up text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-balance sm:text-6xl"
                style={{ animationDelay: '60ms' }}
              >
                The resume builder that <span className="text-accent">respects you</span>.
              </h1>
              <p
                className="mx-auto mt-5 max-w-xl animate-fade-up text-[17px] leading-relaxed text-muted text-balance lg:mx-0"
                style={{ animationDelay: '120ms' }}
              >
                Pick from {TEMPLATES.length} beautiful templates, customize every detail with a live preview, and
                download a pixel-perfect PDF. Your data never leaves your device.
              </p>
              <div
                className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
                style={{ animationDelay: '180ms' }}
              >
                <Button asChild size="xl" className="w-full sm:w-auto">
                  <Link to="/templates">
                    Create my resume <ArrowRight />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="w-full sm:w-auto" onClick={() => fileRef.current?.click()}>
                  <Upload /> Import JSON
                </Button>
              </div>
            </div>
            <HeroArt />
          </div>
        </section>

        {/* Your resumes */}
        <AnimatePresence initial={false}>
          {resumes.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-6xl px-4 pb-16 sm:px-6"
              id="resumes"
            >
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Your resumes</h2>
                  <p className="mt-1 text-sm text-muted">Saved automatically in this browser.</p>
                </div>
                <Menu>
                  <MenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Ellipsis /> <span className="hidden sm:inline">More</span>
                    </Button>
                  </MenuTrigger>
                  <MenuContent>
                    <MenuItem icon={<Upload />} onSelect={() => fileRef.current?.click()}>
                      Import JSON
                    </MenuItem>
                    <MenuItem icon={<Download />} onSelect={() => exportAll(resumes)}>
                      Back up all resumes
                    </MenuItem>
                  </MenuContent>
                </Menu>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
                <motion.div layout className="flex">
                  <Link
                    to="/templates"
                    className="group flex aspect-[210/297] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-strong text-muted transition-colors hover:border-accent hover:bg-accent-soft/40 hover:text-accent-foreground"
                  >
                    <span className="grid size-12 place-items-center rounded-full bg-surface-2 transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-110 group-hover:bg-accent group-hover:text-white">
                      <Plus className="size-5" />
                    </span>
                    <span className="text-sm font-medium">New resume</span>
                  </Link>
                </motion.div>
                <AnimatePresence mode="popLayout">
                  {resumes.map((r, i) => (
                    <ResumeCard key={r.id} resume={r} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Features */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Everything you need. Nothing you don't.
              </h2>
              <p className="mt-3 text-muted text-balance">
                No paywall at the download button, no watermarks, no accounts. Just a fast, focused editor.
              </p>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-surface p-6 transition-colors hover:bg-surface-2/60">
                  <div className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-foreground">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates teaser */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start with a template</h2>
              <p className="mt-2 text-muted">Designed with typographic care. Tested for print.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/templates">
                View all {TEMPLATES.length} <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4">
            {['onyx', 'midnight', 'pathway', 'elegant'].map((id) => {
              const t = getTemplate(id)
              return <TemplateCard key={id} t={t} onSelect={() => navigate('/templates')} />
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
