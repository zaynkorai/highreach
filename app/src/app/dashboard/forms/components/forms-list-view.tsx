"use client";

import { useState } from "react";
import { Form, FormWithStats } from "@/types/form";
import { CreateFormModal } from "./create-form-modal";
import Link from "next/link";

interface FormsListViewProps {
    initialForms: FormWithStats[];
}

export function FormsListView({ initialForms }: FormsListViewProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [forms] = useState(initialForms); // In real app use useEffect to sync with props if we had realtime

    const totalViews = forms.reduce((acc, f) => acc + (f.views || 0), 0);
    const totalSubmissions = forms.reduce((acc, f) => acc + (f.submissions_count || 0), 0);
    const avgConversion = totalViews > 0 ? ((totalSubmissions / totalViews) * 100).toFixed(1) + "%" : "0%";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Forms</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Create and manage forms to capture leads.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Form
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
                    <div className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Total Views</div>
                    <div className="text-2xl font-bold text-foreground dark:text-white">{totalViews}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
                    <div className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Total Submissions</div>
                    <div className="text-2xl font-bold text-foreground dark:text-white">{totalSubmissions}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
                    <div className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Avg. Conversion</div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{avgConversion}</div>
                </div>
            </div>

            {/* Forms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                    <Link key={form.id} href={`/dashboard/forms/${form.id}`} className="block">
                        <div className="group h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-md dark:shadow-none cursor-pointer flex flex-col">
                            <div className="p-6 border-b border-zinc-100 dark:border-white/[0.08] group-hover:bg-emerald-50/10 transition-colors flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.status === "active"
                                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400"
                                        }`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${form.status === "active"
                                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                                            : "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:border-white/10"
                                        }`}>
                                        {form.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{form.name}</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{form.description || "No description"}</p>
                            </div>
                            <div className="px-6 py-4 bg-zinc-50/50 dark:bg-white/[0.02]">
                                <div className="flex justify-between text-sm">
                                    <div>
                                        <span className="text-zinc-500 dark:text-zinc-400 block text-xs mb-0.5">Views</span>
                                        <span className="font-semibold text-foreground dark:text-white">{form.views || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 dark:text-zinc-400 block text-xs mb-0.5">Submissions</span>
                                        <span className="font-semibold text-foreground dark:text-white">{form.submissions_count || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 dark:text-zinc-400 block text-xs mb-0.5">Conversion</span>
                                        <span className="font-semibold text-foreground dark:text-white">
                                            {form.views ? ((form.submissions_count / form.views) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Create New Card (Trigger) */}
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-all group h-full min-h-[220px]"
                >
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-center mb-4 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-white">Create New Form</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Start from scratch</span>
                </button>
            </div>

            <CreateFormModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </div>
    );
}
