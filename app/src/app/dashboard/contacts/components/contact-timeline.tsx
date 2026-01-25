"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Send, Phone, Mail, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createActivity, getContactActivities } from "../actions";
import { ContactActivity } from "@/types/contact";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContactTimelineProps {
    contactId: string;
}

export function ContactTimeline({ contactId }: ContactTimelineProps) {
    const [activities, setActivities] = useState<ContactActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchActivities = async () => {
        try {
            const result = await getContactActivities(contactId);
            if (result.success) {
                setActivities(result.data || []);
            } else {
                toast.error(result.error || "Failed to fetch activities");
            }
        } catch (error) {
            console.error("Failed to fetch activities", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [contactId]);

    const handleSubmitNote = async () => {
        if (!note.trim()) return;
        setIsSubmitting(true);
        try {
            const result = await createActivity(contactId, "note", note);
            if (result.success) {
                setNote("");
                fetchActivities(); // Refresh list
                toast.success("Note added");
            } else {
                toast.error(result.error || "Failed to add note");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "call_log": return <Phone className="h-4 w-4" />;
            case "email": return <Mail className="h-4 w-4" />;
            case "system": return <User className="h-4 w-4" />; // System/User changes
            default: return <FileText className="h-4 w-4" />; // Note
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Input Area */}
            <div className="p-1 mb-4">
                <div className="relative">
                    <Textarea
                        placeholder="Add a note..."
                        value={note}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                        className="min-h-[80px] pr-12 resize-none bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitNote();
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute bottom-2 right-2 h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                        onClick={handleSubmitNote}
                        disabled={isSubmitting || !note.trim()}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Timeline Stream */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {activities.length === 0 ? (
                    <div className="text-center text-zinc-400 text-sm py-8">
                        No activity yet.
                    </div>
                ) : (
                    activities.map((activity, index) => (
                        <div key={activity.id} className="relative pl-6 pb-2 last:pb-0 group">
                            {/* Vertical Line */}
                            {index !== activities.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-[-24px] w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                            )}

                            {/* Icon Bubble */}
                            <div className={cn(
                                "absolute left-0 top-1 h-6 w-6 rounded-full border flex items-center justify-center bg-white dark:bg-zinc-950 z-10",
                                activity.type === "note" ? "border-zinc-200 text-zinc-500" :
                                    activity.type === "call_log" ? "border-blue-200 text-blue-500 bg-blue-50 dark:bg-blue-900/10" :
                                        "border-zinc-200 text-zinc-400"
                            )}>
                                {getIcon(activity.type)}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-200 capitalize">
                                        {activity.type.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                        {format(new Date(activity.created_at), "MMM d, h:mm a")}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                                    {activity.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
