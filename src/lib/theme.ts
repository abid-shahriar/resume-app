import { useCallback, useEffect, useSyncExternalStore } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'
const KEY = 'cvghor:theme'
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function read(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && systemDark())
  document.documentElement.classList.toggle('dark', dark)
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', cb)
  return () => {
    listeners.delete(cb)
    mq.removeEventListener('change', cb)
  }
}

let switchTimer: ReturnType<typeof setTimeout> | undefined

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, read, () => 'system' as ThemePref)

  useEffect(() => {
    apply(pref)
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  const setTheme = useCallback((next: ThemePref) => {
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
    // Animate colors only for the switch itself, so normal interactions keep their own transitions
    const root = document.documentElement
    root.classList.add('theme-switching')
    apply(next)
    notify()
    clearTimeout(switchTimer)
    switchTimer = setTimeout(() => root.classList.remove('theme-switching'), 320)
  }, [])

  return { theme: pref, setTheme }
}

/** Whether the dark theme is currently in effect (preference or system). */
export function useIsDark() {
  return useSyncExternalStore(
    subscribe,
    () => {
      const p = read()
      return p === 'dark' || (p === 'system' && systemDark())
    },
    () => false,
  )
}
