import { Conversation } from "@/types/inbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Star, Phone, Info, CheckCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreadHeaderProps {
    conversation: Conversation;
    onBack: () => void;
    onToggleSidebar: () => void;
    onStatusChange: (status: 'open' | 'closed') => void;
    sidebarOpen: boolean;
    activePane: 'list' | 'thread' | 'info';
}

export function ThreadHeader({
    conversation,
    onBack,
    onToggleSidebar,
    onStatusChange,
    sidebarOpen,
    activePane
}: ThreadHeaderProps) {
    const getInitials = (contact: any) => {
        if (!contact) return "?";
        return (contact.first_name[0] + (contact.last_name?.[0] || "")).toUpperCase();
    };

    return (
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
                <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold border border-brand-200 dark:border-brand-500/20">
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
                    <Phone className="h-4 w-4 text-zinc-400 hover:text-brand-500 transition-colors" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("rounded-xl transition-all", (sidebarOpen || activePane === 'info') && "text-brand-500 bg-brand-50 dark:bg-brand-500/10")}
                    onClick={onToggleSidebar}
                >
                    <Info className="h-4 w-4 shrink-0" />
                </Button>
            </div>
        </div>
    );
}
