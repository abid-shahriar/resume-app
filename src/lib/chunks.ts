/**
 * After a new deploy, a tab that is already open still references the old
 * build's chunk files, which no longer exist. Loading one fails with "Failed
 * to fetch dynamically imported module". Reloading picks up the new build.
 * A short-lived guard prevents reload loops when the network is really down.
 */
const GUARD_KEY = 'cvghor:chunk-reload'
const GUARD_MS = 15_000

export function reloadForStaleChunk(): boolean {
  try {
    const last = Number(sessionStorage.getItem(GUARD_KEY) || 0)
    if (Date.now() - last < GUARD_MS) return false
    sessionStorage.setItem(GUARD_KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

/** `import()` that reloads the page once if the chunk is gone. */
export function importWithReload<T>(load: () => Promise<T>): Promise<T> {
  return load().catch((err: unknown) => {
    if (reloadForStaleChunk()) return new Promise<T>(() => {}) // the page is reloading
    throw err
  })
}
