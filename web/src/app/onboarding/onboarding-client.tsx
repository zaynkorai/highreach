"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    useOnboardingStep,
    useOnboardingActions,
    useOnboardingData
} from "@/stores/onboarding-store";
import { updateOnboarding, completeOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronRight, Rocket, Building2, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Step1 } from "./components/step1";
import { Step2 } from "./components/step2";
import { Step3 } from "./components/step3";

export function OnboardingClient({ userEmail }: { userEmail: string }) {
    const router = useRouter();
    const step = useOnboardingStep();
    const { setStep, setFormData, completeOnboarding: setStoreCompleted } = useOnboardingActions();
    const data = useOnboardingData();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const steps = [
        { id: 1, title: "Profile", icon: UserCircle },
        { id: 2, title: "Company", icon: Building2 },
        { id: 3, title: "Finish", icon: Rocket },
    ];

    const progress = (step / steps.length) * 100;

    const handleNext = async (stepData: any) => {
        setIsSubmitting(true);
        try {
            // Save to store
            const stepKey = `step${step}` as 'step1' | 'step2' | 'step3';
            setFormData(stepKey, stepData);

            // Sync to server
            if (step === 1) {
                await updateOnboarding({
                    step: 2,
                    firstName: stepData.firstName,
                    lastName: stepData.lastName
                });
                setStep(2);
            } else if (step === 2) {
                await updateOnboarding({
                    step: 3,
                    industry: stepData.industry,
                    role: stepData.role
                });
                setStep(3);
            } else if (step === 3) {
                await completeOnboarding();
                setStoreCompleted();
                toast.success("Welcome aboard!");
                router.push("/dashboard");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update progress");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/20">
                        <Rocket className="text-white w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
                        Setting up your <span className="text-primary">HighReach</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">
                        Just 3 quick steps to get you started.
                    </p>
                </div>

                {/* Progress Bar Container */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-8 shadow-sm">
                    {/* Visual Progress */}
                    <div className="flex items-center justify-between mb-10 px-4 relative">
                        {/* Connecting Line Backdrop */}
                        <div className="absolute top-6 left-12 right-12 h-0.5 bg-zinc-100 dark:bg-white/5 -z-0" />

                        {/* Progressive Line */}
                        <div
                            className="absolute top-6 left-12 h-0.5 bg-emerald-500 transition-all duration-500 -z-0"
                            style={{
                                width: `calc(${((step - 1) / (steps.length - 1)) * 100}% - 6rem)`,
                                display: step > 1 ? 'block' : 'none'
                            }}
                        />

                        {steps.map((s) => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isCompleted = step > s.id;

                            return (
                                <div key={s.id} className="flex flex-col items-center gap-3 relative z-10">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                        isActive ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30 scale-110" :
                                            isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" :
                                                "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-500"
                                    )}>
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-[0.2em]",
                                        isActive ? "text-brand-600" : isCompleted ? "text-emerald-500" : "text-zinc-500"
                                    )}>
                                        {s.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Step Content */}
                    <div className="mt-8 min-h-[300px]">
                        {step === 1 && <Step1 onNext={handleNext} defaultEmail={userEmail} isSubmitting={isSubmitting} />}
                        {step === 2 && <Step2 onNext={handleNext} isSubmitting={isSubmitting} />}
                        {step === 3 && <Step3 onNext={() => handleNext({})} isSubmitting={isSubmitting} />}
                    </div>
                </div>

                {/* Footer simple link */}
                <div className="mt-8 text-center text-xs text-zinc-400 font-medium">
                    Need help? <button className="text-zinc-500 hover:text-brand-500 underline">Contact support</button>
                    <span className="mx-2">•</span>
                    Skip for now
                </div>
            </div>
        </div>
    );
}
