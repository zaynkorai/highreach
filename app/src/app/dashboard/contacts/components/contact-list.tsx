"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Contact } from "@/types/contact";
import { ContactFormModal } from "./contact-form-modal";
import { DeleteContactModal } from "./delete-contact-modal";
import { CsvImportModal } from "./csv-import-modal";
import { useContactStore, useContactActions, useFilteredContacts } from "@/stores/contact-store";

interface ContactListProps {
    initialContacts: Contact[];
}

export function ContactList({ initialContacts }: ContactListProps) {
    const router = useRouter();

    // Zustand Store
    const contacts = useContactStore((state) => state.contacts);
    const { setContacts, setSelectedContactId } = useContactActions();
    const filteredContacts = useFilteredContacts();

    // Local UI state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    // State for the contact being edited or deleted
    // We could use store's selectedContactId, but for now keeping the full object here 
    // or we can sync it. Let's stick to local for the modal interaction to minimize refactor risk
    // unless we want to use the store's selected ID strictly. 
    // Let's use local state for the modal's *target* but update store's selected ID for consistency if needed.
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    // Sync contacts when initialContacts prop updates
    useEffect(() => {
        setContacts(initialContacts);
    }, [initialContacts, setContacts]);

    const handleRefresh = () => {
        router.refresh();
    };

    const handleOpenCreate = () => {
        setSelectedContact(null);
        setSelectedContactId(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (contact: Contact) => {
        setSelectedContact(contact);
        setSelectedContactId(contact.id);
        setIsFormOpen(true);
    };

    const handleOpenDelete = (contact: Contact) => {
        setSelectedContact(contact);
        setSelectedContactId(contact.id);
        setIsDeleteOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Contacts</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Manage your leads and customers in one place.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="px-4 py-2 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors shadow-sm"
                    >
                        Import CSV
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-emerald-500/20 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Contact
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/[0.08]">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200">Name</th>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200">Contact Info</th>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200">Source</th>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200">Added</th>
                                <th className="px-6 py-4 font-semibold text-right text-zinc-700 dark:text-zinc-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.08]">
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-zinc-900 dark:text-white font-medium mb-1">No contacts yet</h3>
                                            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">
                                                Add your first contact manually or import a CSV file to get started.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <tr key={contact.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
                                                    {contact.first_name[0]}
                                                    {contact.last_name?.[0]}
                                                </div>
                                                <span className="font-medium text-zinc-900 dark:text-white">
                                                    {contact.first_name} {contact.last_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                {contact.email && (
                                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                        <span className="text-xs">✉️</span> {contact.email}
                                                    </div>
                                                )}
                                                {contact.phone && (
                                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                        <span className="text-xs">📞</span> {contact.phone}
                                                    </div>
                                                )}
                                                {!contact.email && !contact.phone && (
                                                    <span className="text-zinc-400 italic text-xs">No info</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 capitalize border border-zinc-200 dark:border-white/10">
                                                {contact.source || "Manual"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-500">
                                            {new Date(contact.created_at).toLocaleDateString(undefined, {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(contact)}
                                                    className="p-2 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDelete(contact)}
                                                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FORM MODAL (Add/Edit) */}
            <ContactFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                contact={selectedContact}
                onSuccess={handleRefresh}
            />

            {/* DELETE CONFIRMATION MODAL */}
            <DeleteContactModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                contact={selectedContact}
                onSuccess={handleRefresh}
            />

            <CsvImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={handleRefresh}
            />
        </div>
    );
}

