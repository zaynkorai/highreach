"use client";

import React from "react";
import { useKnowledgeStore } from "@/stores/knowledge-store";
import { X, Layers, Hash, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ChunksInspectorModal() {
    const { isChunksModalOpen, selectedSourceWithChunks, closeChunksModal } = useKnowledgeStore();

    if (!isChunksModalOpen) return null;

    const source = selectedSourceWithChunks?.source;
    const chunks = selectedSourceWithChunks?.chunks || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-white/[0.08] flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-foreground">
                                {source?.title || "Knowledge Chunks Inspector"}
                            </h2>
                            <Badge
                                variant="secondary"
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border-none"
                            >
                                {chunks.length} Chunks Indexed
                            </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Semantic embeddings stored in PostgreSQL `pgvector` with 1536 dimensions and cosine distance ops.
                        </p>
                    </div>
                    <button
                        onClick={closeChunksModal}
                        className="p-2 rounded-xl text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Chunks List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chunks.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400 text-sm">
                            <Layers className="w-6 h-6 animate-pulse mx-auto mb-2 text-primary" />
                            Loading chunk vectors...
                        </div>
                    ) : (
                        chunks.map((chunk, idx) => (
                            <div
                                key={chunk.id || idx}
                                className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-white/[0.06] space-y-2"
                            >
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="flex items-center gap-1.5 text-foreground">
                                        <Hash className="w-3.5 h-3.5 text-primary" />
                                        Chunk #{idx + 1}
                                    </span>
                                    <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                                        <span>~{chunk.tokenCount ?? 0} tokens</span>
                                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="w-3 h-3" />
                                            1536-dim vector active
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-white/[0.04] text-xs font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {chunk.content}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-100 dark:border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
                    <span>Target chunk size: ~500 chars with 60 chars semantic overlap</span>
                    <button
                        onClick={closeChunksModal}
                        className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
