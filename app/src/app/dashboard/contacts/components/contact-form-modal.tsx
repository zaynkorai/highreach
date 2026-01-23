import { Contact } from "@/types/contact";
import { useState, useEffect } from "react";
import { createContact, updateContact } from "../actions";
import { contactSchema, ContactFormData } from "@/lib/validations/contact";
import { z } from "zod";

interface ContactFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact?: Contact | null;
    onSuccess?: () => void;
}

export function ContactFormModal({ isOpen, onClose, contact, onSuccess }: ContactFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

    const [formData, setFormData] = useState<ContactFormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        if (contact) {
            setFormData({
                firstName: contact.first_name,
                lastName: contact.last_name || "",
                email: contact.email || "",
                phone: contact.phone || "",
            });
        } else {
            setFormData({ firstName: "", lastName: "", email: "", phone: "" });
        }
        setErrors({});
    }, [contact, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        // Client-side validation
        const result = contactSchema.safeParse(formData);
        if (!result.success) {
            const flattened = result.error.flatten();
            const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};

            // Map array of messages to single string
            Object.keys(flattened.fieldErrors).forEach((key) => {
                const k = key as keyof ContactFormData;
                const messages = flattened.fieldErrors[k];
                if (messages && messages.length > 0) {
                    fieldErrors[k] = messages[0];
                }
            });

            setErrors(fieldErrors);
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                first_name: formData.firstName,
                last_name: formData.lastName || null,
                email: formData.email || null,
                phone: formData.phone || null,
            };

            if (contact) {
                await updateContact(contact.id, payload);
            } else {
                await createContact(payload);
            }
            if (onSuccess) onSuccess();
            onClose();
            // Force refresh for immediate feedback if needed, 
            // though server actions usually handle this via revalidatePath
        } catch (error) {
            console.error(error);
            alert("Failed to save contact");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] w-full max-w-lg rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden"
                role="dialog"
                aria-modal="true"
            >
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/[0.08] flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-foreground">
                        {contact ? "Edit Contact" : "Add New Contact"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">First Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className={`w-full bg-white dark:bg-zinc-950 border rounded-lg px-3 py-2 text-sm focus:ring-2 transition-all outline-none ${errors.firstName
                                    ? "border-red-500 focus:ring-red-500/20"
                                    : "border-zinc-200 dark:border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    }`}
                                placeholder="Jane"
                            />
                            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Last Name</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className={`w-full bg-white dark:bg-zinc-950 border rounded-lg px-3 py-2 text-sm focus:ring-2 transition-all outline-none ${errors.lastName
                                    ? "border-red-500 focus:ring-red-500/20"
                                    : "border-zinc-200 dark:border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    }`}
                                placeholder="Doe"
                            />
                            {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className={`w-full bg-white dark:bg-zinc-950 border rounded-lg px-3 py-2 text-sm focus:ring-2 transition-all outline-none ${errors.email
                                ? "border-red-500 focus:ring-red-500/20"
                                : "border-zinc-200 dark:border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500"
                                }`}
                            placeholder="jane@example.com"
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className={`w-full bg-white dark:bg-zinc-950 border rounded-lg px-3 py-2 text-sm focus:ring-2 transition-all outline-none ${errors.phone
                                ? "border-red-500 focus:ring-red-500/20"
                                : "border-zinc-200 dark:border-white/10 focus:ring-emerald-500/20 focus:border-emerald-500"
                                }`}
                            placeholder="+1 555 000 0000"
                            maxLength={15}
                        />
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 font-medium py-2.5 rounded-lg transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm shadow-sm opacity-100 disabled:opacity-50"
                        >
                            {isLoading ? "Saving..." : contact ? "Update Contact" : "Create Contact"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
