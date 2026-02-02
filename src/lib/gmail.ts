import { db } from "@/lib/db";

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

export async function getGmailAccessToken(userId: string): Promise<string | null> {
    const account = await db.account.findFirst({
        where: { userId, provider: "google" },
    });

    if (!account?.access_token) {
        return null;
    }

    // Check if token is expired and refresh if needed
    if (account.expires_at && account.expires_at * 1000 < Date.now()) {
        if (!account.refresh_token) {
            return null;
        }

        try {
            const response = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID!,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                    refresh_token: account.refresh_token,
                    grant_type: "refresh_token",
                }),
            });

            const tokens = await response.json();

            if (tokens.access_token) {
                await db.account.update({
                    where: { id: account.id },
                    data: {
                        access_token: tokens.access_token,
                        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
                    },
                });
                return tokens.access_token;
            }
        } catch (error) {
            console.error("Failed to refresh Google token:", error);
            return null;
        }
    }

    return account.access_token;
}

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

        const listData = await listResponse.json();

        if (!listData.threads) {
            return [];
        }

        // Fetch full thread data for each
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
        console.error("Error fetching Gmail threads:", error);
        return [];
    }
}

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

export async function createEmailFollowUpReminders(userId: string): Promise<number> {
    const accessToken = await getGmailAccessToken(userId);
    if (!accessToken) {
        console.log("No Gmail access token for user:", userId);
        return 0;
    }

    const threads = await fetchGmailThreads(accessToken);
    const followUps = identifyFollowUpNeeded(threads);

    let created = 0;
    for (const followUp of followUps) {
        // Check if reminder already exists for this thread
        const existing = await db.reminder.findFirst({
            where: {
                userId,
                sourceId: followUp.threadId,
                status: "pending",
            },
        });

        if (!existing) {
            await db.reminder.create({
                data: {
                    userId,
                    type: "email_followup",
                    title: `Follow up: ${followUp.subject}`,
                    description: followUp.snippet,
                    sourceId: followUp.threadId,
                    sourceUrl: `https://mail.google.com/mail/u/0/#inbox/${followUp.threadId}`,
                    dueAt: new Date(), // Due immediately
                    priority: "medium",
                },
            });
            created++;
        }
    }

    // Update integration last sync time
    await db.integration.updateMany({
        where: { userId, type: "gmail" },
        data: { lastSyncAt: new Date() },
    });

    return created;
}
