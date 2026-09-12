"use client";

import React, { useState, useEffect } from "react";
import { useKnowledgeStore } from "@/stores/knowledge-store";
import { Button } from "@/components/ui/button";
import { X, Layers, Info } from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeSourceType } from "@/lib/validations/knowledge";

export function AddSourceModal() {
    const { isAddModalOpen, editingSource, closeAddModal, createSource, updateSource } =
        useKnowledgeStore();

    const [title, setTitle] = useState("");
    const [sourceType, setSourceType] = useState<KnowledgeSourceType>("faq");
    const [rawContent, setRawContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingSource) {
            setTitle(editingSource.title);
            setSourceType(editingSource.sourceType as KnowledgeSourceType);
            setRawContent(editingSource.rawContent);
        } else {
            setTitle("");
            setSourceType("faq");
            setRawContent("");
        }
    }, [editingSource, isAddModalOpen]);

    if (!isAddModalOpen) return null;

    // Real-time chunk estimation
    const charCount = rawContent.trim().length;
    const estimatedTokens = Math.max(0, Math.ceil(charCount / 4));
    const estimatedChunks = charCount === 0 ? 0 : Math.max(1, Math.ceil(charCount / 450));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }
        if (rawContent.trim().length < 5) {
            toast.error("Content must be at least 5 characters");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingSource) {
                const ok = await updateSource(editingSource.id, {
                    title: title.trim(),
                    sourceType,
                    rawContent: rawContent.trim(),
                });
                if (ok) {
                    toast.success("Knowledge source updated and re-indexed");
                } else {
                    toast.error("Failed to update knowledge source");
                }
            } else {
                const ok = await createSource({
                    title: title.trim(),
                    sourceType,
                    rawContent: rawContent.trim(),
                });
                if (ok) {
                    toast.success("Knowledge source created and vectorized");
                } else {
                    toast.error("Failed to create knowledge source");
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-white/[0.08] flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            {editingSource ? "Edit Knowledge Source" : "Add Knowledge Source"}
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Grounded context will be automatically chunked and vectorized using pgvector (1536-dim).
                        </p>
                    </div>
                    <button
                        onClick={closeAddModal}
                        className="p-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            Source Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Standard Pricing Sheet, Roof Inspection FAQs, Return Policy"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/[0.08] text-sm text-foreground placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Source Type Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            Source Classification
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: "faq", label: "FAQ Item" },
                                { id: "service_catalog", label: "Service / Pricing" },
                                { id: "document", label: "Document" },
                                { id: "url", label: "Web Link / URL" },
                            ].map((type) => (
                                <button
                                    type="button"
                                    key={type.id}
                                    onClick={() => setSourceType(type.id as KnowledgeSourceType)}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                                        sourceType === type.id
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-zinc-200 dark:border-white/[0.08] text-zinc-500 hover:text-foreground"
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Raw Content Textarea */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                Raw Business Content <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[11px] text-zinc-400">
                                {charCount} characters
                            </span>
                        </div>
                        <textarea
                            rows={8}
                            placeholder="Paste your FAQ text, service description, terms, warranty clauses, or pricing breakdown here..."
                            value={rawContent}
                            onChange={(e) => setRawContent(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/[0.08] text-xs font-mono text-foreground placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-y leading-relaxed"
                        />
                    </div>

                    {/* Chunking Estimation Pill */}
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                            <Layers className="w-4 h-4 text-primary" />
                            <span>Estimated Vector Chunks:</span>
                            <span className="font-bold text-foreground">~{estimatedChunks} chunks</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                            <Info className="w-3.5 h-3.5" />
                            <span>Estimated Token Budget:</span>
                            <span className="font-bold text-foreground">~{estimatedTokens} tokens</span>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeAddModal}
                            disabled={isSubmitting}
                            className="text-xs font-semibold rounded-xl text-zinc-500"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || rawContent.trim().length < 5}
                            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs"
                        >
                            {isSubmitting
                                ? "Processing Vector Indexing..."
                                : editingSource
                                ? "Save Changes"
                                : "Vectorize & Save"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
