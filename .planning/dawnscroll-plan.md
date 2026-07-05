# Dawnscroll — App Planning Document
*Last updated: May 2026*

---

## Vision

A truth-first Bible platform that goes beyond scripture reading to bring archaeological proof, original language scholarship, AI-powered historical context, and honest examination of how traditions drifted from God's word. Built for believers, skeptics, and everyone in between — with a single conviction: the truth speaks for itself.

---

## Name

**Dawnscroll** — locked. Domain secured (dawnscroll.com). Dawn = light breaking through the darkness of false tradition, the illumination that comes from restored knowledge. Scroll = ancient manuscripts, Dead Sea Scrolls, the biblical scroll, the reading experience. Together: the ancient word that brings dawn to those dying from lack of knowledge (Hosea 4:6).

---

## Seven Pillars — Feature Set

### 1. Bible Reader (V1 — core priority)
- Public domain translations: KJV, ASV, YLT, WEB
- Chapter and verse navigation
- Full-text search across all versions
- Bookmarks, highlights, notes
- Reading plans and daily reading tracker
- Side-by-side version comparison (V2)
- Audio Bible (V2)
- Offline access (premium)

Long-term goal: Commission a scholarly English rendering directly from original manuscripts as the flagship Original Text version. This becomes the default premium experience.

Translation hierarchy:
1. Original Hebrew/Greek/Aramaic — gold standard
2. English rendering of the original (goal to build toward)
3. KJV — best public domain option, noted as imperfect
4. ASV, YLT, WEB — supplemental

---

### 2. Archaeological Evidence (V1)
- Inline dig deeper triggers on relevant passages
- Full exploration hub — browse all findings globally
- Interactive map with archaeological site markers
- Photos, satellite imagery, discovery timelines
- Credibility rating per finding
- Source citations for every entry

Launch content priorities:
- Red Sea chariot wheel formations (Exodus 14)
- Sodom and Gomorrah site — Tall el-Hammam
- Ark of the Covenant research
- Jericho walls excavation
- Exodus route archaeology

Sourcing:
- Phase 1: Public domain academic papers, documentaries, open university archaeology departments
- Phase 2: Partnerships with ministries like Associates for Biblical Research
- Phase 3: Own research team if growth justifies

---

### 3. AI Chat + Apostle Mode (V4 — last feature)

Scholar mode:
- Historical customs, laws, and traditions of biblical eras
- Passage-aware — knows what the user is currently reading
- Bible-first, historical record second
- Cites specific passages and sources
- Educational, not denominational

Apostle mode:
- Available figures: Peter, Andrew, James, John, Philip, Bartholomew, Matthew, Thomas, James son of Alphaeus, Thaddaeus, Simon the Zealot, Paul
- Strictly within their own timeline and knowledge — no awareness of the modern world
- They do not know their letters become scripture
- They do not know the future of the church
- Blocked: Jesus, God, Holy Spirit — treated with reverence, never roleplayed

AI chat phasing:
- V4 Phase 1: Historical and cultural context only
- V4 Phase 2: Faith and theological questions
- V4 Phase 3: Prophecy and doctrine discussion

---

### 4. Original Language Layer (V1)
- Tap any word — original Hebrew or Greek — literal meaning — translation drift notes
- Strong's Concordance integration
- Interlinear view (V2)
- Root word explorer (V2)
- Audio pronunciation (V2)
- Dead Sea Scrolls and Septuagint references (V3)

Data sources: OpenScriptures, Strong's Concordance (public domain JSON), public domain interlinear Bibles

---

### 5. Bible Shorts + Story Time (V2-V3)

Story Time (V3 — premium):
- Cinematic narration of scripture passages
- AI or professional voice with ambient sound design

Bible Shorts (V2):
- AI-generated short-form illustrated video stories
- Scrollable faith content feed
- Shareable clips, series, playlists

---

### 6. Roots (V1)
Trace any tradition, holiday, or practice back to its historical origins and compare against scripture. Educational, sourced, cited — the facts speak for themselves.

Each entry includes:
- The tradition's documented historical origin
- Timeline of how it entered Christian practice
- Specific scripture that addresses it
- Early church comparison — what believers in 30-100 AD actually practiced

Launch content: Halloween, Christmas, Easter traditions, Sunday worship origins, Catholic Church founding history (Simon Magus / Acts 8 connection)

Tone: Present documented history and let the reader draw their own conclusions. Never editorial — always sourced.

---

### 7. Hard Questions (V1)
Confident, sourced, intellectually serious answers to the biggest challenges to faith.

Launch content:
- Intelligent design — the scientific case
- DNA complexity and information theory (Stephen Meyer)
- Irreducible complexity (Michael Behe)
- The Cambrian explosion
- Fine-tuning argument
- Origin of life problem
- Evolution and the something-from-nothing cosmological argument

Tone: Confident, evidence-first, never defensive. Cite credentialed scientists and philosophers.

---

## Content Strategy

| Content Type         | Source                              | Cost          |
|----------------------|-------------------------------------|---------------|
| Bible translations   | Public domain JSON                  | Free          |
| Hebrew/Greek data    | OpenScriptures                      | Free/open source |
| Strong's data        | Public domain JSON                  | Free          |
| Archaeological content | Public research, documentaries    | Free to start |
| AI knowledge         | Claude API + RAG pipeline           | Pay per use   |
| Maps                 | Mapbox                              | Free tier     |
| Media/photos         | Cloudinary                          | Free tier     |

---

## Branding

### Color Palette
| Name        | Hex     | Use                          |
|-------------|---------|------------------------------|
| Stone night | #2C2016 | Primary dark — icon background |
| Dark clay   | #5C4A2A | Secondary dark               |
| Bronze      | #A07840 | Accent mid                   |
| Sand        | #C9A96E | Icon symbol, highlights      |
| Parchment   | #EDD9A3 | Light accent                 |
| Linen       | #F7F0DF | Reading backgrounds          |
| Sage        | #4A5E4A | Secondary colorway background |

### Icon
- Primary: Dark stone (#2C2016) + Ayin in sand/bronze (#C9A96E)
- Secondary: Sage (#4A5E4A) + Ayin in bronze (#C9A96E)
- Ayin is the Hebrew letter meaning eye — sight, perception, seeing truth others miss

### Tagline Candidates
- "The word. As it was written." (frontrunner)
- "Before the translations. Before the traditions."
- "Truth. Origin. Proof."

### Voice and Tone
Uncompromising, Ancient authority, Evidence-first, Reverent, Eye-opening, No ads, No compromise

---

## Tech Stack

### Frontend
- Next.js 14 — React framework, app router, server components
- TypeScript — type safety across the codebase
- Tailwind CSS — utility-first styling

### Backend and Database
- Supabase — Postgres, auth, file storage, real-time, pgvector for RAG
- Next.js API routes — serverless backend

### AI Layer
- Claude API — Scholar mode, Apostle mode, Hard Questions
- System prompts — character and content grounding per mode
- RAG pipeline (pgvector) — responses grounded in curated Bible texts, Strong's data, archaeological records

### Bible and Language Data
- Public domain Bible texts (KJV, ASV, YLT, WEB) in JSON stored in Supabase
- OpenScriptures — morphologically tagged Hebrew OT and Greek NT
- Strong's Concordance — complete word definitions in JSON

### Maps and Media
- Mapbox — archaeological maps, ancient routes, satellite imagery. 50k free loads/month
- Cloudinary — media hosting, auto-optimization, global CDN. 25GB free

### Deployment and Mobile
- Vercel — Next.js hosting, global CDN, preview deployments. Free tier
- GitHub + Actions — version control, automated CI/CD
- Capacitor — wraps web app into native iOS and Android. No rewrite required

### Bootstrap Cost Estimate
| Service      | Free Tier                  | Paid Threshold  |
|--------------|----------------------------|-----------------|
| Vercel       | Launch through early growth | ~$20/mo        |
| Supabase     | 50k MAU, 500MB DB          | ~$25/mo         |
| Mapbox       | 50k map loads/mo           | Pay per load    |
| Cloudinary   | 25GB storage/bandwidth     | ~$89/mo         |
| Claude API   | Pay per use                | ~$0.01-0.05/conv|
| Total        | ~$20/month at launch       |                 |

---

## Monetization

### Model: Free core + paid premium

Free tier — Truth:
- Full Bible reader — all public domain translations
- Original language — tap any word for Hebrew/Greek meaning
- Inline archaeology triggers
- Roots section
- Hard Questions
- Bookmarks, highlights, reading plans

Premium tier — Dawnscroll:
- Everything in free
- Apostle mode — 12 apostles + Paul
- Scholar AI chat — unlimited
- Full archaeology hub — maps, photos, timelines
- Story Time — cinematic narration (V3)
- Bible Shorts feed (V2)
- Offline access

Pricing: $7.99/month or $64.99/year (~32% annual discount)

7-day free trial on premium recommended.

### Guiding Principles
1. Scripture is never paywalled — every word of God is free to every person
2. Premium pays for AI compute and development time — not for access to truth
3. No ads. Ever.
4. Price low enough that cost is never the reason someone does not upgrade

---

## Platform Strategy
- Launch: Web app first (Next.js)
- Mobile: Capacitor wrapper for iOS and Android — no rewrite
- Audience: Believers, serious students, skeptics, curious non-believers

---

## Version Roadmap

| Feature           | V1 (Sep 2026)   | V2                  | V3               | V4 (last)            |
|-------------------|-----------------|---------------------|------------------|----------------------|
| Bible reader      | Core            | Side-by-side, audio | —                | —                    |
| Original language | Word tap        | Interlinear, roots  | Dead Sea Scrolls | —                    |
| Roots             | Full            | —                   | —                | —                    |
| Hard Questions    | Full            | —                   | —                | —                    |
| Archaeology       | Inline triggers | Full hub + video    | 3D models, AR    | —                    |
| Mobile (Capacitor)| —               | iOS + Android       | —                | —                    |
| Bible Shorts      | —               | —                   | Full feed        | Series, playlists    |
| Story Time        | —               | —                   | —                | Premium              |
| AI Scholar chat   | —               | —                   | —                | History → Theology → Prophecy |
| Apostle mode      | —               | —                   | —                | 12 + Paul, save/share|

### Launch Strategy

AI Chat and Apostle Mode are intentionally held until V4 — the last major feature set. The app needs to establish credibility and a large user base on uncontroversial, evidence-based content before introducing AI-generated character interactions that will attract theological criticism. This is a safety-first decision: let the reputation form, let the content library mature, and let the community grow — then ship the controversial features from a position of strength with established trust.

---

*Document generated during planning session — Claude.ai*
