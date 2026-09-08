"use client";

import { useState, useMemo, useTransition, useCallback, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import debounce from "lodash.debounce";
import { Contact, ContactView, PaginatedContacts } from "@/types/contact";
import {
    useContacts,
    useContactActions,
    useFilterSource,
    useFilterTags,
} from "@/stores/contact-store";
import { saveContactView, deleteContactView } from "../actions";
import { toast } from "sonner";

export interface SortConfig {
    key: keyof Contact | "name";
    direction: "asc" | "desc";
}

interface UseContactFiltersOptions {
    initialViews: ContactView[];
    paginatedContacts: PaginatedContacts;
}

export function useContactFilters({ initialViews, paginatedContacts }: UseContactFiltersOptions) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [savedViews, setSavedViews] = useState<ContactView[]>(initialViews);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);

    // Initial search and tag from URL searchParams
    const urlQuery = searchParams.get("q") || "";
    const urlTag = searchParams.get("tag") || "";
    const urlSortBy = (searchParams.get("sortBy") as SortConfig["key"]) || "created_at";
    const urlSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    const [searchQuery, setSearchQueryState] = useState(urlQuery);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: urlSortBy,
        direction: urlSortOrder,
    });

    const contactsRaw = useContacts();
    const { setFilterSource, setFilterTags } = useContactActions();
    const filterSource = useFilterSource();
    const filterTags = useFilterTags();

    // Helper to push URL query updates
    const updateUrl = useCallback(
        (updates: Record<string, string | null>) => {
            const current = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                if (value === null || value === undefined || value === "") {
                    current.delete(key);
                } else {
                    current.set(key, value);
                }
            }
            startTransition(() => {
                router.push(`${pathname}?${current.toString()}`);
            });
        },
        [pathname, router, searchParams]
    );

    // Debounced search sync with URL
    const debouncedSearch = useMemo(
        () =>
            debounce((value: string) => {
                updateUrl({ q: value || null, page: "1" });
            }, 350),
        [updateUrl]
    );

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const setSearchQuery = (query: string) => {
        setSearchQueryState(query);
        debouncedSearch(query);
    };

    const handleSort = (key: keyof Contact | "name") => {
        const nextDirection = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
        setSortConfig({ key, direction: nextDirection });
        const sortBy = key === "name" ? "name" : key === "email" ? "email" : "created_at";
        updateUrl({ sortBy, sortOrder: nextDirection, page: "1" });
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= paginatedContacts.totalPages) {
            updateUrl({ page: String(newPage) });
        }
    };

    // Smart list and views handling
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
            setSearchQueryState("");
            setFilterSource("all");
            setFilterTags([]);
            updateUrl({ q: null, tag: null, page: "1" });
            return;
        }

        setActiveViewId(view.id);
        if (view.filters.searchQuery) {
            setSearchQueryState(view.filters.searchQuery);
        }
        if (view.filters.source) setFilterSource(view.filters.source);
        if (view.filters.tags) setFilterTags(view.filters.tags);
        if (view.filters.sort) setSortConfig(view.filters.sort as SortConfig);

        updateUrl({
            q: view.filters.searchQuery || null,
            tag: view.filters.tags?.[0] || null,
            page: "1",
        });
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

    const onTagToggle = (tag: string) => {
        if (urlTag === tag) {
            updateUrl({ tag: null, page: "1" });
        } else {
            updateUrl({ tag, page: "1" });
        }
    };

    const resetFilters = () => {
        setSearchQueryState("");
        setFilterSource("all");
        setFilterTags([]);
        router.push(pathname);
    };

    const allTags = useMemo(
        () => Array.from(new Set(contactsRaw.flatMap((c) => c.tags || []).filter(Boolean))),
        [contactsRaw]
    );

    const allSources = useMemo(
        () => Array.from(new Set(contactsRaw.map((c) => c.source || "manual").filter(Boolean))),
        [contactsRaw]
    );

    const hasActiveFilters = Boolean(
        searchQuery || urlTag || (filterSource && filterSource !== "all") || filterTags.length > 0
    );

    return {
        contacts: paginatedContacts.contacts,
        total: paginatedContacts.total,
        page: paginatedContacts.page,
        pageSize: paginatedContacts.pageSize,
        totalPages: paginatedContacts.totalPages,
        isPending,
        handlePageChange,
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
        filterTags: urlTag ? [urlTag] : filterTags,
        setFilterTags,
        onTagToggle,
        allTags,
        allSources,
        resetFilters,
        hasActiveFilters,
    };
}
