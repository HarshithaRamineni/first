import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import {
    Bell,
    Mail,
    Github,
    CheckCircle2,
    Clock,
    XCircle,
    Filter,
    Plus
} from "lucide-react";

export const metadata = {
    title: "Reminders | AiXOps",
};

async function getReminders(userId: string) {
    return db.reminder.findMany({
        where: { userId },
        orderBy: [
            { status: "asc" },
            { dueAt: "asc" },
        ],
    });
}

export default async function RemindersPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return null;
    }

    const reminders = await getReminders(userId);

    const pendingReminders = reminders.filter((r) => r.status === "pending");
    const completedReminders = reminders.filter((r) => r.status === "completed");

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Reminders</h1>
                    <p className="text-gray-400">
                        Manage your follow-ups and tasks in one place.
                    </p>
                </div>
                <button className="btn btn-gradient">
                    <Plus className="w-4 h-4" />
                    New Reminder
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="card glass-light p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div>
                            <div className="text-xl font-bold">{pendingReminders.length}</div>
                            <div className="text-xs text-gray-400">Pending</div>
                        </div>
                    </div>
                </div>
                <div className="card glass-light p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                            <div className="text-xl font-bold">{completedReminders.length}</div>
                            <div className="text-xs text-gray-400">Completed</div>
                        </div>
                    </div>
                </div>
                <div className="card glass-light p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <div className="text-xl font-bold">{reminders.length}</div>
                            <div className="text-xs text-gray-400">Total</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reminders List */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">All Reminders</h2>
                    <button className="btn btn-ghost text-sm">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>

                {reminders.length > 0 ? (
                    <div className="space-y-4">
                        {reminders.map((reminder) => (
                            <div
                                key={reminder.id}
                                className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${reminder.status === "completed"
                                        ? "bg-white/5 opacity-60"
                                        : "bg-white/5 hover:bg-white/10"
                                    }`}
                            >
                                {/* Status Icon */}
                                <button className="mt-1">
                                    {reminder.status === "completed" ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-500 hover:border-primary transition-colors" />
                                    )}
                                </button>

                                {/* Type Icon */}
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

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium ${reminder.status === "completed" ? "line-through" : ""}`}>
                                        {reminder.title}
                                    </div>
                                    {reminder.description && (
                                        <div className="text-sm text-gray-400 truncate mt-1">
                                            {reminder.description}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span>Due: {formatDate(reminder.dueAt)}</span>
                                        {reminder.sourceUrl && (
                                            <a
                                                href={reminder.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                View source
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Priority Badge */}
                                <div className={`text-xs px-2 py-1 rounded-full ${reminder.priority === "urgent" ? "bg-red-500/10 text-red-400" :
                                        reminder.priority === "high" ? "bg-orange-500/10 text-orange-400" :
                                            reminder.priority === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                                                "bg-gray-500/10 text-gray-400"
                                    }`}>
                                    {reminder.priority}
                                </div>

                                {/* Actions */}
                                <button className="btn btn-ghost text-xs px-2 py-1">
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No reminders yet</p>
                        <p className="text-sm mt-1">
                            Connect your integrations to get automatic reminders, or create one manually.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
