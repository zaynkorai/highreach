"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageSquare, Phone, Mail, UserCheck, Loader2 } from "lucide-react";
import { getContactsForNewConversation, createConversation } from "@/app/dashboard/inbox/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ChannelType } from "@/types/inbox";

interface NewConversationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConversationCreated: (conversationId: string) => void;
}

interface ContactOption {
    id: string;
    first_name: string;
    last_name: string | null;
    phone: string | null;
    email: string | null;
}

export function NewConversationDialog({
    open,
    onOpenChange,
    onConversationCreated,
}: NewConversationDialogProps) {
    const [contacts, setContacts] = useState<ContactOption[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [channel, setChannel] = useState<ChannelType>("sms");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setIsLoadingContacts(true);
            getContactsForNewConversation()
                .then((res) => {
                    if (res.success && res.data) {
                        setContacts(res.data);
                    } else {
                        toast.error("Failed to load contacts list");
                    }
                })
                .catch(() => toast.error("An error occurred loading contacts"))
                .finally(() => setIsLoadingContacts(false));
        } else {
            // Reset fields on close
            setSelectedContactId(null);
            setMessage("");
            setSearchQuery("");
        }
    }, [open]);

    const selectedContact = contacts.find((c) => c.id === selectedContactId);

    // Auto-adjust channel based on contact capability
    const handleSelectContact = (contact: ContactOption) => {
        setSelectedContactId(contact.id);
        if (!contact.phone && contact.email) {
            setChannel("email");
        } else {
            setChannel("sms");
        }
    };

    const filteredContacts = contacts.filter((c) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const fullName = `${c.first_name} ${c.last_name || ""}`.toLowerCase();
        return (
            fullName.includes(q) ||
            (c.phone && c.phone.includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q))
        );
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContactId) {
            toast.error("Please select a recipient contact");
            return;
        }

        if (channel === "sms" && !selectedContact?.phone) {
            toast.error("The selected contact does not have a phone number for SMS");
            return;
        }

        if (channel === "email" && !selectedContact?.email) {
            toast.error("The selected contact does not have an email address");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createConversation(
                selectedContactId,
                channel,
                message.trim() || undefined
            );

            if (res.success && res.data) {
                toast.success("Conversation ready");
                onConversationCreated(res.data.id);
                onOpenChange(false);
            } else if (!res.success) {
                toast.error(res.error || "Failed to start conversation");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] rounded-2xl p-6">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-brand-500" />
                        Start New Conversation
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Contact Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                            Select Recipient
                        </Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <Input
                                placeholder="Search contacts by name, phone, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                            />
                        </div>

                        {/* Contacts mini list */}
                        <div className="max-h-44 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30">
                            {isLoadingContacts ? (
                                <div className="p-6 flex items-center justify-center gap-2 text-xs text-zinc-400 font-medium">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading contacts...
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="p-6 text-center text-xs text-zinc-400">
                                    {searchQuery ? "No matching contacts found." : "No contacts available."}
                                </div>
                            ) : (
                                filteredContacts.map((contact) => {
                                    const isSelected = contact.id === selectedContactId;
                                    return (
                                        <div
                                            key={contact.id}
                                            onClick={() => handleSelectContact(contact)}
                                            className={cn(
                                                "p-2.5 px-3 flex items-center justify-between cursor-pointer transition-colors text-xs",
                                                isSelected
                                                    ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold"
                                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {(contact.first_name[0] + (contact.last_name?.[0] || "")).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 truncate">
                                                    <p className="font-semibold truncate">
                                                        {contact.first_name} {contact.last_name}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400 truncate">
                                                        {contact.phone || contact.email || "No contact info"}
                                                    </p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <UserCheck className="h-4 w-4 text-brand-500 shrink-0" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Channel Selector */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                            Channel
                        </Label>
                        <Tabs value={channel} onValueChange={(v) => setChannel(v as ChannelType)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
                                <TabsTrigger
                                    value="sms"
                                    className="rounded-lg text-xs font-bold gap-2"
                                    disabled={selectedContact && !selectedContact.phone}
                                >
                                    <Phone className="h-3.5 w-3.5" /> SMS
                                </TabsTrigger>
                                <TabsTrigger
                                    value="email"
                                    className="rounded-lg text-xs font-bold gap-2"
                                    disabled={selectedContact && !selectedContact.email}
                                >
                                    <Mail className="h-3.5 w-3.5" /> Email
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Initial Message Input */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                            Initial Message <span className="text-zinc-400 font-normal">(optional)</span>
                        </Label>
                        <Textarea
                            placeholder="Type a message to send immediately, or leave blank to open an empty thread..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="rounded-xl resize-none text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl text-xs"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!selectedContactId || isSubmitting}
                            className="rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white gap-2"
                        >
                            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {message.trim() ? "Send & Open Thread" : "Open Conversation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
