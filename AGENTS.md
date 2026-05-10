<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:commit-rules -->
# Commit rules
- Never add `Co-Authored-By` trailers to commit messages.
<!-- END:commit-rules -->

<!-- BEGIN:tailwind-rules -->
# Tailwind v4 — critical gotcha

`@theme inline` resolves `var()` references **statically at build time**. Any utility that must stay live at runtime (e.g. reading-mode color tokens) must be written in `@layer utilities` with a direct `var()` reference, not registered under `@theme inline`.

See `src/app/globals.css` for the established pattern.
<!-- END:tailwind-rules -->

<!-- BEGIN:design-system-rules -->
# Design system conventions

- UI components live in `src/components/ui/`.
- Layout components live in `src/components/layout/`.
- Context providers live in `src/context/` and are registered in `src/components/Providers.tsx`.
- All components use reading-mode CSS tokens (`text-reading-text`, `bg-reading-bg`, `border-reading-border`, etc.) so they adapt to light/dark/sepia automatically.
- Use Radix UI primitives for behavior-heavy components (focus trap, keyboard nav, ARIA). Build plain components for visual-only ones.
- Use `cn()` from `src/lib/cn.ts` for all className merging.
<!-- END:design-system-rules -->
