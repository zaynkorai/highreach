"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Conversation, Message, ChannelType } from "@/types/inbox";
import { getMessages, sendMessage, updateConversationStatus } from "./actions";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useInboxStore, useInboxActions } from "@/stores/inbox-store";
import { ConversationList } from "@/components/inbox/conversation-list";
import { MessageThread } from "@/components/inbox/message-thread";
import { ContactSidebar } from "@/components/inbox/contact-sidebar";

interface InboxClientProps {
    initialConversations: Conversation[];
    tenantId: string;
}

export function InboxClient({ initialConversations, tenantId }: InboxClientProps) {
    const supabase = createClient();
    const router = useRouter();

    // Zustand Store
    const conversations = useInboxStore((state) => state.conversations);
    const selectedId = useInboxStore((state) => state.selectedId);
    const messages = useInboxStore((state) => state.messages);
    const isLoadingMessages = useInboxStore((state) => state.isLoadingMessages);

    const {
        setConversations,
        setSelectedId,
        setMessages,
        addMessage,
        updateConversation,
        setIsLoadingMessages
    } = useInboxActions();

    // Local state
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activePane, setActivePane] = useState<'list' | 'thread' | 'info'>('list');

    // Derived state
    const selectedConversation = conversations.find(c => c.id === selectedId);

    // Sync active pane with selection
    useEffect(() => {
        if (selectedId) {
            setActivePane('thread');
        }
    }, [selectedId]);

    // Hydration
    useEffect(() => {
        setConversations(initialConversations);
        // On mobile, don't auto-select if we want to stay on the list
        if (initialConversations.length > 0 && !selectedId && typeof window !== 'undefined' && window.innerWidth > 1024) {
            setSelectedId(initialConversations[0].id);
        }
    }, [initialConversations, setConversations, selectedId, setSelectedId]);

    // Subscriptions
    useEffect(() => {
        const channel = supabase
            .channel('inbox-updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `tenant_id=eq.${tenantId}` },
                (payload) => {
                    const newMsg = payload.new as Message;
                    addMessage(newMsg, newMsg.conversation_id);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `tenant_id=eq.${tenantId}` },
                (payload) => {
                    const updatedConv = payload.new as Conversation;
                    updateConversation(updatedConv);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId, supabase, addMessage, updateConversation]);

    // Message Fetch
    useEffect(() => {
        if (!selectedId) return;
        setIsLoadingMessages(true);
        getMessages(selectedId)
            .then(result => {
                if (result.success && result.data) {
                    setMessages(result.data);
                } else if (!result.success) {
                    toast.error(result.error || "Failed to load messages");
                }
            })
            .catch(() => toast.error("An unexpected error occurred while loading messages"))
            .finally(() => setIsLoadingMessages(false));
    }, [selectedId, setMessages, setIsLoadingMessages]);


    const handleSendMessage = async (content: string, channel: ChannelType, isInternal: boolean, attachments: File[]) => {
        if (!selectedId || !selectedConversation) return;

        let finalContent = content;
        if (attachments.length > 0) {
            const fileNames = attachments.map(f => `[FILE: ${f.name}]`).join(' ');
            finalContent = finalContent ? `${finalContent}\n${fileNames}` : fileNames;
        }

        // Optimistic
        const optimisticMsg: Message = {
            id: "temp-" + Date.now(),
            tenant_id: selectedConversation.tenant_id,
            conversation_id: selectedId,
            direction: 'outbound',
            channel: channel,
            content: finalContent,
            is_internal: isInternal,
            metadata: {},
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        addMessage(optimisticMsg, selectedId);

        try {
            const result = await sendMessage(selectedId, finalContent, channel, isInternal);
            if (!result.success) {
                toast.error(result.error || "Failed to send message");
            }
        } catch (error) {
            console.error("Failed to send", error);
            toast.error("An unexpected error occurred");
        }
    };

    const handleStatusChange = async (newStatus: 'open' | 'closed') => {
        if (!selectedId || !selectedConversation) return;

        // Optimistic Update
        updateConversation({ ...selectedConversation, status: newStatus });

        if (newStatus === 'closed') {
            toast.success("Conversation resolved");
        } else {
            toast.success("Conversation reopened");
        }

        const result = await updateConversationStatus(selectedId, newStatus);
        if (!result.success) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-6rem)] -m-4 md:-m-6 flex bg-zinc-50/50 dark:bg-black overflow-hidden border-t border-zinc-200 dark:border-zinc-800 relative">
            <ConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={(id) => {
                    setSelectedId(id);
                    setActivePane('thread');
                }}
                activePane={activePane}
            />

            <MessageThread
                conversation={selectedConversation}
                messages={messages}
                isLoading={isLoadingMessages}
                onSendMessage={handleSendMessage}
                onStatusChange={handleStatusChange}
                onBack={() => setActivePane('list')}
                onToggleSidebar={() => {
                    if (window.innerWidth < 1280) {
                        setActivePane('info');
                    } else {
                        setSidebarOpen(!sidebarOpen);
                    }
                }}
                activePane={activePane}
                sidebarOpen={sidebarOpen}
            />

            {selectedConversation && (sidebarOpen || activePane === 'info') && (
                <ContactSidebar
                    conversation={selectedConversation}
                    activePane={activePane}
                    sidebarOpen={sidebarOpen}
                    onCloseMobile={() => setActivePane('thread')}
                />
            )}
        </div>
    );
}
