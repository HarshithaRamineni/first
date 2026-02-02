import { db } from "@/lib/db";

interface GitHubPR {
    id: number;
    number: number;
    title: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    user: { login: string };
    requested_reviewers: { login: string }[];
    draft: boolean;
}

interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    user: { login: string };
    assignees: { login: string }[];
    state: string;
}

export async function getGitHubAccessToken(userId: string): Promise<string | null> {
    const account = await db.account.findFirst({
        where: { userId, provider: "github" },
    });

    return account?.access_token || null;
}

export async function fetchGitHubUser(accessToken: string): Promise<{ login: string } | null> {
    try {
        const response = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        });
        return response.json();
    } catch (error) {
        console.error("Error fetching GitHub user:", error);
        return null;
    }
}

export async function fetchPRsAwaitingReview(
    accessToken: string,
    username: string
): Promise<GitHubPR[]> {
    try {
        // Search for PRs where the user is requested as a reviewer
        const response = await fetch(
            `https://api.github.com/search/issues?q=is:pr+is:open+review-requested:${username}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error fetching PRs for review:", error);
        return [];
    }
}

export async function fetchAssignedIssues(
    accessToken: string,
    username: string
): Promise<GitHubIssue[]> {
    try {
        const response = await fetch(
            `https://api.github.com/search/issues?q=is:issue+is:open+assignee:${username}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error fetching assigned issues:", error);
        return [];
    }
}

export async function fetchStalePRs(
    accessToken: string,
    username: string,
    staleDays = 5
): Promise<GitHubPR[]> {
    try {
        const staleDate = new Date();
        staleDate.setDate(staleDate.getDate() - staleDays);
        const dateStr = staleDate.toISOString().split("T")[0];

        const response = await fetch(
            `https://api.github.com/search/issues?q=is:pr+is:open+author:${username}+updated:<${dateStr}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        );

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Error fetching stale PRs:", error);
        return [];
    }
}

export async function createGitHubReminders(userId: string): Promise<number> {
    const accessToken = await getGitHubAccessToken(userId);
    if (!accessToken) {
        console.log("No GitHub access token for user:", userId);
        return 0;
    }

    const user = await fetchGitHubUser(accessToken);
    if (!user) {
        console.log("Could not fetch GitHub user info");
        return 0;
    }

    let created = 0;

    // Fetch PRs awaiting review
    const prsToReview = await fetchPRsAwaitingReview(accessToken, user.login);
    for (const pr of prsToReview) {
        const existing = await db.reminder.findFirst({
            where: {
                userId,
                sourceId: `pr-${pr.id}`,
                status: "pending",
            },
        });

        if (!existing) {
            await db.reminder.create({
                data: {
                    userId,
                    type: "pr_review",
                    title: `Review PR: ${pr.title}`,
                    description: `PR #${pr.number} by ${pr.user.login}`,
                    sourceId: `pr-${pr.id}`,
                    sourceUrl: pr.html_url,
                    dueAt: new Date(), // Due immediately
                    priority: "high",
                },
            });
            created++;
        }
    }

    // Fetch stale PRs authored by user
    const stalePRs = await fetchStalePRs(accessToken, user.login);
    for (const pr of stalePRs) {
        const existing = await db.reminder.findFirst({
            where: {
                userId,
                sourceId: `stale-pr-${pr.id}`,
                status: "pending",
            },
        });

        if (!existing) {
            await db.reminder.create({
                data: {
                    userId,
                    type: "pr_review",
                    title: `Stale PR: ${pr.title}`,
                    description: `Your PR #${pr.number} hasn't been updated in 5+ days`,
                    sourceId: `stale-pr-${pr.id}`,
                    sourceUrl: pr.html_url,
                    dueAt: new Date(),
                    priority: "medium",
                },
            });
            created++;
        }
    }

    // Fetch assigned issues
    const assignedIssues = await fetchAssignedIssues(accessToken, user.login);
    for (const issue of assignedIssues) {
        const createdDate = new Date(issue.created_at);
        const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

        // Only create reminder for issues older than 7 days
        if (daysSinceCreated > 7) {
            const existing = await db.reminder.findFirst({
                where: {
                    userId,
                    sourceId: `issue-${issue.id}`,
                    status: "pending",
                },
            });

            if (!existing) {
                await db.reminder.create({
                    data: {
                        userId,
                        type: "issue_stale",
                        title: `Stale Issue: ${issue.title}`,
                        description: `Issue #${issue.number} assigned to you for ${Math.floor(daysSinceCreated)} days`,
                        sourceId: `issue-${issue.id}`,
                        sourceUrl: issue.html_url,
                        dueAt: new Date(),
                        priority: "low",
                    },
                });
                created++;
            }
        }
    }

    // Update integration last sync time
    await db.integration.updateMany({
        where: { userId, type: "github" },
        data: { lastSyncAt: new Date() },
    });

    return created;
}
