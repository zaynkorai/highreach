import { createClient } from "@/lib/supabase/server";
import IntegrationsClient from "./integrations-client";

export default async function IntegrationsPage() {
    const supabase = await createClient();

    // Fetch current connected accounts
    const { data: accounts } = await supabase
        .from('external_accounts')
        .select('*');

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-foreground">Integrations</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Connect your external accounts to sync calendars and more.</p>
                </div>

                <div className="p-6">
                    <IntegrationsClient initialAccounts={accounts || []} />
                </div>
            </div>
        </div>
    );
}
