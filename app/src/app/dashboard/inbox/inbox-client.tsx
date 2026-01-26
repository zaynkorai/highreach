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
    const [sidebarOpen, setSidebarOpen] = useState(false); // Default false for better mobile/smaller screen view
    const [activePane, setActivePane] = useState<'list' | 'thread' | 'info'>('list');

    // References
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Derived state
    const selectedConversation = conversations.find(c => c.id === selectedId);

    // Sync active pane with selection
    useEffect(() => {
        if (selectedId) {
            setActivePane('thread');
        }
    }, [selectedId]);

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
        <div className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-6rem)] -m-4 md:-m-6 flex bg-zinc-50/50 dark:bg-black overflow-hidden border-t border-zinc-200 dark:border-zinc-800 relative">

            {/* PANE 1: Conversation List */}
            <div className={cn(
                "w-full lg:w-80 xl:w-96 flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shrink-0 transition-all duration-300",
                activePane !== 'list' && "hidden lg:flex"
            )}>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Inbox</h1>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                            <Plus className="h-4 w-4 text-indigo-500" />
                        </Button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-indigo-500/20"
                        />
                    </div>

                    <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-9 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                            <TabsTrigger value="all" className="text-[10px] uppercase tracking-wider font-bold rounded-lg">All</TabsTrigger>
                            <TabsTrigger value="unread" className="text-[10px] uppercase tracking-wider font-bold rounded-lg">Unread</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 custom-scrollbar">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-400">
                            <MessageSquare className="w-8 h-8 opacity-20 mb-3" />
                            <p className="text-sm">No conversations found</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => {
                                    setSelectedId(conv.id);
                                    setActivePane('thread');
                                }}
                                className={cn(
                                    "p-4 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 flex gap-3 relative group",
                                    selectedId === conv.id && "bg-indigo-50/50 dark:bg-indigo-500/5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-500"
                                )}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                        {getInitials(conv.contact)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-zinc-950 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-110">
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
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* PANE 2: Message Thread */}
            <div className={cn(
                "flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden min-w-0 transition-all duration-300",
                activePane === 'list' && "hidden lg:flex",
                activePane === 'info' && "hidden xl:flex"
            )}>
                {selectedConversation ? (
                    <>
                        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10 font-sans">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="lg:hidden -ml-2 rounded-xl"
                                    onClick={() => setActivePane('list')}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-200 dark:border-indigo-500/20">
                                    {getInitials(selectedConversation.contact)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                        {selectedConversation.contact?.first_name} {selectedConversation.contact?.last_name}
                                    </h2>
                                    <div className="flex items-center gap-1.5 ring-offset-background">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Status: Active</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-xl hidden sm:flex">
                                                <Star className="h-4 w-4 text-zinc-400" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Star Conversation</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 text-[10px] font-bold uppercase tracking-wider border-zinc-200 dark:border-zinc-800 hidden sm:flex">
                                    <UserPlus className="h-3.5 w-3.5" /> Assign
                                </Button>

                                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

                                <Button variant="ghost" size="icon" className="rounded-xl">
                                    <Phone className="h-4 w-4 text-zinc-400 hover:text-indigo-500 transition-colors" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("rounded-xl transition-all", (sidebarOpen || activePane === 'info') && "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10")}
                                    onClick={() => {
                                        if (window.innerWidth < 1280) {
                                            setActivePane('info');
                                        } else {
                                            setSidebarOpen(!sidebarOpen);
                                        }
                                    }}
                                >
                                    <Info className="h-4 w-4 shrink-0" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-zinc-50/20 dark:bg-zinc-950/20 custom-scrollbar">
                            {isLoadingMessages ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-400">
                                    <Clock className="h-8 w-8 animate-spin-slow opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Hydrating Thread...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-center my-4">
                                        <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] border border-zinc-200/50 dark:border-white/5">Session History Start</span>
                                    </div>

                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
                                            <div className="w-16 h-16 rounded-[2rem] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                                <MessageSquare className="h-6 w-6 opacity-20" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 font-sans">Wait mode: Expecting inbound...</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    "flex group max-w-[90%] md:max-w-[75%]",
                                                    msg.direction === "outbound" ? "ml-auto" : "mr-auto"
                                                )}
                                            >
                                                <div className={cn(
                                                    "relative px-4 py-3 rounded-2xl text-sm transition-all duration-300",
                                                    msg.is_internal
                                                        ? "bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 text-amber-900 dark:text-amber-200 italic shadow-sm"
                                                        : msg.direction === "outbound"
                                                            ? "bg-indigo-600 dark:bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-500/10"
                                                            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-none shadow-sm"
                                                )}>
                                                    {msg.is_internal && (
                                                        <div className="flex items-center gap-2 mb-2 border-b border-amber-200/30 pb-1.5 opacity-70">
                                                            <StickyNote className="h-3 w-3" />
                                                            <span className="text-[9px] font-black uppercase tracking-wider">TEAM INTERNAL NOTE</span>
                                                        </div>
                                                    )}
                                                    <p className="leading-relaxed font-medium">{msg.content}</p>
                                                    <div className={cn(
                                                        "flex items-center gap-2 mt-2 flex-row-reverse opacity-50",
                                                        msg.direction === "outbound" ? "text-indigo-100" : "text-zinc-400"
                                                    )}>
                                                        <span className="text-[9px] font-bold">{formatTime(msg.created_at)}</span>
                                                        {msg.direction === "outbound" && !msg.is_internal && <CheckCheck className="h-3.5 w-3.5" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 md:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
                            <div className="flex items-center gap-3 mb-3">
                                <Tabs value={isInternalNote ? "internal" : "message"} onValueChange={(val) => setIsInternalNote(val === "internal")} className="w-auto">
                                    <TabsList className="bg-zinc-100 dark:bg-zinc-900 h-8 p-1 rounded-xl">
                                        <TabsTrigger value="message" className="h-6 text-[9px] uppercase font-black tracking-widest rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4">Chat</TabsTrigger>
                                        <TabsTrigger value="internal" className="h-6 text-[9px] uppercase font-black tracking-widest rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white px-4">Note</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                                <Badge variant="outline" className="h-8 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[9px] font-black uppercase tracking-widest px-3 gap-2">
                                    {getChannelIcon(selectedConversation.channel)}
                                    VIA {selectedConversation.channel}
                                </Badge>
                            </div>

                            <div className="relative group">
                                <textarea
                                    rows={window?.innerWidth < 768 ? 1 : 2}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isInternalNote ? "Write an internal team note..." : "Compose message..."}
                                    className={cn(
                                        "w-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none shadow-sm font-medium",
                                        isInternalNote && "focus:ring-amber-500/10 focus:border-amber-500 bg-amber-50/20 dark:bg-amber-900/5"
                                    )}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <div className="absolute right-3 bottom-1/2 translate-y-1/2 lg:bottom-4 lg:translate-y-0">
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        className={cn(
                                            "h-10 w-10 sm:h-11 sm:w-11 rounded-2xl transition-all shadow-xl active:scale-95 p-0",
                                            isInternalNote
                                                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                                                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30"
                                        )}
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-6 bg-zinc-50/10 dark:bg-zinc-950/20">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                            <div className="relative p-10 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl">
                                <MessageSquare className="h-12 w-12 text-indigo-500/40" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white uppercase">Unified Inbox</h3>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Select lead to resume sync</p>
                        </div>
                    </div>
                )}
            </div>

            {/* PANE 3: Contact Context Sidebar */}
            {selectedConversation && (sidebarOpen || activePane === 'info') && (
                <div className={cn(
                    "w-full xl:w-80 2xl:w-96 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 lg:animate-in lg:slide-in-from-right duration-300",
                    activePane === 'info' ? "fixed inset-0 z-50 lg:relative lg:inset-auto" : "hidden xl:flex"
                )}>
                    {/* Mobile Close Button */}
                    <div className="h-16 border-b border-zinc-100 dark:border-zinc-900 px-6 flex items-center justify-between xl:hidden">
                        <Button variant="ghost" className="rounded-xl gap-2 font-black text-[10px] uppercase" onClick={() => setActivePane('thread')}>
                            <ArrowLeft className="h-4 w-4" /> Message Feed
                        </Button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Context</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-8 flex flex-col items-center text-center border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10">
                            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-indigo-500/20 mb-6 group relative">
                                <div className="absolute inset-0 bg-white/20 rounded-[32px] blur-xl group-hover:blur-2xl transition-all" />
                                <span className="relative">{getInitials(selectedConversation.contact)}</span>
                            </div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                                {selectedConversation.contact?.first_name} {selectedConversation.contact?.last_name}
                            </h2>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">Lead Status: Prospecting</p>

                            <div className="flex gap-2.5 mt-8 w-full">
                                <Button size="sm" variant="outline" className="h-10 flex-1 rounded-2xl border-zinc-200 dark:border-zinc-800 gap-2 font-bold text-[10px] uppercase transition-all hover:bg-zinc-100">
                                    <Phone className="h-3.5 w-3.5" /> Call
                                </Button>
                                <Button size="sm" className="h-10 flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold text-[10px] uppercase shadow-lg shadow-indigo-500/20">
                                    <Calendar className="h-3.5 w-3.5" /> Book
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="space-y-4">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                    Lead Metadata
                                </h4>
                                <div className="space-y-2">
                                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-1 border border-zinc-100 dark:border-white/5">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Email Address</span>
                                        <span className="text-xs text-zinc-900 dark:text-zinc-200 font-bold truncate">{selectedConversation.contact?.email || 'N/A'}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-1 border border-zinc-100 dark:border-white/5">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Phone Number</span>
                                        <span className="text-xs text-zinc-900 dark:text-zinc-200 font-bold">{selectedConversation.contact?.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Segmentation Tags</h4>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-indigo-500 hover:bg-indigo-50">
                                        <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedConversation.contact?.tags || ['NEW_LEAD', 'FB_CAMPAIGN']).map(tag => (
                                        <Badge key={tag} variant="secondary" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none px-3 py-1.5 text-[9px] font-black rounded-xl uppercase tracking-wider">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-[0.15em] justify-between text-zinc-500 group h-12 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            View Full CRM Record
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// End of file
