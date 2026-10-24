import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { Logo } from '@/components/site'
import { Button } from '@/components/ui/button'

export default function NotFound({ message = "This page doesn't exist." }: { message?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="flex max-w-sm animate-fade-up flex-col items-center text-center">
        <Logo compact />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Nothing here</h1>
        <p className="mt-2 text-muted">{message}</p>
        <Button asChild className="mt-6">
          <Link to="/">
            <ArrowLeft /> Back home
          </Link>
        </Button>
      </div>
    </div>
  )
}
