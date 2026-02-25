"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReputationStats } from "@/types/reputation";
import { Star, TrendingUp, Users, MessageCircle } from "lucide-react";

interface ReputationOverviewProps {
    stats: ReputationStats;
    isLoading: boolean;
}

export function ReputationOverview({ stats, isLoading }: ReputationOverviewProps) {
    const ratings = [5, 4, 3, 2, 1];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Score Card */}
            <Card className="lg:col-span-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.08] shadow-sm overflow-hidden relative group">
                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">Trust Score</span>
                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-7xl font-black text-foreground tracking-tighter">{stats.averageRating.toFixed(1)}</span>
                            <div className="flex flex-col">
                                <span className="text-xl text-zinc-400 font-bold leading-none">/ 5.0</span>
                                <div className="flex gap-0.5 mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${star <= Math.round(stats.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-zinc-200 dark:text-zinc-800"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-white/[0.05]">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-500 font-medium">New this month</span>
                                <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold flex items-center gap-1">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    +{stats.newReviewsThisMonth}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-500 font-medium">Response Rate</span>
                                <span className="text-sm font-bold text-foreground">{stats.responseRate}%</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Distribution and Sentiment Card */}
            <Card className="lg:col-span-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.08] shadow-sm">
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Rating Distribution */}
                        <div>
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">Rating Distribution</h3>
                            <div className="space-y-3.5">
                                {ratings.map((rating) => {
                                    const count = stats.ratingDistribution[rating] || 0;
                                    const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

                                    return (
                                        <div key={rating} className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 w-10 shrink-0">
                                                <span className="text-xs font-bold text-zinc-500">{rating}</span>
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            </div>
                                            <div className="flex-1 h-2 bg-zinc-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-brand-500 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${isLoading ? 0 : percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-400 w-8 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Customer Sentiment */}
                        <div className="flex flex-col">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6">Customer Sentiment</h3>
                            <div className="flex-1 flex flex-col justify-center gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-emerald-500">Positive</span>
                                        <span className="text-xs font-medium text-zinc-400">82%</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-100 dark:bg-white/[0.05] rounded-full flex overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: '82%' }} />
                                        <div className="h-full bg-zinc-400/20" style={{ width: '12%' }} />
                                        <div className="h-full bg-rose-500" style={{ width: '6%' }} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.05]">
                                        <div className="text-lg font-bold text-brand-500">{stats.totalReviews}</div>
                                        <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">Total</div>
                                    </div>
                                    <div className="text-center p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.05]">
                                        <div className="text-lg font-bold text-foreground">22d</div>
                                        <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">Streak</div>
                                    </div>
                                    <div className="text-center p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.05]">
                                        <div className="text-lg font-bold text-foreground">{stats.averageResponseTime}</div>
                                        <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-tighter">Speed</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
