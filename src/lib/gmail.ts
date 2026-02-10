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
 * Get the stored Google OAuth access token for a user from Firestore.
 */
export async function getGmailAccessToken(userId: string): Promise<string | null> {
    try {
        const db = getDb();
        const accountDoc = await db.collection("accounts").doc(`${userId}_google`).get();

        if (!accountDoc.exists) {
            console.log("[Gmail] No Google account found for user:", userId);
            return null;
        }

        const data = accountDoc.data();
        if (!data?.accessToken) {
            console.log("[Gmail] No access token stored for user:", userId);
            return null;
        }

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
