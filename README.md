# Vitae — free resume & CV builder

A fast, private resume builder that runs entirely in the browser. No backend, no accounts: resumes are saved to `localStorage`.

- 25 templates across 4 layout engines (classic, two-column sidebar, timeline, Swiss grid)
- Drag and drop for sections, entries and contact fields, including moving sections between the main column and the sidebar
- Full design control: colors, 28 Google Fonts, sizes, spacing, heading styles, skill meters, photo shape, A4 or US Letter
- Live preview with page-break guides, undo/redo (Ctrl+Z / Ctrl+Shift+Z) and autosave
- PDF export through the browser's print engine: vector, selectable text, full-bleed backgrounds and clean page breaks
- JSON export/import (also imports [JSON Resume](https://jsonresume.org/schema) files)
- Mobile-first editor with bottom navigation; light and dark themes

## Stack

Vite 8 · React 19 (with `<ViewTransition>`) · TypeScript · Tailwind CSS 4 · React Router 8 · Zustand (persist + zundo undo history) · dnd-kit · Radix UI · Motion

## Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

Import the repository in Vercel. It detects Vite automatically: the build command is `npm run build` and the output directory is `dist`. `vercel.json` rewrites every route to `index.html`, so deep links like `/edit/:id` work.

## Project layout

```
src/
  templates/      resume renderer: registry (25 templates), layouts, resume.css
  features/editor editor panels: content, templates, design, layout, drag & drop
  pages/          home, template gallery, 404
  store/          Zustand store with localStorage persistence and undo history
  lib/            types, defaults, fonts, markdown-lite, import/export
  components/     UI primitives, live preview, print pipeline
```

### Notes on PDF output

`Download PDF` opens the browser's print dialog with only the resume visible (`@page { margin: 0 }`). Sidebar backgrounds are drawn with `position: fixed` so they repeat on every page, and per-page margins use `box-decoration-break: clone` (supported in Chrome/Edge 130+ and Firefox). In Safari, pages after the first may have a smaller top margin.
