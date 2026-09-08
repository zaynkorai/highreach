"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Contact, ContactView } from "@/types/contact";
import {
    useContacts,
    useContactActions,
    useFilterSource,
    useFilterTags,
    useContactSearchQuery,
} from "@/stores/contact-store";
import { saveContactView, deleteContactView } from "../actions";
import { toast } from "sonner";

export interface SortConfig {
    key: keyof Contact | "name";
    direction: "asc" | "desc";
}

export function useContactFilters(initialViews: ContactView[]) {
    const router = useRouter();
    const [savedViews, setSavedViews] = useState<ContactView[]>(initialViews);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: "created_at",
        direction: "desc",
    });

    const contactsRaw = useContacts();
    const { setSearchQuery, setFilterSource, setFilterTags } = useContactActions();
    const filterSource = useFilterSource();
    const filterTags = useFilterTags();
    const searchQuery = useContactSearchQuery();

    const filteredContacts = useMemo(() => {
        const query = searchQuery.toLowerCase();

        return contactsRaw
            .filter((c) => {
                const matchesSearch =
                    !query ||
                    c.first_name?.toLowerCase().includes(query) ||
                    c.last_name?.toLowerCase().includes(query) ||
                    c.email?.toLowerCase().includes(query) ||
                    c.phone?.toLowerCase().includes(query);

                const matchesSource =
                    filterSource === "all" || !filterSource || c.source === filterSource;

                const matchesTags =
                    filterTags.length === 0 ||
                    filterTags.every((t: string) => c.tags?.includes(t));

                return matchesSearch && matchesSource && matchesTags;
            })
            .sort((a, b) => {
                const { key, direction } = sortConfig;
                let valA: string | number = "";
                let valB: string | number = "";

                if (key === "name") {
                    valA = `${a.first_name} ${a.last_name || ""}`.toLowerCase();
                    valB = `${b.first_name} ${b.last_name || ""}`.toLowerCase();
                } else {
                    valA = (a[key] as string) || "";
                    valB = (b[key] as string) || "";
                    if (typeof valA === "string") valA = valA.toLowerCase();
                    if (typeof valB === "string") valB = valB.toLowerCase();
                }

                if (valA < valB) return direction === "asc" ? -1 : 1;
                if (valA > valB) return direction === "asc" ? 1 : -1;
                return 0;
            });
    }, [contactsRaw, searchQuery, filterSource, filterTags, sortConfig]);

    const allTags = useMemo(
        () => Array.from(new Set(contactsRaw.flatMap((c) => c.tags || []).filter(Boolean))),
        [contactsRaw]
    );

    const allSources = useMemo(
        () => Array.from(new Set(contactsRaw.map((c) => c.source || "manual").filter(Boolean))),
        [contactsRaw]
    );

    const handleSort = (key: keyof Contact | "name") => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
    };

    const handleSaveView = async () => {
        const name = prompt("Name your Smart List:");
        if (!name?.trim()) return;

        const filters = {
            source: filterSource === "all" ? undefined : filterSource,
            tags: filterTags.length > 0 ? filterTags : undefined,
            searchQuery: searchQuery || undefined,
            sort: sortConfig,
        };

        try {
            const result = await saveContactView(name, filters);
            if (result.success) {
                toast.success("Smart list saved");
                router.refresh();
                setSavedViews((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        tenant_id: "",
                        name,
                        filters,
                        created_at: new Date().toISOString(),
                    },
                ]);
            } else {
                toast.error(result.error || "Failed to save view");
            }
        } catch {
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
        if (view.filters.sort) setSortConfig(view.filters.sort as SortConfig);
    };

    const handleDeleteView = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this smart list?")) return;

        try {
            const result = await deleteContactView(id);
            if (result.success) {
                toast.success("Smart list deleted");
                setSavedViews((prev) => prev.filter((v) => v.id !== id));
                if (activeViewId === id) handleSwitchView(null);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete view");
            }
        } catch {
            toast.error("An unexpected error occurred");
        }
    };

    const resetFilters = () => {
        setSearchQuery("");
        setFilterSource("all");
        setFilterTags([]);
    };

    const hasActiveFilters = Boolean(
        searchQuery || (filterSource && filterSource !== "all") || filterTags.length > 0
    );

    return {
        filteredContacts,
        sortConfig,
        handleSort,
        savedViews,
        activeViewId,
        handleSaveView,
        handleSwitchView,
        handleDeleteView,
        searchQuery,
        setSearchQuery,
        filterSource,
        setFilterSource,
        filterTags,
        setFilterTags,
        allTags,
        allSources,
        resetFilters,
        hasActiveFilters,
    };
}
