"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Conversation, Message, ChannelType } from "@/types/inbox";
import { getConversations, getMessages, sendMessage, updateConversationStatus } from "./actions";
import { toast } from "sonner";
import { useInboxStore, useInboxActions } from "@/stores/inbox-store";
import { ConversationList } from "@/components/inbox/conversation-list";
import { MessageThread } from "@/components/inbox/message-thread";
import { ContactSidebar } from "@/components/inbox/contact-sidebar";

interface InboxClientProps {
    initialConversations: Conversation[];
    tenantId: string;
}

export function InboxClient({ initialConversations, tenantId }: InboxClientProps) {
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

    // Sync selected conversation with URL
    useEffect(() => {
        if (selectedId) {
            router.replace(`/dashboard/inbox?id=${selectedId}`, { scroll: false });
        }
    }, [selectedId, router]);

    // Hydration
    useEffect(() => {
        setConversations(initialConversations);
        // On mobile, don't auto-select if we want to stay on the list
        if (initialConversations.length > 0 && !selectedId && typeof window !== 'undefined' && window.innerWidth > 1024) {
            setSelectedId(initialConversations[0].id);
        }
    }, [initialConversations, setConversations, selectedId, setSelectedId]);

    // Adaptive Smart Polling for live updates
    useEffect(() => {
        let isMounted = true;
        let isPolling = false;
        let lastActivity = Date.now();

        const onUserActivity = () => {
            lastActivity = Date.now();
        };

        window.addEventListener("mousemove", onUserActivity, { passive: true });
        window.addEventListener("keydown", onUserActivity, { passive: true });
        window.addEventListener("click", onUserActivity, { passive: true });

        const pollUpdates = async () => {
            if (isPolling || !isMounted) return;
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
                return;
            }

            isPolling = true;
            try {
                const res = await getConversations();
                if (isMounted && res.success && res.data) {
                    setConversations(res.data.conversations);
                }
                if (isMounted && selectedId) {
                    const msgRes = await getMessages(selectedId);
                    if (isMounted && msgRes.success && msgRes.data) {
                        setMessages(msgRes.data);
                    }
                }
            } catch {
                // Ignore transient network errors during background polling
            } finally {
                isPolling = false;
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                lastActivity = Date.now();
                pollUpdates();
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        // Adaptive tick timer: 6s when active, backs off when idle (>60s)
        const intervalId = setInterval(() => {
            const idleSeconds = (Date.now() - lastActivity) / 1000;
            if (idleSeconds > 60) {
                // Poll less frequently when user is idle
                if (Math.random() < 0.3) {
                    pollUpdates();
                }
            } else {
                pollUpdates();
            }
        }, 6000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("mousemove", onUserActivity);
            window.removeEventListener("keydown", onUserActivity);
            window.removeEventListener("click", onUserActivity);
        };
    }, [selectedId, setConversations, setMessages]);

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
