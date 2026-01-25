"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { opportunitySchema, OpportunityFormData } from "@/lib/validations/opportunity";
import { createOpportunity } from "../actions";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Contact } from "@/types/contact";
import { PipelineStage } from "@/types/pipeline";

interface OpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    contacts: Contact[];
    stages: PipelineStage[];
    onSuccess: (data: any) => void;
    defaultStageId?: string;
}

export function OpportunityModal({ isOpen, onClose, contacts, stages, onSuccess, defaultStageId }: OpportunityModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors }
    } = useForm<OpportunityFormData>({
        resolver: zodResolver(opportunitySchema) as any,
        defaultValues: {
            title: "",
            value: 0,
            status: "open",
            pipelineStageId: defaultStageId
        }
    });

    // Sync defaultStageId when it changes or modal opens
    useEffect(() => {
        if (defaultStageId) {
            setValue("pipelineStageId", defaultStageId);
        }
    }, [defaultStageId, setValue, isOpen]);

    const pipelineStageId = watch("pipelineStageId");

    const onSubmit = async (data: OpportunityFormData) => {
        setIsLoading(true);
        try {
            const res = await createOpportunity(data);
            if (res.success) {
                toast.success("Opportunity created successfully");
                onSuccess(res.data);
                reset();
                onClose();
            } else {
                toast.error(res.error || "Failed to create opportunity");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-zinc-900 px-6 py-8 relative">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-2xl font-black text-white tracking-tight">New Opportunity</DialogTitle>
                        <p className="text-sm text-zinc-400 font-medium">Capture a new deal and assign it to a stage.</p>
                    </DialogHeader>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 bg-white dark:bg-zinc-950">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Opportunity Title</Label>
                            <Input
                                id="title"
                                className="h-12 bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.08] rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white/20 transition-all font-medium"
                                placeholder="e.g. Q4 Growth Package"
                                {...register("title")}
                            />
                            {errors.title && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-tight">{errors.title.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Associated Contact</Label>
                            <Select onValueChange={(val) => setValue("contactId", val)}>
                                <SelectTrigger className="h-12 bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.08] rounded-xl">
                                    <SelectValue placeholder="Search or select contact..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-zinc-200 dark:border-white/[0.08] shadow-xl">
                                    {contacts.map(contact => (
                                        <SelectItem key={contact.id} value={contact.id} className="rounded-lg py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-[9px] font-black">
                                                    {(contact.first_name[0] + (contact.last_name?.[0] || "")).toUpperCase()}
                                                </div>
                                                <span className="font-bold">{contact.first_name} {contact.last_name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.contactId && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-tight">Please select a contact</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Stage</Label>
                                <Select
                                    value={pipelineStageId}
                                    onValueChange={(val) => setValue("pipelineStageId", val)}
                                >
                                    <SelectTrigger className="h-12 bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.08] rounded-xl">
                                        <SelectValue placeholder="Stage" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {stages.map(stage => (
                                            <SelectItem key={stage.id} value={stage.id} className="rounded-lg">
                                                {stage.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value" className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Deal Value ($)</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    className="h-12 bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.08] rounded-xl font-bold text-indigo-600 dark:text-indigo-400"
                                    {...register("value", { valueAsNumber: true })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl font-bold text-zinc-500 hover:text-zinc-900 transition-all">Cancel</Button>
                        <Button type="submit" disabled={isLoading} className="flex-[2] h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase tracking-widest text-xs shadow-xl shadow-zinc-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            {isLoading ? "creating..." : "Create Deal"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
