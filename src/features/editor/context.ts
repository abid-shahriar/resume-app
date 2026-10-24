import type { Draft } from 'immer'
import { createContext, useContext } from 'react'
import type { Resume } from '@/lib/types'
import { useResumeStore } from '@/store/resumes'

export interface EditorCtx {
  id: string
  update: (recipe: (draft: Draft<Resume>) => void) => void
}

export const EditorContext = createContext<EditorCtx | null>(null)

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorContext')
  return ctx
}

/** Subscribes to a slice of the resume being edited. */
export function useEditorSelect<T>(selector: (r: Resume) => T): T {
  const { id } = useEditor()
  return useResumeStore((s) => selector(s.resumes[id]))
}
