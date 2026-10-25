# Dawnscroll

A modern Bible reader built for deep reading, exploration, and understanding.

## Tech stack

Next.js 16 · TypeScript (strict) · Tailwind CSS v4 · Supabase · Radix UI · Vercel

## Local setup

```bash
git clone https://github.com/ChristopherJacoby/dawn-scroll.git
cd dawn-scroll
npm install
cp .env.local.example .env.local   # fill in Supabase credentials
npm run dev
```

Environment variables (from Supabase dashboard → **Project Settings → API**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

## Commands

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type check
```

Pre-commit hooks run ESLint and Prettier on staged files automatically. CI runs lint → type-check → build on every PR to `main`.

## Mobile apps (Capacitor)

The iOS and Android apps in `ios/` and `android/` load the live site (`capacitor.config.ts`); `capacitor/www/` holds only the offline page. iOS needs Xcode; Android needs Android Studio.

```bash
npm run cap:sync     # copy config and the offline page into both apps
npm run cap:ios      # open the iOS project in Xcode, then run on a simulator
npm run cap:android  # open the Android project in Android Studio
CAPACITOR_SERVER_URL=http://192.168.1.20:3000 npm run cap:sync  # point the apps at a dev server
```

## Database

Migrations live in `supabase/migrations/`.

```bash
supabase start       # local Supabase stack
supabase db diff     # generate migration from schema changes
supabase db push     # push to linked project
```
