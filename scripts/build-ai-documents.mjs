#!/usr/bin/env node
// Rebuilds the AI retrieval corpus (public.ai_documents) from the app's
// content: KJV verses, Strong's entries, findings, traditions and questions.
// Run it after any content migration; unchanged documents are left alone.
//
//   node --env-file=.env.local scripts/build-ai-documents.mjs

import { execFileSync } from "node:child_process";

const url = process.env.SUPABASE_DB_URL;
if (!url) throw new Error("Set SUPABASE_DB_URL.");

// Connection details go through PG* env vars, never argv, so a failure
// can't echo the password in an error message.
let db;
try {
    db = new URL(url);
} catch {
    // Node's URL error includes the input, i.e. the password.
    throw new Error(
        "SUPABASE_DB_URL is not a valid URL (percent-encode special characters in the password).",
    );
}
const env = {
    ...process.env,
    PGHOST: db.hostname,
    PGPORT: db.port || "5432",
    PGUSER: decodeURIComponent(db.username),
    PGPASSWORD: decodeURIComponent(db.password),
    PGDATABASE: db.pathname.slice(1) || "postgres",
    PGSSLMODE: db.searchParams.get("sslmode") ?? "require",
    ...(db.searchParams.get("sslrootcert") && {
        PGSSLROOTCERT: db.searchParams.get("sslrootcert"),
    }),
};

const sql = `
select public.refresh_ai_documents() as changed;
select source_type, count(*) as documents, count(embedding) as embedded
from public.ai_documents group by source_type order by source_type;
`;
try {
    execFileSync("psql", ["-X", "-f", "-"], {
        input: sql,
        env,
        stdio: ["pipe", "inherit", "inherit"],
    });
} catch {
    throw new Error("Refresh failed (see psql output above).");
}
