import { create } from 'zustand';

import { Contact } from '@/types/contact';

interface ContactState {
    contacts: Contact[];
    selectedContactId: string | null;
    searchQuery: string;

    actions: {
        setContacts: (contacts: Contact[]) => void;
        addContact: (contact: Contact) => void;
        updateContact: (id: string, updates: Partial<Contact>) => void;
        deleteContact: (id: string) => void;
        setSelectedContactId: (id: string | null) => void;
        setSearchQuery: (query: string) => void;
    };
}

export const useContactStore = create<ContactState>((set) => ({
    contacts: [],
    selectedContactId: null,
    searchQuery: "",

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
    },
}));

export const useContactActions = () => useContactStore((state) => state.actions);
export const useContacts = () => useContactStore((state) => state.contacts);
export const useContactSearchQuery = () => useContactStore((state) => state.searchQuery);
export const useFilteredContacts = () => useContactStore((state) => {
    const query = state.searchQuery.toLowerCase();
    if (!query) return state.contacts;

    return state.contacts.filter(c =>
        (c.first_name?.toLowerCase().includes(query)) ||
        (c.last_name?.toLowerCase().includes(query)) ||
        (c.email?.toLowerCase().includes(query)) ||
        (c.phone?.toLowerCase().includes(query))
    );
});
