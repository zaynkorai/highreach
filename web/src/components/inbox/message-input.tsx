import { useState, useRef } from "react";
import { Conversation, ChannelType } from "@/types/inbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Zap, Paperclip, Send, Plus, Phone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
    conversation: Conversation;
    onSendMessage: (content: string, channel: ChannelType, isInternal: boolean, attachments: File[]) => Promise<void>;
}

export function MessageInput({ conversation, onSendMessage }: MessageInputProps) {
    const [newMessage, setNewMessage] = useState("");
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const CANNED_RESPONSES = [
        { title: "Review Request", content: "Hi! It was a pleasure working with you. Would you mind leaving us a quick review? Here is the link: https://g.page/r/..." },
        { title: "Missed Call", content: "Sorry we missed your call! How can we help you today?" },
        { title: "Appointment Confirm", content: "Just confirming your appointment for tomorrow. Please reply YES to confirm." },
        { title: "Pricing Info", content: "Our standard rate is $99/hr. Would you like to schedule a free estimate?" },
        { title: "Location Info", content: "We are located at 123 Main St. Parking is available in the back." }
    ];

    const Mail = ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
    );

    const getChannelIcon = (channel: ChannelType) => {
        switch (channel) {
            case 'sms': return <Phone className="h-3 w-3" />;
            case 'email': return <Mail className="h-3 w-3" />;
            case 'whatsapp': return <MessageSquare className="h-3 w-3 text-green-500" />;
            default: return <MessageSquare className="h-3 w-3" />;
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() && attachments.length === 0) return;

        await onSendMessage(newMessage, conversation.channel, isInternalNote, attachments);

        setNewMessage("");
        setAttachments([]);
    };

    return (
        <div className="p-4 md:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
            <div className="flex items-center gap-3 mb-3 justify-between">
                <div className="flex items-center gap-3">
                    <Tabs value={isInternalNote ? "internal" : "message"} onValueChange={(val) => setIsInternalNote(val === "internal")} className="w-auto">
                        <TabsList className="bg-zinc-100 dark:bg-zinc-900 h-8 p-1 rounded-xl">
                            <TabsTrigger value="message" className="h-6 text-[9px] uppercase font-black tracking-widest rounded-lg data-[state=active]:bg-brand-600 data-[state=active]:text-white px-4">Chat</TabsTrigger>
                            <TabsTrigger value="internal" className="h-6 text-[9px] uppercase font-black tracking-widest rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white px-4">Note</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                    <Badge variant="outline" className="h-8 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-[9px] font-black uppercase tracking-widest px-3 gap-2">
                        {getChannelIcon(conversation.channel)}
                        VIA {conversation.channel}
                    </Badge>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 rounded-xl gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10">
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
                    rows={typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isInternalNote ? "Write an internal team note..." : "Compose message..."}
                    className={cn(
                        "w-full bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all resize-none shadow-sm font-medium",
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
                        className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl text-zinc-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
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
                                : "bg-brand-600 hover:bg-brand-700 shadow-brand-500/30"
                        )}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap px-1 pt-2">
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
    );
}
