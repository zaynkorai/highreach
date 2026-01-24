"use client";

import { useState, useEffect, useRef } from "react";
import { Conversation, Message } from "@/types/inbox";
import { getMessages, sendMessage } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { useInboxStore, useInboxActions } from "@/stores/inbox-store";

interface InboxClientProps {
    initialConversations: Conversation[];
    tenantId: string;
}

export function InboxClient({ initialConversations, tenantId }: InboxClientProps) {
    const supabase = createClient();

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

    // Local state for input only
    const [newMessage, setNewMessage] = useState("");

    // Derived state
    const selectedConversation = conversations.find(c => c.id === selectedId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Hydrate Store on Mount
    useEffect(() => {
        setConversations(initialConversations);
        if (initialConversations.length > 0 && !selectedId) {
            setSelectedId(initialConversations[0].id);
        }
    }, [initialConversations, setConversations, selectedId, setSelectedId]);

    // 2. Realtime Subscriptions
    useEffect(() => {
        const channel = supabase
            .channel('inbox-updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `tenant_id=eq.${tenantId}` },
                (payload) => {
                    const newMsg = payload.new as Message;
                    // Store handles deduplication and selectedId check if we want
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

    // 3. Fetch Messages when Conversation Selected
    useEffect(() => {
        if (!selectedId) return;

        setIsLoadingMessages(true);
        getMessages(selectedId)
            .then(setMessages)
            .catch(console.error)
            .finally(() => setIsLoadingMessages(false));
    }, [selectedId, setMessages, setIsLoadingMessages]);

    // 4. Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedId || !selectedConversation) return;

        const content = newMessage;
        setNewMessage(""); // Optimistic clear

        // Optimistic append
        const optimisticMsg: Message = {
            id: "temp-" + Date.now(),
            tenant_id: selectedConversation.tenant_id,
            conversation_id: selectedId,
            direction: 'outbound',
            channel: 'sms',
            content,
            metadata: {},
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        // Directly add to store
        // We pass conversationId because our store action might want to check generic logic, 
        // though here we know it matches selectedId.
        addMessage(optimisticMsg, selectedId);

        try {
            await sendMessage(selectedId, content);
            // Real message will come via subscription
        } catch (error) {
            console.error("Failed to send", error);
        }
    };

    const getInitials = (contact: any) => {
        if (!contact) return "?";
        return (contact.first_name[0] + (contact.last_name?.[0] || "")).toUpperCase();
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
            {/* Conversation List */}
            <div className="w-1/3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-foreground">Inbox</h2>
                    <div className="mt-2 relative">
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                        <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400 text-sm">No conversations yet.</div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedId(conv.id)}
                                className={`p-4 border-b border-zinc-100 dark:border-white/[0.05] cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors ${selectedId === conv.id ? "bg-emerald-50/50 dark:bg-emerald-500/5" : ""
                                    }`}
                            >
                                <div className="flex gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border ${selectedId === conv.id
                                        ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10"
                                        }`}>
                                        {getInitials(conv.contact)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h3 className={`text-sm font-semibold truncate ${conv.unread_count > 0 ? "text-foreground dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}>
                                                {conv.contact?.first_name} {conv.contact?.last_name}
                                            </h3>
                                            <span className="text-xs text-zinc-400 whitespace-nowrap ml-2">
                                                {new Date(conv.last_message_at).toLocaleDateString() === new Date().toLocaleDateString()
                                                    ? formatTime(conv.last_message_at)
                                                    : new Date(conv.last_message_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${conv.unread_count > 0 ? "text-foreground dark:text-white font-medium" : "text-zinc-500 dark:text-zinc-500"}`}>
                                            {conv.last_message_preview || "No messages"}
                                        </p>
                                    </div>
                                    {conv.unread_count > 0 && (
                                        <div className="min-w-[0.625rem] h-2.5 rounded-full bg-emerald-500 mt-2"></div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm flex flex-col overflow-hidden">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-zinc-100 dark:border-white/[0.08] flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-200 dark:border-emerald-500/20">
                                    {getInitials(selectedConversation.contact)}
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-foreground">
                                        {selectedConversation.contact?.first_name} {selectedConversation.contact?.last_name}
                                    </h2>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedConversation.contact?.phone || selectedConversation.contact?.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-zinc-400 hover:text-foreground dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-50/30 dark:bg-black/20">
                            {isLoadingMessages ? (
                                <div className="text-center text-zinc-400 mt-10">Loading messages...</div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${msg.direction === "outbound"
                                            ? "bg-emerald-500 text-white rounded-br-none"
                                            : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-foreground dark:text-white rounded-bl-none"
                                            }`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.direction === "outbound" ? "text-emerald-100" : "text-zinc-400"
                                                }`}>{formatTime(msg.created_at)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-zinc-100 dark:border-white/[0.08] bg-white dark:bg-zinc-900">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSendMessage();
                                    }}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl transition-colors shadow-sm shadow-emerald-500/20 active:scale-95"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-400">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>
        </div>
    );
}
