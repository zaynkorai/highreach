import { create } from 'zustand';
import { Conversation, Message } from '@/types/inbox';

interface InboxState {
    conversations: Conversation[];
    selectedId: string | null;
    messages: Message[];
    isLoadingMessages: boolean;

    actions: {
        setConversations: (conversations: Conversation[]) => void;
        updateConversation: (conversation: Conversation) => void;
        setSelectedId: (id: string | null) => void;
        setMessages: (messages: Message[]) => void;
        addMessage: (message: Message, conversationId: string) => void; // conversationId check for safety
        setIsLoadingMessages: (isLoading: boolean) => void;
        reset: () => void;
    };
}

export const useInboxStore = create<InboxState>((set) => ({
    conversations: [],
    selectedId: null,
    messages: [],
    isLoadingMessages: false,

    actions: {
        setConversations: (conversations) => set({ conversations }),

        updateConversation: (updatedConv) => set((state) => ({
            conversations: state.conversations.map((c) =>
                c.id === updatedConv.id ? { ...c, ...updatedConv, contact: c.contact } : c
            ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
        })),

        setSelectedId: (id) => set({ selectedId: id }),

        setMessages: (messages) => set({ messages }),

        addMessage: (message, conversationId) => set((state) => {
            // Only add if it belongs to currently loaded conversation to avoid confusion
            // Although typical pattern is to just add it if matches selectedId
            if (state.selectedId !== conversationId) return state;

            // Deduplicate by ID
            const exists = state.messages.some(m => m.id === message.id);
            if (exists) return state;

            return { messages: [...state.messages, message] };
        }),

        setIsLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),

        reset: () => set({ conversations: [], selectedId: null, messages: [], isLoadingMessages: false }),
    },
}));

export const useInboxActions = () => useInboxStore((state) => state.actions);
// Selectors
export const useConversations = () => useInboxStore((state) => state.conversations);
export const useSelectedConversationId = () => useInboxStore((state) => state.selectedId);
export const useMessages = () => useInboxStore((state) => state.messages);
export const useIsLoadingMessages = () => useInboxStore((state) => state.isLoadingMessages);
export const useSelectedConversation = () => useInboxStore((state) =>
    state.conversations.find(c => c.id === state.selectedId)
);
