import { Check, ChevronLeft, Copy, Download, Ellipsis, FileJson, Printer, Redo2, Trash2, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useStore } from 'zustand'
import { Logo, ThemeToggle } from '@/components/site'
import { Button } from '@/components/ui/button'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Tip } from '@/components/kit'
import { exportResume } from '@/lib/io'
import { redo, undo, useResumeStore } from '@/store/resumes'
import { useEditor, useEditorSelect } from './context'
import { useDownload } from './DownloadDialog'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const MOD = isMac ? '⌘' : 'Ctrl'

function TitleInput() {
  const { update } = useEditor()
  const title = useEditorSelect((r) => r.title)
  const original = useRef(title)

  // Saved on every keystroke (so navigating away never loses it); blank names are fixed up on blur
  return (
    <input
      value={title}
      maxLength={120}
      onFocus={(e) => {
        original.current = title
        e.currentTarget.select()
      }}
      onChange={(e) => {
        const v = e.target.value
        update((d) => void (d.title = v))
      }}
      onBlur={() => {
        // Read the store, not the render closure: Escape restores the title right before blurring
        update((d) => {
          if (!d.title.trim()) d.title = 'Untitled Resume'
        })
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          const prev = original.current
          update((d) => void (d.title = prev))
          e.currentTarget.blur()
        }
      }}
      aria-label="Resume name"
      className="h-9 w-full min-w-0 max-w-[16rem] truncate rounded-lg border border-transparent bg-transparent px-2 font-medium outline-none transition-colors hover:bg-muted focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 md:text-sm"
    />
  )
}

function SaveIndicator() {
  const updatedAt = useEditorSelect((r) => r.updatedAt)
  const [saving, setSaving] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSaving(true)
    const t = setTimeout(() => setSaving(false), 700)
    return () => clearTimeout(t)
  }, [updatedAt])
  return (
    <Tip content="Changes are saved automatically in this browser">
      <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
        {saving ? (
          <span className="size-3 animate-spin rounded-full border-[1.5px] border-border-strong border-t-primary" />
        ) : (
          <Check className="size-3.5 text-success" />
        )}
        {saving ? 'Saving…' : 'Saved'}
      </span>
    </Tip>
  )
}

export function EditorHeader() {
  const { id } = useEditor()
  const navigate = useNavigate()
  const temporal = useResumeStore.temporal
  const canUndo = useStore(temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(temporal, (s) => s.futureStates.length > 0)
  const duplicate = useResumeStore((s) => s.duplicateResume)
  const download = useDownload()

  const getResume = () => useResumeStore.getState().resumes[id]

  // The home page performs the deletion (with an undo toast) once the editor has unmounted
  const onDelete = () => navigate('/', { state: { deleteId: id } })

  return (
    <header className="z-30 flex h-14 shrink-0 items-center gap-1 border-b border-border bg-background/85 px-2 backdrop-blur-xl sm:gap-2 sm:px-3">
      <Tip content="My resumes">
        <Button render={<Link to="/" />} nativeButton={false} variant="subtle" size="icon-lg" aria-label="Back to my resumes">
          <ChevronLeft />
        </Button>
      </Tip>
      <Link to="/" className="hidden rounded-lg lg:block" aria-label="Vitae home">
        <Logo compact />
      </Link>
      <span className="mx-1 hidden h-5 w-px bg-border lg:block" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TitleInput />
        <SaveIndicator />
      </div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <Tip content={`Undo (${MOD}+Z)`}>
          <Button variant="subtle" size="icon-lg" disabled={!canUndo} onClick={undo} aria-label="Undo">
            <Undo2 />
          </Button>
        </Tip>
        <Tip content={`Redo (${MOD}+Shift+Z)`}>
          <Button variant="subtle" size="icon-lg" disabled={!canRedo} onClick={redo} aria-label="Redo">
            <Redo2 />
          </Button>
        </Tip>
        <span className="hidden lg:block">
          <ThemeToggle />
        </span>
        <Menu>
          <MenuTrigger render={<Button variant="subtle" size="icon-lg" aria-label="More actions" />}>
            <Ellipsis />
          </MenuTrigger>
          <MenuContent className="w-56">
            <MenuItem icon={<Printer />} shortcut={`${MOD}+P`} onSelect={() => download(getResume())}>
              Print / Save as PDF
            </MenuItem>
            <MenuItem icon={<FileJson />} onSelect={() => exportResume(getResume())}>
              Export JSON backup
            </MenuItem>
            <MenuItem
              icon={<Copy />}
              onSelect={() => {
                const newId = duplicate(id)
                if (newId) {
                  toast.success('Duplicated — you are now editing the copy')
                  navigate(`/edit/${newId}`)
                }
              }}
            >
              Duplicate resume
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash2 />} danger onSelect={onDelete}>
              Delete resume
            </MenuItem>
          </MenuContent>
        </Menu>
        <Button size="lg" onClick={() => download(getResume())} className="ml-1" aria-label="Download PDF">
          <Download />
          <span className="hidden sm:inline">Download PDF</span>
        </Button>
      </div>
    </header>
  )
}
