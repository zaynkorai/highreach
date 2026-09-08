"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Contact, ContactView, PaginatedContacts } from "@/types/contact";
import { useContactActions } from "@/stores/contact-store";
import { bulkDeleteContacts, bulkAddTags } from "../actions";
import { toast } from "sonner";
import { useContactFilters } from "../hooks/use-contact-filters";
import { useContactSelection } from "../hooks/use-contact-selection";
import { ContactToolbar } from "./contact-toolbar";
import { ContactTable } from "./contact-table";
import { ContactBulkBar } from "./contact-bulk-bar";
import { ContactSheet } from "./contact-sheet";
import { DeleteContactModal } from "./delete-contact-modal";
import { CsvImportModal } from "./csv-import-modal";

interface ContactListProps {
    initialPaginatedContacts: PaginatedContacts;
    initialViews: ContactView[];
}

export function ContactList({ initialPaginatedContacts, initialViews }: ContactListProps) {
    const router = useRouter();
    const { setContacts, setSelectedContactId } = useContactActions();

    // Custom Hooks
    const filters = useContactFilters({
        initialViews,
        paginatedContacts: initialPaginatedContacts,
    });
    const selection = useContactSelection();

    // Modal States
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    // Sync initial contacts into store
    useEffect(() => {
        setContacts(initialPaginatedContacts.contacts);
    }, [initialPaginatedContacts.contacts, setContacts]);

    const handleRefresh = () => {
        router.refresh();
    };

    const handleOpenCreate = () => {
        setSelectedContact(null);
        setSelectedContactId(null);
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (contact: Contact) => {
        setSelectedContact(contact);
        setSelectedContactId(contact.id);
        setIsSheetOpen(true);
    };

    const handleOpenDelete = (contact: Contact) => {
        setSelectedContact(contact);
        setSelectedContactId(contact.id);
        setIsDeleteOpen(true);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selection.selectedCount} contacts?`)) return;

        try {
            const result = await bulkDeleteContacts(Array.from(selection.selectedIds));
            if (result.success) {
                toast.success(`Deleted ${selection.selectedCount} contacts`);
                selection.clearSelection();
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete contacts");
            }
        } catch {
            toast.error("An unexpected error occurred");
        }
    };

    const handleBulkAddTag = async (tag: string) => {
        let tagToAdd = tag;
        if (tag === "Create Tag") {
            const input = prompt("Enter new tag name:");
            if (!input) return;
            tagToAdd = input.trim();
        }

        try {
            const result = await bulkAddTags(Array.from(selection.selectedIds), [tagToAdd]);
            if (result.success) {
                toast.success(`Added tag "${tagToAdd}" to ${selection.selectedCount} contacts`);
                selection.clearSelection();
                router.refresh();
            } else {
                toast.error(result.error || "Failed to add tags");
            }
        } catch {
            toast.error("An unexpected error occurred");
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <ContactToolbar
                savedViews={filters.savedViews}
                activeViewId={filters.activeViewId}
                onSwitchView={filters.handleSwitchView}
                onDeleteView={filters.handleDeleteView}
                onSaveView={filters.handleSaveView}
                onImportClick={() => setIsImportOpen(true)}
                onAddContactClick={handleOpenCreate}
                searchQuery={filters.searchQuery}
                onSearchChange={filters.setSearchQuery}
                filterSource={filters.filterSource}
                allSources={filters.allSources}
                onSourceChange={filters.setFilterSource}
                filterTags={filters.filterTags}
                allTags={filters.allTags}
                onTagToggle={filters.onTagToggle}
                onClearTags={() => {
                    if (filters.filterTags.length > 0) {
                        filters.onTagToggle(filters.filterTags[0]);
                    }
                }}
                hasActiveFilters={filters.hasActiveFilters}
                onResetFilters={filters.resetFilters}
            />

            <ContactTable
                contacts={filters.contacts}
                selectedIds={selection.selectedIds}
                onSelectAll={(checked) =>
                    selection.handleSelectAll(
                        checked,
                        filters.contacts.map((c) => c.id)
                    )
                }
                onSelectOne={selection.handleSelectOne}
                sortConfig={filters.sortConfig}
                onSort={filters.handleSort}
                onEditContact={handleOpenEdit}
                onDeleteContact={handleOpenDelete}
                total={filters.total}
                page={filters.page}
                pageSize={filters.pageSize}
                totalPages={filters.totalPages}
                onPageChange={filters.handlePageChange}
            />

            <ContactBulkBar
                selectedCount={selection.selectedCount}
                onClearSelection={selection.clearSelection}
                onBulkDelete={handleBulkDelete}
                allTags={filters.allTags}
                onBulkAddTag={handleBulkAddTag}
            />

            {/* Modals & Drawers */}
            <ContactSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                contact={selectedContact}
            />

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
