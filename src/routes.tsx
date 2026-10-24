import { motion } from 'motion/react'
import { lazy, Suspense } from 'react'
import { ScrollRestoration, useLocation, useOutlet, type RouteObject } from 'react-router'
import { PrintHost } from './components/print'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { useTheme } from './lib/theme'
import HomePage from './pages/HomePage'
import NotFound from './pages/NotFound'
import TemplatesPage from './pages/TemplatesPage'

const EditorPage = lazy(() => import('./features/editor/EditorPage'))

function EditorFallback() {
  return (
    <div className="grid h-dvh place-items-center bg-background">
      <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  )
}

/**
 * Fades each page in on navigation. Opacity only: a transform on this wrapper
 * would break `position: fixed/sticky` descendants while animating.
 */
function AnimatedOutlet() {
  const { pathname } = useLocation()
  const outlet = useOutlet()
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-dvh"
    >
      {outlet}
    </motion.div>
  )
}

function RootLayout() {
  useTheme() // keeps the <html> class in sync with the saved preference
  return (
    <TooltipProvider delay={400}>
      <AnimatedOutlet />
      <ScrollRestoration />
      <PrintHost />
      <Toaster position="bottom-center" offset={{ bottom: 24 }} mobileOffset={{ bottom: 88 }} />
    </TooltipProvider>
  )
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'templates', element: <TemplatesPage /> },
      {
        path: 'edit/:id',
        element: (
          <Suspense fallback={<EditorFallback />}>
            <EditorPage />
          </Suspense>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]
