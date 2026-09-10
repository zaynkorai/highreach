"use client";

import React, { useState } from "react";
import { useSocialClientConnect, useSocialActions } from "@/stores/social-store";
import { connectChannelViaClientTokenAction } from "@/app/dashboard/social/actions";
import { PLATFORM_SPECS } from "@/lib/services/social.service";
import type { SocialPlatform } from "@/lib/types/database";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Link2,
    Copy,
    Check,
    ShieldCheck,
    UserPlus,
    Sparkles,
    Radio,
    ExternalLink,
    Loader2,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CLIENT_ACCESSIBLE_PLATFORMS: { id: SocialPlatform; name: string; icon: string }[] = [
    { id: "linkedin", name: "LinkedIn", icon: "in" },
    { id: "twitter", name: "X (Twitter)", icon: "𝕏" },
    { id: "facebook", name: "Facebook", icon: "f" },
    { id: "instagram", name: "Instagram", icon: "📸" },
    { id: "youtube", name: "YouTube", icon: "▶" },
    { id: "skool", name: "Skool", icon: "🎒" },
    { id: "whop", name: "Whop", icon: "🟠" },
    { id: "tiktok", name: "TikTok", icon: "🎵" },
];

export function ClientConnectModal() {
    const { isOpen, tokenData, close, generate } = useSocialClientConnect();
    const { fetchAccounts } = useSocialActions();

    const [clientName, setClientName] = useState("Horizon Media Client");
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<"link" | "preview">("link");

    // Client Preview Simulator State
    const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>("linkedin");
    const [accountHandle, setAccountHandle] = useState("@horizon_ceo");
    const [isConnectingClient, setIsConnectingClient] = useState(false);
    const [connectedSuccess, setConnectedSuccess] = useState(false);

    const magicUrl = tokenData
        ? `${typeof window !== "undefined" ? window.location.origin : "https://app.highreach.io"}/portal/connect?token=${tokenData.token}`
        : "";

    const handleGenerate = async () => {
        if (!clientName.trim()) {
            toast.error("Please enter a client name");
            return;
        }
        setIsGenerating(true);
        try {
            await generate(clientName.trim());
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (!magicUrl) return;
        navigator.clipboard.writeText(magicUrl);
        setCopied(true);
        toast.success("Client onboarding link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSimulateClientConnect = async () => {
        if (!tokenData) return;
        setIsConnectingClient(true);
        try {
            const res = await connectChannelViaClientTokenAction(tokenData.token, {
                platform: selectedPlatform,
                accountName: `${clientName} Official`,
                accountHandle: accountHandle.trim() || undefined,
                avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            });

            if (res.success) {
                setConnectedSuccess(true);
                toast.success(`Client channel ${selectedPlatform} attached to workspace!`);
                await fetchAccounts();
                setTimeout(() => setConnectedSuccess(false), 3500);
            } else {
                toast.error(res.error || "Connection failed");
            }
        } catch {
            toast.error("Error attaching client channel");
        } finally {
            setIsConnectingClient(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent className="max-w-xl p-0 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                <span>Client Channel Onboarding</span>
                                <Badge className="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border-brand-200 text-[10px]">
                                    No Login Required
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-400">
                                Send a private link so clients can connect their socials securely without sharing passwords
                            </DialogDescription>
                        </div>
                    </div>

                    {/* View Mode Switcher */}
                    <div className="flex items-center gap-2 pt-3">
                        <button
                            type="button"
                            onClick={() => setActiveTab("link")}
                            className={cn(
                                "text-xs font-bold px-3 py-1.5 rounded-lg transition-all",
                                activeTab === "link"
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                                    : "text-zinc-500 hover:text-foreground"
                            )}
                        >
                            1. Generate Link
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("preview")}
                            className={cn(
                                "text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                                activeTab === "preview"
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                                    : "text-zinc-500 hover:text-foreground"
                            )}
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>2. Preview Client Experience</span>
                        </button>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {activeTab === "link" && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-xs space-y-1">
                                    <p className="font-bold text-foreground">Zero Password Sharing & No Seat Fees</p>
                                    <p className="text-zinc-500 leading-relaxed">
                                        Clients simply click your magic link, authorize their accounts, and they instantly attach to your HighReach Social Studio. The client never gets access to your CRM or other clients' channels.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                                    Client or Company Name
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        placeholder="Acme Growth Corp"
                                        className="h-9 text-xs"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="h-9 px-4 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shrink-0"
                                    >
                                        {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Link2 className="w-3.5 h-3.5 mr-1" />}
                                        Generate Link
                                    </Button>
                                </div>
                            </div>

                            {magicUrl && (
                                <div className="space-y-2 pt-2 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                                            Unique Client Connect Link (Valid for 7 days)
                                        </Label>
                                        <span className="text-[10px] text-zinc-400 font-mono">
                                            Token: {tokenData?.token.slice(0, 16)}...
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={magicUrl}
                                            readOnly
                                            className="h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-950/60"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleCopy}
                                            className="h-9 px-4 text-xs font-bold shrink-0 gap-1.5"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copied ? "Copied" : "Copy Link"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "preview" && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                    <span className="text-xs font-bold text-foreground">
                                        Client Portal: Connect to {clientName} Workspace
                                    </span>
                                    <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px] border-0">
                                        Client View
                                    </Badge>
                                </div>

                                <p className="text-xs text-zinc-500">
                                    Select which channel you would like to connect for automated scheduling and performance reporting:
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                    {CLIENT_ACCESSIBLE_PLATFORMS.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedPlatform(p.id)}
                                            className={cn(
                                                "p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all",
                                                selectedPlatform === p.id
                                                    ? "bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs"
                                                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-zinc-300"
                                            )}
                                        >
                                            <span className="text-base">{p.icon}</span>
                                            <span className="truncate">{p.name}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                                        Account Handle or Profile URL
                                    </Label>
                                    <Input
                                        value={accountHandle}
                                        onChange={(e) => setAccountHandle(e.target.value)}
                                        placeholder="@handle or profile URL"
                                        className="h-8 text-xs bg-white dark:bg-zinc-900"
                                    />
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleSimulateClientConnect}
                                    disabled={isConnectingClient || !tokenData}
                                    className="w-full h-9 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white gap-2"
                                >
                                    {isConnectingClient ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Authorizing...
                                        </>
                                    ) : (
                                        <>
                                            <Radio className="w-3.5 h-3.5" /> Authorize & Connect to Workspace
                                        </>
                                    )}
                                </Button>

                                {connectedSuccess && (
                                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>Account verified and connected to your agency workspace!</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-zinc-50/60 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
                    <Button
                        size="sm"
                        onClick={close}
                        className="text-xs px-5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 font-bold"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
