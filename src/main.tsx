import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import { routes } from './routes'

const router = createBrowserRouter(routes)

if (import.meta.env.DEV) {
  // Headless PDF check: /?__print=<templateId>[&long=1]
  const params = new URLSearchParams(location.search)
  const tid = params.get('__print')
  if (tid) {
    void Promise.all([import('./components/print'), import('./templates/previews')]).then(([{ mountForPrintTest }, { templatePreview }]) => {
      const r = structuredClone(templatePreview(tid))
      if (params.get('long')) {
        const exp = r.sections.find((s) => s.type === 'experience')!
        exp.items = [...exp.items, ...structuredClone(exp.items), ...structuredClone(exp.items)].map((it, i) => ({ ...it, id: `x${i}` }))
      }
      mountForPrintTest(r)
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
