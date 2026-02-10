"use client";

import { useAuth } from "@/lib/auth-context";
import { Mail, Github, CheckCircle2, XCircle, ArrowUpRight, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface Integration {
    id: string;
    type: string;
    enabled: boolean;
    lastSyncAt: string | null;
}

export default function IntegrationsPage() {
    const { user, loading } = useAuth();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);

    useEffect(() => {
        async function fetchIntegrations() {
            if (!user) return;
            try {
                const res = await fetch("/api/integrations");
                const data = await res.json();
                setIntegrations(data.integrations || []);
            } catch (error) {
                console.error("Error fetching integrations:", error);
            } finally {
                setDataLoading(false);
            }
        }

        if (user) {
            fetchIntegrations();
        } else {
            setDataLoading(false);
        }
    }, [user]);

    const handleConnect = async (type: "gmail" | "github") => {
        try {
            const res = await fetch("/api/integrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, enabled: true }),
            });
            const data = await res.json();
            if (data.integration) {
                setIntegrations(prev => {
                    const existing = prev.find(i => i.type === type);
                    if (existing) {
                        return prev.map(i => i.type === type ? data.integration : i);
                    }
                    return [...prev, data.integration];
                });
            }
        } catch (error) {
            console.error("Error connecting integration:", error);
        }
    };

    const handleSync = async (type: string) => {
        setSyncing(type);
        try {
            if (type === "gmail") {
                // Use dedicated Gmail sync endpoint
                const syncRes = await fetch("/api/gmail/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });
                const syncData = await syncRes.json();

                if (syncData.error) {
                    alert(syncData.error);
                } else if (syncData.remindersCreated > 0) {
                    alert(`Synced! Created ${syncData.remindersCreated} new follow-up reminder(s).`);
                }
            } else {
                // Generic sync for other integrations
                await fetch("/api/integrations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type, enabled: true }),
                });
            }
            // Refresh integrations to update lastSyncAt
            const res = await fetch("/api/integrations");
            const data = await res.json();
            setIntegrations(data.integrations || []);
        } catch (error) {
            console.error("Error syncing:", error);
        } finally {
            setSyncing(null);
        }
    };

    const gmailIntegration = integrations.find(i => i.type === "gmail");
    const githubIntegration = integrations.find(i => i.type === "github");

    if (loading || dataLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Integrations</h1>
                <p className="text-gray-400">
                    Connect your accounts to enable automatic tracking and reminders.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Gmail Integration */}
                <div className="card">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Gmail</h3>
                                <p className="text-sm text-gray-400">Email follow-up tracking</p>
                            </div>
                        </div>
                        {gmailIntegration?.enabled ? (
                            <span className="flex items-center gap-1 text-sm text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" />
                                Connected
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-sm text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full">
                                <XCircle className="w-4 h-4" />
                                Not Connected
                            </span>
                        )}
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        AiXOps can monitor your Gmail for unanswered emails and remind you to follow up.
                        We only read email metadata, never the content.
                    </p>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-300">Features:</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Automatic follow-up detection
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Smart reminder scheduling
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Thread-based tracking
                            </li>
                        </ul>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5">
                        {gmailIntegration?.enabled ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">
                                    {gmailIntegration.lastSyncAt
                                        ? `Last synced: ${new Date(gmailIntegration.lastSyncAt).toLocaleString()}`
                                        : "Ready to sync"
                                    }
                                </span>
                                <button
                                    onClick={() => handleSync("gmail")}
                                    disabled={syncing === "gmail"}
                                    className="btn btn-secondary text-sm"
                                >
                                    {syncing === "gmail" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    Sync Now
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleConnect("gmail")}
                                className="btn btn-primary w-full"
                            >
                                Enable Gmail Integration
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* GitHub Integration */}
                <div className="card">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Github className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">GitHub</h3>
                                <p className="text-sm text-gray-400">PR and issue tracking</p>
                            </div>
                        </div>
                        {githubIntegration?.enabled ? (
                            <span className="flex items-center gap-1 text-sm text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" />
                                Connected
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-sm text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full">
                                <XCircle className="w-4 h-4" />
                                Not Connected
                            </span>
                        )}
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Track pull requests awaiting review, stale issues, and your assigned tasks.
                        Get reminded before things slip through the cracks.
                    </p>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-300">Features:</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                PR review reminders
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Stale issue detection
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Assigned task tracking
                            </li>
                        </ul>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5">
                        {githubIntegration?.enabled ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">
                                    {githubIntegration.lastSyncAt
                                        ? `Last synced: ${new Date(githubIntegration.lastSyncAt).toLocaleString()}`
                                        : "Ready to sync"
                                    }
                                </span>
                                <button
                                    onClick={() => handleSync("github")}
                                    disabled={syncing === "github"}
                                    className="btn btn-secondary text-sm"
                                >
                                    {syncing === "github" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    Sync Now
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleConnect("github")}
                                className="btn btn-primary w-full"
                            >
                                Enable GitHub Integration
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
