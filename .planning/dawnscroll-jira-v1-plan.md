# Dawnscroll — Jira V1 Epic & Story Plan

*Scope: V1 launch features only*
*Methodology: Agile / Scrum*
*Estimated Epics: 10*

---

## Epic 1: Project Foundation & Infrastructure

**Description:** Set up the core tech stack, repository, CI/CD pipeline, and deployment infrastructure. This is the prerequisite for all other work.

### Stories

**DS-101: Initialize Next.js 14 project with TypeScript and Tailwind CSS**
- Set up Next.js 14 with app router and server components
- Configure TypeScript strict mode
- Install and configure Tailwind CSS with the Dawnscroll design tokens (color palette from branding guide)
- Set up ESLint, Prettier, and Husky pre-commit hooks
- *Acceptance Criteria:* App runs locally, linting passes, Tailwind compiles with custom theme

**DS-102: Set up Supabase project and database schema**
- Provision Supabase project (Postgres, Auth, Storage)
- Design and migrate initial database schema: users, bookmarks, highlights, notes, reading_progress
- Enable Row Level Security policies
- *Acceptance Criteria:* Database accessible from Next.js, RLS policies enforced, migrations versioned

**DS-103: Configure GitHub repository and CI/CD pipeline**
- Create GitHub repo with branch protection rules (main, develop)
- Set up GitHub Actions for lint, type-check, test, and deploy on PR merge
- Configure Vercel deployment with preview environments
- *Acceptance Criteria:* PRs trigger checks, merges to main auto-deploy to production

**DS-104: Set up Capacitor for mobile wrapper**
- Install and configure Capacitor for iOS and Android
- Verify web app loads correctly in native shell
- Configure splash screen and app icon placeholders
- *Acceptance Criteria:* App builds and runs on iOS simulator and Android emulator

**DS-105: Implement environment and configuration management**
- Set up environment variables for Supabase, Claude API, Mapbox, Cloudinary
- Create configuration service for feature flags (free vs. premium)
- *Acceptance Criteria:* All services connect via env config, feature flags toggle correctly

---

## Epic 2: Design System & Branding

**Description:** Build a reusable component library and design system based on the Dawnscroll brand identity — ancient, reverent, evidence-first.

### Stories

**DS-201: Create design token system from brand palette**
- Implement Tailwind theme with Stone Night, Dark Clay, Bronze, Sand, Parchment, Linen, Sage, and Rust
- Define semantic reader tokens for surfaces, strong borders, accent contrast, links, focus, selection, highlights, notes, and citations
- Define typography scale: EB Garamond for scripture/brand moments, clean sans for UI controls
- Set up dark/light/sepia reading mode foundations
- Avoid low-contrast pairings such as bronze-on-linen, linen-on-bronze, and sand text on light backgrounds
- *Acceptance Criteria:* Brand colors and semantic reader tokens are available, typography renders correctly, and primary action/text pairings meet contrast requirements

**DS-202: Build core UI component library**
- Button, Card, Modal, Drawer, Toast, Navigation components
- Consistent with ancient, readable, authoritative, quiet aesthetic
- Buttons use restrained radius (`rounded-md` or `rounded-lg`) and high-contrast primary action colors
- Cards/modals/drawers use restrained radius and quiet borders; shadows are reserved for overlays/elevated surfaces
- Responsive across mobile, tablet, desktop
- *Acceptance Criteria:* Components documented, used across at least 2 pages

**DS-203: Design and implement app navigation structure**
- Bottom tab navigation for mobile (Reader, Explore, Library/Profile)
- Sidebar navigation for desktop
- No Chat navigation item in V1 while public AI chat is deferred
- Responsive breakpoints
- *Acceptance Criteria:* Navigation works on all breakpoints, active states visible

**DS-204: Create app icon and splash screen assets**
- Ayin symbol in sand/bronze on stone night background
- Generate required sizes for iOS, Android, and web favicon
- *Acceptance Criteria:* Icons render correctly on all platforms

---

## Epic 3: Bible Reader (Core)

**Description:** The primary reading experience — the heart of the app. Full Bible text with navigation, search, and personal tools. V1 ships with KJV, ASV, YLT, and WEB.

### Stories

**DS-301: Ingest and store Bible translation data**
- Import KJV, ASV, YLT, WEB from public domain JSON sources
- Store in Supabase with indexed schema: book, chapter, verse, translation, text
- Validate data integrity (66 books, correct verse counts)
- *Acceptance Criteria:* All 4 translations queryable, zero missing verses

**DS-302: Build book/chapter/verse navigation**
- Book selector (Old Testament / New Testament grouping)
- Chapter grid for selected book
- Verse-level scroll with verse numbers
- Deep linking to any book/chapter/verse via URL
- *Acceptance Criteria:* User can navigate to any verse in under 3 taps

**DS-303: Implement Bible text rendering and reading view**
- Clean, readable typography on Linen background
- Verse numbers inline, tap-selectable
- Translation selector dropdown (KJV default)
- Smooth scrolling with chapter preloading
- *Acceptance Criteria:* Text renders beautifully on mobile and desktop, no layout jank

**DS-304: Build full-text search across translations**
- Search bar with instant results
- Search across all translations or filter to one
- Results show verse reference, snippet, and translation
- Recent search history
- *Acceptance Criteria:* Search returns results in under 500ms for common queries

**DS-305: Implement bookmarks system**
- Tap-to-bookmark any verse
- Bookmarks list view with sort by date or book order
- Bookmark syncs across devices via Supabase
- *Acceptance Criteria:* Bookmarks persist, sync, and display correctly

**DS-306: Implement highlights system**
- Long-press verse to highlight with color options
- Highlights visible in reading view
- Highlights list view
- *Acceptance Criteria:* Highlights persist, multiple colors available, visible inline

**DS-307: Implement personal notes on verses**
- Attach notes to any verse
- Notes editor with basic formatting
- Notes list view and search
- *Acceptance Criteria:* Notes save, sync, and are retrievable by verse

**DS-308: Build reading plans and daily tracker**
- Curated reading plans (e.g., Bible in a Year, Gospels in 30 Days)
- Daily reading assignment with progress tracking
- Streak counter and completion percentage
- *Acceptance Criteria:* User can enroll in a plan, mark daily reading complete, see progress

---

## Epic 4: Original Language Layer

**Description:** Tap any word to see the original Hebrew or Greek, its literal meaning, and notes on translation drift. Powered by Strong's Concordance and OpenScriptures data.

### Stories

**DS-401: Ingest Strong's Concordance data**
- Import Strong's Hebrew and Greek dictionaries (public domain JSON)
- Store in Supabase with Strong's number, original word, transliteration, definition, usage examples
- *Acceptance Criteria:* All Strong's entries queryable by number, full definitions available

**DS-402: Map Bible text to Strong's numbers**
- Link every word in KJV (primary) to its Strong's number
- Build lookup index for verse-level word mapping
- *Acceptance Criteria:* Every mappable word in KJV resolves to a Strong's entry

**DS-403: Build word-tap interaction for original language**
- Tap any word in the reader to open a language popover
- Display: original Hebrew/Greek characters, transliteration, Strong's number, literal meaning
- Translation drift notes where applicable (e.g., "church" vs. ekklesia)
- *Acceptance Criteria:* Popover appears on tap, data loads in under 300ms, drift notes display where available

**DS-404: Ingest OpenScriptures morphological data**
- Import morphologically tagged Hebrew OT and Greek NT
- Store part-of-speech, tense, mood, root form metadata
- *Acceptance Criteria:* Morphological data available for lookup alongside Strong's data

**DS-405: Create curated translation drift notes**
- Research and write drift notes for high-impact words (church, hell, baptize, cross, Easter, etc.)
- Store as structured content linked to Strong's numbers
- *Acceptance Criteria:* At least 25 drift notes ready for launch, editorially reviewed

---

## Epic 5: Archaeological Evidence

**Description:** Inline "Dig Deeper" triggers on relevant passages plus a browseable exploration hub with maps, photos, and timelines. Evidence-first, fully sourced.

### Stories

**DS-501: Design archaeological content data model**
- Schema: finding title, description, scripture references, location (lat/lng), photos, sources, credibility rating, timeline
- Link findings to specific book/chapter/verse ranges
- *Acceptance Criteria:* Schema supports all required fields, relationships to Bible text work

**DS-502: Build inline "Dig Deeper" triggers in reader**
- When reading a passage with linked archaeological evidence, show a subtle indicator
- Tap to expand a card with summary and link to full finding
- Non-intrusive — should enhance reading, not interrupt it
- *Acceptance Criteria:* Triggers appear on relevant passages, expand smoothly, link to full content

**DS-503: Build archaeological exploration hub**
- Browse all findings in a card grid
- Filter by category, scripture book, credibility rating
- Full finding detail page with description, photos, sources, timeline
- *Acceptance Criteria:* Hub loads all findings, filters work, detail pages render completely

**DS-504: Implement interactive archaeological map**
- Mapbox integration with custom ancient-styled map tiles
- Markers for each archaeological site
- Tap marker to see finding summary, tap through to detail
- *Acceptance Criteria:* Map renders, markers placed accurately, popups work

**DS-505: Create launch archaeological content (5 findings)**
- Red Sea chariot wheel formations (Exodus 14)
- Sodom and Gomorrah — Tall el-Hammam evidence
- Ark of the Covenant research summary
- Jericho walls excavation (Kathleen Kenyon / Bryant Wood)
- Exodus route archaeological evidence
- Each finding: 500-1000 words, 3+ source citations, photos where available
- *Acceptance Criteria:* 5 findings complete, reviewed, sourced, with media assets

**DS-506: Integrate Cloudinary for media hosting**
- Set up Cloudinary account and SDK
- Upload and optimize archaeological photos
- Responsive image delivery via CDN
- *Acceptance Criteria:* Images load fast, optimized for device, served via CDN

---

## Epic 6: AI Chat — Scholar Mode

**Description:** An AI assistant grounded in historical context. Knows what the user is reading. Cites passages and sources. Educational, never denominational. History-only for V1.

### Stories

**DS-601: Set up Claude API integration and service layer**
- Configure Claude API client in Next.js API routes
- Build conversation management (create, continue, end sessions)
- Implement rate limiting and usage tracking
- *Acceptance Criteria:* Claude API responds through app, conversations persist, rate limits enforced

**DS-602: Build RAG pipeline with pgvector**
- Enable pgvector extension in Supabase
- Generate and store embeddings for Bible text, Strong's definitions, archaeological content
- Build retrieval function: given a query, return top-k relevant passages
- *Acceptance Criteria:* RAG returns relevant context for test queries, latency under 1s

**DS-603: Design and implement Scholar Mode system prompt**
- Craft system prompt: historical customs, laws, traditions of biblical eras
- Grounding rules: Bible-first, historical record second, cite specific passages
- Guardrails: no denominational bias, no modern theological opinions, stays in historical lane
- Passage-aware context injection (what the user is currently reading)
- *Acceptance Criteria:* Scholar mode answers are historically grounded, cite sources, stay educational

**DS-604: Build chat UI**
- Conversational interface with message bubbles
- Streaming responses (token-by-token display)
- Source citations rendered as tappable references
- New conversation / conversation history
- *Acceptance Criteria:* Chat feels responsive, citations link to passages, history persists

**DS-605: Implement passage-aware context**
- Detect what passage the user is currently reading
- Automatically inject passage context into AI conversations
- "Ask about this passage" quick action from the reader
- *Acceptance Criteria:* AI responses reference the current passage accurately without user needing to specify

---

## Epic 7: AI Chat — Apostle Mode

**Description:** Converse with the 12 apostles and Paul as historically grounded characters. Strictly within their own timeline and knowledge. Reverent treatment — Jesus, God, and the Holy Spirit are never roleplayed.

### Stories

**DS-701: Design Apostle Mode character system prompts**
- Create individual system prompts for all 13 figures (12 apostles + Paul)
- Each prompt encodes: personality, known biography, timeline constraints, speech patterns
- Hard blocks: no awareness of modern world, no knowledge of their letters becoming scripture, no knowledge of church history post-their-lifetime
- *Acceptance Criteria:* Each apostle responds in character, stays within timeline, passes boundary tests

**DS-702: Implement blocked-figure guardrails**
- Jesus, God, Holy Spirit cannot be selected as conversation partners
- If a user tries to get an apostle to "channel" Jesus, the apostle responds reverently but stays in character
- *Acceptance Criteria:* Blocked figures not selectable, redirect attempts handled gracefully

**DS-703: Build Apostle selection UI**
- Visual gallery of the 13 available figures
- Brief bio card for each (name, role, key events)
- Select to start conversation
- *Acceptance Criteria:* All 13 figures displayed, bios accurate, conversation initiates on selection

**DS-704: Implement Apostle Mode conversation experience**
- Distinct visual treatment from Scholar Mode (different header/accent color)
- Apostle name and icon in chat header
- Responses in first person, period-appropriate language
- *Acceptance Criteria:* Conversations feel distinct from Scholar Mode, immersive, historically grounded

**DS-705: QA and red-team Apostle Mode responses**
- Test edge cases: modern questions, theological traps, attempts to break character
- Verify timeline accuracy for each apostle
- Test blocked-figure guardrails
- Document and fix any failures
- *Acceptance Criteria:* All 13 apostles pass a suite of 20+ edge case tests

---

## Epic 8: Roots — Tradition Origins

**Description:** Trace any tradition, holiday, or practice back to its historical origins and compare against scripture. Documented, sourced, never editorial.

### Stories

**DS-801: Design Roots content data model**
- Schema: tradition name, summary, historical origin, timeline entries, scripture references, early church comparison, sources
- *Acceptance Criteria:* Schema supports all required content fields and relationships

**DS-802: Build Roots browsing and detail UI**
- Card grid of all traditions
- Detail page: origin section, visual timeline, scripture comparison, early church section
- Source citations throughout
- *Acceptance Criteria:* All sections render, timeline is visual, sources are tappable

**DS-803: Create launch Roots content (5 entries)**
- Halloween — origins and scripture comparison
- Christmas traditions — historical origins and scripture comparison
- Easter traditions — historical origins and scripture comparison
- Sunday worship origins — historical shift from Sabbath
- Catholic Church founding history — Simon Magus / Acts 8 connection
- Each entry: 800-1500 words, documented timeline, 5+ source citations
- *Acceptance Criteria:* 5 entries complete, factual, sourced, tone is educational not editorial

---

## Epic 9: Hard Questions — Apologetics

**Description:** Confident, sourced, intellectually serious answers to the biggest challenges to faith. Evidence-first, never defensive. V1 focuses on intelligent design and origin-of-life arguments.

### Stories

**DS-901: Design Hard Questions content data model**
- Schema: question title, category, summary, full article, key arguments, cited sources, related questions
- *Acceptance Criteria:* Schema supports rich content with structured citations

**DS-902: Build Hard Questions browsing and detail UI**
- Category-grouped listing (e.g., "Science & Origins")
- Detail page with article, pull-quotes from cited scientists, source list
- Related questions sidebar/footer
- *Acceptance Criteria:* Content renders cleanly, citations present, related questions link correctly

**DS-903: Create launch Hard Questions content (6 entries)**
- Intelligent design — the scientific case (overview)
- DNA complexity and information theory (Stephen Meyer's arguments)
- Irreducible complexity (Michael Behe's arguments)
- The Cambrian explosion
- Fine-tuning argument
- Origin of life problem / something-from-nothing cosmological argument
- Each entry: 1000-2000 words, 5+ credentialed source citations
- *Acceptance Criteria:* 6 entries complete, tone is confident and evidence-first, all sources credentialed

---

## Epic 10: User Accounts & Premium

**Description:** Authentication, user profiles, and the freemium paywall. Scripture is never paywalled. Premium unlocks AI features, full archaeology hub, and offline access.

### Stories

**DS-1001: Implement authentication with Supabase Auth**
- Email/password sign up and login
- Google and Apple OAuth
- Password reset flow
- Session management and token refresh
- *Acceptance Criteria:* Users can register, login, logout, reset password across all auth methods

**DS-1002: Build user profile and settings**
- Profile page: name, email, reading stats
- Settings: default translation, reading mode (light/dark/sepia), notification preferences
- *Acceptance Criteria:* Settings persist, reading mode applies globally

**DS-1003: Implement freemium access control**
- Define free vs. premium feature matrix per the monetization plan
- Middleware/hooks that check subscription status before rendering premium features
- Graceful upgrade prompts when free users tap premium features
- *Acceptance Criteria:* Free users see all free content, premium features show upgrade prompt, premium users have full access

**DS-1004: Integrate payment provider for subscriptions**
- Stripe or RevenueCat integration for web and mobile
- Monthly and annual plan options
- 7-day free trial flow
- Subscription management (upgrade, downgrade, cancel)
- *Acceptance Criteria:* Users can subscribe, trial works, billing is correct, cancellation works

**DS-1005: Implement offline access for premium users**
- Download Bible translations for offline reading
- Cache bookmarks, highlights, notes locally
- Sync when back online
- *Acceptance Criteria:* Premium users can read Bible offline, data syncs on reconnect

---

## Summary

| Epic | Stories | Priority |
|------|---------|----------|
| 1. Foundation & Infrastructure | 5 | P0 — Sprint 1 |
| 2. Design System & Branding | 4 | P0 — Sprint 1-2 |
| 3. Bible Reader (Core) | 8 | P0 — Sprint 2-4 |
| 4. Original Language Layer | 5 | P0 — Sprint 3-5 |
| 5. Archaeological Evidence | 6 | P1 — Sprint 4-6 |
| 6. AI Chat — Scholar Mode | 5 | P1 — Sprint 4-6 |
| 7. AI Chat — Apostle Mode | 5 | P1 — Sprint 5-7 |
| 8. Roots | 3 | P1 — Sprint 5-7 |
| 9. Hard Questions | 3 | P1 — Sprint 5-7 |
| 10. User Accounts & Premium | 5 | P0 — Sprint 3-5 |
| **Total** | **49 stories** | |

### Suggested Sprint Cadence
- **2-week sprints**
- **Sprints 1-2:** Foundation, design system, start Bible reader
- **Sprints 3-4:** Bible reader complete, original language, start accounts
- **Sprints 5-6:** AI features, archaeology, content creation
- **Sprint 7:** Roots, Hard Questions, polish, QA
- **Sprint 8:** Beta testing, bug fixes, launch prep

---

*Generated from unveiled-plan.md — V1 scope only*
