"use client";

import React from "react";
import { useKnowledgeStore } from "@/stores/knowledge-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    HelpCircle,
    ShoppingBag,
    Globe,
    Layers,
    RotateCw,
    Edit,
    Trash2,
    Search,
    BookOpen,
    Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    faq: HelpCircle,
    service_catalog: ShoppingBag,
    document: FileText,
    url: Globe,
};

const TYPE_LABELS: Record<string, string> = {
    faq: "FAQ",
    service_catalog: "Service Catalog",
    document: "Document",
    url: "URL Source",
};

export function KnowledgeSourcesList() {
    const {
        sources,
        isLoading,
        filterType,
        searchQuery,
        setFilterType,
        setSearchQuery,
        openAddModal,
        openChunksModal,
        deleteSource,
        reindexSource,
    } = useKnowledgeStore();

    const filteredSources = sources.filter((s) => {
        const matchesType = filterType === "all" || s.sourceType === filterType;
        const matchesQuery =
            !searchQuery ||
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.rawContent.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesQuery;
    });

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}" and all its vector embeddings?`)) {
            return;
        }
        const ok = await deleteSource(id);
        if (ok) {
            toast.success("Knowledge source deleted");
        } else {
            toast.error("Failed to delete knowledge source");
        }
    };

    const handleReindex = async (id: string, title: string) => {
        toast.info(`Re-indexing "${title}"...`);
        const ok = await reindexSource(id);
        if (ok) {
            toast.success(`Successfully re-indexed and embedded "${title}"`);
        } else {
            toast.error("Failed to re-index source");
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Type Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-white/[0.05] rounded-xl self-start overflow-x-auto max-w-full">
                    {[
                        { id: "all", label: "All Sources" },
                        { id: "faq", label: "FAQs" },
                        { id: "service_catalog", label: "Services & Pricing" },
                        { id: "document", label: "Documents" },
                        { id: "url", label: "URLs" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterType(tab.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                                filterType === tab.id
                                    ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs"
                                    : "text-zinc-500 hover:text-foreground"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search knowledge..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] focus:outline-hidden focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-zinc-400"
                    />
                </div>
            </div>

            {/* Sources Grid / List */}
            {isLoading && sources.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 text-sm">
                    <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading knowledge base sources...
                </div>
            ) : filteredSources.length === 0 ? (
                <div className="p-12 rounded-2xl border border-dashed border-zinc-200 dark:border-white/[0.08] text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-foreground">No knowledge sources found</h3>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                            {searchQuery
                                ? "No knowledge sources matched your search criteria."
                                : "Add business FAQs, pricing tables, service catalogs, or company policies to ground your autonomous agents."}
                        </p>
                    </div>
                    {!searchQuery && (
                        <Button
                            size="sm"
                            onClick={() => openAddModal()}
                            className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl"
                        >
                            Add First Source
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSources.map((source) => {
                        const Icon = TYPE_ICONS[source.sourceType] || FileText;
                        return (
                            <div
                                key={source.id}
                                className="group p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/[0.08] hover:border-primary/40 transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-foreground line-clamp-1">
                                                    {source.title}
                                                </h4>
                                                <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                                                    {TYPE_LABELS[source.sourceType] || source.sourceType}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none shrink-0"
                                        >
                                            Indexed
                                        </Badge>
                                    </div>

                                    {/* Snippet */}
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                                        {source.rawContent}
                                    </p>
                                </div>

                                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-medium">
                                        <span className="flex items-center gap-1">
                                            <Layers className="w-3.5 h-3.5 text-primary" />
                                            {source.chunkCount} {source.chunkCount === 1 ? "chunk" : "chunks"}
                                        </span>
                                        <span>•</span>
                                        <span>~{source.totalTokens} tokens</span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                                        <button
                                            title="Inspect Chunks"
                                            onClick={() => openChunksModal(source.id)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            title="Re-index Chunks"
                                            onClick={() => handleReindex(source.id, source.title)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                        >
                                            <RotateCw className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            title="Edit Source"
                                            onClick={() => openAddModal(source)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            title="Delete Source"
                                            onClick={() => handleDelete(source.id, source.title)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
