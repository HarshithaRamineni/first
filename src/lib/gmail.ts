import { getDb } from "./firebase-admin";
import { createReminder, findReminderBySourceId, updateIntegrationSync } from "./db";

interface GmailMessage {
    id: string;
    threadId: string;
    snippet: string;
    labelIds: string[];
    internalDate: string;
}

interface GmailThread {
    id: string;
    messages: GmailMessage[];
}

/**
 * Refresh a Google OAuth access token using the refresh token.
 */
async function refreshGoogleAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number } | null> {
    try {
        // Use GOOGLE_CLIENT_ID (server-side env var, matching .env)
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        console.log("[Gmail] Attempting token refresh. Client ID available:", !!clientId, "Client Secret available:", !!clientSecret);

        if (!clientId || !clientSecret) {
            console.error("[Gmail] Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env");
            return null;
        }

        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Gmail] Token refresh failed:", response.status, errorText);
            return null;
        }

        const data = await response.json();
        console.log("[Gmail] Token refresh successful");
        return {
            accessToken: data.access_token,
            expiresIn: data.expires_in || 3600,
        };
    } catch (error) {
        console.error("[Gmail] Error refreshing token:", error);
        return null;
    }
}

/**
 * Get the stored Google OAuth access token for a user from Firestore.
 * Automatically refreshes the token if it has expired.
 */
export async function getGmailAccessToken(userId: string): Promise<string | null> {
    try {
        const db = getDb();
        const accountDoc = await db.collection("accounts").doc(`${userId}_google`).get();

        if (!accountDoc.exists) {
            console.log("[Gmail] No Google account found for user:", userId);
            console.log("[Gmail] Looking for document:", `${userId}_google`);
            return null;
        }

        const data = accountDoc.data();
        console.log("[Gmail] Account data found. Has accessToken:", !!data?.accessToken, "Has refreshToken:", !!data?.refreshToken, "ExpiresAt:", data?.expiresAt);

        if (!data?.accessToken) {
            console.log("[Gmail] No access token stored for user:", userId);
            return null;
        }

        // Check if token has expired
        const now = new Date();
        const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

        // If token is not expired, return it
        if (expiresAt && expiresAt > now) {
            console.log("[Gmail] Access token still valid, expires at:", expiresAt.toISOString());
            return data.accessToken;
        }

        console.log("[Gmail] Access token expired or no expiry set. Expired at:", expiresAt?.toISOString() || "unknown");

        // If token is expired and we have a refresh token, refresh it
        if (data.refreshToken) {
            console.log("[Gmail] Attempting refresh with refresh token...");
            const refreshed = await refreshGoogleAccessToken(data.refreshToken);

            if (refreshed) {
                // Update the stored access token
                const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString();
                await accountDoc.ref.update({
                    accessToken: refreshed.accessToken,
                    expiresAt: newExpiresAt,
                    updatedAt: new Date().toISOString(),
                });

                console.log("[Gmail] Access token refreshed successfully, new expiry:", newExpiresAt);
                return refreshed.accessToken;
            } else {
                console.log("[Gmail] Token refresh failed, trying expired token as fallback...");
                // Fall through to return the expired token
            }
        } else {
            console.log("[Gmail] No refresh token available");
        }

        // Return the (possibly expired) access token as a last resort
        // The Gmail API call will fail with 401 if it's truly expired
        console.log("[Gmail] Returning existing access token (may be expired)");
        return data.accessToken;
    } catch (error) {
        console.error("[Gmail] Error getting access token:", error);
        return null;
    }
}

/**
 * Fetch recent sent Gmail threads using the Gmail API.
 */
export async function fetchGmailThreads(
    accessToken: string,
    maxResults = 20
): Promise<GmailThread[]> {
    try {
        // Get threads that might need follow-up (sent by user, no reply)
        const listResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}&q=in:sent -in:trash`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        if (!listResponse.ok) {
            const errText = await listResponse.text();
            console.error("[Gmail] List threads failed:", listResponse.status, errText);
            if (listResponse.status === 401) {
                throw new Error("TOKEN_EXPIRED");
            }
            return [];
        }

        const listData = await listResponse.json();

        if (!listData.threads) {
            console.log("[Gmail] No threads found");
            return [];
        }

        // Fetch full thread data for each (limit to 10 for performance)
        const threads = await Promise.all(
            listData.threads.slice(0, 10).map(async (thread: { id: string }) => {
                const threadResponse = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}?format=metadata`,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                );
                return threadResponse.json();
            })
        );

        return threads;
    } catch (error) {
        console.error("[Gmail] Error fetching threads:", error);
        throw error;
    }
}

/**
 * Fetch recent inbox emails with full metadata (subject, from, date, snippet).
 */
export async function fetchRecentEmails(
    accessToken: string,
    maxResults = 20
): Promise<{
    emails: {
        id: string;
        threadId: string;
        subject: string;
        from: string;
        to: string;
        date: string;
        snippet: string;
        isRead: boolean;
        labelIds: string[];
    }[];
    error?: string;
}> {
    try {
        // Fetch recent messages from the inbox
        const listResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=-in:trash -in:spam`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        if (!listResponse.ok) {
            const errText = await listResponse.text();
            console.error("[Gmail] List messages failed:", listResponse.status, errText);
            if (listResponse.status === 401) {
                return { emails: [], error: "TOKEN_EXPIRED" };
            }
            return { emails: [], error: `Gmail API error: ${listResponse.status}` };
        }

        const listData = await listResponse.json();

        if (!listData.messages || listData.messages.length === 0) {
            console.log("[Gmail] No messages found");
            return { emails: [] };
        }

        // Fetch metadata for each message
        const emails = await Promise.all(
            listData.messages.slice(0, maxResults).map(async (msg: { id: string; threadId: string }) => {
                try {
                    const msgResponse = await fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
                        {
                            headers: { Authorization: `Bearer ${accessToken}` },
                        }
                    );

                    if (!msgResponse.ok) return null;

                    const msgData = await msgResponse.json();
                    const headers = msgData.payload?.headers || [];

                    const getHeader = (name: string) =>
                        headers.find((h: { name: string; value: string }) =>
                            h.name.toLowerCase() === name.toLowerCase()
                        )?.value || "";

                    return {
                        id: msgData.id,
                        threadId: msgData.threadId,
                        subject: getHeader("Subject") || "(No Subject)",
                        from: getHeader("From"),
                        to: getHeader("To"),
                        date: getHeader("Date") || new Date(parseInt(msgData.internalDate)).toISOString(),
                        snippet: msgData.snippet || "",
                        isRead: !(msgData.labelIds || []).includes("UNREAD"),
                        labelIds: msgData.labelIds || [],
                    };
                } catch (err) {
                    console.error("[Gmail] Error fetching message:", msg.id, err);
                    return null;
                }
            })
        );

        const validEmails = emails.filter(Boolean);
        console.log(`[Gmail] Fetched ${validEmails.length} recent emails`);

        return { emails: validEmails as any };
    } catch (error) {
        console.error("[Gmail] Error fetching recent emails:", error);
        return { emails: [], error: "Failed to fetch emails" };
    }
}

/**
 * Analyze threads and identify ones where the user sent the last message
 * and hasn't received a reply in 3+ days.
 */
export function identifyFollowUpNeeded(threads: GmailThread[]): {
    threadId: string;
    subject: string;
    lastMessageDate: Date;
    snippet: string;
}[] {
    const followUps: {
        threadId: string;
        subject: string;
        lastMessageDate: Date;
        snippet: string;
    }[] = [];

    for (const thread of threads) {
        if (!thread.messages || thread.messages.length === 0) continue;

        const lastMessage = thread.messages[thread.messages.length - 1];
        const lastMessageDate = new Date(parseInt(lastMessage.internalDate));

        // Check if the last message was sent by the user (in SENT folder)
        // and is older than 3 days
        const daysSinceLastMessage = (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastMessage >= 3 && lastMessage.labelIds?.includes("SENT")) {
            followUps.push({
                threadId: thread.id,
                subject: lastMessage.snippet?.slice(0, 100) || "No subject",
                lastMessageDate,
                snippet: lastMessage.snippet || "",
            });
        }
    }

    return followUps;
}

/**
 * Main sync function: fetches Gmail threads, identifies follow-ups,
 * and creates reminders in Firestore.
 */
export async function createEmailFollowUpReminders(userId: string): Promise<{
    created: number;
    error?: string;
}> {
    const accessToken = await getGmailAccessToken(userId);
    if (!accessToken) {
        console.log("[Gmail Sync] No access token for user:", userId);
        return { created: 0, error: "No Gmail access token. Please sign in with Google again." };
    }

    try {
        const threads = await fetchGmailThreads(accessToken);
        console.log(`[Gmail Sync] Fetched ${threads.length} threads for user ${userId}`);

        const followUps = identifyFollowUpNeeded(threads);
        console.log(`[Gmail Sync] Found ${followUps.length} threads needing follow-up`);

        let created = 0;
        for (const followUp of followUps) {
            // Check if reminder already exists for this thread
            const existing = await findReminderBySourceId(userId, followUp.threadId);

            if (!existing) {
                await createReminder({
                    userId,
                    type: "email_followup",
                    title: `Follow up: ${followUp.subject}`,
                    description: followUp.snippet,
                    dueAt: new Date().toISOString(),
                    priority: "medium",
                    sourceId: followUp.threadId,
                    sourceUrl: `https://mail.google.com/mail/u/0/#inbox/${followUp.threadId}`,
                });
                created++;
            }
        }

        // Update integration last sync time
        await updateIntegrationSync(userId, "gmail");

        console.log(`[Gmail Sync] Created ${created} new reminders for user ${userId}`);
        return { created };
    } catch (error: any) {
        if (error.message === "TOKEN_EXPIRED") {
            return { created: 0, error: "Gmail token expired. Please sign in with Google again." };
        }
        console.error("[Gmail Sync] Error:", error);
        return { created: 0, error: "Failed to sync Gmail" };
    }
}
