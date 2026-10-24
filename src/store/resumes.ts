import { produce, type Draft } from 'immer'
import { temporal } from 'zundo'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { BASE_DESIGN, blankResume, sampleResume } from '@/lib/defaults'
import type { Resume } from '@/lib/types'
import { uid } from '@/lib/utils'
import { DEFAULT_CUSTOM_LAYOUT, DEFAULT_TEMPLATE_ID, templateDesign } from '@/templates/registry'
import { debouncedStorage } from './storage'

interface ResumeState {
  resumes: Record<string, Resume>
  createResume: (opts?: { templateId?: string; sample?: boolean; title?: string }) => string
  addResume: (resume: Resume) => string
  duplicateResume: (id: string) => string | undefined
  deleteResume: (id: string) => void
  restoreResume: (resume: Resume) => void
  updateResume: (id: string, recipe: (draft: Draft<Resume>) => void) => void
}

/** Records the state *before* a burst of changes, so undo reverts a whole typing burst. */
function leadingDebounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let last = 0
  return (...args: A) => {
    const now = Date.now()
    if (now - last > wait) fn(...args)
    last = now
  }
}

export const useResumeStore = create<ResumeState>()(
  temporal(
    persist(
      (set, get) => ({
        resumes: {},

        createResume: ({ templateId = DEFAULT_TEMPLATE_ID, sample = true, title } = {}) => {
          const id = uid()
          const now = Date.now()
          const content = sample ? sampleResume() : blankResume()
          const resume: Resume = {
            id,
            title: title?.trim() || (sample ? 'My Resume' : 'Untitled Resume'),
            templateId,
            createdAt: now,
            updatedAt: now,
            ...content,
            design: templateDesign(templateId),
            customLayout: { ...DEFAULT_CUSTOM_LAYOUT },
          }
          set((s) => ({ resumes: { ...s.resumes, [id]: resume } }))
          return id
        },

        addResume: (resume) => {
          const id = get().resumes[resume.id] ? uid() : resume.id || uid()
          const now = Date.now()
          set((s) => ({ resumes: { ...s.resumes, [id]: { ...resume, id, createdAt: now, updatedAt: now } } }))
          return id
        },

        duplicateResume: (id) => {
          const src = get().resumes[id]
          if (!src) return undefined
          const copy = structuredClone(src)
          const newId = uid()
          const now = Date.now()
          copy.id = newId
          copy.title = `${src.title} (copy)`
          copy.createdAt = now
          copy.updatedAt = now
          set((s) => ({ resumes: { ...s.resumes, [newId]: copy } }))
          return newId
        },

        deleteResume: (id) =>
          set((s) => {
            const next = { ...s.resumes }
            delete next[id]
            return { resumes: next }
          }),

        restoreResume: (resume) => set((s) => ({ resumes: { ...s.resumes, [resume.id]: resume } })),

        updateResume: (id, recipe) =>
          set((s) => {
            const current = s.resumes[id]
            if (!current) return s
            const next = produce(current, (d) => {
              recipe(d)
              d.updatedAt = Date.now()
            })
            return { resumes: { ...s.resumes, [id]: next } }
          }),
      }),
      {
        name: 'cvghor:store',
        version: 1,
        storage: createJSONStorage(() => debouncedStorage),
        partialize: (s) => ({ resumes: s.resumes }),
        // Fill in design options added after a resume was saved
        merge: (persisted, current) => {
          const saved = (persisted as { resumes?: Record<string, Resume> } | undefined)?.resumes ?? {}
          const resumes: Record<string, Resume> = {}
          for (const [key, r] of Object.entries(saved)) {
            if (r && typeof r === 'object' && r.basics && Array.isArray(r.sections)) {
              resumes[key] = {
                ...r,
                basics: { ...r.basics, photoSource: r.basics.photoSource ?? '', photoCrop: r.basics.photoCrop ?? null },
                design: { ...BASE_DESIGN, ...r.design },
                customLayout: { ...DEFAULT_CUSTOM_LAYOUT, ...r.customLayout },
              }
            }
          }
          return { ...current, resumes }
        },
      },
    ),
    {
      limit: 150,
      // `s` can be undefined during persist's synchronous first hydration
      partialize: (s) => ({ resumes: s?.resumes }),
      equality: (a, b) => a.resumes === b.resumes,
      handleSet: (handleSet) => leadingDebounce(handleSet, 600),
    },
  ),
)

/**
 * zundo applies undo/redo through zustand's raw `set`, which bypasses the
 * persist middleware. A no-op setState afterwards goes through persist and
 * writes the restored state to localStorage (zundo's equality check keeps it
 * out of the history).
 */
export function undo() {
  useResumeStore.temporal.getState().undo()
  useResumeStore.setState({})
}

export function redo() {
  useResumeStore.temporal.getState().redo()
  useResumeStore.setState({})
}

export function useResume(id: string | undefined) {
  return useResumeStore((s) => (id ? s.resumes[id] : undefined))
}

export function useResumeList() {
  return useResumeStore(
    useShallow((s) => Object.values(s.resumes).sort((a, b) => b.updatedAt - a.updatedAt)),
  )
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  Object.assign(window, { __cvghor: useResumeStore, __cvghorDesign: templateDesign })
}

/** Keep tabs in sync: when another tab writes, rehydrate. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'cvghor:store') void useResumeStore.persist.rehydrate()
  })
}
