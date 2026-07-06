# PRD V1.0 — KJV Bible Reader + KJV Data Import

**Product:** Dawnscroll  
**Version:** V1.0  
**Status:** Draft for implementation planning  
**Last updated:** 2026-07-06  
**Primary source material:** `.planning/dawnscroll-plan.md`, `.planning/dawnscroll-backlog.md`, `.planning/dawnscroll-jira-v1-plan.md`, `.agents/product/prd-writer.md`, `.agents/product/mvp-scope-agent.md`, `.agents/bible-data/*`, `.agents/software/bible-data-engineer.md`, `.agents/design/reader-ux-agent.md`

---

## 1. Overview

Dawnscroll V1.0 needs a trustworthy, comfortable, and fast KJV Bible reader backed by a repeatable KJV data import pipeline. This PRD intentionally narrows the broader V1 Bible Reader plan to the smallest credible first release slice: **KJV only**, with the data model and UX shaped so ASV, YLT, WEB, original-language mapping, and personal study tools can be added later without rework.

The KJV reader is the foundation for Dawnscroll's larger truth-first product: scripture-first reading, future original-language scholarship, archaeological links, Roots content, and trustworthy citations. V1.0 must therefore prioritize scripture text integrity, source metadata, deterministic imports, clear navigation, and reader comfort over breadth of features.

---

## 2. Problem Statement

Users need a calm, reliable way to read and search the King James Version inside Dawnscroll before deeper study layers can be trusted. Engineering needs normalized Bible data in Supabase before reader navigation, search, original-language mappings, archaeology links, bookmarks, highlights, notes, and reading plans can depend on verse references.

Without this release:

- Dawnscroll cannot demonstrate its core reader experience.
- Downstream features lack stable `book/chapter/verse` identifiers.
- Scripture accuracy, source attribution, and import repeatability remain unverified.
- The team risks building UX and study features against ad hoc or unvalidated text.

---

## 3. Goals

### 3.1 Product Goals

1. Ship a complete KJV reading experience covering all 66 Protestant canon books.
2. Let users navigate to any KJV chapter by book and chapter.
3. Let users deep-link directly to a KJV book/chapter and optionally a verse anchor.
4. Let users search KJV text and open results in the reader.
5. Establish the canonical Bible data shape used by later translations and study features.
6. Preserve source, license, and import metadata for trust and auditability.
7. Deliver a reader UI that follows Dawnscroll reading-mode tokens and avoids clutter.

### 3.2 Data Goals

1. Import KJV from an approved public-domain or otherwise legally approved source.
2. Normalize books, chapters, verses, abbreviations, testament grouping, canonical order, and verse text.
3. Validate completeness before data is treated as production-ready.
4. Make imports idempotent and safe to re-run.
5. Produce a machine-readable and human-readable validation report.

---

## 4. Non-Goals

The following are explicitly out of scope for this V1.0 PRD:

- Importing ASV, YLT, WEB, or any non-KJV translation.
- Side-by-side translation comparison.
- Audio Bible.
- Offline reading.
- Original-language word tap, Strong's, morphology, interlinear, or drift notes.
- Archaeology inline triggers.
- Roots or Hard Questions content surfaces.
- AI chat, Scholar Mode, or Apostle Mode.
- Bookmarks, highlights, notes, reading plans, or authenticated personalization.
- Mobile-native Capacitor packaging.
- A custom Dawnscroll original translation.

---

## 5. Users and Jobs To Be Done

### 5.1 Primary Users

- **Scripture reader:** Wants to read the KJV comfortably on mobile or desktop.
- **Searcher:** Wants to find a verse or phrase quickly and open it in context.
- **Sharer:** Wants to send a stable link to a chapter or verse.
- **Internal content/data team:** Needs stable references for future archaeology, Roots, and original-language work.

### 5.2 Jobs

- When I know a passage, I want to open its book and chapter quickly so I can read without friction.
- When I remember a phrase, I want to search KJV text so I can find the verse.
- When I share a passage, I want the link to open the same chapter and verse for someone else.
- When the team imports scripture text, we need proof that no verses are missing, duplicated, or malformed.

---

## 6. Scope

### 6.1 Must Have

#### KJV Data Import

- Approved KJV source recorded with source URL/path, license status, source format, retrieval date, and attribution notes.
- Database schema for translations, books, chapters, and verses.
- Public read access for scripture text; no public write access.
- KJV import script that:
    - Parses the approved raw source.
    - Normalizes book names, abbreviations, testament, canonical order, chapter numbers, verse numbers, and verse text.
    - Preserves KJV translation metadata.
    - Bulk upserts or otherwise imports idempotently.
    - Can be re-run without duplicating verses.
- Validation that checks:
    - 66 books present.
    - Expected testament grouping present.
    - Expected chapter counts per book present.
    - No duplicate `(translation, book, chapter, verse)` records.
    - No empty verse text.
    - Verse ordering is stable.
    - At least 10 named spot-check verses match the approved source, including Genesis 1:1, Psalm 23:1, Isaiah 53:5, Matthew 5:9, John 1:1, John 3:16, Romans 8:28, 1 Corinthians 13:4, Revelation 1:8, and Revelation 22:21.
- Import validation report committed or generated as an artifact by the import workflow.

#### Reader Data Access

- TypeScript Bible types for `Translation`, `Book`, `Chapter`, `Verse`, and `VerseRange`.
- Server-side query function for all Bible books.
- Server-side query function for a KJV chapter by book and chapter number.
- Server-side KJV search function returning reference, text, and ranking metadata.
- Graceful handling for unknown book slugs, invalid chapter numbers, empty search queries, and no-result searches.

#### Reader UX

- Reader route for `/read/[book]/[chapter]`.
- Optional verse anchor support using `#verse-N`.
- Book selector showing all 66 books grouped by Old Testament and New Testament.
- Chapter selector showing the correct chapter count for the selected book.
- KJV chapter view showing ordered verse numbers and verse text.
- Reader typography and layout that use Dawnscroll reading-mode CSS tokens.
- Basic reader toolbar with current reference and navigation controls.
- Previous/next chapter navigation.
- Search UI with debounced KJV query, results list, and result-to-reader navigation.
- Accessible semantic markup for scripture content and controls.

### 6.2 Should Have

- Local recent search history for the last 10 KJV searches.
- Adjacent chapter prefetching.
- Scroll restoration when moving between chapters or returning from a search result.
- Loading and empty states using existing UI patterns.
- Reader smoke tests covering John 3 and search result navigation.

### 6.3 Could Have

- Keyboard shortcuts for previous/next chapter on desktop.
- Copy verse reference and text action.
- Compact book filter inside the book selector.

---

## 7. Functional Requirements

### 7.1 Data Model Requirements

| Entity         | Required Fields                                                                                                                         | Notes                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `translations` | `id`, `slug`, `name`, `abbreviation`, `language`, `license`, `source_url`, `attribution`, `created_at`, `updated_at`                    | V1.0 contains `kjv`; shape must support later translations.                |
| `books`        | `id`, `slug`, `name`, `abbreviation`, `testament`, `canonical_order`, `chapter_count`                                                   | Books are translation-independent unless a future source forces otherwise. |
| `chapters`     | `id`, `book_id`, `chapter_number`, `verse_count`                                                                                        | Used for selectors and validation.                                         |
| `verses`       | `id`, `translation_id`, `book_id`, `chapter_number`, `verse_number`, `text`, `search_vector`, `source_hash`, `created_at`, `updated_at` | Unique on translation/book/chapter/verse.                                  |

### 7.2 Import Requirements

- Import must run from a documented command.
- Import must fail loudly on missing source metadata, malformed references, duplicate verses, or missing verse text.
- Import must normalize Unicode consistently.
- Import must not silently change scripture text beyond documented whitespace/encoding normalization.
- Import must output counts by book and chapter.
- Import must output blocking vs. non-blocking anomalies.
- Import must be suitable for CI or a controlled deployment workflow.

### 7.3 Reader Requirements

- Default reader landing state should open a sensible KJV chapter, recommended: John 1 or Genesis 1.
- Every rendered verse must have a stable DOM anchor: `id="verse-{verseNumber}"`.
- Verse numbers must be visible but visually subordinate to the text.
- Scripture text must remain the visual focus; controls must not crowd the reading surface.
- Reader must support light, dark, and sepia modes through existing token patterns where available.
- Invalid routes must show a helpful not-found or recovery state, not a raw error.
- Reader must work on mobile and desktop breakpoints.

### 7.4 Search Requirements

- KJV search accepts a free-text query.
- Empty or whitespace-only search does not call the backend.
- Results include book name, chapter, verse, translation abbreviation, and snippet/text.
- Selecting a result opens `/read/[book]/[chapter]#verse-N`.
- Common queries should return quickly enough to feel interactive; target p95 under 500ms after the query reaches the backend in production-like conditions.

---

## 8. UX and Design Requirements

- Use reading-mode tokens such as `text-reading-text`, `bg-reading-bg`, and `border-reading-border` so the reader adapts to light, dark, and sepia modes.
- Use `cn()` for class merging in implementation work.
- Reader typography should favor long-form comfort, with scripture text styled distinctly from UI controls.
- Mobile navigation must keep the chapter text readable and avoid sticky UI that covers verses.
- Focus states must be visible and keyboard-accessible.
- Loading, empty, and error states must be quiet and consistent with Dawnscroll's ancient, readable, authoritative visual direction.
- Do not add a Chat navigation item as part of this work.

---

## 9. Accessibility Requirements

- All selectors, buttons, search fields, and navigation controls must be keyboard reachable.
- Current book/chapter state must be programmatically identifiable.
- Search results must be announced or structured so screen readers can understand result count and references.
- Verse anchors must not break screen-reader reading flow.
- Color must not be the only indicator for current chapter or active search result.
- Text contrast must meet WCAG AA for normal body text and controls.

---

## 10. Analytics and Observability

V1.0 should define event names even if analytics instrumentation is added later:

- `bible_reader_opened`
- `bible_book_selected`
- `bible_chapter_selected`
- `bible_prev_next_used`
- `bible_search_submitted`
- `bible_search_result_opened`
- `bible_import_started`
- `bible_import_completed`
- `bible_import_failed`
- `bible_import_validation_failed`

Each event should avoid storing full scripture text or sensitive user-entered data unless explicitly approved later.

---

## 11. Acceptance Criteria

### 11.1 Data Import Acceptance Criteria

- KJV source has recorded license/source metadata and is approved before import implementation proceeds.
- Import creates exactly one KJV translation record.
- Import produces 66 books in canonical order.
- Import creates all expected KJV chapters and verses according to the approved validation baseline.
- Re-running the import does not duplicate translation, book, chapter, or verse records.
- Validation report shows zero blocking defects.
- Named spot-check verses match the approved source.
- Public clients can read KJV verses but cannot write scripture tables.

### 11.2 Reader Acceptance Criteria

- `/read/john/3` opens John chapter 3 in KJV.
- `/read/john/3#verse-16` opens John chapter 3 and scrolls or anchors to verse 16.
- Book selector lists all 66 books grouped by testament.
- Chapter selector shows the correct number of chapters for Genesis, Psalms, Matthew, John, and Revelation.
- John 3 renders all verses in order with visible verse numbers.
- Previous/next navigation works across chapter and book boundaries.
- Search for `love your neighbour` or another approved KJV phrase returns relevant KJV results.
- Selecting a search result opens the correct chapter and verse anchor.
- Reader passes accessibility checks for keyboard navigation and visible focus.
- Reader uses reading-mode tokens rather than hard-coded mode-specific colors for core text/surfaces.

---

## 12. Dependencies

- Supabase project and migrations workflow.
- Existing Next.js app router conventions in this repository.
- Existing design tokens and reading-mode CSS patterns.
- Approved KJV data source and license review.
- Canon metadata baseline for book order, chapter counts, and verse counts.
- CI checks for lint, type-check, and build.

---

## 13. Risks and Mitigations

| Risk                                                   | Impact                   | Mitigation                                                                                   |
| ------------------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------- |
| KJV source claims public domain but lacks provenance   | Legal/trust risk         | Require source metadata and license review before implementation use.                        |
| Verse counts differ from expected baseline             | Scripture integrity risk | Treat as blocking until Bible Data QA classifies the anomaly.                                |
| Parser normalizes away meaningful punctuation or words | Scripture accuracy risk  | Allow only documented whitespace/encoding normalization; spot-check source text.             |
| Search ranking feels poor for KJV phrasing             | UX risk                  | Start with Postgres full-text search, then tune dictionaries/ranking after measured results. |
| Reader controls clutter scripture                      | UX/trust risk            | Follow Reader UX guidance: scripture first, controls quiet and subordinate.                  |
| Schema is too KJV-specific                             | Future rework risk       | Keep translation-aware `verses` and translation metadata even while V1.0 imports KJV only.   |

---

## 14. Implementation Sequencing Recommendation

1. Approve KJV source and license metadata.
2. Define Bible types and canonical metadata.
3. Create scripture schema and indexes.
4. Build KJV import script.
5. Build validation/reporting.
6. Add server data access functions.
7. Build reader route and chapter view.
8. Build book/chapter navigation.
9. Build search API and UI.
10. Add accessibility, performance, and regression checks.

---

## 15. Open Questions

1. Which exact KJV source file will be approved for V1.0 import?
2. Should the validation baseline use a committed canonical metadata file, an external reference, or both?
3. Should book records be globally canonical or translation-scoped from day one?
4. Should KJV retain archaic punctuation/capitalization exactly as source-provided, or should Dawnscroll select a specific KJV edition policy?
5. What is the preferred default reader landing passage: Genesis 1, John 1, or a resumable user-specific location in a later release?
6. Should search use exact KJV spelling only, or support modern spelling aliases in a later enhancement?

---

## 16. Source Material Traceability

- `.planning/dawnscroll-plan.md` identifies the Bible Reader as V1 core priority and KJV as the best public-domain option in the translation hierarchy.
- `.planning/dawnscroll-backlog.md` provides the atomic Bible data, reader navigation, reading view, and search tasks that this PRD narrows to KJV only.
- `.planning/dawnscroll-jira-v1-plan.md` frames the broader V1 Bible Reader epic and acceptance expectations for import, navigation, rendering, and search.
- `.agents/product/prd-writer.md` requires goals, non-goals, requirements, acceptance criteria, dependencies, and risks.
- `.agents/product/mvp-scope-agent.md` supports cutting speculative scope while preserving core product value.
- `.agents/bible-data/*` requires source approval, license review, normalization, citation/source metadata, and data QA.
- `.agents/software/bible-data-engineer.md` requires repeatable import pipelines, validation reports, and source metadata mappings.
- `.agents/design/reader-ux-agent.md` requires a comfortable, calm reader that protects scripture from clutter.
