// Temporary route to verify Supabase connectivity. Remove before production.
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase.from("_test").select("*").limit(1);

    // PGRST200 = table not found in schema cache — connection works, table just doesn't exist yet
    if (error && error.code !== "42P01" && error.code !== "PGRST200") {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, connected: true });
}
