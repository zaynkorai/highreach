"use client";

import React, { useState } from "react";
import {
    useSocialAccounts,
    useSocialActions,
} from "@/stores/social-store";
import { PLATFORM_SPECS } from "@/lib/services/social.service";
import type { SocialPlatform } from "@/lib/types/database";
import {
    connectSocialAccountAction,
    disconnectSocialAccountAction,
} from "@/app/dashboard/social/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    CheckCircle2,
    Plus,
    Trash2,
    ExternalLink,
    Radio,
    ShieldCheck,
    Share2,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CHANNEL_CONFIGS: {
    platform: SocialPlatform;
    title: string;
    description: string;
    icon: string;
    brandColor: string;
}[] = [
    {
        platform: "twitter",
        title: "X (formerly Twitter)",
        description: "Post tweets, threads, links, and join real-time conversations.",
        icon: "𝕏",
        brandColor: "#000000",
    },
    {
        platform: "linkedin",
        title: "LinkedIn",
        description: "Publish company updates, executive articles, and B2B announcements.",
        icon: "in",
        brandColor: "#0A66C2",
    },
    {
        platform: "facebook",
        title: "Facebook Page",
        description: "Reach local communities and engage page followers with multimedia.",
        icon: "f",
        brandColor: "#1877F2",
    },
    {
        platform: "instagram",
        title: "Instagram",
        description: "Share visual stories, carousel posts, reels, and business highlights.",
        icon: "📸",
        brandColor: "#E4405F",
    },
    {
        platform: "threads",
        title: "Threads",
        description: "Engage in conversational microblogging linked to Meta accounts.",
        icon: "@",
        brandColor: "#000000",
    },
    {
        platform: "youtube",
        title: "YouTube Community",
        description: "Broadcast text polls, milestone cards, and video updates.",
        icon: "▶",
        brandColor: "#FF0000",
    },
    {
        platform: "tiktok",
        title: "TikTok",
        description: "Publish short-form video updates directly to brand profile.",
        icon: "🎵",
        brandColor: "#000000",
    },
    {
        platform: "pinterest",
        title: "Pinterest",
        description: "Drive visual discovery, inspiration pins, and catalog traffic.",
        icon: "📌",
        brandColor: "#E60023",
    },
    {
        platform: "twitch",
        title: "Twitch",
        description: "Broadcast stream announcements and schedule chat notifications.",
        icon: "🟣",
        brandColor: "#9146FF",
    },
    {
        platform: "kick",
        title: "Kick",
        description: "Schedule live stream alerts and channel broadcasts in green style.",
        icon: "🟢",
        brandColor: "#53FC18",
    },
];

export function SocialAccountsManager() {
    const accounts = useSocialAccounts();
    const { fetchAccounts } = useSocialActions();

    const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);
    const [accountName, setAccountName] = useState("");
    const [accountHandle, setAccountHandle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenConnect = (platform: SocialPlatform) => {
        setConnectingPlatform(platform);
        setAccountName(`HighReach ${PLATFORM_SPECS[platform]?.name || "Brand"}`);
        setAccountHandle(`@highreach_${platform}`);
    };

    const handleConnectSubmit = async () => {
        if (!connectingPlatform || !accountName.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await connectSocialAccountAction({
                platform: connectingPlatform,
                accountName: accountName.trim(),
                accountHandle: accountHandle.trim() || undefined,
                avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
            });

            if (res.success) {
                toast.success(`${PLATFORM_SPECS[connectingPlatform]?.name} connected successfully!`);
                setConnectingPlatform(null);
                await fetchAccounts();
            } else {
                toast.error(res.error || "Failed to connect account");
            }
        } catch (err: unknown) {
            toast.error("Error connecting account");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDisconnect = async (accountId: string, platformName: string) => {
        try {
            const res = await disconnectSocialAccountAction(accountId);
            if (res.success) {
                toast.success(`${platformName} disconnected`);
                await fetchAccounts();
            } else {
                toast.error(res.error || "Failed to disconnect");
            }
        } catch (err: unknown) {
            toast.error("Failed to disconnect");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                        <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">
                            Connected Social Channels
                        </h2>
                        <p className="text-xs text-zinc-500">
                            {accounts.length} of {CHANNEL_CONFIGS.length} channels connected & ready for scheduling
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold gap-1.5 py-1 px-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Active Sandbox & Dispatch Engine
                </Badge>
            </div>

            {/* Channels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {CHANNEL_CONFIGS.map((cfg) => {
                    const connected = accounts.find((a) => a.platform === cfg.platform);

                    return (
                        <div
                            key={cfg.platform}
                            className={cn(
                                "p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4",
                                connected
                                    ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs"
                                    : "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/80 dark:border-zinc-800/60 opacity-85 hover:opacity-100"
                            )}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                                        {cfg.icon}
                                    </div>
                                    {connected ? (
                                        <Badge
                                            variant="outline"
                                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold gap-1 py-0.5 px-2"
                                        >
                                            <CheckCircle2 className="w-3 h-3" /> Connected
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] text-zinc-400 py-0.5 px-2">
                                            Not Connected
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-bold text-sm text-foreground">{cfg.title}</h3>
                                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                                        {cfg.description}
                                    </p>
                                </div>

                                {connected && (
                                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2.5">
                                        <img
                                            src={connected.avatar_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"}
                                            alt={connected.account_name}
                                            className="w-7 h-7 rounded-full object-cover shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-xs text-foreground truncate">
                                                {connected.account_name}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 truncate">
                                                {connected.account_handle || `@${connected.platform}`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                                {connected ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDisconnect(connected.id, cfg.title)}
                                        className="w-full text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Disconnect
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => handleOpenConnect(cfg.platform)}
                                        className="w-full text-xs h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 font-semibold gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Connect Channel
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Connect Channel Modal */}
            {connectingPlatform && (
                <Dialog open={!!connectingPlatform} onOpenChange={() => setConnectingPlatform(null)}>
                    <DialogContent className="max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">
                                Connect {PLATFORM_SPECS[connectingPlatform]?.name}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Connect your profile or business page to start scheduling and publishing posts.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="acc-name" className="text-xs font-semibold">
                                    Account / Brand Name
                                </Label>
                                <Input
                                    id="acc-name"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    placeholder="e.g. HighReach Solutions"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="acc-handle" className="text-xs font-semibold">
                                    Handle / Username
                                </Label>
                                <Input
                                    id="acc-handle"
                                    value={accountHandle}
                                    onChange={(e) => setAccountHandle(e.target.value)}
                                    placeholder="e.g. @highreach"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConnectingPlatform(null)}
                                disabled={isSubmitting}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleConnectSubmit}
                                disabled={isSubmitting || !accountName.trim()}
                                className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 gap-1.5"
                            >
                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                Authorize & Connect
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
