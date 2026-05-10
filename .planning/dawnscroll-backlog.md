# Dawnscroll — V1 Atomic Backlog

## How to Read This

- **Epics** are ordered by execution priority — complete Epic 1 before Epic 2
- **Features** within each epic are ordered by dependency — earlier features unblock later ones
- **Tickets** within each feature are numbered in execution order
- **Priority 1–9:** 1 = critical path / blocks everything, 9 = polish / low urgency
- **Shippable:** every ticket compiles, passes CI, doesn't break the app, and is demonstrable on its own

---

## Epic 1: Foundation & Infrastructure

*Everything else depends on this. Do not skip steps.*

---

### Feature 1.1: Project Initialization

**DS-001** | Priority: 1 | ~60 lines
**Initialize Next.js 14 app with TypeScript and Tailwind**
Scaffold the project with `create-next-app`, enable app router, configure TypeScript strict mode, install Tailwind CSS.
*Shippable when:* `npm run dev` boots a blank page with no errors.

---

**DS-002** | Priority: 1 | ~40 lines
**Configure ESLint, Prettier, and Husky pre-commit hooks**
Install and wire ESLint (Next.js ruleset), Prettier with a `.prettierrc`, and Husky to block commits that fail lint.
*Shippable when:* A commit with a lint error is rejected at the hook stage.

---

**DS-003** | Priority: 1 | ~30 lines
**Set up environment variable schema and validation**
Create `.env.local.example` with all required keys. Add a startup validation function that throws clearly if a required env var is missing.
*Shippable when:* App throws a readable error on boot if any env var is absent.

---

### Feature 1.2: Version Control & Deployment

**DS-004** | Priority: 1 | ~0 lines (config only)
**Create GitHub repository with branch protection**
Initialize repo, push initial commit, add branch protection rules: PRs required to merge to `main`, CI must pass.
*Shippable when:* Attempting to push directly to `main` is rejected.

---

**DS-005** | Priority: 1 | ~50 lines (YAML)
**Configure GitHub Actions CI pipeline**
Add workflow that runs on every PR: lint, type-check, build. Fails PR if any step fails.
*Shippable when:* A PR with a TypeScript error shows a failed check in GitHub.

---

**DS-006** | Priority: 1 | ~0 lines (config only)
**Connect Vercel and configure preview deployments**
Link GitHub repo to Vercel. Configure production deployment on `main` merge, preview deployments on PRs.
*Shippable when:* Merging to `main` produces a live production URL automatically.

---

### Feature 1.3: Supabase Setup

**DS-007** | Priority: 1 | ~40 lines
**Initialize Supabase project and connect client**
Create Supabase project. Install `@supabase/supabase-js`. Create `lib/supabase/client.ts` and `lib/supabase/server.ts` (browser and server clients respectively).
*Shippable when:* A test query to Supabase resolves without error in a route handler.

---

**DS-008** | Priority: 1 | ~30 lines
**Install Supabase CLI and configure local dev environment**
Install Supabase CLI, link to project, run `supabase start` locally. Add `supabase/` directory to repo for migration tracking.
*Shippable when:* `supabase db push` runs without error against the linked project.

---

### Feature 1.4: Mobile Shell

**DS-009** | Priority: 3 | ~50 lines
**Install and configure Capacitor for iOS and Android**
Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`. Run `cap init`. Configure `capacitor.config.ts` pointing at the Next.js build output.
*Shippable when:* `cap run ios` launches the app in the iOS simulator showing the homepage.

---

## Epic 2: Design System & Branding

*Build this in parallel with or immediately after Foundation. Every UI epic depends on it.*

---

### Feature 2.1: Design Tokens

**DS-010** | Priority: 1 | ~80 lines
**Extend Tailwind theme with Dawnscroll brand palette**
Add all brand colors to `tailwind.config.ts`: Stone Night `#2C2016`, Dark Clay `#5C4A2A`, Bronze `#A07840`, Sand `#C9A96E`, Parchment `#EDD9A3`, Linen `#F7F0DF`, Sage `#4A5E4A`. Add custom font families (serif for scripture, sans for UI).
*Shippable when:* `bg-stone-night` and `text-sand` apply correctly in any component.

---

**DS-011** | Priority: 1 | ~60 lines
**Define global CSS base styles and reading mode variables**
Add CSS custom properties for light, dark, and sepia reading modes. Apply base body styles. Define transitions for mode switching.
*Shippable when:* Toggling a `data-reading-mode` attribute on `<body>` shifts background and text colors.

---

### Feature 2.2: Core Components

**DS-012** | Priority: 2 | ~80 lines
**Build Button component with variants**
Variants: `primary`, `secondary`, `ghost`, `destructive`. Sizes: `sm`, `md`, `lg`. Handles loading and disabled states.
*Shippable when:* All variants render correctly with correct hover/focus/disabled states.

---

**DS-013** | Priority: 2 | ~60 lines
**Build Card component**
Supports header, body, and footer slots. Optional border, shadow, and padding variants. Used across Archaeology, Roots, and Hard Questions.
*Shippable when:* Card renders with all slot combinations without layout breaking.

---

**DS-014** | Priority: 2 | ~100 lines
**Build Modal and Drawer components**
Modal for desktop overlays, Drawer (bottom sheet) for mobile. Handles open/close state, backdrop, focus trap, and `Escape` key dismissal.
*Shippable when:* Modal opens, traps focus, closes on Escape and backdrop click.

---

**DS-015** | Priority: 2 | ~60 lines
**Build Toast notification component**
Types: `success`, `error`, `info`. Auto-dismisses after 4 seconds. Stackable. Triggered via a `useToast` hook.
*Shippable when:* Calling `toast.success("Saved")` renders and auto-dismisses correctly.

---

**DS-016** | Priority: 2 | ~120 lines
**Build Navigation component (mobile bottom tab + desktop sidebar)**
Mobile: fixed bottom tab bar with icons for Reader, Explore, Chat, Profile.
Desktop: collapsible left sidebar with same destinations.
*Shippable when:* Navigation renders correctly at mobile and desktop breakpoints, active tab is highlighted.

---

**DS-017** | Priority: 3 | ~40 lines
**Build Loading and Skeleton components**
Skeleton screen component for content loading states. Spinner for button-level loading. Used throughout the app.
*Shippable when:* Skeleton animates correctly and matches the dimensions of the content it replaces.

---

## Epic 3: Authentication & User Accounts

*Needs to be in place before any personal data (bookmarks, highlights, notes) can be stored.*

---

### Feature 3.1: Auth Infrastructure

**DS-018** | Priority: 1 | ~60 lines
**Configure Supabase Auth and create auth helper utilities**
Enable email/password and OAuth providers (Google, Apple) in Supabase. Create `lib/auth.ts` with `getSession`, `getUser`, and `requireAuth` server-side helpers.
*Shippable when:* `requireAuth()` redirects unauthenticated requests to `/login`.

---

**DS-019** | Priority: 1 | ~50 lines
**Create users profile table and migration**
Migration: `profiles` table linked to `auth.users` via foreign key. Columns: `id`, `display_name`, `avatar_url`, `created_at`. RLS: users can only read and update their own profile.
*Shippable when:* Migration runs cleanly, RLS blocks cross-user reads.

---

**DS-020** | Priority: 1 | ~80 lines
**Build Sign Up page and form**
Fields: email, password, confirm password. Calls Supabase `signUp`. Shows inline validation errors. Redirects to email confirmation notice.
*Shippable when:* Valid submission creates a Supabase Auth user and sends confirmation email.

---

**DS-021** | Priority: 1 | ~70 lines
**Build Log In page and form**
Fields: email, password. Calls Supabase `signInWithPassword`. Shows error on invalid credentials. Redirects to `/` on success.
*Shippable when:* Correct credentials log in and redirect; wrong credentials show an error message.

---

**DS-022** | Priority: 2 | ~60 lines
**Implement Google and Apple OAuth login**
Add OAuth buttons to login page. Implement Supabase OAuth callback route at `/auth/callback`. Handle session exchange.
*Shippable when:* Clicking "Continue with Google" completes full OAuth flow and lands on home.

---

**DS-023** | Priority: 2 | ~50 lines
**Build Password Reset flow**
Forgot password link on login page → email input → Supabase sends reset link → reset password form on magic link landing.
*Shippable when:* Full reset flow works end-to-end via email.

---

### Feature 3.2: User Profile & Settings

**DS-024** | Priority: 3 | ~90 lines
**Build Profile page**
Display name, email, member since date, reading streak, total verses read. Edit display name inline.
*Shippable when:* Profile page renders correct user data and name edits persist.

---

**DS-025** | Priority: 3 | ~80 lines
**Build Settings page**
Controls: default translation selector, reading mode (light/dark/sepia), font size slider, notification preference toggle.
*Shippable when:* All settings persist to Supabase and apply immediately without page reload.

---

## Epic 4: Bible Reader

*The core of the app. Build in order — data layer first, then navigation, then view, then personal tools.*

---

### Feature 4.1: Bible Data Layer

**DS-026** | Priority: 1 | ~60 lines
**Define Bible TypeScript types**
Types: `Translation`, `Book`, `Chapter`, `Verse`, `VerseRange`. Export from `types/bible.ts`. These are used across every Bible feature.
*Shippable when:* Types importable and pass `tsc` without error.

---

**DS-027** | Priority: 1 | ~80 lines
**Create Bible text database schema and migration**
Tables: `translations`, `books`, `chapters`, `verses`. Indexes on `(translation_id, book_id, chapter_number, verse_number)`. RLS: public read, no public write.
*Shippable when:* Migration runs cleanly, a manual insert and select works.

---

**DS-028** | Priority: 1 | ~100 lines
**Write KJV data ingestion script**
Script imports KJV JSON (public domain), normalizes to schema, bulk-inserts into Supabase. Idempotent — safe to re-run.
*Shippable when:* Script runs to completion, spot-check 10 verses match the source.

---

**DS-029** | Priority: 2 | ~80 lines
**Write ASV, YLT, and WEB data ingestion scripts**
Same pattern as KJV. One script per translation or a single configurable script.
*Shippable when:* All 3 translations ingested, verse counts validated against known totals.

---

**DS-030** | Priority: 1 | ~50 lines
**Create `getBibleBooks` server query function**
Returns all 66 books with metadata (name, testament, chapter count, abbreviation). Cached at the request level.
*Shippable when:* Function returns correct 66 books with accurate metadata.

---

**DS-031** | Priority: 1 | ~50 lines
**Create `getBibleChapter` server query function**
Accepts `(translationId, bookId, chapterNumber)`. Returns ordered array of verses. Handles invalid inputs gracefully.
*Shippable when:* Returns correct verses for John 3, KJV in under 100ms.

---

**DS-032** | Priority: 2 | ~40 lines
**Create `searchBible` full-text search query function**
Uses Postgres `to_tsvector` + `to_tsquery`. Accepts query string and optional translation filter. Returns top 50 matches with book/chapter/verse references.
*Shippable when:* Searching "love your neighbor" returns expected results from KJV.

---

### Feature 4.2: Reader Navigation

**DS-033** | Priority: 1 | ~100 lines
**Build `BookSelector` component**
Lists all 66 books grouped by Old/New Testament. Tappable. Emits selected book. Searchable filter input.
*Shippable when:* All 66 books render, filter works, selection emits correct book.

---

**DS-034** | Priority: 1 | ~60 lines
**Build `ChapterSelector` component**
Grid of chapter numbers for a selected book. Tappable. Shows current chapter highlighted.
*Shippable when:* Renders correct chapter count per book, highlights active chapter.

---

**DS-035** | Priority: 1 | ~70 lines
**Implement URL-based deep linking for book/chapter/verse**
Route: `/read/[book]/[chapter]` with optional `#verse-N` anchor. Navigation updates the URL. Browser back/forward works correctly.
*Shippable when:* Sharing the URL `/read/john/3` opens John chapter 3 for any user.

---

### Feature 4.3: Reading View

**DS-036** | Priority: 1 | ~60 lines
**Build `VerseText` component**
Renders a single verse: verse number badge + text. Supports tap-to-select. Applies highlight color if present. Accessible markup.
*Shippable when:* Verse renders with number, text is selectable, highlight color applies.

---

**DS-037** | Priority: 1 | ~80 lines
**Build `ChapterView` component**
Maps verses array into `VerseText` components. Handles scroll position restoration. Smooth scroll to a specific verse via anchor.
*Shippable when:* John 3 renders all 36 verses in order, scrolling to verse 16 works.

---

**DS-038** | Priority: 2 | ~60 lines
**Build `TranslationSelector` dropdown**
Dropdown listing available translations. Switching translation reloads chapter in new translation. Persists selection to user settings.
*Shippable when:* Switching from KJV to ASV reloads the same chapter in ASV.

---

**DS-039** | Priority: 2 | ~80 lines
**Implement reading mode toggle (light / dark / sepia)**
Toggle accessible from the reader toolbar. Applies `data-reading-mode` to `<body>`. Persists to user settings.
*Shippable when:* Toggling modes applies correct background and text colors instantly.

---

**DS-040** | Priority: 3 | ~70 lines
**Add adjacent chapter prefetching**
When rendering a chapter, prefetch the next and previous chapters in the background using Next.js `prefetch`.
*Shippable when:* Navigating to the next chapter loads instantly with no visible fetch delay.

---

### Feature 4.4: Search

**DS-041** | Priority: 2 | ~40 lines
**Create `/api/bible/search` route handler**
Accepts `q` and optional `translation` query params. Calls `searchBible`. Returns JSON array of verse results.
*Shippable when:* `GET /api/bible/search?q=faith&translation=kjv` returns results.

---

**DS-042** | Priority: 2 | ~70 lines
**Build `SearchInput` component with debounce**
Input with 300ms debounce. Calls search API on change. Shows loading spinner during fetch. Clears on Escape.
*Shippable when:* Typing "faith" triggers a debounced API call and shows loading state.

---

**DS-043** | Priority: 2 | ~80 lines
**Build `SearchResults` component**
List of verse results showing reference (e.g., John 3:16 KJV) and text snippet. Tapping a result navigates to that verse in the reader.
*Shippable when:* Tapping a result opens the correct chapter scrolled to the correct verse.

---

**DS-044** | Priority: 3 | ~50 lines
**Add recent search history**
Store last 10 searches in `localStorage`. Show below search input before typing. Tap to re-run. Clear history option.
*Shippable when:* Previous searches appear on input focus, persists across sessions.

---

### Feature 4.5: Bookmarks

**DS-045** | Priority: 2 | ~40 lines
**Create bookmarks table migration and RLS policy**
Table: `bookmarks(id, user_id, book, chapter, verse, translation, created_at)`. RLS: users can only see their own bookmarks.
*Shippable when:* Migration runs, a test insert respects RLS.

---

**DS-046** | Priority: 2 | ~40 lines
**Create bookmark API routes (GET, POST, DELETE)**
`GET /api/bookmarks` — list user's bookmarks. `POST /api/bookmarks` — create. `DELETE /api/bookmarks/[id]` — remove. All protected by auth.
*Shippable when:* All 3 routes return correct responses, unauthenticated requests get 401.

---

**DS-047** | Priority: 2 | ~60 lines
**Build bookmark toggle on verse**
Long-press or action menu on a verse reveals bookmark icon. Toggles bookmark state. Optimistic UI update with rollback on error.
*Shippable when:* Toggling bookmark adds/removes from list, survives page reload.

---

**DS-048** | Priority: 3 | ~80 lines
**Build Bookmarks list page**
Displays all user bookmarks. Sort by date added or canonical book order. Tap to navigate to verse. Swipe or action button to delete.
*Shippable when:* All bookmarks render, sorting works, navigation and deletion work.

---

### Feature 4.6: Highlights

**DS-049** | Priority: 2 | ~40 lines
**Create highlights table migration and RLS policy**
Table: `highlights(id, user_id, book, chapter, verse, translation, color, created_at)`. RLS: users see only their own.
*Shippable when:* Migration runs cleanly, RLS enforced.

---

**DS-050** | Priority: 2 | ~40 lines
**Create highlight API routes (GET, POST, DELETE)**
Same pattern as bookmarks. `color` field is one of 5 hex values.
*Shippable when:* All routes respond correctly, unauthorized access blocked.

---

**DS-051** | Priority: 2 | ~90 lines
**Build highlight color picker and inline highlight UI**
Selecting a verse reveals a color picker popover (5 colors). Applying a color sends POST. Highlighted verses render with that background color in the chapter view.
*Shippable when:* Applying a highlight color renders correctly inline and persists.

---

**DS-052** | Priority: 3 | ~70 lines
**Build Highlights list page**
All highlights grouped by book and chapter. Color swatch shown per entry. Tap to navigate to passage. Delete option.
*Shippable when:* Highlights render with correct colors, navigation and deletion work.

---

### Feature 4.7: Notes

**DS-053** | Priority: 2 | ~40 lines
**Create notes table migration and RLS policy**
Table: `notes(id, user_id, book, chapter, verse, translation, content, updated_at)`. One note per verse per user.
*Shippable when:* Migration runs, one note per verse constraint enforced.

---

**DS-054** | Priority: 2 | ~40 lines
**Create notes API routes (GET, POST, PUT, DELETE)**
`GET /api/notes?book=john&chapter=3` — fetch notes for a chapter. `POST` — create. `PUT /api/notes/[id]` — update content. `DELETE` — remove.
*Shippable when:* Full CRUD works, unauthenticated requests blocked.

---

**DS-055** | Priority: 2 | ~100 lines
**Build note editor component**
Opens as a bottom drawer on verse long-press. Textarea with character count. Auto-saves on blur with 500ms debounce. Shows unsaved indicator.
*Shippable when:* Note typed, auto-saves, re-opens with content on next open.

---

**DS-056** | Priority: 3 | ~80 lines
**Build Notes list page**
All notes sorted by date modified or book order. Preview first 80 chars. Tap to navigate to verse. Delete option.
*Shippable when:* Notes list renders, navigation works, delete removes from list.

---

### Feature 4.8: Reading Plans

**DS-057** | Priority: 3 | ~60 lines
**Create reading plans schema and seed data**
Tables: `reading_plans(id, name, description, duration_days)`, `reading_plan_days(plan_id, day_number, passages[])`. Seed 2-3 default plans (Bible in a Year, Gospels in 30 Days, Psalms and Proverbs).
*Shippable when:* Plans and daily passages queryable, spot-check day 1 of each plan.

---

**DS-058** | Priority: 3 | ~50 lines
**Create user reading progress table and API**
Table: `user_reading_progress(user_id, plan_id, day_number, completed, completed_at)`. API: mark a day complete, get progress for a plan.
*Shippable when:* Marking a day complete persists and returns in progress query.

---

**DS-059** | Priority: 3 | ~90 lines
**Build Reading Plans browser and enrollment UI**
Card per plan showing name, description, duration. Enroll button. Active plan shown at top with current day highlighted.
*Shippable when:* Enrolling in a plan records progress, active plan shows current day.

---

**DS-060** | Priority: 3 | ~80 lines
**Build daily reading tracker and streak counter**
Shows today's passage with a "Mark Complete" button. Streak counter based on consecutive days completed. Progress bar (days done / total days).
*Shippable when:* Completing today's reading increments streak, progress bar updates.

---

## Epic 5: Original Language Layer

*Depends on Epic 4 — builds directly on top of the reader.*

---

### Feature 5.1: Data Ingestion

**DS-061** | Priority: 1 | ~50 lines
**Define original language TypeScript types**
Types: `StrongsEntry`, `MorphologicalTag`, `WordMapping`. Export from `types/language.ts`.
*Shippable when:* Types pass `tsc`, used correctly in at least one other file.

---

**DS-062** | Priority: 1 | ~60 lines
**Create original language database schema and migration**
Tables: `strongs_entries(id, number, language, word, transliteration, definition, usage)`, `verse_word_map(verse_id, word_index, strongs_number)`.
*Shippable when:* Migration runs cleanly, schema supports all required fields.

---

**DS-063** | Priority: 1 | ~100 lines
**Write Strong's Concordance ingestion script**
Import public domain Strong's Hebrew and Greek JSON. Normalize and bulk-insert into `strongs_entries`. Idempotent.
*Shippable when:* All Strong's entries inserted, spot-check H7225 (reshith / beginning) returns correct definition.

---

**DS-064** | Priority: 2 | ~100 lines
**Write verse-to-Strong's word mapping ingestion script**
Map each KJV word to its Strong's number using a tagged source (e.g., OpenScriptures). Store in `verse_word_map`.
*Shippable when:* John 1:1 returns correct Strong's numbers for "In", "the", "beginning", "was", "Word".

---

**DS-065** | Priority: 2 | ~80 lines
**Write OpenScriptures morphological data ingestion script**
Import morphological tags (part of speech, tense, mood, root) from OpenScriptures Hebrew OT and Greek NT. Store alongside Strong's data.
*Shippable when:* A Greek verb returns its tense and mood; a Hebrew noun returns its gender.

---

### Feature 5.2: Word-Tap Interaction

**DS-066** | Priority: 1 | ~40 lines
**Create `/api/language/word` route handler**
Accepts `strongsNumber`. Returns full Strong's entry including original characters, transliteration, definition.
*Shippable when:* `GET /api/language/word?strongs=G3056` returns the entry for "logos".

---

**DS-067** | Priority: 1 | ~90 lines
**Make verse words individually tappable**
Wrap each word in `VerseText` in a `<span>` tied to its Strong's number. Tap triggers the word detail popover.
*Shippable when:* Tapping any word in John 1:1 opens a popover with that word's Strong's number.

---

**DS-068** | Priority: 1 | ~100 lines
**Build word detail popover**
Displays: original characters (Hebrew/Greek), transliteration, Strong's number, literal definition, part of speech. Renders within the reader without navigation.
*Shippable when:* Tapping "Word" in John 1:1 shows "logos — λόγος — the divine expression" popover.

---

**DS-069** | Priority: 2 | ~80 lines
**Create and display translation drift notes**
Add `drift_note` column to `strongs_entries`. Write and seed drift notes for 25 high-impact words (ekklesia/church, Hades/hell, baptizo/baptize, etc). Render in the word popover when present.
*Shippable when:* Tapping "church" in any verse shows the ekklesia drift note.

---

## Epic 6: Archaeological Evidence

*Depends on Design System. Can be built in parallel with Epic 5.*

---

### Feature 6.1: Data Layer

**DS-070** | Priority: 1 | ~50 lines
**Define archaeological content TypeScript types**
Types: `Finding`, `FindingTimeline`, `FindingSource`. Export from `types/archaeology.ts`.
*Shippable when:* Types pass `tsc`.

---

**DS-071** | Priority: 1 | ~70 lines
**Create archaeological findings database schema and migration**
Tables: `findings(id, title, summary, description, location_lat, location_lng, credibility_rating, created_at)`, `finding_scripture_refs(finding_id, book, chapter_start, verse_start, chapter_end, verse_end)`, `finding_sources(finding_id, citation, url)`, `finding_timeline(finding_id, year, event)`.
*Shippable when:* Migration runs, all relationships work.

---

**DS-072** | Priority: 1 | ~80 lines
**Write and seed 5 launch archaeological findings**
Red Sea chariot wheels, Tall el-Hammam (Sodom), Ark of the Covenant research, Jericho walls excavation, Exodus route evidence. Each requires: full description, 3+ sources, lat/lng, timeline entries, scripture refs.
*Shippable when:* All 5 findings query correctly with all related data.

---

### Feature 6.2: Inline Reader Integration

**DS-073** | Priority: 2 | ~40 lines
**Create `/api/archaeology/by-passage` route handler**
Accepts book, chapter, verse range. Returns findings linked to that passage.
*Shippable when:* `GET /api/archaeology/by-passage?book=exodus&chapter=14` returns the Red Sea finding.

---

**DS-074** | Priority: 2 | ~80 lines
**Build inline "Dig Deeper" trigger in reader**
When a chapter has linked findings, show a subtle indicator icon beside the relevant verse range. Tapping expands a small card showing the finding title and summary.
*Shippable when:* Reading Exodus 14 shows the dig deeper indicator; tapping expands the Red Sea finding card.

---

**DS-075** | Priority: 2 | ~60 lines
**Build finding summary card component**
Title, credibility badge, 2-sentence summary, "View Full Finding" CTA. Used inline in reader and on the hub.
*Shippable when:* Card renders all fields correctly, CTA navigates to full finding.

---

### Feature 6.3: Exploration Hub

**DS-076** | Priority: 2 | ~40 lines
**Create `/api/archaeology/findings` route handler**
Returns paginated list of all findings with optional filters: scripture book, credibility rating.
*Shippable when:* Returns all 5 findings unfiltered, filtering by book works.

---

**DS-077** | Priority: 2 | ~90 lines
**Build Archaeological Hub page**
Card grid of all findings. Filter bar (by scripture book, credibility). Each card: title, photo, scripture ref, credibility badge.
*Shippable when:* Hub renders all 5 findings, filters work, cards link to detail pages.

---

**DS-078** | Priority: 2 | ~100 lines
**Build Finding Detail page**
Full description, photo gallery (Cloudinary), timeline component, scripture references (tappable — navigate to reader), source citations. Credibility rating with explanation.
*Shippable when:* All sections render, tapping a scripture ref opens the reader at that passage.

---

**DS-079** | Priority: 2 | ~80 lines
**Integrate Cloudinary for finding photos**
Set up Cloudinary SDK. Upload finding photos. Replace hardcoded image URLs with Cloudinary auto-optimized URLs. Responsive `srcset` via Cloudinary transforms.
*Shippable when:* Photos load fast on mobile, format is auto-optimized (WebP where supported).

---

**DS-080** | Priority: 3 | ~100 lines
**Build interactive Mapbox archaeological map**
Mapbox GL JS integration. Ancient-themed basemap. Marker per finding at lat/lng. Tap marker shows finding summary card. CTA to full detail page.
*Shippable when:* All 5 findings appear as markers at correct coordinates, tapping shows summary.

---

## Epic 7: AI Chat — Scholar Mode

*Depends on Supabase setup (Epic 1) and Bible data (Epic 4). Build AI service layer before UI.*

---

### Feature 7.1: AI Infrastructure

**DS-081** | Priority: 1 | ~60 lines
**Install Claude SDK and create AI service wrapper**
Install `@anthropic-ai/sdk`. Create `lib/ai/client.ts` wrapping the Claude client with error handling, retry logic, and usage logging.
*Shippable when:* A test call to `client.messages.create()` returns a valid response.

---

**DS-082** | Priority: 1 | ~80 lines
**Enable pgvector in Supabase and create embeddings schema**
Enable `pgvector` extension. Create `embeddings(id, content, source_type, source_id, embedding vector(1536))` table. Add HNSW index for fast similarity search.
*Shippable when:* A test vector insert and similarity search returns expected results.

---

**DS-083** | Priority: 1 | ~100 lines
**Build embedding generation and ingestion pipeline**
Script that generates embeddings for Bible verses, Strong's definitions, and archaeological findings using the Anthropic embeddings API. Stores in `embeddings` table. Idempotent.
*Shippable when:* Embeddings exist for all KJV verses, a similarity search for "resurrection" returns relevant verses.

---

**DS-084** | Priority: 1 | ~60 lines
**Create RAG retrieval function**
`retrieveContext(query: string, sourceTypes?: string[]): Promise<string>` — runs similarity search, fetches top-5 matches, formats as context string for injection into prompts.
*Shippable when:* `retrieveContext("what were Pharisees?")` returns relevant Bible passages and definitions.

---

### Feature 7.2: Scholar Mode

**DS-085** | Priority: 1 | ~80 lines
**Design and implement Scholar Mode system prompt**
Craft the system prompt: historical customs and traditions of biblical eras, Bible-first then historical record, cite specific passages, no denominational bias, history-only (V1). Store in `lib/ai/prompts/scholar.ts`.
*Shippable when:* Scholar mode stays historical, cites passages, deflects modern theological debate.

---

**DS-086** | Priority: 1 | ~60 lines
**Create `/api/chat/scholar` streaming route handler**
Accepts conversation history + current passage context. Retrieves RAG context. Calls Claude with streaming. Returns `ReadableStream` for token-by-token delivery.
*Shippable when:* `POST /api/chat/scholar` streams a response, RAG context is injected.

---

**DS-087** | Priority: 1 | ~100 lines
**Build chat message components (user and AI bubbles)**
`UserMessage` and `AIMessage` components. AI messages support markdown rendering. Citations rendered as tappable verse references. Streaming text renders token-by-token.
*Shippable when:* Messages render correctly, streaming shows typing effect, citations are tappable.

---

**DS-088** | Priority: 1 | ~100 lines
**Build Scholar Mode chat interface**
Conversation thread, message input with send button. New conversation button. Conversation stored in component state (V1). Scroll-to-bottom on new message.
*Shippable when:* User can hold a multi-turn conversation with Scholar Mode, UI stays scrolled to latest message.

---

**DS-089** | Priority: 2 | ~60 lines
**Implement passage-aware context injection**
Detect current reading position from URL or passed prop. Automatically prepend "The user is currently reading [Book Chapter:Verse]" to the Scholar system prompt.
*Shippable when:* Asking "what does this mean?" while reading John 3 returns a response contextually about John 3.

---

**DS-090** | Priority: 2 | ~40 lines
**Add "Ask about this passage" quick action in reader**
A button in the reader toolbar that opens Scholar Mode with the current passage pre-loaded as context.
*Shippable when:* Tapping from John 3 opens Scholar chat with John 3 context already injected.

---

## Epic 8: AI Chat — Apostle Mode

*Depends on Epic 7 AI infrastructure. Build after Scholar Mode is stable.*

---

### Feature 8.1: Apostle Characters

**DS-091** | Priority: 1 | ~200 lines (split across files)
**Write system prompts for all 13 apostle figures**
Figures: Peter, Andrew, James (son of Zebedee), John, Philip, Bartholomew, Matthew, Thomas, James (son of Alphaeus), Thaddaeus, Simon the Zealot, Paul. One file per apostle in `lib/ai/prompts/apostles/`. Each prompt encodes: biography, timeline constraints, personality, speech patterns, hard blocks (no modern world, no knowledge of canon formation).
*Shippable when:* Each apostle file exists, exported as a string, imports cleanly.

---

**DS-092** | Priority: 1 | ~60 lines
**Implement blocked-figure guardrails**
Jesus, God, Holy Spirit cannot be selected. If a prompt attempts to get an apostle to impersonate them, the apostle responds reverently but stays in character. Add guardrail layer to system prompt and test cases.
*Shippable when:* "Pretend you are Jesus" redirects gracefully; blocked figures don't appear in selection UI.

---

**DS-093** | Priority: 1 | ~60 lines
**Create `/api/chat/apostle` streaming route handler**
Same structure as Scholar route. Accepts figure ID + conversation history. Loads appropriate apostle system prompt. Streams response.
*Shippable when:* `POST /api/chat/apostle` with `figureId: "peter"` responds in character.

---

### Feature 8.2: Apostle UI

**DS-094** | Priority: 2 | ~100 lines
**Build Apostle selection gallery**
Visual grid of the 13 figures. Each card: name, role/title, key biographical fact. Tapping a card navigates to that apostle's chat. Blocked figures not shown.
*Shippable when:* All 13 figures display with bios, tapping starts a conversation.

---

**DS-095** | Priority: 2 | ~80 lines
**Build Apostle Mode chat interface**
Same base as Scholar chat but with distinct visual treatment — different header color (Bronze/Parchment scheme), apostle name and avatar in chat header.
*Shippable when:* Apostle chat is visually distinct from Scholar chat, figure name shows in header.

---

**DS-096** | Priority: 2 | ~80 lines
**QA and red-team all 13 apostle prompts**
Test suite: modern questions ("What do you think of the internet?"), theological traps, attempts to break character, timeline violations. Document failures and fix prompts.
*Shippable when:* All 13 apostles pass a written suite of 15+ edge case prompts without breaking character.

---

## Epic 9: Roots — Tradition Origins

*Depends on Design System. Can be built in parallel with AI epics.*

---

### Feature 9.1: Data Layer

**DS-097** | Priority: 1 | ~50 lines
**Create Roots content database schema and migration**
Tables: `traditions(id, name, slug, summary, origin_summary, created_at)`, `tradition_timeline(tradition_id, year, event, source)`, `tradition_scripture_refs(tradition_id, book, chapter, verse, note)`, `tradition_sources(tradition_id, citation, url)`.
*Shippable when:* Migration runs, all relationships functional.

---

**DS-098** | Priority: 1 | ~120 lines
**Write and seed 5 launch Roots entries**
Halloween, Christmas traditions, Easter traditions, Sunday worship origins, Catholic Church founding history (Simon Magus / Acts 8). Each: full origin writeup, 5+ timeline entries, 3+ scripture refs, 5+ sources. Tone: documented history, no editorializing.
*Shippable when:* All 5 entries query with all related data.

---

### Feature 9.2: Roots UI

**DS-099** | Priority: 2 | ~40 lines
**Create `/api/roots/traditions` route handler**
Returns list of all traditions with name, slug, summary.
*Shippable when:* Returns all 5 traditions with correct fields.

---

**DS-100** | Priority: 2 | ~80 lines
**Build Roots browse page**
Card grid of all traditions. Each card: tradition name, one-sentence summary. Tapping navigates to detail.
*Shippable when:* All 5 traditions render as cards, navigation to detail works.

---

**DS-101** | Priority: 2 | ~120 lines
**Build Tradition Detail page**
Sections: Historical Origin, Visual Timeline, Scripture Comparison, Early Church (30–100 AD), Sources. All sources are cited inline. No editorial conclusions — facts only.
*Shippable when:* All sections render for all 5 traditions with correct data.

---

## Epic 10: Hard Questions — Apologetics

*Depends on Design System. Can be built in parallel with AI and Roots epics.*

---

### Feature 10.1: Data Layer

**DS-102** | Priority: 1 | ~50 lines
**Create Hard Questions database schema and migration**
Tables: `questions(id, title, slug, category, summary, body, created_at)`, `question_sources(question_id, author, title, citation, url)`, `related_questions(question_id, related_question_id)`.
*Shippable when:* Migration runs cleanly.

---

**DS-103** | Priority: 1 | ~120 lines
**Write and seed 6 launch Hard Questions entries**
Intelligent design overview, DNA and information theory (Meyer), irreducible complexity (Behe), Cambrian explosion, fine-tuning argument, origin of life / cosmological argument. Each: 1000–2000 words, 5+ credentialed sources, confident tone.
*Shippable when:* All 6 entries query with sources and related questions populated.

---

### Feature 10.2: Hard Questions UI

**DS-104** | Priority: 2 | ~40 lines
**Create `/api/questions` route handler**
Returns list of questions grouped by category.
*Shippable when:* Returns all 6 questions with categories.

---

**DS-105** | Priority: 2 | ~80 lines
**Build Hard Questions browse page**
Questions grouped by category (e.g., "Science & Origins"). Card per question: title, one-sentence summary. Tapping navigates to detail.
*Shippable when:* All 6 questions render grouped correctly, navigation works.

---

**DS-106** | Priority: 2 | ~120 lines
**Build Question Detail page**
Full article body with pull-quotes from cited scientists. Source list at bottom. Related questions section. Print/share friendly layout.
*Shippable when:* Full article renders for all 6 questions, sources list correctly, related questions link correctly.

---

## Epic 11: Premium & Subscriptions

*Build auth first (Epic 3). Can run in parallel with content epics.*

---

### Feature 11.1: Access Control

**DS-107** | Priority: 1 | ~60 lines
**Define free vs. premium feature matrix as constants**
Export `FREE_FEATURES` and `PREMIUM_FEATURES` constants. Create `isPremiumFeature(featureKey)` utility. Used everywhere access is checked.
*Shippable when:* Utility correctly identifies premium features from constants.

---

**DS-108** | Priority: 1 | ~70 lines
**Create `useSubscription` hook and subscription status API**
Hook returns `{ isPremium, isLoading, plan }`. Backed by a `subscriptions` table in Supabase. Free users return `isPremium: false`.
*Shippable when:* Hook returns correct status for both free and premium test accounts.

---

**DS-109** | Priority: 2 | ~80 lines
**Build premium feature gate component**
`<PremiumGate feature="apostleMode">` — wraps premium content. Free users see an upgrade prompt instead of the content. Premium users see content normally.
*Shippable when:* Free users see upgrade CTA, premium users see the wrapped content.

---

**DS-110** | Priority: 2 | ~80 lines
**Build upgrade prompt / paywall modal**
Shown when a free user hits a premium feature. Lists what premium includes. "Start Free Trial" and "View Plans" CTAs. Matches Dawnscroll brand.
*Shippable when:* Modal renders correctly, CTAs navigate to subscription page.

---

### Feature 11.2: Payments

**DS-111** | Priority: 2 | ~80 lines
**Integrate Stripe and create subscription products**
Set up Stripe account and products: monthly ($7.99–$9.99) and annual ($59.99–$79.99). Install `stripe` SDK. Create `lib/stripe.ts` client wrapper.
*Shippable when:* Stripe products exist, SDK connects without error.

---

**DS-112** | Priority: 2 | ~80 lines
**Create Stripe Checkout session API route**
`POST /api/subscriptions/checkout` — creates a Stripe Checkout session for the selected plan. Returns checkout URL. Includes 7-day trial parameter.
*Shippable when:* Calling the route redirects to a real Stripe Checkout page with trial applied.

---

**DS-113** | Priority: 2 | ~80 lines
**Build Pricing / Subscription page**
Two plan cards: monthly and annual. Annual shows per-month equivalent and savings. "Start Free Trial" CTA on both. Feature comparison list below.
*Shippable when:* Page renders both plans correctly, CTA triggers Stripe Checkout.

---

**DS-114** | Priority: 2 | ~70 lines
**Implement Stripe webhook handler**
`POST /api/webhooks/stripe` — handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Updates `subscriptions` table accordingly.
*Shippable when:* Completing a test checkout via Stripe CLI marks the user as premium in Supabase.

---

**DS-115** | Priority: 3 | ~60 lines
**Build subscription management page**
Shows current plan, renewal date, and "Cancel Subscription" CTA (redirects to Stripe Customer Portal). Accessible from Profile.
*Shippable when:* Current plan and renewal date display correctly, cancel redirects to Stripe portal.

---

---

## Backlog Summary

| Epic | Feature Count | Ticket Count | Priority Range |
|------|--------------|--------------|----------------|
| 1. Foundation & Infrastructure | 4 | 9 | P1 |
| 2. Design System & Branding | 2 | 8 | P1–P3 |
| 3. Auth & User Accounts | 2 | 8 | P1–P3 |
| 4. Bible Reader | 8 | 35 | P1–P3 |
| 5. Original Language Layer | 2 | 9 | P1–P2 |
| 6. Archaeological Evidence | 3 | 11 | P1–P3 |
| 7. AI Chat — Scholar Mode | 2 | 10 | P1–P2 |
| 8. AI Chat — Apostle Mode | 2 | 6 | P1–P2 |
| 9. Roots | 2 | 5 | P1–P2 |
| 10. Hard Questions | 2 | 5 | P1–P2 |
| 11. Premium & Subscriptions | 2 | 9 | P1–P3 |
| **Total** | **31 features** | **115 tickets** | |

### Recommended Execution Order
1. Epics 1, 2, 3 — build in this order, they are prerequisites for everything
2. Epic 4 — Bible Reader is the core; complete before moving on
3. Epics 5, 6, 11 — can interleave once Reader is stable
4. Epics 7, 8 — AI features after data layer is solid
5. Epics 9, 10 — content-heavy, can be written in parallel with development

---

*Generated from unveiled-plan.md — V1 scope, atomic MR-sized tickets*
