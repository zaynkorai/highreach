import { create, useStore } from 'zustand';
import { FormField, FormFieldType, FormTheme } from '@/types/form';
import { arrayMove } from '@dnd-kit/sortable';
import { temporal } from 'zundo';

interface FormEditorState {
    fields: FormField[];
    theme?: FormTheme;
    selectedFieldId: string | null;
    isSaving: boolean;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';

    actions: {
        setFields: (fields: FormField[]) => void;
        setTheme: (theme: FormTheme) => void;
        updateTheme: (updates: Partial<FormTheme>) => void;
        addField: (type: FormFieldType) => void;
        updateField: (id: string, updates: Partial<FormField>) => void;
        deleteField: (id: string) => void;
        moveField: (activeId: string, overId: string) => void;
        setSelectedFieldId: (id: string | null) => void;
        setIsSaving: (isSaving: boolean) => void;
        setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
    };
}

export const useFormEditorStore = create<FormEditorState>()(
    temporal(
        (set) => ({
            fields: [],
            theme: undefined,
            selectedFieldId: null,
            isSaving: false,
            saveStatus: 'idle',

            actions: {
                setFields: (fields) => set({ fields }),
                setTheme: (theme) => set({ theme }),
                updateTheme: (updates) => set((state) => ({
                    theme: state.theme ? { ...state.theme, ...updates } : undefined
                })),

                addField: (type) => set((state) => {
                    const newField: FormField = {
                        id: crypto.randomUUID(),
                        type,
                        label: `New ${type} field`,
                        placeholder: "",
                        required: false,
                        helperText: "",
                        options: [],
                    };
                    return {
                        fields: [...state.fields, newField],
                        selectedFieldId: newField.id
                    };
                }),

                updateField: (id, updates) => set((state) => ({
                    fields: state.fields.map(f => f.id === id ? { ...f, ...updates } : f)
                })),

                deleteField: (id) => set((state) => ({
                    fields: state.fields.filter(f => f.id !== id),
                    selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId
                })),

                moveField: (activeId, overId) => set((state) => {
                    const oldIndex = state.fields.findIndex(f => f.id === activeId);
                    const newIndex = state.fields.findIndex(f => f.id === overId);

                    if (oldIndex !== -1 && newIndex !== -1) {
                        return { fields: arrayMove(state.fields, oldIndex, newIndex) };
                    }
                    return state;
                }),

                setSelectedFieldId: (id) => set({ selectedFieldId: id }),
                setIsSaving: (isSaving) => set({ isSaving }),
                setSaveStatus: (status) => set({ saveStatus: status }),
            },
        }),
        {
            partialize: (state) => ({ fields: state.fields, theme: state.theme }), // Track field and theme history
            limit: 50,
        }
    )
);

export const useFormEditorActions = () => useFormEditorStore((state) => state.actions);
// Selectors
export const useFormFields = () => useFormEditorStore((state) => state.fields);
export const useFormTheme = () => useFormEditorStore((state) => state.theme);
export const useSelectedFieldId = () => useFormEditorStore((state) => state.selectedFieldId);
export const useIsFormSaving = () => useFormEditorStore((state) => state.isSaving);
export const useSaveStatus = () => useFormEditorStore((state) => state.saveStatus);
export const useSelectedField = () => useFormEditorStore((state) =>
    state.fields.find(f => f.id === state.selectedFieldId)
);

// Zundo Hooks
export const useTemporalStore = () => {
    const store = useFormEditorStore as any;
    return store.temporal;
}

export const useUndo = () => {
    const temporal = useTemporalStore();
    return temporal ? temporal.getState().undo : () => { };
};

export const useRedo = () => {
    const temporal = useTemporalStore();
    return temporal ? temporal.getState().redo : () => { };
};

// For reactive state, we use useStore with the temporal store
export const usePastStates = () => {
    const temporal = useTemporalStore();
    return useStore(temporal, (state: any) => state.pastStates);
};

export const useFutureStates = () => {
    const temporal = useTemporalStore();
    return useStore(temporal, (state: any) => state.futureStates);
};
