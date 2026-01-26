"use client";

import { useEffect, useState } from "react";
import {
    useReputationActions,
    useReviews,
    useReputationStats,
    useReputationLoading
} from "@/stores/reputation-store";
import { Review } from "@/types/reputation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Star,
    Search,
    Filter,
    MessageSquare,
    TrendingUp,
    MoreVertical,
    Reply,
    ExternalLink,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewCard } from "./components/review-card";
import { ReputationOverview } from "./components/reputation-overview";
import { RequestReviewModal } from "./components/request-review-modal";

export default function ReputationPage() {
    const { fetchReviews } = useReputationActions();
    const reviews = useReviews();
    const stats = useReputationStats();
    const isLoading = useReputationLoading();
    const [searchQuery, setSearchQuery] = useState("");
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'positive' | 'negative' | 'google' | 'facebook'>('all');

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const filteredReviews = reviews.filter((r: Review) => {
        const matchesSearch = r.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.text.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeFilter === 'all') return matchesSearch;
        if (activeFilter === 'positive') return matchesSearch && r.sentiment === 'positive';
        if (activeFilter === 'negative') return matchesSearch && r.sentiment === 'negative';
        if (activeFilter === 'google') return matchesSearch && r.source === 'google';
        if (activeFilter === 'facebook') return matchesSearch && r.source === 'facebook';
        return matchesSearch;
    });

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                        Reputation <span className="text-indigo-500 font-medium tracking-normal">Center</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live monitoring from Google & Facebook
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                        onClick={() => setIsRequestModalOpen(true)}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Request Review
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            <ReputationOverview stats={stats} isLoading={isLoading} />

            {/* Insights & Feed Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Side Insights */}
                <div className="xl:col-span-1 space-y-6">

                </div>

                {/* Main Feed */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-white/[0.05] rounded-xl self-start w-full md:w-auto overflow-x-auto no-scrollbar">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'positive', label: 'Positive' },
                                { id: 'negative', label: 'Negative' },
                                { id: 'google', label: 'Google' },
                                { id: 'facebook', label: 'Facebook' },
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id as any)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                        activeFilter === filter.id
                                            ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-sm"
                                            : "text-zinc-500 hover:text-zinc-700"
                                    )}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                placeholder="Search conversations..."
                                className="pl-10 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.08] rounded-xl text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-40 w-full bg-zinc-100 dark:bg-white/[0.02] animate-pulse rounded-3xl border border-zinc-200 dark:border-white/[0.08]" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredReviews.length > 0 ? (
                                filteredReviews.map((review: Review) => (
                                    <ReviewCard key={review.id} review={review} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-white/[0.08]">
                                    <div className="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-zinc-400" />
                                    </div>
                                    <h3 className="text-xl font-bold">No results found</h3>
                                    <p className="text-zinc-500 max-w-sm mx-auto mt-2">
                                        Try adjusting your filters or search terms to find what you&apos;re looking for.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <RequestReviewModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
            />
        </div>
    );
}
