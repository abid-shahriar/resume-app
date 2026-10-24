export { cn } from 'cn'

export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.round(diff / 1000)
  if (sec < 45) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hr${hr > 1 ? 's' : ''} ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day} day${day > 1 ? 's' : ''} ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function slugify(s: string) {
  return (
    s
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'resume'
  )
}

export function downloadFile(filename: string, content: string | Blob, type = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Some browsers read the blob lazily after the click; keep it alive for a while
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
