import {
  Award,
  BookOpen,
  Briefcase,
  FileText,
  FolderGit2,
  GraduationCap,
  Heart,
  HeartHandshake,
  Languages,
  Shapes,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { SectionType } from '@/lib/types'

export const SECTION_ICONS: Record<SectionType, LucideIcon> = {
  summary: FileText,
  experience: Briefcase,
  education: GraduationCap,
  skills: Sparkles,
  projects: FolderGit2,
  certifications: Award,
  languages: Languages,
  awards: Trophy,
  publications: BookOpen,
  volunteer: HeartHandshake,
  references: Users,
  interests: Heart,
  custom: Shapes,
}
