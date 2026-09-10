"use client";

import React, { useEffect } from "react";
import {
    useSocialActiveTab,
    useSocialStats,
    useSocialChannelBreakdown,
    useSocialActions,
    useSocialFilters,
    useSocialStreak,
    type SocialStudioTab,
} from "@/stores/social-store";
import { SocialCalendarView } from "./components/social-calendar-view";
import { SocialPostsList } from "./components/social-posts-list";
import { SocialAccountsManager } from "./components/social-accounts-manager";
import { GlobalSocialSettings } from "./components/global-social-settings";
import { PostComposerModal } from "./components/post-composer-modal";
import { MediaLightbox } from "./components/media-lightbox";
import { PostAnalyticsModal } from "./components/post-analytics-modal";
import { Button } from "@/components/ui/button";
import {
    Calendar as CalendarIcon,
    ListFilter,
    Radio,
    Plus,
    Share2,
    Eye,
    TrendingUp,
    Clock,
    CheckCircle2,
    Sparkles,
    Flame,
    Settings,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SocialStudioPage() {
    const activeTab = useSocialActiveTab();
    const stats = useSocialStats();
    const streak = useSocialStreak();
    const channelBreakdown = useSocialChannelBreakdown();
    const { isLoading } = useSocialFilters();
    const { setActiveTab, openComposer, refreshAll } = useSocialActions();

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Streak At-Risk Alert Banner (Postiz Parity) */}
            {streak.isAtRisk && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center text-lg animate-bounce">
                            🔥
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <span>Posting Streak at Risk!</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold uppercase">
                                    {streak.currentStreak} Days
                                </span>
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                                You haven't scheduled or published a post today. Keep your momentum going and protect your streak!
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => openComposer()}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 px-4 gap-1.5 shrink-0 shadow-xs"
                    >
                        <Flame className="w-3.5 h-3.5 fill-white" />
                        Save My Streak
                    </Button>
                </div>
            )}

            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-black tracking-tight text-foreground">
                            Social <span className="text-brand-500 font-medium">Studio</span>
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200/60 dark:border-brand-900/40">
                            Postiz Engine
                        </span>

                        {/* Daily Posting Streak Badge */}
                        <div
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tight border transition-all",
                                streak.currentStreak > 0
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                    : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                            )}
                            title={`Current streak: ${streak.currentStreak} days | Longest: ${streak.longestStreak} days`}
                        >
                            <Flame className={cn("w-3.5 h-3.5", streak.currentStreak > 0 && "fill-amber-500 text-amber-500 animate-pulse")} />
                            <span>{streak.currentStreak > 0 ? `${streak.currentStreak} Day Streak` : "0 Day Streak"}</span>
                        </div>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm font-medium flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Multi-channel content scheduling, AI generation, and unified audience growth
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => openComposer()}
                        className="h-11 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs gap-2 shadow-lg shadow-brand-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Compose Post
                    </Button>
                </div>
            </div>

            {/* 2. Key Performance Indicators (KPIs) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Scheduled Queue</span>
                        <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-black text-foreground">{stats.scheduledCount}</p>
                    <p className="text-[11px] text-zinc-400">Ready for automated dispatch</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Published Posts</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-foreground">{stats.publishedCount}</p>
                    <p className="text-[11px] text-zinc-400">Dispatched across networks</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Impressions</span>
                        <Eye className="w-4 h-4 text-indigo-500" />
                    </div>
                    <p className="text-2xl font-black text-foreground">
                        {stats.totalImpressions.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-zinc-400">Audience reach across platforms</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Connected Accounts</span>
                        <Radio className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-2xl font-black text-foreground">{stats.connectedAccountsCount}</p>
                    <p className="text-[11px] text-zinc-400">Active social channels</p>
                </div>
            </div>

            {/* 3. Channel Performance Breakdown (Postiz Analytics) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-brand-600" />
                            <span>Network Performance Breakdown</span>
                        </h2>
                        <p className="text-xs text-zinc-400">Real-time impressions & engagement distribution by channel</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                    {channelBreakdown.map((item) => (
                        <div
                            key={item.platform}
                            className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-foreground capitalize">{item.name}</span>
                                <span className="text-[10px] text-zinc-400 font-bold">{item.postCount} posts</span>
                            </div>
                            <div className="flex items-baseline justify-between">
                                <span className="text-lg font-black text-foreground">{item.impressions.toLocaleString()}</span>
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {item.engagements} engagements
                                </span>
                            </div>
                            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-brand-500 h-1.5 rounded-full"
                                    style={{
                                        width: `${stats.totalImpressions > 0 ? Math.min(100, Math.round((item.impressions / stats.totalImpressions) * 100)) : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Studio Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <button
                    type="button"
                    onClick={() => setActiveTab("calendar")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        activeTab === "calendar"
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    )}
                >
                    <CalendarIcon className="w-4 h-4" />
                    <span>Content Calendar</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("posts")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        activeTab === "posts"
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    )}
                >
                    <ListFilter className="w-4 h-4" />
                    <span>Post Queue & Feed</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("channels")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        activeTab === "channels"
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    )}
                >
                    <Radio className="w-4 h-4" />
                    <span>Connected Channels</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        activeTab === "settings"
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    )}
                >
                    <Settings className="w-4 h-4" />
                    <span>Global Settings</span>
                </button>
            </div>

            {/* 4. Active Tab Content View */}
            <div>
                {activeTab === "calendar" && <SocialCalendarView />}
                {activeTab === "posts" && <SocialPostsList />}
                {activeTab === "channels" && <SocialAccountsManager />}
                {activeTab === "settings" && <GlobalSocialSettings />}
            </div>

            {/* 5. Modals & Lightbox Overlays */}
            <PostComposerModal />
            <MediaLightbox />
            <PostAnalyticsModal />
        </div>
    );
}
