"use client";

import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime } from "@/lib/utils";
import {
    Mail,
    ExternalLink,
    Clock,
    CheckCircle2,
    Loader2,
    RefreshCw,
    AlertCircle,
    Zap,
    Inbox,
    Send,
    MailOpen,
    Star
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import FollowUpTimerModal from "./FollowUpTimerModal";

interface EmailReminder {
    id: string;
    type: string;
    title: string;
    description: string | null;
    dueAt: string;
    priority: string;
    status: string;
    sourceUrl: string | null;
    createdAt: string;
    autoFollowUp?: boolean;
    followUpDays?: number;
    nextFollowUpAt?: string;
}

interface GmailEmail {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    snippet: string;
    isRead: boolean;
    labelIds: string[];
}

type TabType = "inbox" | "followups";

export default function EmailsPage() {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("inbox");
    const [emails, setEmails] = useState<GmailEmail[]>([]);
    const [followUps, setFollowUps] = useState<EmailReminder[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEmail, setSelectedEmail] = useState<EmailReminder | null>(null);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);

    const fetchInboxEmails = async () => {
        if (!user) return;

        try {
            console.log("[EmailsPage] Fetching inbox emails...");
            const res = await fetch("/api/gmail/emails?limit=20");
            const data = await res.json();
            console.log("[EmailsPage] Gmail emails API response:", JSON.stringify(data).slice(0, 500));

            if (data.error) {
                console.error("[EmailsPage] Gmail API error:", data.error);
                setError(data.error);
                setEmails([]);
                setDebugInfo(`Error: ${data.error} | Debug: ${data.debug || 'none'} | Status: ${res.status}`);
            } else {
                const fetchedEmails = data.emails || [];
                console.log("[EmailsPage] Fetched", fetchedEmails.length, "emails");
                setEmails(fetchedEmails);
                setDebugInfo(`Fetched ${fetchedEmails.length} emails | Debug: ${data.debug || 'none'} | Status: ${res.status}`);
                if (fetchedEmails.length > 0) {
                    setError(null);
                }
            }
        } catch (error) {
            console.error("Error fetching emails:", error);
            setError("Failed to load emails from Gmail");
            setDebugInfo(`Catch error: ${error}`);
        }
    };

    const fetchFollowUps = async () => {
        if (!user) return;

        try {
            const res = await fetch("/api/reminders?type=email_followup");
            const data = await res.json();
            setFollowUps(data.reminders || []);
        } catch (error) {
            console.error("Error fetching follow-ups:", error);
        }
    };

    useEffect(() => {
        if (user) {
            Promise.all([fetchInboxEmails(), fetchFollowUps()]).finally(() => {
                setDataLoading(false);
            });
        } else {
            setDataLoading(false);
        }
    }, [user]);

    const handleSync = async () => {
        setSyncing(true);
        setError(null);
        try {
            // Sync follow-up reminders
            const syncRes = await fetch("/api/gmail/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const syncData = await syncRes.json();

            if (syncData.error) {
                setError(syncData.error);
            }

            // Also refresh inbox emails
            await Promise.all([fetchInboxEmails(), fetchFollowUps()]);

            if (!syncData.error) {
                if (syncData.remindersCreated > 0) {
                    setError(`✓ Synced! Found ${syncData.remindersCreated} new follow-up(s)`);
                } else {
                    setError("✓ Emails synced successfully!");
                }
            }
        } catch (error) {
            console.error("Error syncing:", error);
            setError("Failed to sync Gmail. Please try again.");
        } finally {
            setSyncing(false);
        }
    };

    const handleMarkComplete = async (reminderId: string) => {
        try {
            await fetch(`/api/reminders/${reminderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "completed" }),
            });
            await fetchFollowUps();
        } catch (error) {
            console.error("Error marking email complete:", error);
        }
    };

    const parseFromField = (from: string): { name: string; email: string } => {
        const match = from.match(/^(.+?)\s*<(.+?)>$/);
        if (match) {
            return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
        }
        return { name: from, email: from };
    };

    const getInitials = (name: string): string => {
        return name
            .split(" ")
            .map((w) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    if (loading || dataLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const pendingFollowUps = followUps.filter((e) => e.status === "pending");
    const completedFollowUps = followUps.filter((e) => e.status === "completed");
    const unreadCount = emails.filter((e) => !e.isRead).length;

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Email Follow-ups</h1>
                <p className="text-gray-400">
                    Track emails that need your attention and never miss a follow-up.
                </p>
            </div>

            {/* Debug Info */}
            {debugInfo && (
                <div className="mb-4 card p-3 border-yellow-500/50 text-xs text-yellow-300 font-mono">
                    🔍 Debug: {debugInfo}
                </div>
            )}

            {/* Sync Bar */}
            <div className="mb-6 flex items-center justify-between card p-4">
                <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-red-400" />
                    <div>
                        <div className="font-medium">Gmail Integration</div>
                        <div className="text-sm text-gray-400">
                            {emails.length > 0
                                ? `${emails.length} emails · ${unreadCount} unread · ${pendingFollowUps.length} follow-ups`
                                : "Click Sync Now to load your emails"}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="btn btn-primary"
                >
                    {syncing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Syncing...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Sync Now
                        </>
                    )}
                </button>
            </div>

            {/* Error/Success Message */}
            {error && (
                <div className={`mb-6 card p-4 ${error.startsWith("✓") ? "border-green-500/50" : "border-red-500/50"}`}>
                    <div className="flex items-center gap-2">
                        {error.startsWith("✓") ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <p className={error.startsWith("✓") ? "text-green-400" : "text-red-400"}>
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1 w-fit">
                <button
                    onClick={() => setActiveTab("inbox")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "inbox"
                        ? "bg-primary text-white"
                        : "text-gray-400 hover:text-white"
                        }`}
                >
                    <Inbox className="w-4 h-4" />
                    Recent Emails
                    {emails.length > 0 && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                            {emails.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("followups")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "followups"
                        ? "bg-primary text-white"
                        : "text-gray-400 hover:text-white"
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Follow-ups
                    {pendingFollowUps.length > 0 && (
                        <span className="bg-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full text-xs">
                            {pendingFollowUps.length}
                        </span>
                    )}
                </button>
            </div>

            {/* INBOX TAB */}
            {activeTab === "inbox" && (
                <>
                    {emails.length === 0 && !syncing ? (
                        <div className="card p-12 text-center">
                            <Mail className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                            <h3 className="text-xl font-semibold mb-2">No Emails Yet</h3>
                            <p className="text-gray-400 mb-6">
                                Click &quot;Sync Now&quot; to fetch your recent emails from Gmail.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button onClick={handleSync} disabled={syncing} className="btn btn-primary">
                                    <RefreshCw className="w-4 h-4" />
                                    Sync Now
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {emails.map((email) => {
                                const { name, email: addr } = parseFromField(email.from);
                                const isSent = email.labelIds?.includes("SENT");
                                const isStarred = email.labelIds?.includes("STARRED");
                                const dateStr = (() => {
                                    try {
                                        return formatRelativeTime(new Date(email.date).toISOString());
                                    } catch {
                                        return email.date;
                                    }
                                })();

                                return (
                                    <div
                                        key={email.id}
                                        className={`card p-4 hover:border-primary/50 transition-all cursor-pointer ${!email.isRead ? "border-l-2 border-l-primary bg-primary/5" : ""
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Avatar */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium ${!email.isRead
                                                ? "bg-gradient-to-br from-primary to-accent text-white"
                                                : "bg-white/10 text-gray-400"
                                                }`}>
                                                {isSent ? (
                                                    <Send className="w-4 h-4" />
                                                ) : (
                                                    getInitials(name)
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-sm ${!email.isRead ? "font-semibold text-white" : "text-gray-300"}`}>
                                                        {isSent ? `To: ${email.to?.split("<")[0]?.trim() || email.to}` : name}
                                                    </span>
                                                    {isStarred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                                                    {!email.isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                                    )}
                                                </div>
                                                <h3 className={`text-sm mb-1 ${!email.isRead ? "font-medium text-white" : "text-gray-300"}`}>
                                                    {email.subject}
                                                </h3>
                                                <p className="text-xs text-gray-500 line-clamp-1">
                                                    {email.snippet}
                                                </p>
                                            </div>

                                            {/* Meta */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-xs text-gray-500">{dateStr}</span>
                                                <a
                                                    href={`https://mail.google.com/mail/u/0/#inbox/${email.threadId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-ghost text-xs p-1.5"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* FOLLOW-UPS TAB */}
            {activeTab === "followups" && (
                <>
                    {pendingFollowUps.length === 0 && completedFollowUps.length === 0 && (
                        <div className="card p-12 text-center">
                            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500/30" />
                            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                            <p className="text-gray-400 mb-6">
                                No emails need follow-up right now. We check for sent emails older than 3 days with no reply.
                            </p>
                            <button onClick={handleSync} disabled={syncing} className="btn btn-secondary">
                                <RefreshCw className="w-4 h-4" />
                                Check Again
                            </button>
                        </div>
                    )}

                    {/* Pending Follow-ups */}
                    {pendingFollowUps.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                Pending Follow-ups ({pendingFollowUps.length})
                            </h2>
                            <div className="space-y-3">
                                {pendingFollowUps.map((email) => (
                                    <div
                                        key={email.id}
                                        className="card p-4 hover:border-primary/50 transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                                <Mail className="w-5 h-5 text-red-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium mb-1">{email.title}</h3>
                                                {email.description && (
                                                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                                                        {email.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span>Sent {formatRelativeTime(email.createdAt)}</span>
                                                    <span className={`px-2 py-1 rounded-full ${email.priority === "high"
                                                        ? "bg-orange-500/10 text-orange-400"
                                                        : "bg-gray-500/10 text-gray-400"
                                                        }`}>
                                                        {email.priority}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!email.autoFollowUp && (
                                                    <button
                                                        onClick={() => setSelectedEmail(email)}
                                                        className="btn btn-ghost text-sm"
                                                        title="Set AI Auto-Follow-Up"
                                                    >
                                                        <Zap className="w-4 h-4" />
                                                        Auto-Follow
                                                    </button>
                                                )}
                                                {email.autoFollowUp && email.nextFollowUpAt && (
                                                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Zap className="w-3 h-3" />
                                                        {formatRelativeTime(email.nextFollowUpAt)}
                                                    </div>
                                                )}
                                                {email.sourceUrl && (
                                                    <a
                                                        href={email.sourceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-ghost text-sm"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Open
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleMarkComplete(email.id)}
                                                    className="btn btn-secondary text-sm"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Follow-ups */}
                    {completedFollowUps.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                Completed ({completedFollowUps.length})
                            </h2>
                            <div className="space-y-3">
                                {completedFollowUps.slice(0, 5).map((email) => (
                                    <div
                                        key={email.id}
                                        className="card p-4 opacity-60"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium mb-1 line-through">{email.title}</h3>
                                                <div className="text-xs text-gray-500">
                                                    Completed {formatRelativeTime(email.dueAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Follow-Up Timer Modal */}
            {selectedEmail && (
                <FollowUpTimerModal
                    emailId={selectedEmail.id}
                    emailTitle={selectedEmail.title}
                    emailDescription={selectedEmail.description || ""}
                    isOpen={!!selectedEmail}
                    onClose={() => setSelectedEmail(null)}
                    onSave={() => {
                        setSelectedEmail(null);
                        fetchFollowUps();
                    }}
                />
            )}
        </div>
    );
}
