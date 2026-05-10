# Dawnscroll

A modern Bible reader built for deep reading, exploration, and understanding.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database / Auth | Supabase |
| UI primitives | Radix UI |
| Icons | Lucide React |
| Deployment | Vercel |

## Local setup

**1. Clone and install**

```bash
git clone https://github.com/ChristopherJacoby/dawn-scroll.git
cd dawn-scroll
npm install
```

**2. Environment variables**

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

Keys are found in the Supabase dashboard under **Project Settings → API**.

**3. Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/                  # Next.js App Router pages and layouts
  components/
    layout/             # App shell components (Navigation)
    ui/                 # Design system components
  context/              # React context providers (ReadingMode, Toast)
  lib/
    supabase/           # Supabase client helpers (browser + server)
    cn.ts               # Tailwind class merge utility
    env.ts              # Startup environment validation
supabase/
  migrations/           # SQL migration files
```

## Design system

Components live in `src/components/ui/`. All components adapt to the active reading mode via CSS custom properties.

| Component | Notes |
|---|---|
| `Button` | Variants: primary, secondary, ghost, destructive. Sizes: sm, md, lg. Built-in loading spinner. |
| `Card` | `CardHeader`, `CardBody`, `CardFooter` slots. Variants for border, shadow, padding. |
| `Modal` | Radix Dialog. `ModalBody`, `ModalFooter` slots. Focus trap + Escape dismiss. |
| `Drawer` | Radix Dialog as a bottom sheet. `DrawerBody`, `DrawerFooter` slots. |
| `Skeleton` | `animate-pulse` placeholder. Size via `className`. |
| `Navigation` | Fixed sidebar on desktop, slide-in drawer on mobile. |

**Reading modes** — light, dark, sepia — are controlled via `useReadingMode()` from `src/context/reading-mode.tsx`. Mode is stored in React state and applied as `data-reading-mode` on `<body>`.

**Toasts** — trigger via `useToast()` from `src/context/toast.tsx`:

```ts
const toast = useToast();
toast.success("Saved");
toast.error("Something went wrong.");
toast.info("New passage available.");
```

## Development workflow

Branches follow the `DS-{ticket-number}/{description}` convention, e.g. `DS-27/navigation-component`.

```bash
npm run dev      # development server (Turbopack)
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type check
```

Pre-commit hooks (Husky + lint-staged) run ESLint and Prettier on staged `.ts`/`.tsx` files automatically.

CI runs lint → type-check → build on every PR to `main`.

## Database

Supabase is used for database and auth. Migrations live in `supabase/migrations/`.

```bash
supabase start          # start local Supabase stack
supabase db diff        # generate a new migration from schema changes
supabase db push        # push migrations to the linked project
```

The project is linked to Supabase project ref `drthxnrighufmgwerhqd`.
