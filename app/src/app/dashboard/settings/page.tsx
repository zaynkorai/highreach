"use client";

import { useState } from "react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("organization");

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Manage your account settings and preferences.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-1">
                    <button
                        onClick={() => setActiveTab("organization")}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "organization"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground"
                            }`}
                    >
                        Organization Profile
                    </button>
                    <button
                        onClick={() => setActiveTab("account")}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "account"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground"
                            }`}
                    >
                        Account & Security
                    </button>
                    <button
                        onClick={() => setActiveTab("billing")}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "billing"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground"
                            }`}
                    >
                        Billing & Plans
                    </button>
                    <button
                        onClick={() => setActiveTab("integrations")}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "integrations"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground"
                            }`}
                    >
                        Integrations
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/[0.08] flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02]">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Organization Profile</h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Update your company details and contact info.</p>
                            </div>
                            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-emerald-500/20 active:scale-95">
                                Save Changes
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Logo Upload */}
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-white/5 border-2 border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <button className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">Upload new logo</button>
                                    <p className="text-xs text-zinc-500 mt-1">Recommended size: 512x512px. JPG or PNG.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Business Name</label>
                                    <input
                                        type="text"
                                        defaultValue="Mike's Plumbing"
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Website</label>
                                    <input
                                        type="url"
                                        defaultValue="https://mikesplumbing.com"
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone Number</label>
                                    <input
                                        type="tel"
                                        defaultValue="+1 555 123 4567"
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                                    <input
                                        type="email"
                                        defaultValue="mike@mikesplumbing.com"
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Business Address</label>
                                <textarea
                                    defaultValue="123 Pipe Lane, Metropolis, NY 10012"
                                    rows={3}
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
