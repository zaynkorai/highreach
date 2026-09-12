import { create } from 'zustand';
import { PipelineWithStages, PipelineStage, Opportunity } from '@/types/pipeline';

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
        removeOpportunity: (id: string) => void;
        moveOpportunityInStore: (id: string, newStageId: string, newIndex: number) => void;
        addPipeline: (pipeline: PipelineWithStages) => void;
        updatePipelineName: (id: string, name: string) => void;
        removePipeline: (id: string) => void;
        addStage: (pipelineId: string, stage: PipelineStage) => void;
        updateStageName: (stageId: string, name: string) => void;
        removeStage: (pipelineId: string, stageId: string) => void;
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

        removeOpportunity: (id) => set((state) => ({
            opportunities: state.opportunities.filter((o) => o.id !== id)
        })),

        moveOpportunityInStore: (id, newStageId, newIndex) => set((state) => {
            const targetOpp = state.opportunities.find((o) => o.id === id);
            if (!targetOpp) return state;

            // Get opportunities in new stage (excluding the moved one)
            const stageOpps = state.opportunities
                .filter((o) => o.pipeline_stage_id === newStageId && o.id !== id)
                .sort((a, b) => a.order_index - b.order_index);

            // Insert moved opportunity at newIndex
            const clampedIndex = Math.max(0, Math.min(newIndex, stageOpps.length));
            const updatedStageList = [
                ...stageOpps.slice(0, clampedIndex),
                { ...targetOpp, pipeline_stage_id: newStageId },
                ...stageOpps.slice(clampedIndex),
            ].map((opp, idx) => ({ ...opp, order_index: idx }));

            // Map all opportunities back
            const stageOppMap = new Map(updatedStageList.map((o) => [o.id, o]));
            return {
                opportunities: state.opportunities.map((o) => stageOppMap.get(o.id) || o),
            };
        }),

        addPipeline: (pipeline) => set((state) => ({
            pipelines: [...state.pipelines, pipeline],
            activePipelineId: pipeline.id,
        })),

        updatePipelineName: (id, name) => set((state) => ({
            pipelines: state.pipelines.map((p) =>
                p.id === id ? { ...p, name } : p
            )
        })),

        removePipeline: (id) => set((state) => {
            const remaining = state.pipelines.filter((p) => p.id !== id);
            return {
                pipelines: remaining,
                activePipelineId: state.activePipelineId === id ? (remaining[0]?.id || null) : state.activePipelineId,
            };
        }),

        addStage: (pipelineId, stage) => set((state) => ({
            pipelines: state.pipelines.map((p) =>
                p.id === pipelineId
                    ? { ...p, stages: [...p.stages, stage] }
                    : p
            )
        })),

        updateStageName: (stageId, name) => set((state) => ({
            pipelines: state.pipelines.map((p) => ({
                ...p,
                stages: p.stages.map((s) => s.id === stageId ? { ...s, name } : s)
            }))
        })),

        removeStage: (pipelineId, stageId) => set((state) => ({
            pipelines: state.pipelines.map((p) =>
                p.id === pipelineId
                    ? { ...p, stages: p.stages.filter((s) => s.id !== stageId) }
                    : p
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

