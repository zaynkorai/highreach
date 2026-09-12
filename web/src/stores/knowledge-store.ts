import { create } from "zustand";
import type { KnowledgeSourceSummary, KnowledgeStats } from "@/lib/services/knowledge-service";
import type { SemanticSearchResult } from "@/lib/ai/semantic-retrieval";
import type { KnowledgeSourceFormData, UpdateKnowledgeSourceFormData } from "@/lib/validations/knowledge";
import {
    getKnowledgeSourcesAction,
    getKnowledgeStatsAction,
    getKnowledgeSourceWithChunksAction,
    createKnowledgeSourceAction,
    updateKnowledgeSourceAction,
    deleteKnowledgeSourceAction,
    reindexKnowledgeSourceAction,
    testSemanticSearchAction,
} from "@/app/dashboard/knowledge/actions";

export type KnowledgeTab = "catalog" | "test-bench";

export interface ChunkItem {
    id: string;
    sourceId: string;
    content: string;
    tokenCount: number | null;
    createdAt: Date;
}

interface KnowledgeState {
    sources: KnowledgeSourceSummary[];
    stats: KnowledgeStats | null;
    activeTab: KnowledgeTab;
    filterType: string;
    searchQuery: string;
    isLoading: boolean;
    isSearching: boolean;

    // Modals
    isAddModalOpen: boolean;
    editingSource: KnowledgeSourceSummary | null;
    isChunksModalOpen: boolean;
    selectedSourceWithChunks: {
        source: KnowledgeSourceSummary;
        chunks: ChunkItem[];
    } | null;

    // Test Bench
    testQuery: string;
    minSimilarity: number;
    testResults: SemanticSearchResult[];
    testSearchTimeMs: number | null;

    // Actions
    setActiveTab: (tab: KnowledgeTab) => void;
    setFilterType: (filter: string) => void;
    setSearchQuery: (query: string) => void;
    setTestQuery: (query: string) => void;
    setMinSimilarity: (score: number) => void;
    openAddModal: (source?: KnowledgeSourceSummary) => void;
    closeAddModal: () => void;
    openChunksModal: (sourceId: string) => Promise<void>;
    closeChunksModal: () => void;

    fetchSources: () => Promise<void>;
    fetchStats: () => Promise<void>;
    refreshAll: () => Promise<void>;
    createSource: (data: KnowledgeSourceFormData) => Promise<boolean>;
    updateSource: (id: string, data: UpdateKnowledgeSourceFormData) => Promise<boolean>;
    deleteSource: (id: string) => Promise<boolean>;
    reindexSource: (id: string) => Promise<boolean>;
    runSemanticSearch: (queryOverride?: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
    sources: [],
    stats: null,
    activeTab: "catalog",
    filterType: "all",
    searchQuery: "",
    isLoading: false,
    isSearching: false,

    isAddModalOpen: false,
    editingSource: null,
    isChunksModalOpen: false,
    selectedSourceWithChunks: null,

    testQuery: "",
    minSimilarity: 0.5,
    testResults: [],
    testSearchTimeMs: null,

    setActiveTab: (tab) => set({ activeTab: tab }),
    setFilterType: (filter) => set({ filterType: filter }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setTestQuery: (query) => set({ testQuery: query }),
    setMinSimilarity: (score) => set({ minSimilarity: score }),

    openAddModal: (source) => set({ isAddModalOpen: true, editingSource: source || null }),
    closeAddModal: () => set({ isAddModalOpen: false, editingSource: null }),

    openChunksModal: async (sourceId) => {
        set({ isChunksModalOpen: true });
        const res = await getKnowledgeSourceWithChunksAction(sourceId);
        if (res.success && res.data) {
            set({
                selectedSourceWithChunks: {
                    source: {
                        ...res.data.source,
                        chunkCount: res.data.chunks.length,
                        totalTokens: res.data.chunks.reduce((acc, c) => acc + (c.tokenCount ?? 0), 0),
                    } as KnowledgeSourceSummary,
                    chunks: res.data.chunks as ChunkItem[],
                },
            });
        }
    },
    closeChunksModal: () => set({ isChunksModalOpen: false, selectedSourceWithChunks: null }),

    fetchSources: async () => {
        set({ isLoading: true });
        const res = await getKnowledgeSourcesAction();
        if (res.success && res.data) {
            set({ sources: res.data, isLoading: false });
        } else {
            set({ isLoading: false });
        }
    },

    fetchStats: async () => {
        const res = await getKnowledgeStatsAction();
        if (res.success && res.data) {
            set({ stats: res.data });
        }
    },

    refreshAll: async () => {
        set({ isLoading: true });
        const [sourcesRes, statsRes] = await Promise.all([
            getKnowledgeSourcesAction(),
            getKnowledgeStatsAction(),
        ]);
        set({
            sources: sourcesRes.success && sourcesRes.data ? sourcesRes.data : [],
            stats: statsRes.success && statsRes.data ? statsRes.data : null,
            isLoading: false,
        });
    },

    createSource: async (data) => {
        set({ isLoading: true });
        const res = await createKnowledgeSourceAction(data);
        if (res.success) {
            await get().refreshAll();
            set({ isAddModalOpen: false, editingSource: null });
            return true;
        }
        set({ isLoading: false });
        return false;
    },

    updateSource: async (id, data) => {
        set({ isLoading: true });
        const res = await updateKnowledgeSourceAction(id, data);
        if (res.success) {
            await get().refreshAll();
            set({ isAddModalOpen: false, editingSource: null });
            return true;
        }
        set({ isLoading: false });
        return false;
    },

    deleteSource: async (id) => {
        const res = await deleteKnowledgeSourceAction(id);
        if (res.success) {
            await get().refreshAll();
            return true;
        }
        return false;
    },

    reindexSource: async (id) => {
        const res = await reindexKnowledgeSourceAction(id);
        if (res.success) {
            await get().refreshAll();
            return true;
        }
        return false;
    },

    runSemanticSearch: async (queryOverride) => {
        const query = (queryOverride ?? get().testQuery).trim();
        if (!query) return;

        set({ isSearching: true, testSearchTimeMs: null });
        const startTime = performance.now();

        const res = await testSemanticSearchAction({
            query,
            minSimilarity: get().minSimilarity,
            maxResults: 6,
        });

        const elapsed = Math.round(performance.now() - startTime);

        if (res.success && res.data) {
            set({
                testResults: res.data,
                isSearching: false,
                testSearchTimeMs: elapsed,
            });
        } else {
            set({ testResults: [], isSearching: false, testSearchTimeMs: elapsed });
        }
    },
}));
