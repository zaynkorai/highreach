import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    isSidebarOpen: boolean;
    theme: 'light' | 'dark' | 'system'; // syncing with next-themes potentially

    actions: {
        toggleSidebar: () => void;
        setSidebarOpen: (isOpen: boolean) => void;
        setTheme: (theme: 'light' | 'dark' | 'system') => void;
    };
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            theme: 'system',

            actions: {
                toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
                setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
                setTheme: (theme) => set({ theme }),
            },
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({ isSidebarOpen: state.isSidebarOpen, theme: state.theme }),
        }
    )
);

export const useUIActions = () => useUIStore((state) => state.actions);
export const useIsSidebarOpen = () => useUIStore((state) => state.isSidebarOpen);
export const useTheme = () => useUIStore((state) => state.theme);
