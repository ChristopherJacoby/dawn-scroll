# KJV import pipeline

The KJV import pipeline is intentionally repeatable and auditable:

1. Read `data/kjv/source-manifest.json` for the upstream source, license statement, attribution, access date, and optional pinned checksum.
2. Download the Project Gutenberg plain-text source into `data/kjv/raw/kjv-gutenberg-10.txt`.
3. Normalize text to Unicode NFC with LF newlines and collapsed verse whitespace.
4. Parse canonical 66-book KJV verse references from `chapter:verse` lines.
5. Validate 66 books, 1,189 chapters, and 31,102 verses, plus the manifest checksum when `expectedSha256` is set.
6. Emit:
   - `data/kjv/kjv.normalized.json` for application/import tooling.
   - `data/kjv/kjv.seed.sql` for Supabase loading.
   - `data/kjv/validation-report.json` for audit evidence.

Run:

```bash
npm run import:kjv
```

For parser smoke tests against a small fixture (skips full-canon totals):

```bash
node scripts/import-kjv.mjs --input data/kjv/fixtures/kjv-sample.txt --allow-partial
```

For deterministic re-runs against a previously downloaded source:

```bash
node scripts/import-kjv.mjs --from-cache
```

The configured source is Project Gutenberg eBook #10, whose catalog documents the title, language, release/update history, and public-domain status in the United States. Do not replace the source without updating the manifest with source, license, attribution, and checksum details.
