"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, X } from "lucide-react"; // Removed duplicates
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Contact } from "@/types/contact";
import { contactSchema, ContactFormData } from "@/lib/validations/contact";
import { createContact, updateContact } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactTimeline } from "./contact-timeline";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ContactSheetProps {
    isOpen: boolean;
    onClose: () => void;
    contact?: Contact | null;
}

export function ContactSheet({ isOpen, onClose, contact }: ContactSheetProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [tagInput, setTagInput] = useState("");

    const form = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            source: "manual",
            tags: [],
        },
    });

    // Reset form when contact changes or sheet opens
    useEffect(() => {
        if (isOpen) {
            if (contact) {
                form.reset({
                    firstName: contact.first_name,
                    lastName: contact.last_name || "",
                    email: contact.email || "",
                    phone: contact.phone || "",
                    source: contact.source || "manual",
                    tags: contact.tags || [],
                });
            } else {
                form.reset({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    source: "manual",
                    tags: [],
                });
            }
        }
    }, [contact, isOpen, form]);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            const currentTags = form.getValues("tags") || [];
            if (!currentTags.includes(tagInput.trim())) {
                form.setValue("tags", [...currentTags, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        const currentTags = form.getValues("tags") || [];
        form.setValue(
            "tags",
            currentTags.filter((tag: string) => tag !== tagToRemove)
        );
    };

    const onSubmit = async (data: ContactFormData) => {
        setIsLoading(true);
        try {
            // Transform form data to match API expectations
            const payload = {
                first_name: data.firstName,
                last_name: data.lastName || null,
                email: data.email || null,
                phone: data.phone || null,
                source: data.source || null,
                tags: data.tags || [],
            };

            if (contact) {
                const result = await updateContact(contact.id, payload);
                if (result.success) {
                    toast.success("Contact updated");
                    onClose();
                } else {
                    toast.error(result.error || "Failed to update contact");
                }
            } else {
                const result = await createContact(payload);
                if (result.success) {
                    toast.success("Contact created");
                    onClose();
                } else {
                    toast.error(result.error || "Failed to create contact");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-0 gap-0">
                <Tabs defaultValue="profile" className="flex flex-col h-full w-full">

                    {/* Header Section */}
                    <div className="px-6 py-6 border-b border-zinc-200 dark:border-zinc-800">
                        <SheetHeader className="mb-4 space-y-1">
                            <SheetTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                {contact ? "Edit Contact" : "Create Contact"}
                                {contact && <Badge variant="secondary" className="font-normal text-xs">{contact.source || "manual"}</Badge>}
                            </SheetTitle>
                            <SheetDescription className="text-zinc-500 dark:text-zinc-400">
                                {contact ? "Manage contact details and view activity history." : "Add a new contact to your CRM."}
                            </SheetDescription>
                        </SheetHeader>

                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="history" disabled={!contact}>History</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Content Section - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <TabsContent value="profile" className="h-full mt-0 focus-visible:outline-none">
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Name Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            placeholder="Jane"
                                            {...form.register("firstName")}
                                        />
                                        {form.formState.errors.firstName && (
                                            <p className="text-sm text-red-500">
                                                {form.formState.errors.firstName.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            placeholder="Doe"
                                            {...form.register("lastName")}
                                        />
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        {...form.register("email")}
                                    />
                                    {form.formState.errors.email && (
                                        <p className="text-sm text-red-500">
                                            {form.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 555 000 0000"
                                        {...form.register("phone")}
                                    />
                                    {form.formState.errors.phone && (
                                        <p className="text-sm text-red-500">
                                            {form.formState.errors.phone.message}
                                        </p>
                                    )}
                                </div>

                                {/* Source & Tags */}
                                <div className="space-y-2">
                                    <Label>Source</Label>
                                    <Select
                                        onValueChange={(val) => form.setValue("source", val)}
                                        defaultValue={form.getValues("source") || "manual"}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manual">Manual</SelectItem>
                                            <SelectItem value="referral">Referral</SelectItem>
                                            <SelectItem value="website">Website</SelectItem>
                                            <SelectItem value="advertisement">Advertisement</SelectItem>
                                            <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {form.watch("tags")?.map((tag: string) => (
                                            <Badge key={tag} variant="secondary" className="gap-1">
                                                {tag}
                                                <X
                                                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                                                    onClick={() => removeTag(tag)}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                    <Input
                                        placeholder="Type tag and press Enter"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                    />
                                </div>

                                {/* Actions Footer */}
                                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <Button variant="outline" type="button" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading} className="bg-brand-600 hover:bg-brand-700 text-white">
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {contact ? "Save Changes" : "Create Contact"}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="history" className="h-full mt-0 focus-visible:outline-none">
                            {contact ? (
                                <ContactTimeline contactId={contact.id} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                    <p>Save the contact first to view history.</p>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
