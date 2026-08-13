---
name: grind
description: Work through Dawnscroll board tickets end-to-end, one at a time — understand, research, build, verify, PR, merge, next — until the target epic is done or a blocker needs the user.
---

# Grind: ticket-by-ticket delivery loop

Work through GitHub issues on ChristopherJacoby/dawn-scroll one ticket at a
time, fully shipping each before starting the next. The user has standing
approval for the full loop including merge — do not pause to ask between
tickets. Stop only for genuine blockers or scope decisions.

## Pick the next ticket

1. `gh issue list --state open` filtered to the target epic label (default:
   the epic named by the user; otherwise lowest-numbered open DS ticket not
   blocked by a prerequisite epic).
2. Skip tickets blocked by unbuilt prerequisites (e.g. anything needing auth
   before Epic 3 ships) — note them for the end-of-run report.

## Per-ticket loop

1. **Understand** — read the issue body, the matching entry in
   `.planning/dawnscroll-backlog.md`, and any relevant PRD in `.planning/`.
2. **Research** — read the code you'll touch first. This project runs
   Next.js 16: consult `node_modules/next/dist/docs/` before using any
   API you haven't verified in this repo (per AGENTS.md — training-data
   knowledge of Next.js is stale). Use a research agent for open questions.
3. **Branch** — `DS-{number}/short-description` off freshly-pulled `main`.
4. **Build** — follow design conventions in AGENTS.md: reading-mode tokens,
   `cn()` for classnames, components in `src/components/{ui,layout,...}`,
   restrained radii, Radix only for behavior-heavy components. Match the
   new React hooks lint rules (no sync setState in effects; prefer derived
   state or `useSyncExternalStore`).
5. **Tests as needed** — logic gets unit tests; pure presentation gets
   browser verification instead. Don't force tests where a browser check
   proves more.
6. **Verify** — `npm run lint`, `npx tsc --noEmit`, `npm run build`, then
   drive the real app: preview server config "dev" (`.claude/launch.json`),
   exercise the feature in the browser including error/empty states, and
   check the Next dev overlay for hydration issues.
7. **Ship** — commit (imperative summary; NEVER a Co-Authored-By trailer),
   push, `gh pr create` with body starting "Closes #<issue>", wait for
   checks, `gh pr merge --merge --delete-branch`, pull `main`.
8. **Next** — go to step 1. Give the user a one-paragraph progress note
   between tickets, not a report.

## Stop conditions

- Target epic's unblocked tickets are all merged → final report: shipped
  list, skipped/blocked list with reasons, suggested next epic.
- A ticket needs a product decision, credentials, paid service, or schema
  migration on production → stop and ask, with your recommendation.
- CI fails twice on the same PR after a fix attempt → stop and report.

## Environment notes

- Supabase free tier auto-pauses after ~1 week idle; if queries fail with
  DNS errors, the user must restore the project in the Supabase dashboard.
- Remote DB changes go through `npx supabase db push` (migrations) and
  `npx supabase db query --file` (data, ≤~2MB per request — chunk larger
  files at statement boundaries).
