"use client";

import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime } from "@/lib/utils";
import {
    Bell,
    Mail,
    Github,
    CheckCircle2,
    Clock,
    TrendingUp,
    ArrowUpRight,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
    pendingReminders: number;
    completedReminders: number;
    integrations: number;
    activities: number;
}

interface Reminder {
    id: string;
    type: string;
    title: string;
    description: string | null;
    dueAt: string;
    priority: string;
    status: string;
}

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const [stats, setStats] = useState<Stats>({ pendingReminders: 0, completedReminders: 0, integrations: 0, activities: 0 });
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;

            try {
                const res = await fetch("/api/reminders?status=pending");
                const data = await res.json();
                setReminders(data.reminders?.slice(0, 5) || []);
                setStats({
                    pendingReminders: data.reminders?.filter((r: Reminder) => r.status === "pending").length || 0,
                    completedReminders: 0,
                    integrations: 0,
                    activities: 0,
                });
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setDataLoading(false);
            }
        }

        if (user) {
            fetchData();
        } else {
            setDataLoading(false);
        }
    }, [user]);

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
                <h1 className="text-2xl font-bold mb-2">
                    Welcome back, {user?.displayName?.split(" ")[0] || "there"}!
                </h1>
                <p className="text-gray-400">
                    Here's what's happening with your automations.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card glass-light">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                            Pending
                        </span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.pendingReminders}</div>
                    <div className="text-sm text-gray-400">Pending Reminders</div>
                </div>

                <div className="card glass-light">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                            Done
                        </span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.completedReminders}</div>
                    <div className="text-sm text-gray-400">Completed This Month</div>
                </div>

                <div className="card glass-light">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.integrations}</div>
                    <div className="text-sm text-gray-400">Active Integrations</div>
                </div>

                <div className="card glass-light">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-accent" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stats.activities}</div>
                    <div className="text-sm text-gray-400">Recent Activities</div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Upcoming Reminders */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold">Upcoming Reminders</h2>
                        <Link href="/dashboard/reminders" className="text-sm text-primary hover:underline flex items-center gap-1">
                            View all <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {reminders.length > 0 ? (
                        <div className="space-y-4">
                            {reminders.map((reminder) => (
                                <div key={reminder.id} className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${reminder.type === "email_followup" ? "bg-red-500/10" :
                                            reminder.type === "pr_review" ? "bg-purple-500/10" : "bg-primary/10"
                                        }`}>
                                        {reminder.type === "email_followup" ? (
                                            <Mail className="w-5 h-5 text-red-400" />
                                        ) : reminder.type === "pr_review" ? (
                                            <Github className="w-5 h-5 text-purple-400" />
                                        ) : (
                                            <Bell className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{reminder.title}</div>
                                        <div className="text-sm text-gray-400 truncate">{reminder.description}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Due {formatRelativeTime(reminder.dueAt)}
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded-full ${reminder.priority === "urgent" ? "bg-red-500/10 text-red-400" :
                                            reminder.priority === "high" ? "bg-orange-500/10 text-orange-400" :
                                                "bg-gray-500/10 text-gray-400"
                                        }`}>
                                        {reminder.priority}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No pending reminders</p>
                            <p className="text-sm mt-1">Connect your integrations to get started</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-6">Quick Actions</h2>
                    <div className="space-y-4">
                        <Link href="/dashboard/integrations" className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Mail className="w-5 h-5 text-red-400" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">Connect Gmail</div>
                                <div className="text-sm text-gray-400">Track email follow-ups automatically</div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        </Link>

                        <Link href="/dashboard/integrations" className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Github className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">Connect GitHub</div>
                                <div className="text-sm text-gray-400">Monitor PRs and issues</div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        </Link>

                        <Link href="/dashboard/reminders" className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Bell className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">Create Reminder</div>
                                <div className="text-sm text-gray-400">Set a custom reminder for any task</div>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
