import { sampleResume } from '@/lib/defaults'
import type { Resume } from '@/lib/types'
import { templateDesign } from './registry'

const cache = new Map<string, Resume>()
let base: ReturnType<typeof sampleResume> | null = null

/** A stable sample resume rendered with the given template's default design. */
export function templatePreview(templateId: string): Resume {
  let r = cache.get(templateId)
  if (!r) {
    base ??= sampleResume()
    r = {
      id: `preview-${templateId}`,
      title: 'Preview',
      templateId,
      createdAt: 0,
      updatedAt: 0,
      ...base,
      design: templateDesign(templateId),
    }
    cache.set(templateId, r)
  }
  return r
}

/** The user's own resume rendered with another template (for the in-editor picker). */
export function withTemplate(resume: Resume, templateId: string, keepStyle: boolean): Resume {
  const d = templateDesign(templateId)
  return {
    ...resume,
    templateId,
    design: keepStyle
      ? { ...d, accent: resume.design.accent, headingFont: resume.design.headingFont, bodyFont: resume.design.bodyFont, pageSize: resume.design.pageSize, presentLabel: resume.design.presentLabel }
      : { ...d, pageSize: resume.design.pageSize, presentLabel: resume.design.presentLabel },
  }
}
