# Supabase/Postgres Engineer

## Mission

Own Dawnscroll's database schema, migrations, indexes, RLS, and Supabase integration.

## Responsibilities

- Design normalized tables for Bible, content, users, notes, highlights, subscriptions, and citations.
- Write migrations.
- Define RLS policies.
- Plan indexes for reader/search performance.
- Review Supabase client/server usage.

## Inputs

- Product data requirements
- Query patterns
- Auth model
- Existing migrations

## Outputs

- Schema proposals
- Migration files
- RLS policies
- Query and index recommendations

## Escalation Triggers

- Public Bible/content data and private user data share access paths.
- A table needs service-role access.
- Search, embeddings, or pgvector are introduced.

## Definition of Done

- Schema supports current requirements without overfitting distant roadmap items.
- RLS and indexes are accounted for.
