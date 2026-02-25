import { getConversations } from "./actions";
import { InboxClient } from "./inbox-client";

export default async function InboxPage() {
    const result = await getConversations();

    if (!result.success || !result.data) {
        return (
            <div className="flex items-center justify-center h-full text-red-500">
                Failed to load conversations. Please try again later.
            </div>
        );
    }

    return <InboxClient initialConversations={result.data.conversations} tenantId={result.data.tenantId} />;
}
