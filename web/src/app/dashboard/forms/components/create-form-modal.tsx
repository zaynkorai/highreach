"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createForm } from "../actions";
import { toast } from "sonner";

interface CreateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateFormModal({ isOpen, onClose }: CreateFormModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selection, setSelection] = useState<'scratch' | 'templates'>('scratch');
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selection === 'templates') {
            toast.info("Templates functionality is coming soon!");
            return;
        }

        setIsLoading(true);

        try {
            const result = await createForm(name || "New Form", description);
            if (result.success && result.data) {
                toast.success("Form created successfully!");
                onClose();
                router.push(`/dashboard/forms/${result.data.id}`); // Redirect to builder
            } else {
                toast.error(result.error || "Failed to create form");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] w-full max-w-3xl rounded-2xl shadow-xl p-0 relative animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Create New Form</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Selection Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* Scratch Card */}
                        <div
                            onClick={() => setSelection('scratch')}
                            className={`relative cursor-pointer group border-2 rounded-xl p-6 transition-all ${selection === 'scratch'
                                ? 'border-brand-500 bg-brand-50/10'
                                : 'border-zinc-200 dark:border-white/10 hover:border-brand-500/50 hover:bg-zinc-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </div>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selection === 'scratch' ? 'border-brand-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                    {selection === 'scratch' && <div className="w-2.5 h-2.5 bg-brand-500 rounded-full" />}
                                </div>
                            </div>
                            <h3 className="font-bold text-foreground mb-1">Start from Scratch</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Design from scratch using the form builder</p>
                        </div>

                        {/* Templates Card */}
                        <div
                            onClick={() => setSelection('templates')}
                            className={`relative cursor-pointer group border-2 rounded-xl p-0 overflow-hidden transition-all ${selection === 'templates'
                                ? 'border-brand-500'
                                : 'border-zinc-200 dark:border-white/10 hover:border-brand-500/50'
                                }`}
                        >
                            <div className="absolute top-4 right-4 z-10">
                                <div className={`w-5 h-5 rounded-full border bg-white dark:bg-zinc-800 flex items-center justify-center ${selection === 'templates' ? 'border-brand-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                    {selection === 'templates' && <div className="w-2.5 h-2.5 bg-brand-500 rounded-full" />}
                                </div>
                            </div>
                            <div className="h-32 bg-zinc-100 dark:bg-zinc-800 relative">
                                {/* Abstract representation of templates */}
                                <div className="absolute inset-0 opacity-50 flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-2 p-4 rotate-12 scale-110 opacity-60">
                                        <div className="w-16 h-20 bg-white dark:bg-zinc-700 rounded shadow-sm border border-zinc-200 dark:border-white/5"></div>
                                        <div className="w-16 h-20 bg-white dark:bg-zinc-700 rounded shadow-sm border border-zinc-200 dark:border-white/5 mt-4"></div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent"></div>
                                <div className="absolute bottom-4 left-6">
                                    <span className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-semibold px-2 py-1 rounded shadow-sm">100+ Templates</span>
                                </div>
                            </div>
                            <div className="p-6 pt-4">
                                <h3 className="font-bold text-foreground mb-1">From Templates</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Jump start with an awesome prebuilt form</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Details (Condition: Only show if scratch selected for now, or always show? 
                        Ref image implies selection first. Let's keep input inputs but make them subtle or below) */}
                    {selection === 'scratch' && (
                        <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                                        Form Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Website Contact Form"
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                                        Description <span className="text-zinc-400 font-normal lowercase">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Internal notes..."
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isLoading ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
