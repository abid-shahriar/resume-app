import { flushSync } from 'react-dom'
import { prefersReducedMotion } from './utils'

/**
 * Runs a (synchronous) state update inside a native View Transition so the
 * before/after DOM states morph smoothly. Falls back to a plain update.
 */
export function withViewTransition(update: () => void) {
  if (typeof document === 'undefined' || !('startViewTransition' in document) || prefersReducedMotion()) {
    update()
    return
  }
  try {
    document.startViewTransition(() => {
      flushSync(update)
    })
  } catch {
    update()
  }
}
