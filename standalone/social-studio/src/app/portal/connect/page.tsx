"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    verifyClientConnectTokenAction,
    connectChannelViaClientTokenAction,
} from "@/app/dashboard/social/actions";
import { PLATFORM_SPECS } from "@/lib/services/social-utils";
import type { SocialPlatform } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Plus,
    Sparkles,
    Radio,
    ExternalLink,
    Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConnectedClientChannel {
    platform: SocialPlatform;
    accountName: string;
    accountHandle: string;
    connectedAt: string;
}

const SUPPORTED_PORTAL_PLATFORMS: {
    id: SocialPlatform;
    name: string;
    description: string;
    icon: string;
    brandColor: string;
}[] = [
    {
        id: "linkedin",
        name: "LinkedIn",
        description: "Publish company updates & executive thought leadership",
        icon: "in",
        brandColor: "#0A66C2",
    },
    {
        id: "twitter",
        name: "X (formerly Twitter)",
        description: "Real-time microblogging, threads, and audience conversation",
        icon: "𝕏",
        brandColor: "#000000",
    },
    {
        id: "facebook",
        name: "Facebook Page",
        description: "Engage followers with visual posts and group milestones",
        icon: "f",
        brandColor: "#1877F2",
    },
    {
        id: "instagram",
        name: "Instagram",
        description: "Photo carousels, aesthetic highlights, and reels",
        icon: "📸",
        brandColor: "#E4405F",
    },
    {
        id: "threads",
        name: "Threads",
        description: "Meta conversational network for real-time discussion",
        icon: "@",
        brandColor: "#000000",
    },
    {
        id: "youtube",
        name: "YouTube Community",
        description: "Subscriber announcements, polls, and video teasers",
        icon: "▶",
        brandColor: "#FF0000",
    },
    {
        id: "tiktok",
        name: "TikTok",
        description: "Short-form video reach and viral organic growth",
        icon: "🎵",
        brandColor: "#000000",
    },
    {
        id: "skool",
        name: "Skool Community",
        description: "Discussion topics, course announcements, and community posts",
        icon: "🎒",
        brandColor: "#F59E0B",
    },
    {
        id: "whop",
        name: "Whop Marketplace",
        description: "Product drops, membership perks, and direct member alerts",
        icon: "🟠",
        brandColor: "#FF5C35",
    },
];

function ClientConnectPortalContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [isVerifying, setIsVerifying] = useState(true);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [clientData, setClientData] = useState<{ tenantId: string; clientName: string } | null>(null);

    // Selected platform & form state
    const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("linkedin");
    const [accountName, setAccountName] = useState("");
    const [accountHandle, setAccountHandle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [connectedList, setConnectedList] = useState<ConnectedClientChannel[]>([]);

    useEffect(() => {
        async function verify() {
            if (!token) {
                setTokenError("No authorization token provided. Please use the link provided by your agency.");
                setIsVerifying(false);
                return;
            }

            try {
                const res = await verifyClientConnectTokenAction(token);
                if (res.success && res.data) {
                    setClientData(res.data);
                    setAccountName(`${res.data.clientName} Official`);
                    setAccountHandle(`@${res.data.clientName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`);
                } else {
                    setTokenError(res.error || "This client connect link is invalid or has expired (links are valid for 7 days).");
                }
            } catch {
                setTokenError("Failed to verify access link. Please request a new invite.");
            } finally {
                setIsVerifying(false);
            }
        }

        verify();
    }, [token]);

    const handleConnectChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !accountName.trim() || !accountHandle.trim()) {
            toast.error("Please provide both account name and handle");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await connectChannelViaClientTokenAction(token, {
                platform: selectedPlatform,
                accountName: accountName.trim(),
                accountHandle: accountHandle.trim(),
                avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            });

            if (res.success) {
                toast.success(`${PLATFORM_SPECS[selectedPlatform]?.name} connected to agency workspace!`);
                setConnectedList((prev) => [
                    ...prev,
                    {
                        platform: selectedPlatform,
                        accountName: accountName.trim(),
                        accountHandle: accountHandle.trim(),
                        connectedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                ]);
                // Switch default to next unlinked platform if possible
                const nextPlatform = SUPPORTED_PORTAL_PLATFORMS.find(
                    (p) => p.id !== selectedPlatform && !connectedList.some((c) => c.platform === p.id)
                );
                if (nextPlatform) {
                    setSelectedPlatform(nextPlatform.id);
                }
            } else {
                toast.error(res.error || "Failed to link channel");
            }
        } catch {
            toast.error("Network error connecting channel");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-4">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                <p className="text-sm font-medium text-muted-foreground">
                    Verifying authorization link...
                </p>
            </div>
        );
    }

    if (tokenError || !clientData) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-5">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-foreground">Link Expired or Invalid</h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {tokenError || "This invite link is not valid or has expired after 7 days."}
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400">
                        Please contact your agency manager to request a new magic link.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
            {/* Top Branding Bar */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Secure Client Portal</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                    Connect Your Social Channels
                </h1>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                    Welcome, <strong className="text-foreground">{clientData.clientName}</strong>! Link your social media
                    profiles directly to your agency workspace. No HighReach login or password required.
                </p>
            </div>

            {/* Main Interactive Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Platform Selection & Link Form */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-lg">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Plus className="w-5 h-5 text-brand-600" />
                                <span>1. Select Platform to Authorize</span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Choose which channel you want to add to your brand management queue.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Platform Grid */}
                            <div className="grid grid-cols-3 gap-2.5">
                                {SUPPORTED_PORTAL_PLATFORMS.map((platform) => {
                                    const isSelected = selectedPlatform === platform.id;
                                    const isAlreadyConnected = connectedList.some((c) => c.platform === platform.id);

                                    return (
                                        <button
                                            key={platform.id}
                                            type="button"
                                            onClick={() => setSelectedPlatform(platform.id)}
                                            className={cn(
                                                "p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden",
                                                isSelected
                                                    ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 shadow-xs ring-2 ring-brand-500/20"
                                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                                            )}
                                        >
                                            <div className="flex items-center justify-between w-full mb-2">
                                                <div
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-xs"
                                                    style={{ backgroundColor: platform.brandColor }}
                                                >
                                                    {platform.icon}
                                                </div>
                                                {isAlreadyConnected && (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                )}
                                            </div>
                                            <div className="font-bold text-xs text-foreground truncate">
                                                {platform.name}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Connection Details Form */}
                            <form onSubmit={handleConnectChannel} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
                                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <span>2. Channel Details</span>
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                        {PLATFORM_SPECS[selectedPlatform]?.name}
                                    </Badge>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Account / Business Display Name</Label>
                                    <Input
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        placeholder="e.g. Acme Corp Official"
                                        className="h-10 text-xs rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Channel Handle or Public Profile URL</Label>
                                    <Input
                                        value={accountHandle}
                                        onChange={(e) => setAccountHandle(e.target.value)}
                                        placeholder="e.g. @acme_corp or linkedin.com/company/acme"
                                        className="h-10 text-xs rounded-xl"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !accountName.trim() || !accountHandle.trim()}
                                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-10 rounded-xl gap-2 mt-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Authorizing & Linking...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-4 h-4" />
                                            Authorize {PLATFORM_SPECS[selectedPlatform]?.name}
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Security info & Connected Channels Summary */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Security Badge Card */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Zero Password Access</h3>
                                <p className="text-xs text-muted-foreground">Tokens are encrypted and scoped to your brand.</p>
                            </div>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-2.5 pt-1">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>No agency login or shared passwords needed</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Access can be revoked at any time by your team</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Posts require approval according to your agency workflow</span>
                            </li>
                        </ul>
                    </div>

                    {/* Channels Connected This Session */}
                    <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                                    <span>Authorized Channels</span>
                                </CardTitle>
                                <Badge variant="secondary" className="text-[10px] font-bold">
                                    {connectedList.length} Connected
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {connectedList.length === 0 ? (
                                <div className="p-6 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-muted-foreground">
                                    No channels linked yet in this session. Select a platform on the left to begin.
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {connectedList.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between animate-in fade-in"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                                    style={{ backgroundColor: PLATFORM_SPECS[item.platform]?.brandColor }}
                                                >
                                                    {SUPPORTED_PORTAL_PLATFORMS.find((p) => p.id === item.platform)?.icon || "•"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-foreground truncate">
                                                        {item.accountName}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        {item.accountHandle}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                                                Active
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function ClientConnectPortalPage() {
    return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 flex flex-col">
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-sm tracking-tight text-foreground">
                        <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                            HR
                        </div>
                        <span>HighReach</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-muted-foreground font-semibold">
                            Client Connect
                        </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                        <span>Powered by HighReach Social Studio</span>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <Suspense
                    fallback={
                        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-4">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                            <p className="text-sm font-medium text-muted-foreground">
                                Loading client authorization portal...
                            </p>
                        </div>
                    }
                >
                    <ClientConnectPortalContent />
                </Suspense>
            </main>
            <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-muted-foreground">
                <p>HighReach Omnichannel Marketing & Social Studio</p>
            </footer>
        </div>
    );
}

