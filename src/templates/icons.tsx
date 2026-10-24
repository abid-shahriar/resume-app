import {
  AtSign,
  Cake,
  Flag,
  Globe,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import type { ContactKind } from '@/lib/types'

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string }

function brand(path: string, viewBox = '0 0 24 24') {
  return function BrandIcon({ size = 24, ...props }: IconProps) {
    return (
      <svg width={size} height={size} viewBox={viewBox} fill="currentColor" aria-hidden="true" {...props}>
        <path d={path} />
      </svg>
    )
  }
}

export const LinkedInIcon = brand(
  'M4.98 3.5a2.5 2.5 0 1 1-.02 5 2.5 2.5 0 0 1 .02-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.2 21 14.5V21h-4v-5.8c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H9z',
)
export const GitHubIcon = brand(
  'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z',
  '0 0 16 16',
)
export const XIcon = brand(
  'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
)
export const DribbbleIcon = function DribbbleIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
    </svg>
  )
}
export const BehanceIcon = brand(
  'M8.2 11.3c.9-.4 1.5-1.2 1.5-2.4 0-2.3-1.7-2.9-3.7-2.9H0v12h6.2c2.3 0 4.4-1.1 4.4-3.6 0-1.6-.8-2.7-2.4-3.1zM2.7 8.1h2.6c1 0 1.9.3 1.9 1.4 0 1.1-.7 1.5-1.7 1.5H2.7zm2.9 7.8H2.7v-3.3h3c1.2 0 2 .5 2 1.7 0 1.3-1 1.6-2.1 1.6zM15.4 7h5.2v1.3h-5.2zM18 9.6c-2.9 0-4.6 2-4.6 4.6 0 2.8 1.7 4.6 4.6 4.6 2.2 0 3.6-1 4.3-3.1h-2.2c-.3.8-1.2 1.2-2 1.2-1.6 0-2.4-.9-2.4-2.4h6.7c.1-2.9-1.3-4.9-4.4-4.9zm-2.3 3.8c.1-1.3.9-2 2.2-2 1.3 0 2 .8 2.1 2z',
)

type AnyIcon = ComponentType<LucideProps> | ComponentType<IconProps>

export const CONTACT_META: Record<ContactKind, { label: string; icon: AnyIcon; placeholder: string }> = {
  email: { label: 'Email', icon: Mail, placeholder: 'you@example.com' },
  phone: { label: 'Phone', icon: Phone, placeholder: '+1 555 000 0000' },
  location: { label: 'Location', icon: MapPin, placeholder: 'City, Country' },
  website: { label: 'Website', icon: Globe, placeholder: 'yourwebsite.com' },
  linkedin: { label: 'LinkedIn', icon: LinkedInIcon, placeholder: 'linkedin.com/in/you' },
  github: { label: 'GitHub', icon: GitHubIcon, placeholder: 'github.com/you' },
  twitter: { label: 'X / Twitter', icon: XIcon, placeholder: '@you' },
  dribbble: { label: 'Dribbble', icon: DribbbleIcon, placeholder: 'dribbble.com/you' },
  behance: { label: 'Behance', icon: BehanceIcon, placeholder: 'behance.net/you' },
  portfolio: { label: 'Portfolio', icon: LinkIcon, placeholder: 'portfolio.com' },
  birthday: { label: 'Date of birth', icon: Cake, placeholder: '12 May 1994' },
  nationality: { label: 'Nationality', icon: Flag, placeholder: 'Canadian' },
  custom: { label: 'Custom', icon: AtSign, placeholder: 'Anything else' },
}

export const CONTACT_KINDS = Object.keys(CONTACT_META) as ContactKind[]

export function contactHref(kind: ContactKind, value: string, url: string): string | undefined {
  const v = value.trim()
  const u = url.trim()
  const withProto = (s: string) => (/^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`)
  if (u) {
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return undefined
    return withProto(u)
  }
  if (!v) return undefined
  switch (kind) {
    case 'email':
      return /\S+@\S+/.test(v) ? `mailto:${v}` : undefined
    case 'phone':
      return `tel:${v.replace(/[^\d+]/g, '')}`
    case 'linkedin':
      if (/linkedin\.com/i.test(v)) return withProto(v)
      return `https://linkedin.com/${v.replace(/^\/+/, '').replace(/^(?!in\/)/, 'in/')}`
    case 'github':
      if (/github\.com/i.test(v)) return withProto(v)
      return `https://github.com/${v.replace(/^@/, '')}`
    case 'twitter':
      if (/(twitter|x)\.com/i.test(v)) return withProto(v)
      return `https://x.com/${v.replace(/^@/, '')}`
    case 'dribbble':
      if (/dribbble\.com/i.test(v)) return withProto(v)
      return `https://dribbble.com/${v.replace(/^@/, '')}`
    case 'behance':
      if (/behance\.net/i.test(v)) return withProto(v)
      return `https://behance.net/${v.replace(/^@/, '')}`
    case 'website':
    case 'portfolio':
      return /\s/.test(v) ? undefined : withProto(v)
    default:
      return undefined
  }
}
