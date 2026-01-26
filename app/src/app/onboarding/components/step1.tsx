"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "lucide-react";

const step1Schema = z.object({
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    phone: z.string().min(10, "Valid phone number required").optional(),
});

type Step1Data = z.infer<typeof step1Schema>;

export function Step1({ onNext, defaultEmail, isSubmitting }: {
    onNext: (data: Step1Data) => void,
    defaultEmail: string,
    isSubmitting: boolean
}) {
    const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
        resolver: zodResolver(step1Schema),
    });

    return (
        <form onSubmit={handleSubmit(onNext)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight">Personalize your profile</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Tell us a bit about yourself to get started.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                        id="firstName"
                        placeholder="John"
                        {...register("firstName")}
                        className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                        id="lastName"
                        placeholder="Doe"
                        {...register("lastName")}
                        className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.lastName.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" value={defaultEmail} disabled className="bg-zinc-100 dark:bg-white/5 opacity-50" />
                <p className="text-[10px] text-zinc-400 font-medium">This email is verified and connected to your tenant.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number (Optional)</Label>
                <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    {...register("phone")}
                />
                <p className="text-[10px] text-zinc-400 font-medium italic">We use this for important system notifications only.</p>
            </div>

            <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold gap-2 text-sm uppercase tracking-widest" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Continue to Company Info"}
                <ChevronRight className="w-4 h-4" />
            </Button>
        </form>
    );
}
