import { ArrowLeft, RotateCw } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Logo } from '@/components/site'
import { Button } from '@/components/ui/button'

/** Friendly fallback for unexpected errors (replaces React Router's default screen). */
export default function RouteError() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) ? error.status : null
  if (import.meta.env.DEV) console.error(error)

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="flex max-w-sm animate-fade-up flex-col items-center text-center">
        <Logo compact />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{status === 404 ? 'Nothing here' : 'Something went wrong'}</h1>
        <p className="mt-2 text-muted-foreground">
          {status === 404
            ? "This page doesn't exist."
            : 'The page failed to load, possibly because a new version was just released. Your resumes are safe on this device.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button size="lg" onClick={() => window.location.reload()}>
            <RotateCw /> Reload
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.location.assign('/')}>
            <ArrowLeft /> Home
          </Button>
        </div>
      </div>
    </div>
  )
}
