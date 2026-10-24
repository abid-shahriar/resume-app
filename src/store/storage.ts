import { toast } from 'sonner'
import type { StateStorage } from 'zustand/middleware'

/**
 * localStorage adapter with debounced writes, so typing doesn't serialize the
 * whole store on every keystroke. Pending writes are flushed when the page is
 * hidden or closed.
 */
const pending = new Map<string, string>()
let timer: ReturnType<typeof setTimeout> | undefined
let warned = false

function flush() {
  if (timer) clearTimeout(timer)
  timer = undefined
  for (const [key, value] of pending) {
    try {
      localStorage.setItem(key, value)
      warned = false
    } catch (err) {
      if (!warned) {
        warned = true
        toast.error('Storage is full', {
          description: 'Your latest changes could not be saved. Try removing photos or old resumes, or export a backup.',
          duration: 8000,
        })
      }
      console.error(err)
    }
  }
  pending.clear()
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

export const debouncedStorage: StateStorage = {
  getItem: (name) => {
    if (pending.has(name)) return pending.get(name)!
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    pending.set(name, value)
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, 250)
  },
  removeItem: (name) => {
    pending.delete(name)
    try {
      localStorage.removeItem(name)
    } catch {
      /* ignore */
    }
  },
}

export function flushStorage() {
  flush()
}

export function storageUsage(): { used: number; total: number } {
  let used = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? ''
      used += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2
    }
  } catch {
    /* ignore */
  }
  return { used, total: 5 * 1024 * 1024 }
}
