import { create } from 'zustand';

import { Contact } from '@/types/contact';

interface ContactState {
    contacts: Contact[];
    selectedContactId: string | null;
    searchQuery: string;
    filterSource: string | "all";
    filterTags: string[];

    actions: {
        setContacts: (contacts: Contact[]) => void;
        addContact: (contact: Contact) => void;
        updateContact: (id: string, updates: Partial<Contact>) => void;
        deleteContact: (id: string) => void;
        setSelectedContactId: (id: string | null) => void;
        setSearchQuery: (query: string) => void;
        setFilterSource: (source: string | "all") => void;
        setFilterTags: (tags: string[]) => void;
    };
}

export const useContactStore = create<ContactState>((set) => ({
    contacts: [],
    selectedContactId: null,
    searchQuery: "",
    filterSource: "all",
    filterTags: [],

    actions: {
        setContacts: (contacts) => set({ contacts }),

        addContact: (contact) => set((state) => ({
            contacts: [contact, ...state.contacts]
        })),

        updateContact: (id, updates) => set((state) => ({
            contacts: state.contacts.map(c => c.id === id ? { ...c, ...updates } : c)
        })),

        deleteContact: (id) => set((state) => ({
            contacts: state.contacts.filter(c => c.id !== id)
        })),

        setSelectedContactId: (id) => set({ selectedContactId: id }),

        setSearchQuery: (query) => set({ searchQuery: query }),
        setFilterSource: (source) => set({ filterSource: source }),
        setFilterTags: (tags) => set({ filterTags: tags }),
    },
}));

export const useContactActions = () => useContactStore((state) => state.actions);
export const useContacts = () => useContactStore((state) => state.contacts);
export const useContactSearchQuery = () => useContactStore((state) => state.searchQuery);
export const useFilterSource = () => useContactStore((state) => state.filterSource);
export const useFilterTags = () => useContactStore((state) => state.filterTags);

// Removed useFilteredContacts to prevent infinite loops.
// Use useContacts + useContactFilters + useContactSearchQuery in component with useMemo.
