import { getConversations } from "./actions";
import { InboxClient } from "./inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
    const result = await getConversations();

    if (!result.success || !result.data) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] gap-3 text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-lg">
                    !
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Failed to load conversations</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
                    {!result.success ? result.error : "An unexpected error occurred while loading conversations."}
                </p>
                <a
                    href="/dashboard/inbox"
                    className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-colors"
                >
                    Retry
                </a>
            </div>
        );
    }

    return <InboxClient initialConversations={result.data.conversations} tenantId={result.data.tenantId} />;
}
