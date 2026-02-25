"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronRight, Briefcase, UserCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const step2Schema = z.object({
    industry: z.string().min(1, "Please select an industry"),
    role: z.string().min(1, "Please select your role"),
});

type Step2Data = z.infer<typeof step2Schema>;

export function Step2({ onNext, isSubmitting }: { onNext: (data: Step2Data) => void, isSubmitting: boolean }) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Step2Data>({
        resolver: zodResolver(step2Schema),
        defaultValues: {
            industry: '',
            role: ''
        }
    });

    const selectedIndustry = watch("industry");
    const selectedRole = watch("role");

    const industries = [
        "Real Estate", "Professional Services", "Medical", "Retail", "Technology", "Other"
    ];

    const roles = [
        { id: 'founder', title: 'Founder / CEO', icon: UserCircle },
        { id: 'manager', title: 'Manager', icon: Users },
        { id: 'contributor', title: 'Solo Contributor', icon: Briefcase },
    ];

    return (
        <form onSubmit={handleSubmit(onNext)} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight">Tell us about your business</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">This helps us tailor the platform for your specific needs.</p>
            </div>

            <div className="space-y-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Industry</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {industries.map((industry) => (
                        <button
                            key={industry}
                            type="button"
                            onClick={() => setValue("industry", industry)}
                            className={cn(
                                "p-4 rounded-2xl border text-sm font-bold transition-all text-center",
                                selectedIndustry === industry
                                    ? "border-brand-600 bg-brand-50 text-brand-600 dark:bg-brand-500/10"
                                    : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-600 dark:text-zinc-400"
                            )}
                        >
                            {industry}
                        </button>
                    ))}
                </div>
                {errors.industry && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.industry.message}</p>}
            </div>

            <div className="space-y-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Your Role</Label>
                <div className="space-y-3">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => setValue("role", role.id)}
                                className={cn(
                                    "w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left",
                                    selectedRole === role.id
                                        ? "border-brand-600 bg-brand-50 text-brand-600 dark:bg-brand-500/10 shadow-sm"
                                        : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-600 dark:text-zinc-400"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                    selectedRole === role.id ? "bg-brand-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                )}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="font-bold">{role.title}</span>
                            </button>
                        );
                    })}
                </div>
                {errors.role && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.role.message}</p>}
            </div>

            <Button type="submit" className="w-full h-12 bg-brand-600 hover:bg-brand-700 rounded-xl font-bold gap-2 text-sm uppercase tracking-widest" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Finalize Setup"}
                <ChevronRight className="w-4 h-4" />
            </Button>
        </form>
    );
}
