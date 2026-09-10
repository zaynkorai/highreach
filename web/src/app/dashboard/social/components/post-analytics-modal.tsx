"use client";

import React from "react";
import { useSocialAnalytics, useSocialActions } from "@/stores/social-store";
import { PLATFORM_SPECS } from "@/lib/services/social.service";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    Eye,
    ThumbsUp,
    Share2,
    MessageCircle,
    MousePointerClick,
    Percent,
    TrendingUp,
    Calendar,
    Copy,
    ExternalLink,
    Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export function PostAnalyticsModal() {
    const { activePost, close } = useSocialAnalytics();
    const { duplicatePost } = useSocialActions();

    if (!activePost) return null;

    const metrics = activePost.metrics || {};
    const views = metrics.views || 0;
    const likes = metrics.likes || 0;
    const shares = metrics.shares || 0;
    const comments = metrics.comments || 0;
    const clicks = metrics.clicks || 0;

    const totalEngagements = likes + shares + comments + clicks;
    const engagementRate = views > 0 ? ((totalEngagements / views) * 100).toFixed(2) : "0.00";
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) : "0.00";

    const channels = activePost.channels || [];

    const handleDuplicate = () => {
        duplicatePost(activePost.id);
        close();
    };

    return (
        <Dialog open={!!activePost} onOpenChange={(open) => !open && close()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center">
                                <BarChart3 className="w-4 h-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    Single Post Analytics
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-400">
                                    Real-time delivery statistics and engagement metrics
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {activePost.platforms.map((p) => (
                                <Badge
                                    key={p}
                                    variant="secondary"
                                    className="capitalize text-[10px] font-bold px-2 py-0.5"
                                >
                                    {p}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Post Content Snapshot */}
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-2">
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line line-clamp-3">
                            {activePost.content}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {activePost.published_at
                                    ? format(parseISO(activePost.published_at), "MMM d, yyyy h:mm a")
                                    : "Recently published"}
                            </span>
                            {activePost.settings?.utm?.campaign && (
                                <span className="font-mono text-brand-600 dark:text-brand-400">
                                    Campaign: {activePost.settings.utm.campaign}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                            <div className="flex items-center justify-between text-zinc-400">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Views</span>
                                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                            </div>
                            <p className="text-xl font-black text-foreground">{views.toLocaleString()}</p>
                            <p className="text-[10px] text-zinc-400">Total impressions</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                            <div className="flex items-center justify-between text-zinc-400">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Engagements</span>
                                <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <p className="text-xl font-black text-foreground">{totalEngagements.toLocaleString()}</p>
                            <p className="text-[10px] text-zinc-400">Likes, shares, comments</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                            <div className="flex items-center justify-between text-zinc-400">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Engagement %</span>
                                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <p className="text-xl font-black text-foreground">{engagementRate}%</p>
                            <p className="text-[10px] text-zinc-400">Engagements / Views</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                            <div className="flex items-center justify-between text-zinc-400">
                                <span className="text-[10px] font-bold uppercase tracking-wider">Link CTR</span>
                                <MousePointerClick className="w-3.5 h-3.5 text-sky-500" />
                            </div>
                            <p className="text-xl font-black text-foreground">{ctr}%</p>
                            <p className="text-[10px] text-zinc-400">{clicks} click-throughs</p>
                        </div>
                    </div>

                    {/* Channel Breakdown or Deep Breakdown */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-brand-600" />
                            <span>Platform Metric Distribution</span>
                        </h4>

                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                            {activePost.platforms.map((p) => {
                                const spec = PLATFORM_SPECS[p];
                                // Channel metrics estimation / distribution
                                const chViews = Math.round(views / activePost.platforms.length);
                                const chLikes = Math.round(likes / activePost.platforms.length);
                                const chShares = Math.round(shares / activePost.platforms.length);
                                const chClicks = Math.round(clicks / activePost.platforms.length);

                                return (
                                    <div
                                        key={p}
                                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: spec?.brandColor || "#666" }}
                                            />
                                            <span className="font-semibold text-xs text-foreground capitalize">
                                                {spec?.name || p}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1" title="Views">
                                                <Eye className="w-3.5 h-3.5 text-zinc-400" /> {chViews}
                                            </span>
                                            <span className="flex items-center gap-1" title="Likes">
                                                <ThumbsUp className="w-3.5 h-3.5 text-zinc-400" /> {chLikes}
                                            </span>
                                            <span className="flex items-center gap-1" title="Shares">
                                                <Share2 className="w-3.5 h-3.5 text-zinc-400" /> {chShares}
                                            </span>
                                            <span className="flex items-center gap-1" title="Clicks">
                                                <MousePointerClick className="w-3.5 h-3.5 text-zinc-400" /> {chClicks}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-zinc-50/60 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDuplicate}
                        className="text-xs gap-1.5"
                    >
                        <Copy className="w-3.5 h-3.5" /> Duplicate as Draft
                    </Button>

                    <Button
                        size="sm"
                        onClick={close}
                        className="text-xs px-5 bg-brand-600 hover:bg-brand-700 text-white font-bold"
                    >
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
