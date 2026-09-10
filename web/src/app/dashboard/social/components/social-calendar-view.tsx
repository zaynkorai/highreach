"use client";

import React, { useState } from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
} from "date-fns";
import {
    useSocialPosts,
    useSocialActions,
} from "@/stores/social-store";
import { PLATFORM_SPECS } from "@/lib/services/social.service";
import type { SocialPost } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Send,
    Trash2,
    Clock,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SocialCalendarView() {
    const posts = useSocialPosts();
    const { openComposer, publishNow, deletePost } = useSocialActions();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Group posts by YYYY-MM-DD
    const postsByDate = React.useMemo(() => {
        const map: Record<string, SocialPost[]> = {};
        for (const post of posts) {
            const dateTarget = post.scheduled_at || post.published_at || post.created_at;
            if (!dateTarget) continue;
            try {
                const key = format(parseISO(dateTarget), "yyyy-MM-dd");
                if (!map[key]) map[key] = [];
                map[key].push(post);
            } catch (err) {
                // Ignore parse errors on invalid dates
            }
        }
        return map;
    }, [posts]);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const handleToday = () => setCurrentMonth(new Date());

    const handleDayClick = (day: Date) => {
        const formatted = format(day, "yyyy-MM-dd'T'10:00");
        openComposer({ scheduledAt: formatted });
    };

    return (
        <div className="space-y-4">
            {/* Calendar Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center font-bold">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {format(currentMonth, "MMMM yyyy")}
                        </h2>
                        <p className="text-xs text-zinc-500">
                            {posts.filter(p => p.status === "scheduled").length} scheduled in queue
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleToday} className="text-xs h-8">
                        Today
                    </Button>
                    <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors border-l border-zinc-200 dark:border-zinc-800"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => openComposer()}
                        className="bg-brand-600 hover:bg-brand-700 text-xs font-semibold h-8 gap-1.5 ml-2"
                    >
                        <Plus className="w-3.5 h-3.5" /> New Post
                    </Button>
                </div>
            </div>

            {/* Calendar Month Grid */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                {/* Day of week headers */}
                <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-center text-xs font-semibold text-zinc-500 py-2.5">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                        <div key={d}>{d}</div>
                    ))}
                </div>

                {/* Days cells */}
                <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-200 dark:divide-zinc-800">
                    {days.map((day) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const dayPosts = postsByDate[dateKey] || [];
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isDayToday = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    "min-h-[110px] p-2 flex flex-col justify-between transition-colors group cursor-pointer hover:bg-brand-50/20 dark:hover:bg-brand-950/10",
                                    !isCurrentMonth && "bg-zinc-50/50 dark:bg-zinc-950/20 opacity-40",
                                    isDayToday && "bg-brand-50/30 dark:bg-brand-950/20"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                                            isDayToday
                                                ? "bg-brand-600 text-white"
                                                : "text-zinc-700 dark:text-zinc-300"
                                        )}
                                    >
                                        {format(day, "d")}
                                    </span>
                                    {dayPosts.length > 0 && (
                                        <span className="text-[10px] font-bold text-zinc-400">
                                            {dayPosts.length}
                                        </span>
                                    )}
                                </div>

                                {/* Post Pills on this date */}
                                <div className="space-y-1 my-1 overflow-y-auto max-h-[70px]">
                                    {dayPosts.slice(0, 3).map((post) => (
                                        <div
                                            key={post.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedPost(post);
                                            }}
                                            className={cn(
                                                "px-2 py-1 rounded-md text-[11px] font-medium truncate flex items-center justify-between gap-1 shadow-xs border transition-transform hover:scale-[1.02]",
                                                post.status === "published"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900"
                                                    : post.status === "scheduled"
                                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900"
                                                    : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                                            )}
                                        >
                                            <span className="truncate">{post.content}</span>
                                            <span className="text-[9px] uppercase font-bold shrink-0">
                                                {post.platforms[0]?.slice(0, 2)}
                                            </span>
                                        </div>
                                    ))}
                                    {dayPosts.length > 3 && (
                                        <div className="text-[10px] text-zinc-400 text-center font-semibold">
                                            +{dayPosts.length - 3} more
                                        </div>
                                    )}
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 flex justify-end transition-opacity">
                                    <span className="text-[10px] text-brand-600 font-semibold flex items-center gap-0.5">
                                        <Plus className="w-2.5 h-2.5" /> Schedule
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Post Quick Inspector Modal */}
            {selectedPost && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setSelectedPost(null)}
                >
                    <div
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge
                                    className={cn(
                                        "capitalize text-xs font-semibold",
                                        selectedPost.status === "published"
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                            : selectedPost.status === "scheduled"
                                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                            : "bg-zinc-500/10 text-zinc-600"
                                    )}
                                    variant="outline"
                                >
                                    {selectedPost.status}
                                </Badge>
                                <span className="text-xs text-zinc-400">
                                    {selectedPost.scheduled_at
                                        ? format(parseISO(selectedPost.scheduled_at), "MMM d, yyyy h:mm a")
                                        : "Draft"}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="text-zinc-400 hover:text-zinc-600 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Target Channels</p>
                            <div className="flex gap-1.5 flex-wrap">
                                {selectedPost.platforms.map((p) => (
                                    <Badge key={p} variant="secondary" className="capitalize text-xs">
                                        {p}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 whitespace-pre-line">
                            {selectedPost.content}
                        </p>

                        {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-48">
                                <img
                                    src={selectedPost.media_urls[0]}
                                    alt="Post media"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {selectedPost.status === "published" && selectedPost.metrics && (
                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <p className="text-[10px] text-zinc-400">Views</p>
                                    <p className="font-bold text-xs">{selectedPost.metrics.views || 0}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <p className="text-[10px] text-zinc-400">Likes</p>
                                    <p className="font-bold text-xs">{selectedPost.metrics.likes || 0}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <p className="text-[10px] text-zinc-400">Shares</p>
                                    <p className="font-bold text-xs">{selectedPost.metrics.shares || 0}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                    <p className="text-[10px] text-zinc-400">Clicks</p>
                                    <p className="font-bold text-xs">{selectedPost.metrics.clicks || 0}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    deletePost(selectedPost.id);
                                    setSelectedPost(null);
                                }}
                                className="h-8 text-xs gap-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </Button>

                            {selectedPost.status !== "published" && (
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        publishNow(selectedPost.id);
                                        setSelectedPost(null);
                                    }}
                                    className="h-8 text-xs bg-brand-600 hover:bg-brand-700 font-bold gap-1"
                                >
                                    <Send className="w-3.5 h-3.5" /> Publish Now
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
