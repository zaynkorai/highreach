"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    RefreshCw,
    Unlink,
    Loader2,
    Mail,
    Star,
    Copy,
    Check,
    X,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { disconnectIntegration, syncExternalCalendarNow } from "@/app/dashboard/calendars/actions";

interface ExternalAccount {
    id?: string;
    provider: string;
    provider_account_id: string;
    created_at: string;
}

export default function IntegrationsClient({
    initialAccounts,
    isSmsConfigured,
    isEmailConfigured = false,
    tenantPhone = null,
}: {
    initialAccounts: ExternalAccount[];
    isSmsConfigured: boolean;
    isEmailConfigured?: boolean;
    tenantPhone?: string | null;
}) {
    const searchParams = useSearchParams();
    const [accounts, setAccounts] = useState<ExternalAccount[]>(initialAccounts);
    const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
    const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
    const [isTelnyxModalOpen, setIsTelnyxModalOpen] = useState(false);
    const [copiedWebhook, setCopiedWebhook] = useState(false);

    useEffect(() => {
        setAccounts(initialAccounts);
    }, [initialAccounts]);

    useEffect(() => {
        const success = searchParams.get("success");
        const error = searchParams.get("error");

        if (success) {
            toast.success(`Successfully connected ${success} calendar`);
        }
        if (error) {
            toast.error(`Failed to connect ${error} calendar`);
        }
    }, [searchParams]);

    const handleSync = async (provider: "google" | "outlook", accountId?: string) => {
        if (!accountId) return;
        setSyncingProvider(provider);
        try {
            const res = await syncExternalCalendarNow(accountId);
            if (res.success) {
                toast.success(`Successfully synced ${provider} calendar`);
            } else {
                toast.error(res.error || `Failed to sync ${provider}`);
            }
        } catch (err: any) {
            toast.error(err.message || `Failed to sync ${provider}`);
        } finally {
            setSyncingProvider(null);
        }
    };

    const handleDisconnect = async (provider: "google" | "outlook") => {
        if (!confirm(`Are you sure you want to disconnect ${provider === "google" ? "Google Calendar" : "Outlook Calendar"}? Any linked calendars will stop syncing.`)) {
            return;
        }

        setDisconnectingProvider(provider);
        try {
            const res = await disconnectIntegration(provider);
            if (res.success) {
                toast.success(`Disconnected ${provider} calendar`);
                setAccounts((prev) => prev.filter((a) => a.provider !== provider));
            } else {
                toast.error(res.error || `Failed to disconnect ${provider}`);
            }
        } catch (err: any) {
            toast.error(err.message || `Failed to disconnect ${provider}`);
        } finally {
            setDisconnectingProvider(null);
        }
    };

    const copyWebhookUrl = () => {
        const url = `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/telnyx`;
        navigator.clipboard.writeText(url).catch(() => {});
        setCopiedWebhook(true);
        toast.success("Webhook URL copied to clipboard!");
        setTimeout(() => setCopiedWebhook(false), 2000);
    };

    const googleAccount = accounts.find((a) => a.provider === "google");
    const outlookAccount = accounts.find((a) => a.provider === "outlook");

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Calendar */}
                <div className="p-6 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center p-2.5">
                                <img
                                    src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png"
                                    alt="Google Calendar"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            {googleAccount ? (
                                <Badge variant="outline" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-none gap-1.5 py-1 px-3">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-zinc-100 dark:bg-white/5 text-zinc-500 border-none py-1 px-3">
                                    Not Connected
                                </Badge>
                            )}
                        </div>
                        <h3 className="font-bold text-foreground">Google Calendar</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                            Sync your appointments with Google Calendar and block busy slots automatically.
                        </p>
                        {googleAccount && (
                            <p className="text-xs font-medium text-zinc-400 mt-4 flex items-center gap-1.5">
                                Connected as: <span className="text-foreground">{googleAccount.provider_account_id}</span>
                            </p>
                        )}
                    </div>

                    <div className="mt-8">
                        {googleAccount ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-zinc-200 dark:border-white/10 gap-1.5 text-xs"
                                    onClick={() => handleSync("google", googleAccount.id)}
                                    disabled={syncingProvider === "google"}
                                >
                                    {syncingProvider === "google" ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    )}
                                    Sync Now
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 gap-1.5 text-xs"
                                    onClick={() => handleDisconnect("google")}
                                    disabled={disconnectingProvider === "google"}
                                >
                                    {disconnectingProvider === "google" ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Unlink className="w-3.5 h-3.5" />
                                    )}
                                    Disconnect
                                </Button>
                            </div>
                        ) : (
                            <Link href="/api/integrations/google/auth" prefetch={false}>
                                <Button className="w-full bg-primary hover:opacity-90 text-white shadow-lg shadow-primary/20">
                                    Connect Google
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Outlook Calendar */}
                <div className="p-6 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center p-2.5">
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg"
                                    alt="Outlook Calendar"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            {outlookAccount ? (
                                <Badge variant="outline" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-none gap-1.5 py-1 px-3">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-zinc-100 dark:bg-white/5 text-zinc-500 border-none py-1 px-3">
                                    Not Connected
                                </Badge>
                            )}
                        </div>
                        <h3 className="font-bold text-foreground">Outlook Calendar</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                            Sync your appointments with Microsoft Outlook and Office 365.
                        </p>
                        {outlookAccount && (
                            <p className="text-xs font-medium text-zinc-400 mt-4 flex items-center gap-1.5">
                                Connected as: <span className="text-foreground">{outlookAccount.provider_account_id}</span>
                            </p>
                        )}
                    </div>

                    <div className="mt-8">
                        {outlookAccount ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-zinc-200 dark:border-white/10 gap-1.5 text-xs"
                                    onClick={() => handleSync("outlook", outlookAccount.id)}
                                    disabled={syncingProvider === "outlook"}
                                >
                                    {syncingProvider === "outlook" ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    )}
                                    Sync Now
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 gap-1.5 text-xs"
                                    onClick={() => handleDisconnect("outlook")}
                                    disabled={disconnectingProvider === "outlook"}
                                >
                                    {disconnectingProvider === "outlook" ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Unlink className="w-3.5 h-3.5" />
                                    )}
                                    Disconnect
                                </Button>
                            </div>
                        ) : (
                            <Link href="/api/integrations/outlook/auth" prefetch={false}>
                                <Button className="w-full bg-primary hover:opacity-90 text-white shadow-lg shadow-primary/20">
                                    Connect Outlook
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Telnyx SMS */}
                <div className="p-6 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center p-2.5">
                                <MessageSquare className="w-6 h-6 text-brand-500" />
                            </div>
                            {isSmsConfigured ? (
                                <Badge variant="outline" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-none gap-1.5 py-1 px-3">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-red-50 dark:bg-red-500/10 text-red-500 border-none py-1 px-3 gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> Missing API Key
                                </Badge>
                            )}
                        </div>
                        <h3 className="font-bold text-foreground">Telnyx SMS & Calls</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                            Send and receive SMS messages directly through your business number with missed-call auto-texting.
                        </p>
                        {tenantPhone && (
                            <p className="text-xs font-medium text-zinc-400 mt-3">
                                Business Number: <span className="text-foreground font-mono">{tenantPhone}</span>
                            </p>
                        )}
                        {!isSmsConfigured && (
                            <p className="text-[10px] font-bold text-red-500 mt-4 uppercase tracking-widest bg-red-50 dark:bg-red-500/5 p-2 rounded-lg border border-red-100 dark:border-red-500/10 flex items-center gap-2">
                                Set TELNYX_API_KEY in environment
                            </p>
                        )}
                    </div>

                    <div className="mt-8">
                        <Button
                            variant="outline"
                            className="w-full border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5"
                            onClick={() => setIsTelnyxModalOpen(true)}
                        >
                            View Configuration Details
                        </Button>
                    </div>
                </div>

                {/* Resend Email */}
                <div className="p-6 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center p-2.5">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            {isEmailConfigured ? (
                                <Badge variant="outline" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-none gap-1.5 py-1 px-3">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none py-1 px-3 gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> Optional / Unset
                                </Badge>
                            )}
                        </div>
                        <h3 className="font-bold text-foreground">Resend Email Gateway</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                            Sends transactional emails, booking reminders, team invitations, and review requests.
                        </p>
                        <p className="text-xs text-zinc-400 mt-3">
                            Sender: <span className="text-foreground font-mono">onboarding@resend.dev</span>
                        </p>
                    </div>

                    <div className="mt-8">
                        <Button
                            variant="outline"
                            className="w-full border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5"
                            onClick={() => {
                                if (isEmailConfigured) {
                                    toast.success("Resend API key is active. All system emails are being delivered.");
                                } else {
                                    toast.info("Add RESEND_API_KEY to .env to enable email sending.");
                                }
                            }}
                        >
                            {isEmailConfigured ? "Service Healthy" : "Setup Instructions"}
                        </Button>
                    </div>
                </div>

                {/* Google Reviews Hub */}
                <div className="p-6 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center p-2.5">
                                <Star className="w-6 h-6 text-amber-500" />
                            </div>
                            <Badge variant="outline" className="bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-none py-1 px-3">
                                Reputation Hub
                            </Badge>
                        </div>
                        <h3 className="font-bold text-foreground">Google Business & Reviews</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                            Connect your Google Business Profile to track incoming customer reviews and automate 5-star requests.
                        </p>
                    </div>

                    <div className="mt-8">
                        <Link href="/dashboard/reputation">
                            <Button variant="outline" className="w-full border-zinc-200 dark:border-white/10 gap-1.5">
                                Manage Reputation & Reviews <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>


            </div>

            {/* Telnyx Configuration Modal */}
            {isTelnyxModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-brand-100 dark:bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-foreground text-base">Telnyx SMS Configuration</h3>
                            </div>
                            <button
                                onClick={() => setIsTelnyxModalOpen(false)}
                                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Webhook URL (Inbound SMS & Calls)
                                </label>
                                <div className="mt-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/telnyx`}
                                        className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono select-all"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={copyWebhookUrl}
                                        className="shrink-0 gap-1 text-xs"
                                    >
                                        {copiedWebhook ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" /> Copy
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 text-xs leading-relaxed">
                                <div className="font-semibold text-foreground">Setup Checklist:</div>
                                <ol className="list-decimal pl-4 space-y-1 text-zinc-500 dark:text-zinc-400">
                                    <li>Create a Messaging Profile in the Telnyx Portal.</li>
                                    <li>Set the Webhook URL above as the destination for <code className="text-primary font-mono text-[11px]">message.received</code>.</li>
                                    <li>Assign your phone number to the profile.</li>
                                    <li>Ensure your API Key is present in <code className="text-primary font-mono text-[11px]">TELNYX_API_KEY</code>.</li>
                                </ol>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button onClick={() => setIsTelnyxModalOpen(false)}>
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

