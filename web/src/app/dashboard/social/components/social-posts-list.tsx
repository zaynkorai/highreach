"use client";

import React, { useState } from "react";
import {
    useSocialPosts,
    useSocialActions,
    useSocialFilters,
    useSocialLightbox,
    useSocialAnalytics,
    useSocialPublishedWarning,
} from "@/stores/social-store";
import type { SocialPlatform, SocialPostStatus, SocialPost } from "@/lib/types/database";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Search,
    Filter,
    Plus,
    Send,
    Trash2,
    Calendar,
    Eye,
    ThumbsUp,
    Share2,
    MessageCircle,
    MousePointerClick,
    AlertCircle,
    CheckCircle2,
    Clock,
    BarChart3,
    Edit3,
    Maximize2,
    AlertTriangle,
    Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SocialPostsList() {
    const posts = useSocialPosts();
    const { statusFilter, platformFilter, searchQuery, isLoading } = useSocialFilters();
    const {
        setStatusFilter,
        setPlatformFilter,
        setSearchQuery,
        openComposer,
        publishNow,
        deletePost,
        duplicatePost,
        handleEditPost,
    } = useSocialActions();
    const { open: openLightbox } = useSocialLightbox();
    const { open: openAnalytics } = useSocialAnalytics();
    const { post: warningPost, setWarning } = useSocialPublishedWarning();

    const filteredPosts = posts.filter((post) => {
        // Status filter
        if (statusFilter !== "all" && post.status !== statusFilter) return false;

        // Platform filter
        if (platformFilter !== "all" && !post.platforms.includes(platformFilter)) return false;

        // Search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return post.content.toLowerCase().includes(query);
        }

        return true;
    });

    return (
        <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search posts by keyword..."
                        className="pl-9 h-9 text-xs"
                    />
                </div>

                {/* Status Pills */}
                <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {(["all", "scheduled", "published", "draft", "failed"] as ("all" | SocialPostStatus)[]).map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(st)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors",
                                statusFilter === st
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5"
                            )}
                        >
                            {st}
                            {st !== "all" && (
                                <span className="ml-1.5 text-[10px] opacity-70">
                                    ({posts.filter((p) => p.status === st).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Platform Filter & Add Post */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value as "all" | SocialPlatform)}
                        className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                        <option value="all">All Channels</option>
                        <option value="twitter">X / Twitter</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="threads">Threads</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitch">Twitch</option>
                        <option value="kick">Kick</option>
                    </select>

                    <Button
                        size="sm"
                        onClick={() => openComposer()}
                        className="bg-brand-600 hover:bg-brand-700 text-xs font-semibold h-9 px-4 gap-1.5 shrink-0"
                    >
                        <Plus className="w-4 h-4" /> New Post
                    </Button>
                </div>
            </div>

            {/* Posts Feed Grid / Empty State */}
            {filteredPosts.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 mx-auto flex items-center justify-center">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-foreground">No posts found</h3>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                            {searchQuery
                                ? "No social posts match your current search criteria."
                                : "Start scheduling content across your connected channels using our AI composer."}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => openComposer()}
                        className="bg-brand-600 hover:bg-brand-700 text-xs font-semibold gap-1.5"
                    >
                        <Plus className="w-4 h-4" /> Compose Post
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPosts.map((post) => {
                        const isPublished = post.status === "published";
                        const isScheduled = post.status === "scheduled";
                        const isFailed = post.status === "failed";

                        return (
                            <div
                                key={post.id}
                                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                            >
                                <div className="space-y-3">
                                    {/* Top Metadata */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {post.platforms.map((p) => (
                                                <Badge
                                                    key={p}
                                                    variant="secondary"
                                                    className="capitalize text-[10px] font-semibold py-0.5 px-2"
                                                >
                                                    {p}
                                                </Badge>
                                            ))}
                                            {post.settings?.thread && post.settings.thread.length > 0 && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold"
                                                >
                                                    Thread ({post.settings.thread.length + 1})
                                                </Badge>
                                            )}
                                        </div>

                                        <Badge
                                            className={cn(
                                                "capitalize text-[11px] font-semibold flex items-center gap-1",
                                                isPublished
                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                    : isScheduled
                                                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                                    : isFailed
                                                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                    : "bg-zinc-500/10 text-zinc-600"
                                            )}
                                            variant="outline"
                                        >
                                            {isPublished && <CheckCircle2 className="w-3 h-3" />}
                                            {isScheduled && <Clock className="w-3 h-3" />}
                                            {isFailed && <AlertCircle className="w-3 h-3" />}
                                            {post.status}
                                        </Badge>
                                    </div>

                                    {/* Content text */}
                                    <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line line-clamp-4">
                                        {post.content}
                                    </p>

                                    {/* Media Thumbnail */}
                                    {post.media_urls && post.media_urls.length > 0 && (
                                        <div
                                            className="relative group rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 max-h-40 cursor-pointer"
                                            onClick={() => openLightbox(post.media_urls![0])}
                                            title="Click to view full image in Lightbox"
                                        >
                                            <img
                                                src={post.media_urls[0]}
                                                alt="Post attachment"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1">
                                                <Maximize2 className="w-4 h-4" /> View Fullscreen
                                            </div>
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <p className="text-xs text-zinc-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {post.scheduled_at
                                            ? `Scheduled: ${format(parseISO(post.scheduled_at), "MMM d, yyyy h:mm a")}`
                                            : post.published_at
                                            ? `Published: ${format(parseISO(post.published_at), "MMM d, yyyy h:mm a")}`
                                            : `Created: ${format(parseISO(post.created_at), "MMM d, yyyy")}`}
                                    </p>
                                </div>

                                {/* Bottom bar: Metrics or Actions */}
                                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                                    {isPublished && post.metrics ? (
                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1" title="Views">
                                                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                                {post.metrics.views || 0}
                                            </span>
                                            <span className="flex items-center gap-1" title="Likes">
                                                <ThumbsUp className="w-3.5 h-3.5 text-zinc-400" />
                                                {post.metrics.likes || 0}
                                            </span>
                                            <span className="flex items-center gap-1" title="Shares">
                                                <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                                                {post.metrics.shares || 0}
                                            </span>
                                            <span className="flex items-center gap-1" title="Clicks">
                                                <MousePointerClick className="w-3.5 h-3.5 text-zinc-400" />
                                                {post.metrics.clicks || 0}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] text-zinc-400">
                                            {isScheduled ? "Pending dispatch" : "Draft in progress"}
                                        </span>
                                    )}

                                    <div className="flex items-center gap-1">
                                        {isPublished && (
                                            <button
                                                type="button"
                                                onClick={() => openAnalytics(post)}
                                                className="px-2 py-1 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors flex items-center gap-1 text-xs font-bold"
                                                title="View Single Post Analytics (Impressions, Engagements, CTR %)"
                                            >
                                                <BarChart3 className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Stats</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => handleEditPost(post)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                            title={isPublished ? "Edit post (Safe Guarded)" : "Edit post"}
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => duplicatePost(post.id)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                                            title="Duplicate & Repurpose Post"
                                        >
                                            <Share2 className="w-4 h-4 rotate-180" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => deletePost(post.id)}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                            title="Delete post"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        {!isPublished && (
                                            <Button
                                                size="sm"
                                                onClick={() => publishNow(post.id)}
                                                className="h-7 px-3 text-xs bg-brand-600 hover:bg-brand-700 font-semibold gap-1"
                                            >
                                                <Send className="w-3 h-3" /> Publish Now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Safe Edge Case Protection Dialog: Editing Published Post (Postiz Parity) */}
            <Dialog open={!!warningPost} onOpenChange={(open) => !open && setWarning(null)}>
                <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Cannot Edit Published Post
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 leading-relaxed">
                            This post has already been dispatched to social channels. External platform APIs do not allow retrospective editing of live content.
                            <br /><br />
                            Would you like to <strong>duplicate this content into a new draft</strong> so you can revise and schedule it?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center justify-end gap-2 pt-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setWarning(null)}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                if (warningPost) {
                                    duplicatePost(warningPost.id);
                                    setWarning(null);
                                }
                            }}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs gap-1.5"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            Duplicate as Draft
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
