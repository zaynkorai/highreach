"use client";

import { useState } from "react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    formId: string;
}

export function ShareModal({ isOpen, onClose, formId }: ShareModalProps) {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedEmbed, setCopiedEmbed] = useState(false);

    if (!isOpen) return null;

    // Assuming localhost for dev, but in prod this would be absolute URL
    const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/f/${formId}`;
    const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;

    const copyToClipboard = (text: string, isEmbed: boolean) => {
        navigator.clipboard.writeText(text);
        if (isEmbed) {
            setCopiedEmbed(true);
            setTimeout(() => setCopiedEmbed(false), 2000);
        } else {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] w-full max-w-md rounded-2xl shadow-xl p-6 relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl font-bold text-foreground mb-4">Share Form</h2>

                <div className="space-y-6">
                    {/* Public Link */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                            Public Link
                        </label>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={publicUrl}
                                className="flex-1 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 focus:outline-none"
                            />
                            <button
                                onClick={() => copyToClipboard(publicUrl, false)}
                                className="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                            >
                                {copiedLink ? "Copied!" : "Copy Link"}
                            </button>
                        </div>
                    </div>

                    {/* Embed Code */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                            Embed Code
                        </label>
                        <div className="relative">
                            <textarea
                                readOnly
                                value={embedCode}
                                rows={3}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 focus:outline-none font-mono resize-none"
                            />
                            <button
                                onClick={() => copyToClipboard(embedCode, true)}
                                className="absolute bottom-2 right-2 px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 rounded text-xs font-medium transition-colors shadow-sm"
                            >
                                {copiedEmbed ? "Copied!" : "Copy Code"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
