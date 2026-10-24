import { lazy, Suspense, ViewTransition } from 'react'
import { Outlet, ScrollRestoration, type RouteObject } from 'react-router'
import { Toaster } from 'sonner'
import { PrintHost } from './components/print'
import { TooltipProvider } from './components/ui/controls'
import { useTheme } from './lib/theme'
import HomePage from './pages/HomePage'
import NotFound from './pages/NotFound'
import TemplatesPage from './pages/TemplatesPage'

const EditorPage = lazy(() => import('./features/editor/EditorPage'))

function EditorFallback() {
  return (
    <div className="grid h-dvh place-items-center bg-background">
      <div className="size-6 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  )
}

function RootLayout() {
  const { theme } = useTheme()
  const dark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return (
    <TooltipProvider>
      <ViewTransition default="page">
        <div className="min-h-dvh">
          <Outlet />
        </div>
      </ViewTransition>
      <ScrollRestoration />
      <PrintHost />
      <Toaster
        position="bottom-center"
        theme={dark ? 'dark' : 'light'}
        offset={{ bottom: 24 }}
        mobileOffset={{ bottom: 88 }}
        toastOptions={{
          classNames: {
            toast: '!rounded-xl !border-border !bg-surface !text-foreground !shadow-lg !font-sans',
            description: '!text-muted',
          },
        }}
      />
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
