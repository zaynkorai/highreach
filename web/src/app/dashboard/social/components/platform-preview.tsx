"use client";

import React from "react";
import Image from "next/image";
import type { SocialPlatform } from "@/lib/types/database";
import {
    Heart,
    MessageCircle,
    Repeat2,
    Share2,
    Bookmark,
    ThumbsUp,
    Send,
    MoreHorizontal,
    Globe,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformPreviewProps {
    platform: SocialPlatform;
    content: string;
    mediaUrls?: string[];
    thread?: string[];
    authorName?: string;
    authorHandle?: string;
    authorAvatar?: string;
}

export function PlatformPreview({
    platform,
    content,
    mediaUrls = [],
    thread = [],
    authorName = "HighReach AI",
    authorHandle = "@highreach_ai",
    authorAvatar = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
}: PlatformPreviewProps) {
    const displayText = content.trim() || "Preview will appear here as you type...";

    // ── X (Twitter) Preview ──────────────────────────────────────
    if (platform === "twitter") {
        return (
            <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-zinc-900 dark:text-zinc-100 max-w-lg mx-auto shadow-sm space-y-4">
                {/* Main Tweet */}
                <div className="flex gap-3 relative">
                    {thread.length > 0 && (
                        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800 -mb-4 z-0" />
                    )}
                    <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-10 h-10 rounded-full object-cover shrink-0 z-10"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 leading-tight">
                            <span className="font-bold text-sm truncate">{authorName}</span>
                            <CheckCircle2 className="w-4 h-4 text-sky-500 fill-sky-500 shrink-0" />
                            <span className="text-zinc-500 text-xs truncate">{authorHandle}</span>
                            <span className="text-zinc-500 text-xs">·</span>
                            <span className="text-zinc-500 text-xs">1m</span>
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-line break-words leading-relaxed">
                            {displayText}
                        </p>

                        {mediaUrls.length > 0 && (
                            <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-72">
                                <img
                                    src={mediaUrls[0]}
                                    alt="Media preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-3 text-zinc-500 text-xs max-w-sm pt-1">
                            <span className="flex items-center gap-1.5 hover:text-sky-500">
                                <MessageCircle className="w-4 h-4" /> <span>12</span>
                            </span>
                            <span className="flex items-center gap-1.5 hover:text-emerald-500">
                                <Repeat2 className="w-4 h-4" /> <span>4</span>
                            </span>
                            <span className="flex items-center gap-1.5 hover:text-rose-500">
                                <Heart className="w-4 h-4" /> <span>48</span>
                            </span>
                            <span className="flex items-center gap-1.5 hover:text-sky-500">
                                <Bookmark className="w-4 h-4" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Subsequent Thread Posts */}
                {thread.map((item, idx) => (
                    <div key={idx} className="flex gap-3 relative pt-2">
                        {idx < thread.length - 1 && (
                            <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800 -mb-4 z-0" />
                        )}
                        <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-10 h-10 rounded-full object-cover shrink-0 z-10"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 leading-tight">
                                <span className="font-bold text-sm truncate">{authorName}</span>
                                <CheckCircle2 className="w-4 h-4 text-sky-500 fill-sky-500 shrink-0" />
                                <span className="text-zinc-500 text-xs truncate">{authorHandle}</span>
                                <span className="text-zinc-500 text-xs">·</span>
                                <span className="text-zinc-500 text-xs">{idx + 2}/{thread.length + 1}</span>
                            </div>
                            <p className="mt-2 text-sm whitespace-pre-line break-words leading-relaxed text-zinc-800 dark:text-zinc-200">
                                {item.trim() || `Thread post #${idx + 2}...`}
                            </p>
                            <div className="flex items-center justify-between mt-3 text-zinc-500 text-xs max-w-sm pt-1">
                                <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /></span>
                                <span className="flex items-center gap-1.5"><Repeat2 className="w-4 h-4" /></span>
                                <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /></span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // ── LinkedIn Preview ─────────────────────────────────────────
    if (platform === "linkedin") {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-zinc-100 max-w-lg mx-auto shadow-sm">
                <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                        <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm">{authorName}</span>
                                <span className="text-zinc-400 text-xs font-normal">· 1st</span>
                            </div>
                            <p className="text-xs text-zinc-500 leading-tight">AI Speed-to-Lead Platform • 12,400 followers</p>
                            <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                Just now • <Globe className="w-3 h-3" />
                            </p>
                        </div>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                </div>

                <p className="mt-3 text-sm whitespace-pre-line break-words leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {displayText}
                </p>

                {mediaUrls.length > 0 && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-72">
                        <img
                            src={mediaUrls[0]}
                            alt="Media preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-1">
                        <span className="flex -space-x-1">
                            <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white">👍</span>
                            <span className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] text-white">👏</span>
                        </span>
                        <span className="ml-1 text-[11px]">86</span>
                    </div>
                    <span className="text-[11px]">14 comments • 3 reposts</span>
                </div>

                <div className="grid grid-cols-4 gap-1 pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    <button className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md">
                        <ThumbsUp className="w-4 h-4" /> Like
                    </button>
                    <button className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md">
                        <MessageCircle className="w-4 h-4" /> Comment
                    </button>
                    <button className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md">
                        <Repeat2 className="w-4 h-4" /> Repost
                    </button>
                    <button className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md">
                        <Send className="w-4 h-4" /> Send
                    </button>
                </div>
            </div>
        );
    }

    // ── Facebook Preview ─────────────────────────────────────────
    if (platform === "facebook") {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-zinc-100 max-w-lg mx-auto shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <span className="font-semibold text-sm">{authorName}</span>
                            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                                <span>Just now</span>
                                <span>·</span>
                                <Globe className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                </div>

                <p className="mt-3 text-sm whitespace-pre-line break-words leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {displayText}
                </p>

                {mediaUrls.length > 0 && (
                    <div className="mt-3 -mx-4 border-y border-zinc-200 dark:border-zinc-800 max-h-80 overflow-hidden">
                        <img
                            src={mediaUrls[0]}
                            alt="Media preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                    <span className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white">👍</span>
                        <span>42</span>
                    </span>
                    <span>8 comments</span>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1.5 mt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    <button className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md">
                        <ThumbsUp className="w-4 h-4" /> Like
                    </button>
                    <button className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md">
                        <MessageCircle className="w-4 h-4" /> Comment
                    </button>
                    <button className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-md">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                </div>
            </div>
        );
    }

    // ── Twitch Stream Chat / Announcement Preview ────────────────
    if (platform === "twitch") {
        return (
            <div className="bg-[#18181b] border border-[#2f2f35] rounded-2xl overflow-hidden text-white max-w-sm mx-auto shadow-md">
                {/* Twitch Chat Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e0e10] border-b border-[#2f2f35] text-xs font-bold uppercase tracking-wider text-zinc-300">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#9146ff] animate-pulse" />
                        <span>Stream Chat</span>
                    </div>
                    <span className="text-[10px] text-[#bf94ff] font-mono">1.4k viewers</span>
                </div>

                {/* Chat Feed */}
                <div className="p-3.5 space-y-3 min-h-[220px] flex flex-col justify-end">
                    <div className="text-[11px] text-zinc-500 text-center border-b border-zinc-800 pb-2">
                        Welcome to the chat room!
                    </div>

                    {/* Pinned Stream Announcement Box */}
                    <div className="p-3 rounded-xl bg-[#9146ff]/15 border border-[#9146ff]/40 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="px-1.5 py-0.5 rounded bg-[#9146ff] text-white text-[9px] font-black tracking-wider uppercase">
                                Broadcaster
                            </span>
                            <span className="font-bold text-[#bf94ff]">{authorName}</span>
                            <span className="text-[10px] text-zinc-400">· announcement</span>
                        </div>
                        <p className="text-xs text-zinc-100 whitespace-pre-line leading-relaxed">
                            {displayText}
                        </p>

                        {mediaUrls.length > 0 && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-[#9146ff]/30 max-h-48">
                                <img
                                    src={mediaUrls[0]}
                                    alt="Twitch announcement media"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Twitch Chat Input Box */}
                <div className="p-2.5 bg-[#0e0e10] border-t border-[#2f2f35] flex items-center gap-2">
                    <div className="flex-1 bg-[#1f1f23] rounded-lg px-3 py-1.5 text-xs text-zinc-400 border border-transparent">
                        Send a message
                    </div>
                    <button className="px-3 py-1.5 bg-[#9146ff] hover:bg-[#772ce8] rounded-lg text-xs font-bold text-white transition-colors">
                        Chat
                    </button>
                </div>
            </div>
        );
    }

    // ── Kick Stream Chat / Announcement Preview ──────────────────
    if (platform === "kick") {
        return (
            <div className="bg-[#0b0e0f] border border-[#191b1d] rounded-2xl overflow-hidden text-white max-w-sm mx-auto shadow-md">
                {/* Kick Chat Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#060708] border-b border-[#191b1d] text-xs font-bold uppercase tracking-wider text-zinc-300">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#53fc18] animate-pulse" />
                        <span>Live Kick Chat</span>
                    </div>
                    <span className="text-[10px] text-[#53fc18] font-mono">LIVE</span>
                </div>

                {/* Chat Feed */}
                <div className="p-3.5 space-y-3 min-h-[220px] flex flex-col justify-end">
                    <div className="text-[11px] text-zinc-600 text-center border-b border-zinc-900 pb-2">
                        Verified Channel Broadcast
                    </div>

                    {/* Pinned Stream Announcement Box */}
                    <div className="p-3 rounded-xl bg-[#53fc18]/10 border border-[#53fc18]/30 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="px-1.5 py-0.5 rounded bg-[#53fc18] text-black text-[9px] font-black tracking-wider uppercase">
                                Host
                            </span>
                            <span className="font-bold text-[#53fc18]">{authorName}</span>
                            <span className="text-[10px] text-zinc-400">· stream alert</span>
                        </div>
                        <p className="text-xs text-zinc-200 whitespace-pre-line leading-relaxed">
                            {displayText}
                        </p>

                        {mediaUrls.length > 0 && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-[#53fc18]/30 max-h-48">
                                <img
                                    src={mediaUrls[0]}
                                    alt="Kick alert media"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Kick Chat Input Box */}
                <div className="p-2.5 bg-[#060708] border-t border-[#191b1d] flex items-center gap-2">
                    <div className="flex-1 bg-[#131517] rounded-lg px-3 py-1.5 text-xs text-zinc-400 border border-zinc-800">
                        Broadcast to channel...
                    </div>
                    <button className="px-3 py-1.5 bg-[#53fc18] hover:bg-[#48de15] rounded-lg text-xs font-black text-black transition-colors">
                        Send
                    </button>
                </div>
            </div>
        );
    }

    // ── Instagram Preview ────────────────────────────────────────
    return (
        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 max-w-sm mx-auto shadow-sm">
            <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="flex items-center gap-2.5">
                    <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-pink-500 p-0.5"
                    />
                    <span className="font-semibold text-xs truncate max-w-[160px]">{authorHandle.replace("@", "")}</span>
                </div>
                <MoreHorizontal className="w-4 h-4 text-zinc-400" />
            </div>

            <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                {mediaUrls.length > 0 ? (
                    <img
                        src={mediaUrls[0]}
                        alt="Instagram preview"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="p-6 text-center text-zinc-400 text-xs">
                        <p className="font-medium">Image or Video Attachment</p>
                        <p className="text-[10px] mt-1 text-zinc-500">(Add a media URL to see live photo preview)</p>
                    </div>
                )}
            </div>

            <div className="p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                        <MessageCircle className="w-5 h-5 text-zinc-800 dark:text-zinc-200 -rotate-90" />
                        <Send className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                    </div>
                    <Bookmark className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                </div>

                <p className="font-semibold text-xs mt-2">128 likes</p>

                <p className="text-xs mt-1 text-zinc-800 dark:text-zinc-200 leading-normal">
                    <span className="font-semibold mr-1">{authorHandle.replace("@", "")}</span>
                    {displayText}
                </p>

                <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-2">Just now</p>
            </div>
        </div>
    );
}
