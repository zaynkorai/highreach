import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingState {
    currentStep: number;
    isCompleted: boolean;
    formData: {
        step1?: {
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
        };
        step2?: {
            industry: string;
            role: string;
        };
        step3?: {
            usageGoal: string;
            teamSize: string;
        };
    };
    actions: {
        setStep: (step: number) => void;
        setFormData: (step: 'step1' | 'step2' | 'step3', data: any) => void;
        completeOnboarding: () => void;
        reset: () => void;
    };
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            currentStep: 1,
            isCompleted: false,
            formData: {},
            actions: {
                setStep: (step) => set({ currentStep: step }),
                setFormData: (step, data) =>
                    set((state) => ({
                        formData: {
                            ...state.formData,
                            [step]: { ...state.formData[step], ...data },
                        },
                    })),
                completeOnboarding: () => set({ isCompleted: true }),
                reset: () => set({ currentStep: 1, isCompleted: false, formData: {} }),
            },
        }),
        {
            name: 'onboarding-storage', // unique name for localStorage
            partialize: (state) => ({
                currentStep: state.currentStep,
                isCompleted: state.isCompleted,
                formData: state.formData,
            }),
        }
    )
);

export const useOnboardingActions = () => useOnboardingStore((state) => state.actions);
export const useOnboardingStep = () => useOnboardingStore((state) => state.currentStep);
export const useOnboardingData = () => useOnboardingStore((state) => state.formData);
export const useIsOnboardingCompleted = () => useOnboardingStore((state) => state.isCompleted);
