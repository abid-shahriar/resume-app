import { Check, ChevronLeft, Copy, Download, Ellipsis, FileJson, Printer, Redo2, Trash2, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useStore } from 'zustand'
import { Logo, ThemeToggle } from '@/components/site'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/controls'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu'
import { exportResume } from '@/lib/io'
import { cn } from '@/lib/utils'
import { useResumeStore } from '@/store/resumes'
import { useEditor, useEditorSelect } from './context'
import { useDownload } from './DownloadDialog'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const MOD = isMac ? '⌘' : 'Ctrl'

function TitleInput() {
  const { update } = useEditor()
  const title = useEditorSelect((r) => r.title)
  const [draft, setDraft] = useState(title)
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setDraft(title)
  }, [title])

  const commit = () => {
    focused.current = false
    const t = draft.trim() || 'Untitled Resume'
    setDraft(t)
    if (t !== title) update((d) => void (d.title = t))
  }

  return (
    <input
      value={draft}
      onFocus={(e) => {
        focused.current = true
        e.currentTarget.select()
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setDraft(title)
          e.currentTarget.blur()
        }
      }}
      aria-label="Resume name"
      className="h-9 w-full min-w-0 max-w-[16rem] truncate rounded-lg border border-transparent bg-transparent px-2 font-medium outline-none transition-colors hover:bg-surface-2 focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15 md:text-sm"
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
    <Tooltip content="Changes are saved automatically in this browser">
      <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted md:inline-flex">
        {saving ? (
          <span className="size-3 animate-spin rounded-full border-[1.5px] border-border-strong border-t-accent" />
        ) : (
          <Check className="size-3.5 text-success" />
        )}
        {saving ? 'Saving…' : 'Saved'}
      </span>
    </Tooltip>
  )
}

export function EditorHeader() {
  const { id } = useEditor()
  const navigate = useNavigate()
  const temporal = useResumeStore.temporal
  const canUndo = useStore(temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(temporal, (s) => s.futureStates.length > 0)
  const duplicate = useResumeStore((s) => s.duplicateResume)
  const remove = useResumeStore((s) => s.deleteResume)
  const restore = useResumeStore((s) => s.restoreResume)
  const download = useDownload()

  const getResume = () => useResumeStore.getState().resumes[id]

  const onDelete = () => {
    const snapshot = getResume()
    navigate('/')
    // Delete after navigating away so the editor never renders a missing resume
    setTimeout(() => {
      remove(id)
      toast(`Deleted “${snapshot.title}”`, { action: { label: 'Undo', onClick: () => restore(snapshot) }, duration: 6000 })
    }, 0)
  }

  return (
    <header className="z-30 flex h-14 shrink-0 items-center gap-1 border-b border-border bg-background/85 px-2 backdrop-blur-xl sm:gap-2 sm:px-3">
      <Tooltip content="My resumes">
        <Button asChild variant="subtle" size="icon-sm">
          <Link to="/" aria-label="Back to my resumes">
            <ChevronLeft />
          </Link>
        </Button>
      </Tooltip>
      <Link to="/" className="hidden rounded-lg lg:block" aria-label="Vitae home">
        <Logo compact />
      </Link>
      <span className="mx-1 hidden h-5 w-px bg-border lg:block" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TitleInput />
        <SaveIndicator />
      </div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <Tooltip content={`Undo (${MOD}+Z)`}>
          <Button variant="subtle" size="icon-sm" disabled={!canUndo} onClick={() => temporal.getState().undo()} aria-label="Undo">
            <Undo2 />
          </Button>
        </Tooltip>
        <Tooltip content={`Redo (${MOD}+Shift+Z)`}>
          <Button variant="subtle" size="icon-sm" disabled={!canRedo} onClick={() => temporal.getState().redo()} aria-label="Redo">
            <Redo2 />
          </Button>
        </Tooltip>
        <span className="hidden lg:block">
          <ThemeToggle />
        </span>
        <Menu>
          <MenuTrigger asChild>
            <Button variant="subtle" size="icon-sm" aria-label="More actions">
              <Ellipsis />
            </Button>
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
        <Button onClick={() => download(getResume())} size="sm" className={cn('ml-1 h-9 px-3 sm:px-3.5')} aria-label="Download PDF">
          <Download />
          <span className="hidden sm:inline">Download PDF</span>
        </Button>
      </div>
    </header>
  )
}
