"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface ExternalAccount {
    provider: string;
    provider_account_id: string;
    created_at: string;
}

export default function IntegrationsClient({ initialAccounts, isSmsConfigured }: { initialAccounts: ExternalAccount[], isSmsConfigured: boolean }) {
    const searchParams = useSearchParams();

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success) {
            toast.success(`Successfully connected ${success}`);
        }
        if (error) {
            toast.error(`Failed to connect ${error}`);
        }
    }, [searchParams]);

    const googleAccount = initialAccounts.find(a => a.provider === 'google');
    const outlookAccount = initialAccounts.find(a => a.provider === 'outlook');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google Calendar */}
            <div className="p-6 rounded-2xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 flex items-center justify-center p-2.5">
                            <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" alt="Google Calendar" className="w-full h-full object-contain" />
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
                        Sync your appointments with Google Calendar and block busy slots.
                    </p>
                    {googleAccount && (
                        <p className="text-xs font-medium text-zinc-400 mt-4 flex items-center gap-1.5">
                            Connected as: <span className="text-foreground">{googleAccount.provider_account_id}</span>
                        </p>
                    )}
                </div>

                <div className="mt-8">
                    {googleAccount ? (
                        <Button variant="outline" className="w-full border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5" disabled>
                            Manage Connection
                        </Button>
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
                            <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook Calendar" className="w-full h-full object-contain" />
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
                        <Button variant="outline" className="w-full border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5" disabled>
                            Manage Connection
                        </Button>
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
                    <h3 className="font-bold text-foreground">Telnyx SMS</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        Send and receive SMS messages directly through your business number.
                    </p>
                    {!isSmsConfigured && (
                        <p className="text-[10px] font-bold text-red-500 mt-4 uppercase tracking-widest bg-red-50 dark:bg-red-500/5 p-2 rounded-lg border border-red-100 dark:border-red-500/10 flex items-center gap-2">
                            Set TELNYX_API_KEY in environment
                        </p>
                    )}
                </div>

                <div className="mt-8">
                    <Button variant="outline" className="w-full border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5" disabled={!isSmsConfigured}>
                        {isSmsConfigured ? "View Settings" : "Requires Configuration"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
