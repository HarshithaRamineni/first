import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { User, Bell, Shield, Trash2 } from "lucide-react";

export const metadata = {
    title: "Settings | AiXOps",
};

async function getUserSettings(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            accounts: {
                select: { provider: true },
            },
        },
    });
    return user;
}

export default async function SettingsPage() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return null;
    }

    const user = await getUserSettings(userId);

    return (
        <div className="p-6 lg:p-8 max-w-3xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">Settings</h1>
                <p className="text-gray-400">
                    Manage your account and preferences.
                </p>
            </div>

            <div className="space-y-6">
                {/* Profile Section */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Profile</h2>
                    </div>

                    <div className="flex items-center gap-6 mb-6">
                        {user?.image ? (
                            <img
                                src={user.image}
                                alt={user.name || "User"}
                                className="w-20 h-20 rounded-full"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-2xl font-medium text-primary">
                                    {user?.name?.[0] || user?.email?.[0] || "U"}
                                </span>
                            </div>
                        )}
                        <div>
                            <div className="text-xl font-semibold">{user?.name || "Anonymous"}</div>
                            <div className="text-gray-400">{user?.email}</div>
                            <div className="text-sm text-gray-500 mt-1">
                                Member since {user?.createdAt.toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Display Name</label>
                            <input
                                type="text"
                                defaultValue={user?.name || ""}
                                className="input"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                defaultValue={user?.email || ""}
                                className="input"
                                disabled
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Email is managed by your OAuth provider
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Email Notifications</div>
                                <div className="text-sm text-gray-400">Receive reminder emails</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Daily Summary</div>
                                <div className="text-sm text-gray-400">Get a daily digest of your reminders</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Weekly Report</div>
                                <div className="text-sm text-gray-400">Weekly activity summary</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Connected Accounts */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Connected Accounts</h2>
                    </div>

                    <div className="space-y-4">
                        {user?.accounts.map((account) => (
                            <div key={account.provider} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${account.provider === "google" ? "bg-red-500/10" : "bg-purple-500/10"
                                        }`}>
                                        {account.provider === "google" ? "G" : "GH"}
                                    </div>
                                    <div>
                                        <div className="font-medium capitalize">{account.provider}</div>
                                        <div className="text-sm text-gray-400">Connected</div>
                                    </div>
                                </div>
                                <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                    Active
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="card border-red-500/20">
                    <div className="flex items-center gap-3 mb-6">
                        <Trash2 className="w-5 h-5 text-red-400" />
                        <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
                    </div>

                    <p className="text-gray-400 text-sm mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>

                    <button className="btn bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}
