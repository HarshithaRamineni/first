import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { getOrCreateUser } from "@/lib/db";
import { getGmailAccessToken, fetchRecentEmails } from "@/lib/gmail";

export async function GET(request: NextRequest) {
    try {
        // Verify the user is authenticated
        const token = request.cookies.get("firebase-auth-token")?.value;
        if (!token) {
            console.log("[Gmail Emails API] No auth token cookie");
            return NextResponse.json({ error: "Unauthorized", debug: "no_cookie" }, { status: 401 });
        }

        const decoded = await verifyIdToken(token);
        if (!decoded?.email) {
            console.log("[Gmail Emails API] Invalid token");
            return NextResponse.json({ error: "Unauthorized", debug: "invalid_token" }, { status: 401 });
        }

        const user = await getOrCreateUser(decoded);
        if (!user) {
            console.log("[Gmail Emails API] User not found");
            return NextResponse.json({ error: "User not found", debug: "no_user" }, { status: 404 });
        }

        console.log("[Gmail Emails API] User:", user.id, "Email:", decoded.email);

        // Get Gmail access token
        const accessToken = await getGmailAccessToken(user.id as string);
        if (!accessToken) {
            console.log("[Gmail Emails API] No Gmail access token for user:", user.id);
            return NextResponse.json({
                emails: [],
                error: "Gmail not connected. Please sign out and sign in again with Google.",
                debug: "no_access_token",
            });
        }

        console.log("[Gmail Emails API] Got access token, length:", accessToken.length);

        // Fetch recent emails
        const { searchParams } = new URL(request.url);
        const maxResults = parseInt(searchParams.get("limit") || "20");

        console.log("[Gmail Emails API] Fetching up to", maxResults, "emails...");
        const result = await fetchRecentEmails(accessToken, maxResults);
        console.log("[Gmail Emails API] Result: emails:", result.emails.length, "error:", result.error || "none");

        if (result.error === "TOKEN_EXPIRED") {
            return NextResponse.json({
                emails: [],
                error: "Gmail token expired. Please sign out and sign in again with Google.",
                debug: "token_expired",
            });
        }

        return NextResponse.json({
            emails: result.emails,
            count: result.emails.length,
            error: result.error || null,
            debug: `fetched_${result.emails.length}_emails`,
        });
    } catch (error: any) {
        console.error("[Gmail Emails API] Error:", error?.message || error);
        return NextResponse.json(
            { error: "Failed to fetch emails", emails: [], debug: `exception: ${error?.message}` },
            { status: 500 }
        );
    }
}
