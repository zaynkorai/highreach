import { useEffect, useRef } from "react";
import { Message } from "@/types/inbox";
import { Clock, MessageSquare, StickyNote, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
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
    );
}
