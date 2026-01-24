"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Conversation, Message, ChannelType } from "@/types/inbox";
import { getMessages, sendMessage } from "./actions";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useInboxStore, useInboxActions } from "@/stores/inbox-store";
import {
    Search,
    Filter,
    MoreVertical,
    Phone,
    Mail,
    MessageSquare,
    Info,
    Send,
    Paperclip,
    Smile,
    User,
    CheckCheck,
    Clock,
    Tag,
    Calendar,
    StickyNote,
    Sparkles,
    ChevronRight,
    ArrowLeft,
    Plus,
    Star,
    UserPlus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface InboxClientProps {
    initialConversations: Conversation[];
    tenantId: string;
}

export function InboxClient({ initialConversations, tenantId }: InboxClientProps) {
    const supabase = createClient();
    const router = useRouter(); // Error: need to import useRouter

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
    const [newMessage, setNewMessage] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // References
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Derived state
    const selectedConversation = conversations.find(c => c.id === selectedId);

    const filteredConversations = conversations.filter(c => {
        if (searchQuery) {
            const name = `${c.contact?.first_name} ${c.contact?.last_name}`.toLowerCase();
            if (!name.includes(searchQuery.toLowerCase())) return false;
        }
        if (activeFilter === "unread") return c.unread_count > 0;
        return true;
    });

    // Hydration
    useEffect(() => {
        setConversations(initialConversations);
        if (initialConversations.length > 0 && !selectedId) {
            setSelectedId(initialConversations[0].id);
        }
    }, [initialConversations, setConversations]);

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
    }, [tenantId, supabase]);

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

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedId || !selectedConversation) return;

        const content = newMessage;
        const channel = selectedConversation.channel || 'sms';
        setNewMessage("");

        // Optimistic
        const optimisticMsg: Message = {
            id: "temp-" + Date.now(),
            tenant_id: selectedConversation.tenant_id,
            conversation_id: selectedId,
            direction: 'outbound',
            channel: channel,
            content,
            is_internal: isInternalNote,
            metadata: {},
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        addMessage(optimisticMsg, selectedId);

        try {
            const result = await sendMessage(selectedId, content, channel, isInternalNote);
            if (!result.success) {
                toast.error(result.error || "Failed to send message");
                // In a real app, we might want to remove the optimistic message or show a "retry" state
            }
        } catch (error) {
            console.error("Failed to send", error);
            toast.error("An unexpected error occurred");
        }
    };

    const getInitials = (contact: any) => {
        if (!contact) return "?";
        return (contact.first_name[0] + (contact.last_name?.[0] || "")).toUpperCase();
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getChannelIcon = (channel: ChannelType) => {
        switch (channel) {
            case 'sms': return <Phone className="h-3 w-3" />;
            case 'email': return <Mail className="h-3 w-3" />;
            case 'whatsapp': return <MessageSquare className="h-3 w-3 text-green-500" />;
            default: return <MessageSquare className="h-3 w-3" />;
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] -m-6 flex bg-zinc-50/50 dark:bg-black overflow-hidden border-t border-zinc-200 dark:border-zinc-800">

            {/* PANE 1: Conversation List */}
            <div className="w-80 sm:w-96 flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Inbox</h1>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Filter by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-emerald-500/20"
                        />
                    </div>

                    <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-8 bg-zinc-100 dark:bg-zinc-900 p-1">
                            <TabsTrigger value="all" className="text-[10px] uppercase tracking-wider font-bold">All</TabsTrigger>
                            <TabsTrigger value="unread" className="text-[10px] uppercase tracking-wider font-bold">Unread</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 custom-scrollbar">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-400">
                            <p className="text-sm">No conversations found</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedId(conv.id)}
                                className={cn(
                                    "p-4 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 flex gap-3 relative",
                                    selectedId === conv.id && "bg-emerald-50/50 dark:bg-emerald-500/5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-emerald-500"
                                )}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                        {getInitials(conv.contact)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-zinc-950 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        {getChannelIcon(conv.channel)}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h3 className={cn(
                                            "text-sm font-semibold truncate",
                                            conv.unread_count > 0 ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
                                        )}>
                                            {conv.contact?.first_name} {conv.contact?.last_name}
                                        </h3>
                                        <span className="text-[10px] uppercase font-bold text-zinc-400 whitespace-nowrap ml-2">
                                            {formatTime(conv.last_message_at)}
                                        </span>
                                    </div>
                                    <p className={cn(
                                        "text-xs truncate",
                                        conv.unread_count > 0 ? "text-zinc-900 dark:text-zinc-200 font-medium" : "text-zinc-500 dark:text-zinc-500"
                                    )}>
                                        {conv.last_message_preview || "No messages"}
                                    </p>
                                </div>
                                {conv.unread_count > 0 && (
                                    <div className="self-center ml-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* PANE 2: Message Thread */}
            <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden min-w-0">
                {selectedConversation ? (
                    <>
                        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Button variant="ghost" size="icon" className="sm:hidden -ml-2">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
                                    {getInitials(selectedConversation.contact)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                        {selectedConversation.contact?.first_name} {selectedConversation.contact?.last_name}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full">
                                                <Star className="h-4 w-4 text-zinc-400" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Star Conversation</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 rounded-lg gap-2 text-xs border-zinc-200 dark:border-zinc-800">
                                                <UserPlus className="h-3.5 w-3.5" />
                                                Assign
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Assign Agent</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full">
                                                <Phone className="h-4 w-4 text-zinc-400 hover:text-emerald-500" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Start Voice Call</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("rounded-full", sidebarOpen && "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10")}
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                >
                                    <Info className="h-4 w-4 shrink-0" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 dark:bg-zinc-900/10 custom-scrollbar">
                            {isLoadingMessages ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-400">
                                    <Clock className="h-8 w-8 animate-spin-slow" />
                                    <p className="text-sm font-medium">Loading history...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {/* Date Divider */}
                                    <div className="flex justify-center">
                                        <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Today</span>
                                    </div>

                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-2">
                                            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
                                                <MessageSquare className="h-5 w-5 opacity-20" />
                                            </div>
                                            <p className="text-xs">No messages in this thread yet.</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    "flex group max-w-[85%]",
                                                    msg.direction === "outbound" ? "ml-auto" : "mr-auto"
                                                )}
                                            >
                                                <div className={cn(
                                                    "relative px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                                                    msg.is_internal
                                                        ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-amber-900 dark:text-amber-200 italic"
                                                        : msg.direction === "outbound"
                                                            ? "bg-emerald-600 dark:bg-emerald-600 text-white rounded-br-none"
                                                            : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-bl-none"
                                                )}>
                                                    {msg.is_internal && (
                                                        <div className="flex items-center gap-2 mb-1 border-b border-amber-200/50 pb-1">
                                                            <StickyNote className="h-3 w-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-tight">Internal Note</span>
                                                        </div>
                                                    )}
                                                    <p className="leading-relaxed">{msg.content}</p>
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 mt-1.5 flex-row-reverse",
                                                        msg.direction === "outbound" ? "text-emerald-100" : "text-zinc-400"
                                                    )}>
                                                        <span className="text-[9px] font-bold">{formatTime(msg.created_at)}</span>
                                                        {msg.direction === "outbound" && !msg.is_internal && <CheckCheck className="h-3 w-3" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input Area 2.0 */}
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <Tabs value={isInternalNote ? "internal" : "message"} onValueChange={(val) => setIsInternalNote(val === "internal")} className="w-auto">
                                    <TabsList className="bg-transparent border border-zinc-200 dark:border-zinc-800 h-7 p-0 gap-0">
                                        <TabsTrigger value="message" className="h-7 text-[10px] uppercase font-bold rounded-none data-[state=active]:bg-emerald-500 data-[state=active]:text-white px-3">Message</TabsTrigger>
                                        <TabsTrigger value="internal" className="h-7 text-[10px] uppercase font-bold rounded-none data-[state=active]:bg-amber-500 data-[state=active]:text-white px-3">Internal Note</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
                                <Badge variant="outline" className="h-7 border-zinc-200 dark:border-zinc-800 transform scale-90 -ml-2 text-[9px] uppercase font-bold gap-1.5">
                                    {getChannelIcon(selectedConversation.channel)}
                                    {selectedConversation.channel}
                                </Badge>
                            </div>

                            <div className="relative group">
                                <textarea
                                    rows={2}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isInternalNote ? "Type an internal note (only team sees this)..." : "Type a message..."}
                                    className={cn(
                                        "w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-4 pr-16 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none shadow-sm",
                                        isInternalNote && "focus:ring-amber-500/20 focus:border-amber-500 bg-amber-50/30 dark:bg-amber-900/5"
                                    )}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        className={cn(
                                            "h-8 w-8 rounded-xl transition-all shadow-md active:scale-90 p-0",
                                            isInternalNote
                                                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                                                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                        )}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Smart Tools Footer */}
                            <div className="flex items-center gap-4 mt-3 px-1 text-zinc-500">
                                <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider hover:text-emerald-500 transition-colors">
                                    <Smile className="h-3.5 w-3.5" />
                                    Emoji
                                </button>
                                <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider hover:text-emerald-500 transition-colors">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    AI Draft
                                </button>
                                <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider hover:text-emerald-500 transition-colors ml-auto">
                                    <Clock className="h-3.5 w-3.5" />
                                    Schedule Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-4 bg-zinc-50/20 dark:bg-zinc-950/20">
                        <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/5">
                            <MessageSquare className="h-10 w-10 text-zinc-200 dark:text-zinc-800" />
                        </div>
                        <p className="text-sm font-medium">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>

            {/* PANE 3: Contact Context Sidebar */}
            {selectedConversation && sidebarOpen && (
                <div className="w-[320px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Profile Header */}
                        <div className="p-8 flex flex-col items-center text-center border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/20">
                            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-emerald-500/10 mb-4 border-4 border-white dark:border-zinc-950">
                                {getInitials(selectedConversation.contact)}
                            </div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                {selectedConversation.contact?.first_name} {selectedConversation.contact?.last_name}
                            </h2>
                            <p className="text-xs text-zinc-500 font-medium mt-1">Acquisition Lead • San Francisco, CA</p>

                            <div className="flex gap-2 mt-6">
                                <Button size="sm" variant="outline" className="h-9 rounded-xl border-zinc-200 dark:border-zinc-800 gap-2">
                                    <Phone className="h-3.5 w-3.5" /> Call
                                </Button>
                                <Button size="sm" className="h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 gap-2">
                                    <Calendar className="h-3.5 w-3.5" /> Book
                                </Button>
                            </div>
                        </div>

                        {/* Details Sections */}
                        <div className="p-6 space-y-8">
                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 flex items-center gap-2">
                                    <Info className="h-3 w-3" /> Contact Information
                                </h4>
                                <div className="space-y-1.5">
                                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-zinc-400" />
                                        <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate">{selectedConversation.contact?.email || 'No email provided'}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-zinc-400" />
                                        <span className="text-xs text-zinc-600 dark:text-zinc-300">{selectedConversation.contact?.phone || 'No phone provided'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Tags */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 flex items-center gap-2">
                                        <Tag className="h-3 w-3" /> Recent Tags
                                    </h4>
                                    <Plus className="h-3 w-3 text-zinc-400 cursor-pointer hover:text-emerald-500" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedConversation.contact?.tags || ['Warm Lead', 'Enterprise', 'Follow-up']).map(tag => (
                                        <Badge key={tag} variant="secondary" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Upcoming Appointment */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase">Next Meeting</span>
                                </div>
                                <p className="text-sm font-bold mb-1">Product Demo Call</p>
                                <p className="text-[11px] opacity-80">Tomorrow at 10:00 AM</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-900">
                        <Button variant="ghost" className="w-full text-xs font-bold uppercase justify-between text-zinc-500 group">
                            Full CRM Profile
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
// End of file
