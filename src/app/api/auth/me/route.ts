import { getUser } from "@/lib/auth";

/** Verified current user, or 401. Used by the account UI and for auth checks. */
export async function GET() {
    const user = await getUser();
    if (!user) {
        return Response.json({ user: null }, { status: 401 });
    }
    return Response.json({
        user: { id: user.id, email: user.email, createdAt: user.created_at },
    });
}
