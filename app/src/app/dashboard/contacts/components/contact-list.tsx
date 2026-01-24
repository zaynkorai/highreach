"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Contact, ContactView } from "@/types/contact";
import { ContactSheet } from "./contact-sheet"; // Updated import
import { DeleteContactModal } from "./delete-contact-modal";
import { CsvImportModal } from "./csv-import-modal";
import { useContactStore, useContactActions, useContacts, useFilterSource, useFilterTags, useContactSearchQuery } from "@/stores/contact-store"; import { useMemo } from "react";
import { Badge } from "@/components/ui/badge"; // Shadcn
import { Input } from "@/components/ui/input"; // Shadcn
import { Checkbox } from "@/components/ui/checkbox"; // Shadcn
import { bulkDeleteContacts, bulkAddTags, saveContactView, deleteContactView } from "../actions";
import { toast } from "sonner";
import { ArrowUpDown } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Filter, Plus, Search, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";


interface ContactListProps {
    initialContacts: Contact[];
    initialViews: ContactView[];
}

export function ContactList({ initialContacts, initialViews }: ContactListProps) {
    const [savedViews, setSavedViews] = useState<ContactView[]>(initialViews);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);
    const router = useRouter();

    // Zustand Store
    const contactsRaw = useContacts();
    const { setContacts, setSelectedContactId, setSearchQuery, setFilterSource, setFilterTags } = useContactActions();
    const filterSource = useFilterSource();
    const filterTags = useFilterTags();
    const searchQuery = useContactSearchQuery();

    const [sortConfig, setSortConfig] = useState<{ key: keyof Contact | "name"; direction: "asc" | "desc" }>({ key: "created_at", direction: "desc" });

    const filteredContacts = useMemo(() => {
        const query = searchQuery.toLowerCase();

        return contactsRaw.filter(c => {
            // Search Filter
            const matchesSearch = !query || (
                (c.first_name?.toLowerCase().includes(query)) ||
                (c.last_name?.toLowerCase().includes(query)) ||
                (c.email?.toLowerCase().includes(query)) ||
                (c.phone?.toLowerCase().includes(query))
            );

            // Source Filter
            const matchesSource = filterSource === "all" || !filterSource || c.source === filterSource;

            // Tags Filter
            const matchesTags = filterTags.length === 0 || filterTags.every((t: string) => c.tags?.includes(t));

            return matchesSearch && matchesSource && matchesTags;
        }).sort((a, b) => {
            const { key, direction } = sortConfig;
            let valA: any = "";
            let valB: any = "";

            if (key === "name") {
                valA = `${a.first_name} ${a.last_name || ""}`.toLowerCase();
                valB = `${b.first_name} ${b.last_name || ""}`.toLowerCase();
            } else {
                valA = a[key] || "";
                valB = b[key] || "";
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
            }

            if (valA < valB) return direction === "asc" ? -1 : 1;
            if (valA > valB) return direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [contactsRaw, searchQuery, filterSource, filterTags, sortConfig]);

    // Local UI state
    const [isSheetOpen, setIsSheetOpen] = useState(false); // Changed from isFormOpen
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Bulk Actions handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredContacts.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} contacts?`)) return;

        try {
            const result = await bulkDeleteContacts(Array.from(selectedIds));
            if (result.success) {
                toast.success(`Deleted ${selectedIds.size} contacts`);
                setSelectedIds(new Set());
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete contacts");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    };

    const handleBulkAddTag = async (tag: string) => {
        let tagToAdd = tag;
        // Logic to handle "Create Tag" selection or manual typing if captured
        if (tag === "Create Tag") {
            const input = prompt("Enter new tag name:");
            if (!input) return;
            tagToAdd = input.trim();
        }

        try {
            const result = await bulkAddTags(Array.from(selectedIds), [tagToAdd]);
            if (result.success) {
                toast.success(`Added tag "${tagToAdd}" to ${selectedIds.size} contacts`);
                setSelectedIds(new Set());
                router.refresh();
            } else {
                toast.error(result.error || "Failed to add tags");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    };

    const handleSort = (key: keyof Contact | "name") => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
        }));
    };

    // Saved Views Handlers
    const handleSaveView = async () => {
        const name = prompt("Name your Smart List:");
        if (!name?.trim()) return;

        const filters = {
            source: filterSource === "all" ? undefined : filterSource,
            tags: filterTags.length > 0 ? filterTags : undefined,
            searchQuery: searchQuery || undefined,
            sort: sortConfig
        };

        try {
            const result = await saveContactView(name, filters);
            if (result.success) {
                toast.success("Smart list saved");
                router.refresh();
                // Optimistic update
                setSavedViews([...savedViews, {
                    id: crypto.randomUUID(), // Temp ID until refresh
                    tenant_id: "",
                    name,
                    filters,
                    created_at: new Date().toISOString()
                } as any]);
            } else {
                toast.error(result.error || "Failed to save view");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    };

    const handleSwitchView = (view: ContactView | null) => {
        if (!view) {
            setActiveViewId(null);
            setSearchQuery("");
            setFilterSource("all");
            setFilterTags([]);
            return;
        }

        setActiveViewId(view.id);
        if (view.filters.searchQuery) setSearchQuery(view.filters.searchQuery);
        if (view.filters.source) setFilterSource(view.filters.source);
        if (view.filters.tags) setFilterTags(view.filters.tags);
        if (view.filters.sort) setSortConfig(view.filters.sort as any);
    };

    const handleDeleteView = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this smart list?")) return;

        try {
            const result = await deleteContactView(id);
            if (result.success) {
                toast.success("Smart list deleted");
                setSavedViews(savedViews.filter(v => v.id !== id));
                if (activeViewId === id) handleSwitchView(null);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete view");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    };

    // Sync contacts when initialContacts prop updates
    useEffect(() => {
        setContacts(initialContacts);
    }, [initialContacts, setContacts]);

    // Unique tags and sources for filters
    const allTags = Array.from(new Set(contactsRaw.flatMap(c => c.tags || []).filter(Boolean)));
    const allSources = Array.from(new Set(contactsRaw.map(c => c.source || "manual").filter(Boolean)));

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

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Contacts</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Manage your leads and customers.
                    </p>
                </div>

                {/* Saved Views Tabs - Mobile Responsive */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 sm:mb-0 sm:pb-0 sm:ml-4 flex-1 no-scrollbar mask-linear-fade">
                    <Button
                        variant={activeViewId === null ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleSwitchView(null)}
                        className={cn("rounded-full h-8 text-xs font-medium transition-all", activeViewId === null && "bg-zinc-100 dark:bg-zinc-800")}
                    >
                        All Contacts
                    </Button>
                    {savedViews.map(view => (
                        <div key={view.id} className="relative group flex-shrink-0">
                            <Button
                                variant={activeViewId === view.id ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => handleSwitchView(view)}
                                className={cn("rounded-full h-8 text-xs font-medium pr-7 transition-all", activeViewId === view.id && "bg-zinc-100 dark:bg-zinc-800")}
                            >
                                {view.name}
                            </Button>
                            <div
                                onClick={(e) => handleDeleteView(view.id, e)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                            >
                                <XIcon className="h-3 w-3 text-zinc-500" />
                            </div>
                        </div>
                    ))}
                    {(searchQuery || filterSource !== "all" || filterTags.length > 0) && activeViewId === null && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveView}
                            className="rounded-full h-8 text-xs border-dashed gap-1 ml-2 text-zinc-500 hover:text-zinc-900 flex-shrink-0"
                        >
                            <Plus className="h-3 w-3" />
                            Save View
                        </Button>
                    )}
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsImportOpen(true)}
                    >
                        Import CSV
                    </Button>
                    <Button
                        onClick={handleOpenCreate}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Contact
                    </Button>
                </div>
            </div>

            {/* Smart Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 p-1">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white dark:bg-zinc-900"
                    />
                </div>

                {/* Source Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="border-dashed">
                            <Filter className="mr-2 h-4 w-4" />
                            Source
                            {filterSource !== "all" && (
                                <>
                                    <span className="mx-2 h-4 w-[1px] shrink-0 bg-border" />
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                        {filterSource}
                                    </Badge>
                                </>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Filter source..." />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => setFilterSource("all")}
                                    >
                                        <div className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            filterSource === "all" ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                        )}>
                                            <Check className={cn("h-4 w-4")} />
                                        </div>
                                        <span>All Sources</span>
                                    </CommandItem>
                                    {allSources.map((source) => (
                                        <CommandItem
                                            key={source}
                                            onSelect={() => {
                                                if (filterSource === source) {
                                                    setFilterSource("all");
                                                } else {
                                                    setFilterSource(source);
                                                }
                                            }}
                                        >
                                            <div className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                filterSource === source ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                            )}>
                                                <Check className={cn("h-4 w-4")} />
                                            </div>
                                            <span>{source}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Tags Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="border-dashed">
                            <Plus className="mr-2 h-4 w-4" />
                            Tags
                            {filterTags.length > 0 && (
                                <>
                                    <span className="mx-2 h-4 w-[1px] shrink-0 bg-border" />
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                                        {filterTags.length}
                                    </Badge>
                                    <div className="hidden space-x-1 lg:flex">
                                        {filterTags.length > 2 ? (
                                            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                                                {filterTags.length} selected
                                            </Badge>
                                        ) : (
                                            filterTags.map((tag) => (
                                                <Badge
                                                    variant="secondary"
                                                    key={tag}
                                                    className="rounded-sm px-1 font-normal"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Filter tags..." />
                            <CommandList>
                                <CommandEmpty>No tags found.</CommandEmpty>
                                <CommandGroup>
                                    {allTags.map((tag) => {
                                        const isSelected = filterTags.includes(tag);
                                        return (
                                            <CommandItem
                                                key={tag}
                                                onSelect={() => {
                                                    if (isSelected) {
                                                        setFilterTags(filterTags.filter((t) => t !== tag));
                                                    } else {
                                                        setFilterTags([...filterTags, tag]);
                                                    }
                                                }}
                                            >
                                                <div className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                )}>
                                                    <Check className={cn("h-4 w-4")} />
                                                </div>
                                                <span>{tag}</span>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                                {filterTags.length > 0 && (
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => setFilterTags([])}
                                                className="justify-center text-center"
                                            >
                                                Clear filters
                                            </CommandItem>
                                        </CommandGroup>
                                    </>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Reset Filters */}
                {(searchQuery || filterSource !== "all" || filterTags.length > 0) && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSearchQuery("");
                            setFilterSource("all");
                            setFilterTags([]);
                        }}
                        className="h-8 px-2 lg:px-3"
                    >
                        Reset
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}

            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/[0.08]">
                            <tr>
                                <th className="px-6 py-4 w-[50px]">
                                    <Checkbox
                                        checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length}
                                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        aria-label="Select all"
                                    />
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                                    onClick={() => handleSort("name")}
                                >
                                    <div className="flex items-center gap-2">
                                        Name
                                        <ArrowUpDown className="w-4 h-4 text-zinc-400" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200">Contact Info</th>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200">Tags</th>
                                <th
                                    className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                                    onClick={() => handleSort("source")}
                                >
                                    <div className="flex items-center gap-2">
                                        Source
                                        <ArrowUpDown className="w-4 h-4 text-zinc-400" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-right text-zinc-700 dark:text-zinc-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.08]">
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                                <Search className="w-6 h-6 text-zinc-400" />
                                            </div>
                                            <h3 className="text-zinc-900 dark:text-white font-medium mb-1">No contacts found</h3>
                                            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">
                                                No contacts match your current filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <tr key={contact.id} className={cn(
                                        "group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors",
                                        selectedIds.has(contact.id) && "bg-zinc-50 dark:bg-white/[0.05]"
                                    )}>
                                        <td className="px-6 py-4">
                                            <Checkbox
                                                checked={selectedIds.has(contact.id)}
                                                onCheckedChange={(checked) => handleSelectOne(contact.id, !!checked)}
                                                aria-label={`Select ${contact.first_name}`}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
                                                    {contact.first_name[0]}
                                                    {contact.last_name?.[0]}
                                                </div>
                                                <span className="font-medium text-zinc-900 dark:text-white cursor-pointer hover:underline" onClick={() => handleOpenEdit(contact)}>
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
                                            <div className="flex flex-wrap gap-1">
                                                {contact.tags && contact.tags.length > 0 ? (
                                                    contact.tags.map(tag => (
                                                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 h-5">
                                                            {tag}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-zinc-400 text-xs">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 capitalize border border-zinc-200 dark:border-white/10">
                                                {contact.source || "Manual"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEdit(contact)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDelete(contact)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-200 z-40 border border-zinc-700/50">
                    <span className="text-sm font-medium pl-1">
                        {selectedIds.size} selected
                    </span>
                    <div className="h-4 w-[1px] bg-zinc-700" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIds(new Set())}
                        className="hover:bg-zinc-800 text-zinc-300 hover:text-white h-8"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="h-8 shadow-sm"
                    >
                        Delete
                    </Button>

                    {/* Bulk Tagging Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 shadow-sm text-zinc-900 dark:text-zinc-100"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add Tag
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="center" side="top">
                            <Command>
                                <CommandInput placeholder="Tag name..." />
                                <CommandList>
                                    <CommandEmpty>
                                        <div className="p-2 text-center text-xs text-muted-foreground">
                                            Type to create new tag
                                        </div>
                                    </CommandEmpty>
                                    <CommandGroup heading="Existing Tags">
                                        {allTags.map((tag) => (
                                            <CommandItem
                                                key={tag}
                                                onSelect={() => handleBulkAddTag(tag)}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add "{tag}"
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    <CommandSeparator />
                                    <CommandGroup heading="Create New">
                                        <CommandItem onSelect={(val) => handleBulkAddTag(val)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Tag
                                        </CommandItem>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            {/* CONTACT SHEET (Add/Edit) */}
            <ContactSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                contact={selectedContact}
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

function X({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}
