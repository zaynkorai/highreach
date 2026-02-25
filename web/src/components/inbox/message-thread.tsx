import { Conversation, Message, ChannelType } from "@/types/inbox";
import { cn } from "@/lib/utils";
import { ThreadEmpty } from "./thread-empty";
import { ThreadHeader } from "./thread-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface MessageThreadProps {
    conversation: Conversation | undefined;
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (content: string, channel: ChannelType, isInternal: boolean, attachments: File[]) => Promise<void>;
    onStatusChange: (status: 'open' | 'closed') => void;
    onBack: () => void;
    onToggleSidebar: () => void;
    activePane: 'list' | 'thread' | 'info';
    className?: string;
    sidebarOpen: boolean;
}

export function MessageThread({
    conversation,
    messages,
    isLoading,
    onSendMessage,
    onStatusChange,
    onBack,
    onToggleSidebar,
    activePane,
    className,
    sidebarOpen
}: MessageThreadProps) {
    if (!conversation) {
        return <ThreadEmpty className={className} />;
    }

    return (
        <div className={cn(
            "flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden min-w-0 transition-all duration-300",
            activePane === 'list' && "hidden lg:flex",
            activePane === 'info' && "hidden xl:flex",
            className
        )}>
            <ThreadHeader
                conversation={conversation}
                onBack={onBack}
                onToggleSidebar={onToggleSidebar}
                onStatusChange={onStatusChange}
                sidebarOpen={sidebarOpen}
                activePane={activePane}
            />
            <MessageList
                messages={messages}
                isLoading={isLoading}
            />
            <MessageInput
                conversation={conversation}
                onSendMessage={onSendMessage}
            />
        </div>
    );
}
