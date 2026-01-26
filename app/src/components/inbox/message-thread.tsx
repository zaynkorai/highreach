import { useRef, useState, useEffect } from "react";
import { Conversation, Message, ChannelType } from "@/types/inbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
    ArrowLeft, Star, UserPlus, Phone, Info, CheckCircle, RotateCcw,
    Clock, MessageSquare, StickyNote, CheckCheck, Zap, Paperclip, Send, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    const [newMessage, setNewMessage] = useState("");
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial constants
    const CANNED_RESPONSES = [
        { title: "Review Request", content: "Hi! It was a pleasure working with you. Would you mind leaving us a quick review? Here is the link: https://g.page/r/..." },
        { title: "Missed Call", content: "Sorry we missed your call! How can we help you today?" },
        { title: "Appointment Confirm", content: "Just confirming your appointment for tomorrow. Please reply YES to confirm." },
        { title: "Pricing Info", content: "Our standard rate is $99/hr. Would you like to schedule a free estimate?" },
        { title: "Location Info", content: "We are located at 123 Main St. Parking is available in the back." }
    ];

    // Helpers
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

    const Mail = ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
    );

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if ((!newMessage.trim() && attachments.length === 0) || !conversation) return;

        await onSendMessage(newMessage, conversation.channel, isInternalNote, attachments);

        setNewMessage("");
        setAttachments([]);
    };

    if (!conversation) {
        return (
            <div className={cn(
                "flex-1 flex flex-col items-center justify-center text-zinc-400 gap-6 bg-zinc-50/10 dark:bg-zinc-950/20",
                className
            )}>
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
        );
    }

    return (
        <div className={cn(
            "flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden min-w-0 transition-all duration-300",
            activePane === 'list' && "hidden lg:flex",
            activePane === 'info' && "hidden xl:flex",
            className
        )}>
            <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 flex items-center justify-between shrink-0 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10 font-sans">
                <div className="flex items-center gap-3 overflow-hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden -ml-2 rounded-xl"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-200 dark:border-indigo-500/20">
                        {getInitials(conversation.contact)}
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {conversation.contact?.first_name} {conversation.contact?.last_name}
                        </h2>
                        <div className="flex items-center gap-1.5 ring-offset-background">
                            <span className={cn(
                                "min-w-[6px] h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]",
                                conversation.status === 'closed' ? "bg-zinc-400" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            )} />
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
                                {conversation.status === 'closed' ? 'Resolved' : 'Active'}
                            </span>
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

                    {conversation.status === 'open' ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStatusChange('closed')}
                            className="h-9 rounded-xl gap-2 text-[10px] font-bold uppercase tracking-wider border-zinc-200 dark:border-zinc-800 hidden sm:flex hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 dark:hover:border-emerald-500/20"
                        >
                            <CheckCircle className="h-3.5 w-3.5" /> Resolve
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStatusChange('open')}
                            className="h-9 rounded-xl gap-2 text-[10px] font-bold uppercase tracking-wider border-zinc-200 dark:border-zinc-800 hidden sm:flex hover:bg-zinc-100 hover:text-zinc-900"
                        >
                            <RotateCcw className="h-3.5 w-3.5" /> Reopen
                        </Button>
                    )}

                    <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <Phone className="h-4 w-4 text-zinc-400 hover:text-indigo-500 transition-colors" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("rounded-xl transition-all", (sidebarOpen || activePane === 'info') && "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10")}
                        onClick={onToggleSidebar}
                    >
                        <Info className="h-4 w-4 shrink-0" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-zinc-50/20 dark:bg-zinc-950/20 custom-scrollbar">
                {isLoading ? (
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
                                        <p className="leading-relaxed font-medium whitespace-pre-wrap">{msg.content}</p>
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
                <div className="flex items-center gap-3 mb-3 justify-between">
                    <div className="flex items-center gap-3">
                        <Tabs value={isInternalNote ? "internal" : "message"} onValueChange={(val) => setIsInternalNote(val === "internal")} className="w-auto">
                            <TabsList className="bg-zinc-100 dark:bg-zinc-900 h-8 p-1 rounded-xl">
                                <TabsTrigger value="message" className="h-6 text-[9px] uppercase font-black tracking-widest rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4">Chat</TabsTrigger>
                                <TabsTrigger value="internal" className="h-6 text-[9px] uppercase font-black tracking-widest rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white px-4">Note</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                        <Badge variant="outline" className="h-8 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[9px] font-black uppercase tracking-widest px-3 gap-2">
                            {getChannelIcon(conversation.channel)}
                            VIA {conversation.channel}
                        </Badge>
                    </div>

                    {/* QUICK REPLIES */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 rounded-xl gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                                <Zap className="h-3 w-3" /> Templates
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-80" align="end">
                            <Command>
                                <CommandInput placeholder="Search templates..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No templates found.</CommandEmpty>
                                    <CommandGroup heading="Quick Replies">
                                        {CANNED_RESPONSES.map((response) => (
                                            <CommandItem
                                                key={response.title}
                                                onSelect={() => {
                                                    setNewMessage(newMessage + (newMessage ? " " : "") + response.content);
                                                }}
                                                className="text-xs gap-2 cursor-pointer"
                                            >
                                                <div className="flex flex-col gap-1 w-full">
                                                    <span className="font-bold">{response.title}</span>
                                                    <span className="text-zinc-500 truncate">{response.content}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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
                                handleSend();
                            }
                        }}
                    />
                    <div className="absolute right-3 bottom-1/2 translate-y-1/2 lg:bottom-4 lg:translate-y-0 flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            multiple
                            onChange={(e) => {
                                if (e.target.files) {
                                    setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
                                }
                            }}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!newMessage.trim() && attachments.length === 0}
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

                {/* Attachment Previews */}
                {attachments.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap px-1">
                        {attachments.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 pl-3 pr-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 max-w-[100px] truncate">{file.name}</span>
                                <span className="text-[9px] text-zinc-400 uppercase">{file.type.split('/')[1] || 'FILE'}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full"
                                    onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                >
                                    <Plus className="h-3 w-3 rotate-45" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

