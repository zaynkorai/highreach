import { create } from 'zustand';
import { PipelineWithStages, Opportunity } from '@/types/pipeline';

interface PipelineState {
    pipelines: PipelineWithStages[];
    activePipelineId: string | null;
    opportunities: Opportunity[];
    isLoading: boolean;

    actions: {
        setPipelines: (pipelines: PipelineWithStages[]) => void;
        setActivePipelineId: (id: string | null) => void;
        setOpportunities: (opportunities: Opportunity[]) => void;
        addOpportunity: (opportunity: Opportunity) => void;
        updateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
        setIsLoading: (loading: boolean) => void;
    };

    // Derived
    getActivePipeline: () => PipelineWithStages | undefined;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
    pipelines: [],
    activePipelineId: null,
    opportunities: [],
    isLoading: false,

    actions: {
        setPipelines: (pipelines) => {
            set({ pipelines });
            if (pipelines.length > 0 && !get().activePipelineId) {
                set({ activePipelineId: pipelines[0].id });
            }
        },

        setActivePipelineId: (id) => set({ activePipelineId: id }),

        setOpportunities: (opportunities) => set({ opportunities }),

        addOpportunity: (opportunity) => set((state) => ({
            opportunities: [...state.opportunities, opportunity]
        })),

        updateOpportunity: (id, updates) => set((state) => ({
            opportunities: state.opportunities.map((o) =>
                o.id === id ? { ...o, ...updates } : o
            )
        })),

        setIsLoading: (isLoading) => set({ isLoading }),
    },

    getActivePipeline: () => {
        const state = get();
        return state.pipelines.find(p => p.id === state.activePipelineId);
    }
}));

export const usePipelineActions = () => usePipelineStore((state) => state.actions);
