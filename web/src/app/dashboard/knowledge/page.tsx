"use client";

import React, { useEffect } from "react";
import { useKnowledgeStore } from "@/stores/knowledge-store";
import { KnowledgeSourcesList } from "./components/knowledge-sources-list";
import { SemanticTestBench } from "./components/semantic-test-bench";
import { AddSourceModal } from "./components/add-source-modal";
import { ChunksInspectorModal } from "./components/chunks-inspector-modal";
import { Button } from "@/components/ui/button";
import {
    Brain,
    Plus,
    Database,
    Layers,
    Sparkles,
    ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function KnowledgeBasePage() {
    const {
        stats,
        activeTab,
        setActiveTab,
        openAddModal,
        refreshAll,
    } = useKnowledgeStore();

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-black tracking-tight text-foreground">
                            Knowledge Base
                        </h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium text-xs">
                        Ingest FAQs, services, and company docs
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => openAddModal()}
                        className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-11 px-5 rounded-2xl gap-2 shadow-sm shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Knowledge Source
                    </Button>
                </div>
            </div>

            {/* 2. Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-zinc-500">Knowledge Sources</span>
                        <div className="text-2xl font-black text-foreground">
                            {stats?.totalSources ?? 0}
                        </div>
                        <span className="text-[10px] text-zinc-400">Tenant documentation files</span>
                    </div>
                </div>
            </div>

            {/* 3. Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-white/[0.08] pb-1">
                <button
                    onClick={() => setActiveTab("catalog")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-b-2 -mb-1",
                        activeTab === "catalog"
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-zinc-500 hover:text-foreground"
                    )}
                >
                    <Database className="w-4 h-4" />
                    <span>Knowledge Sources</span>
                </button>

                <button
                    onClick={() => setActiveTab("test-bench")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-b-2 -mb-1",
                        activeTab === "test-bench"
                            ? "border-primary text-primary bg-primary/5"
                            : "border-transparent text-zinc-500 hover:text-foreground"
                    )}
                >
                    <span>Interactive Semantic Test Bench</span>
                </button>
            </div>

            {/* 4. Tab Content */}
            {activeTab === "catalog" ? (
                <KnowledgeSourcesList />
            ) : (
                <SemanticTestBench />
            )}

            {/* 5. Modals */}
            <AddSourceModal />
            <ChunksInspectorModal />
        </div>
    );
}
