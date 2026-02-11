"use client";

import { useState } from "react";
import { X, Sparkles, Clock, Send } from "lucide-react";

interface FollowUpTimerModalProps {
    emailId: string;
    emailTitle: string;
    emailDescription: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function FollowUpTimerModal({
    emailId,
    emailTitle,
    emailDescription,
    isOpen,
    onClose,
    onSave,
}: FollowUpTimerModalProps) {
    const [followUpDays, setFollowUpDays] = useState(3);
    const [previewDraft, setPreviewDraft] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handlePreviewDraft = async () => {
        setPreviewLoading(true);
        try {
            const res = await fetch("/api/email/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    originalSubject: emailTitle.replace("Follow up: ", ""),
                    originalSnippet: emailDescription || "",
                    daysSinceLastEmail: followUpDays,
                    previousAttempts: 0,
                }),
            });
            const data = await res.json();
            setPreviewDraft(data.draft?.body || "Unable to generate preview");
        } catch (error) {
            console.error("Error previewing draft:", error);
            setPreviewDraft("Error generating preview");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`/api/reminders/${emailId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    followUpDays,
                    autoFollowUp: true,
                }),
            });
            onSave();
            onClose();
        } catch (error) {
            console.error("Error saving follow-up settings:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            AI Auto-Follow-Up
                        </h2>
                        <p className="text-sm text-gray-400">
                            Set a timer to automatically draft follow-up emails using AI
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Email Context */}
                <div className="card bg-white/5 p-4 mb-6">
                    <div className="text-sm font-medium text-gray-300 mb-1">Email:</div>
                    <div className="font-medium mb-2">{emailTitle}</div>
                    {emailDescription && (
                        <div className="text-sm text-gray-400 line-clamp-2">
                            {emailDescription}
                        </div>
                    )}
                </div>

                {/* Timer Settings */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Follow-up Timer
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {[3, 5, 7, 14].map((days) => (
                            <button
                                key={days}
                                onClick={() => setFollowUpDays(days)}
                                className={`px-4 py-3 rounded-lg border transition-all ${followUpDays === days
                                        ? "border-primary bg-primary/20 text-white"
                                        : "border-white/10 hover:border-white/20"
                                    }`}
                            >
                                <div className="font-semibold">{days}</div>
                                <div className="text-xs text-gray-400">
                                    {days === 1 ? "day" : "days"}
                                </div>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        AI will draft a follow-up email if no response is received in{" "}
                        <span className="text-primary font-medium">{followUpDays} days</span>
                    </p>
                </div>

                {/* Preview Draft Button */}
                <div className="mb-6">
                    <button
                        onClick={handlePreviewDraft}
                        disabled={previewLoading}
                        className="btn btn-secondary text-sm w-full"
                    >
                        {previewLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Generating Preview...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Preview AI Draft
                            </>
                        )}
                    </button>
                </div>

                {/* Draft Preview */}
                {previewDraft && (
                    <div className="mb-6">
                        <div className="text-sm font-medium mb-2">AI Draft Preview:</div>
                        <div className="card bg-white/5 p-4">
                            <div className="text-sm text-gray-300 whitespace-pre-wrap">
                                {previewDraft}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            ℹ️ The actual draft will be personalized based on timing and context
                        </p>
                    </div>
                )}

                {/* How It Works */}
                <div className="card bg-blue-500/10 border-blue-500/20 p-4 mb-6">
                    <div className="text-sm font-medium mb-2">How it works:</div>
                    <ul className="text-xs text-gray-400 space-y-1">
                        <li>✓ Timer starts from when you set it</li>
                        <li>✓ AI will draft a personalized follow-up after {followUpDays} days</li>
                        <li>✓ You'll be notified to review before sending</li>
                        <li>✓ If no response, intervals increase automatically (3d → 6d → 12d)</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="btn btn-ghost flex-1"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary flex-1"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Enable Auto-Follow-Up
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
