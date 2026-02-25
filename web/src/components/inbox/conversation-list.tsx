import { useState } from "react";
import { Conversation, ChannelType } from "@/types/inbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Mail, MessageSquare, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    activePane: 'list' | 'thread' | 'info';
    className?: string;
}

export function ConversationList({
    conversations,
    selectedId,
    onSelect,
    activePane,
    className
}: ConversationListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'all'>('open');
    const [activeFilter, setActiveFilter] = useState("all");

    // Local helpers
    const getInitials = (contact: any) => {
        if (!contact) return "?";
        return (contact.first_name[0] + (contact.last_name?.[0] || "")).toUpperCase();
    };

    const getChannelIcon = (channel: ChannelType) => {
        switch (channel) {
            case 'sms': return <Phone className="h-3 w-3" />;
            case 'email': return <Mail className="h-3 w-3" />;
            case 'whatsapp': return <MessageSquare className="h-3 w-3 text-green-500" />;
            default: return <MessageSquare className="h-3 w-3" />;
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredConversations = conversations.filter(c => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (searchQuery) {
            const name = `${c.contact?.first_name} ${c.contact?.last_name}`.toLowerCase();
            if (!name.includes(searchQuery.toLowerCase())) return false;
        }
        if (activeFilter === "unread") return c.unread_count > 0;
        return true;
    });

    return (
        <div className={cn(
            "w-full lg:w-80 xl:w-96 flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shrink-0 transition-all duration-300",
            activePane !== 'list' && "hidden lg:flex",
            className
        )}>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Inbox</h1>
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                        <Plus className="h-4 w-4 text-brand-500" />
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-brand-500/20"
                    />
                </div>

                <div className="flex gap-2">
                    <Tabs value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-9 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                            <TabsTrigger value="open" className="text-[10px] uppercase tracking-wider font-bold rounded-lg">Open</TabsTrigger>
                            <TabsTrigger value="closed" className="text-[10px] uppercase tracking-wider font-bold rounded-lg">Done</TabsTrigger>
                            <TabsTrigger value="all" className="text-[10px] uppercase tracking-wider font-bold rounded-lg">All</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "shrink-0 rounded-xl border-zinc-200 dark:border-zinc-800",
                            activeFilter === 'unread' && "bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20"
                        )}
                        onClick={() => setActiveFilter(activeFilter === 'unread' ? 'all' : 'unread')}
                    >
                        <Mail className="h-4 w-4" />
                    </Button>
                </div>
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
                            onClick={() => onSelect(conv.id)}
                            className={cn(
                                "p-4 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 flex gap-3 relative group",
                                selectedId === conv.id && "bg-brand-50/50 dark:bg-brand-500/5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-brand-500"
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
                                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-sm shadow-brand-500/50" />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}


