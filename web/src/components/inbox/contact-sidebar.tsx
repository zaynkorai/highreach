import { Conversation } from "@/types/inbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Calendar, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactSidebarProps {
    conversation: Conversation;
    activePane: 'list' | 'thread' | 'info';
    sidebarOpen: boolean;
    onCloseMobile: () => void;
    className?: string;
}

export function ContactSidebar({
    conversation,
    activePane,
    sidebarOpen,
    onCloseMobile,
    className
}: ContactSidebarProps) {
    // Helpers
    const getInitials = (contact: any) => {
        if (!contact) return "?";
        return (contact.first_name[0] + (contact.last_name?.[0] || "")).toUpperCase();
    };

    return (
        <div className={cn(
            "w-full xl:w-80 2xl:w-96 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 lg:animate-in lg:slide-in-from-right duration-300",
            activePane === 'info' ? "fixed inset-0 z-50 lg:relative lg:inset-auto" : "hidden xl:flex",
            className
        )}>
            {/* Mobile Close Button */}
            <div className="h-16 border-b border-zinc-100 dark:border-zinc-900 px-6 flex items-center justify-between xl:hidden">
                <Button variant="ghost" className="rounded-xl gap-2 font-black text-[10px] uppercase" onClick={onCloseMobile}>
                    <ArrowLeft className="h-4 w-4" /> Message Feed
                </Button>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Context</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-8 flex flex-col items-center text-center border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10">
                    <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-brand-500/20 mb-6 group relative">
                        <div className="absolute inset-0 bg-white/20 rounded-[32px] blur-xl group-hover:blur-2xl transition-all" />
                        <span className="relative">{getInitials(conversation.contact)}</span>
                    </div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {conversation.contact?.first_name} {conversation.contact?.last_name}
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">Lead Status: Prospecting</p>

                    <div className="flex gap-2.5 mt-8 w-full">
                        <Button size="sm" variant="outline" className="h-10 flex-1 rounded-2xl border-zinc-200 dark:border-zinc-800 gap-2 font-bold text-[10px] uppercase transition-all hover:bg-zinc-100">
                            <Phone className="h-3.5 w-3.5" /> Call
                        </Button>
                        <Button size="sm" className="h-10 flex-1 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white gap-2 font-bold text-[10px] uppercase shadow-lg shadow-brand-500/20">
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
                                <span className="text-xs text-zinc-900 dark:text-zinc-200 font-bold truncate">{conversation.contact?.email || 'N/A'}</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-1 border border-zinc-100 dark:border-white/5">
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Phone Number</span>
                                <span className="text-xs text-zinc-900 dark:text-zinc-200 font-bold">{conversation.contact?.phone || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Segmentation Tags</h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-brand-500 hover:bg-brand-50">
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(conversation.contact?.tags || ['NEW_LEAD', 'FB_CAMPAIGN']).map(tag => (
                                <Badge key={tag} variant="secondary" className="bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-none px-3 py-1.5 text-[9px] font-black rounded-xl uppercase tracking-wider">
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
    );
}
