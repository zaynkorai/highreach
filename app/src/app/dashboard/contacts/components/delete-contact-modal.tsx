import { Contact } from "@/types/contact";
import { useState } from "react";
import { deleteContact } from "../actions";

interface DeleteContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact | null;
    onSuccess?: () => void;
}

export function DeleteContactModal({ isOpen, onClose, contact, onSuccess }: DeleteContactModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!contact) return;
        setIsLoading(true);
        try {
            await deleteContact(contact.id);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to delete contact");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !contact) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] w-full max-w-sm rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden p-6"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-1">Delete Contact?</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Are you sure you want to delete <strong>{contact.first_name} {contact.last_name}</strong>? This action cannot be undone.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 font-medium py-2.5 rounded-lg transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50"
                    >
                        {isLoading ? "Deleting..." : "Delete Contact"}
                    </button>
                </div>
            </div>
        </div>
    );
}
