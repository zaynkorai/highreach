"use client";

import React, { useState } from "react";
import { useSocialAnalytics, useSocialActions } from "@/stores/social-store";
import { PLATFORM_SPECS } from "@/lib/services/social.service";
import { triggerCommentToLeadSimulationAction } from "@/app/dashboard/social/actions";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    Zap,
    Repeat2,
    Send,
    CheckCircle2,
    UserCheck,
    Layers,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

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

    // Simulation State for Comment-to-Lead Engine
    const [simCommentText, setSimCommentText] = useState(
        activePost.settings?.commentToLead?.triggerKeyword || "GROWTH"
    );
    const [simCommenterName, setSimCommenterName] = useState("Alex Carter");
    const [simCommenterHandle, setSimCommenterHandle] = useState("@alex_carter");
    const [simResult, setSimResult] = useState<{
        triggered: boolean;
        triggerKeyword: string;
        dmMessage: string;
        createdContactId?: string;
        logMessage: string;
    } | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const handleRunSimulation = async () => {
        if (!simCommentText.trim()) return;
        setIsSimulating(true);
        try {
            const res = await triggerCommentToLeadSimulationAction(activePost.id, {
                name: simCommenterName,
                handle: simCommenterHandle,
                platform: activePost.platforms[0] || "twitter",
                commentText: simCommentText,
            });

            if (res.success && res.result) {
                setSimResult({
                    triggered: res.result.triggered,
                    triggerKeyword: res.result.triggerKeyword,
                    dmMessage: res.result.dmMessage,
                    createdContactId: res.createdContactId,
                    logMessage: res.result.logMessage,
                });
                if (res.result.triggered) {
                    toast.success("Keyword matched! DM and CRM Contact created.");
                } else {
                    toast.info("Comment received, but keyword did not match.");
                }
            } else {
                toast.error(res.error || "Simulation failed");
            }
        } catch {
            toast.error("Error executing simulation");
        } finally {
            setIsSimulating(false);
        }
    };

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

                    {/* Comment-to-Lead Simulator & Verification */}
                    {activePost.settings?.commentToLead?.enabled && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center">
                                        <Zap className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-foreground">
                                            Comment-to-DM Growth Engine Active
                                        </h4>
                                        <p className="text-[11px] text-zinc-500">
                                            Target Keyword: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">[{activePost.settings.commentToLead.triggerKeyword}]</span>
                                        </p>
                                    </div>
                                </div>
                                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-0 text-[10px]">
                                    Live Simulator
                                </Badge>
                            </div>

                            <div className="space-y-2 pt-1 border-t border-amber-500/20">
                                <p className="text-[11px] text-zinc-500">
                                    Test how follower comments trigger instant DM dispatch and HighReach CRM Contact creation:
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <Input
                                        value={simCommenterName}
                                        onChange={(e) => setSimCommenterName(e.target.value)}
                                        placeholder="Commenter Name"
                                        className="h-8 text-xs bg-white dark:bg-zinc-900"
                                    />
                                    <Input
                                        value={simCommentText}
                                        onChange={(e) => setSimCommentText(e.target.value)}
                                        placeholder="Comment Text"
                                        className="h-8 text-xs font-mono bg-white dark:bg-zinc-900"
                                    />
                                    <Button
                                        size="sm"
                                        type="button"
                                        onClick={handleRunSimulation}
                                        disabled={isSimulating || !simCommentText.trim()}
                                        className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1"
                                    >
                                        <Send className="w-3 h-3" />
                                        {isSimulating ? "Testing..." : "Simulate Comment"}
                                    </Button>
                                </div>

                                {simResult && (
                                    <div className="mt-2 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-amber-500/30 space-y-2 text-xs animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                                                {simResult.triggered ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        <span>Keyword Trigger Matched!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-4 h-4 text-zinc-400" />
                                                        <span>No Keyword Match</span>
                                                    </>
                                                )}
                                            </span>
                                            {simResult.createdContactId && (
                                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] border-0 flex items-center gap-1">
                                                    <UserCheck className="w-3 h-3" /> CRM Contact Created
                                                </Badge>
                                            )}
                                        </div>

                                        {simResult.triggered && (
                                            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-[11px] space-y-1">
                                                <p className="font-bold text-zinc-400">Automated DM Sent to {simCommenterName}:</p>
                                                <p className="text-zinc-700 dark:text-zinc-300 italic whitespace-pre-line">
                                                    "{simResult.dmMessage}"
                                                </p>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-zinc-400">{simResult.logMessage}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Evergreen Queue Status */}
                    {activePost.settings?.evergreen?.enabled && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                                    <Repeat2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <span>Evergreen Post Recycling Active</span>
                                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] border-0">
                                            Loop #{activePost.settings.evergreen.recyclesCount || 0}
                                        </Badge>
                                    </h4>
                                    <p className="text-[11px] text-zinc-500">
                                        Re-schedules every {activePost.settings.evergreen.recycleIntervalDays} days
                                        {activePost.settings.evergreen.aiVariation ? " with AI hook variation" : ""}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                Protected
                            </span>
                        </div>
                    )}

                    {/* LinkedIn Carousel Document Details */}
                    {activePost.settings?.carousel?.enabled && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center">
                                    <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground">
                                        LinkedIn Document Carousel
                                    </h4>
                                    <p className="text-[11px] text-zinc-500">
                                        {activePost.settings.carousel.slides?.length || 0} Slides • Theme: {activePost.settings.carousel.theme || "Dark"}
                                    </p>
                                </div>
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-0 text-[10px]">
                                PDF Slide Deck
                            </Badge>
                        </div>
                    )}
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
