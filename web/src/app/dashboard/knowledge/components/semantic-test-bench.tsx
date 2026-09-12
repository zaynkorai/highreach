"use client";

import React from "react";
import { useKnowledgeStore } from "@/stores/knowledge-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Sparkles,
    Zap,
    Sliders,
    Layers,
    Clock,
    FileText,
    HelpCircle,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLE_QUERIES = [
    "What are your standard business and weekend hours?",
    "How much do your onboarding and service packages cost?",
    "What is included in your warranty or satisfaction guarantee?",
    "Do you offer emergency after-hours dispatch or support?",
];

export function SemanticTestBench() {
    const {
        testQuery,
        minSimilarity,
        testResults,
        isSearching,
        testSearchTimeMs,
        setTestQuery,
        setMinSimilarity,
        runSemanticSearch,
    } = useKnowledgeStore();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        runSemanticSearch();
    };

    const handleSampleClick = (query: string) => {
        setTestQuery(query);
        runSemanticSearch(query);
    };

    return (
        <div className="space-y-6">
            {/* Intro Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border border-primary/20 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
                                <Sparkles className="w-4 h-4" />
                            </span>
                            <h3 className="text-base font-bold text-foreground">
                                Interactive Semantic Retrieval Playground
                            </h3>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl">
                            Test natural language queries against your PostgreSQL `pgvector` knowledge base. Autonomous agents use this exact retrieval pipeline to ground responses in factual business truth.
                        </p>
                    </div>

                    {/* Similarity Threshold Control */}
                    <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs">
                        <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                            Min Similarity:
                        </div>
                        <span className="text-xs font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/10">
                            {Math.round(minSimilarity * 100)}%
                        </span>
                        <input
                            type="range"
                            min="0.3"
                            max="0.9"
                            step="0.05"
                            value={minSimilarity}
                            onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
                            className="w-24 accent-primary cursor-pointer"
                        />
                    </div>
                </div>

                {/* Query Input Form */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Type a customer question (e.g., 'What is your response time for emergency roof leaks?')..."
                            value={testQuery}
                            onChange={(e) => setTestQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-foreground placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-primary/20 shadow-xs"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isSearching || !testQuery.trim()}
                        className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-2 shrink-0 shadow-xs"
                    >
                        <Zap className="w-4 h-4" />
                        {isSearching ? "Searching Vectors..." : "Retrieve Chunks"}
                    </Button>
                </form>

                {/* Sample Query Chips */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Try Sample:
                    </span>
                    {SAMPLE_QUERIES.map((sample, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSampleClick(sample)}
                            className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:text-primary hover:border-primary/40 transition-all flex items-center gap-1 group shadow-2xs"
                        >
                            <span>{sample}</span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <span>Retrieved Context Chunks</span>
                        {testResults.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                {testResults.length} Matched
                            </span>
                        )}
                    </h4>

                    {testSearchTimeMs !== null && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Latency: {testSearchTimeMs}ms</span>
                        </div>
                    )}
                </div>

                {isSearching ? (
                    <div className="p-12 text-center text-zinc-400 text-sm rounded-3xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40">
                        <Zap className="w-6 h-6 animate-bounce mx-auto mb-2 text-primary" />
                        Evaluating pgvector cosine distance across knowledge vectors...
                    </div>
                ) : testResults.length === 0 ? (
                    <div className="p-12 rounded-3xl border border-dashed border-zinc-200 dark:border-white/[0.08] text-center space-y-2">
                        <HelpCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
                        <h5 className="text-sm font-bold text-foreground">
                            {testQuery ? "No chunks matched this query" : "No active query"}
                        </h5>
                        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                            {testQuery
                                ? `No knowledge chunks met the current similarity threshold (${Math.round(
                                      minSimilarity * 100
                                  )}%). Try lowering the threshold or refining your question.`
                                : "Enter a natural language question above to inspect grounded semantic chunks."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {testResults.map((result, idx) => {
                            const matchPercent = Math.round(result.similarity * 100);
                            const isHighMatch = matchPercent >= 80;
                            return (
                                <div
                                    key={result.chunkId || idx}
                                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-white/[0.08] space-y-3 shadow-xs hover:border-primary/30 transition-all"
                                >
                                    {/* Header & Match Badge */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary" />
                                                <h5 className="text-sm font-bold text-foreground">
                                                    {result.title}
                                                </h5>
                                                <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                                                    [{result.sourceType}]
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-zinc-400">
                                                Chunk ID: {result.chunkId.slice(0, 8)}... • ~{result.tokenCount} tokens
                                            </span>
                                        </div>

                                        {/* Similarity Badge */}
                                        <div className="text-right shrink-0">
                                            <div
                                                className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-black tracking-tight border inline-flex items-center gap-1",
                                                    isHighMatch
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                                )}
                                            >
                                                <span>{matchPercent}% Match</span>
                                                <span className="text-[10px] opacity-75 font-mono">
                                                    ({result.similarity.toFixed(3)})
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Block */}
                                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-white/[0.04] text-xs font-mono text-zinc-700 dark:text-zinc-200 leading-relaxed">
                                        {result.content}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
