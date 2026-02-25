"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Zap, Clock, MessageSquare, Mail, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

type StepType = "trigger" | "delay" | "action";

interface WorkflowStep {
    id: string;
    type: StepType;
    config: Record<string, any>;
}

const TRIGGERS = [
    { id: "contact.created", label: "New Contact Created", icon: "MessageSquare" },
    { id: "form.submitted", label: "Form Submitted", icon: "MessageSquare" },
    { id: "call.missed", label: "Missed Call", icon: "PhoneMissed" },
    { id: "opportunity.stage_changed", label: "Deal Stage Changed", icon: "Trophy" },
];

const ACTIONS = [
    { id: "send_sms", label: "Send SMS", icon: "MessageSquare" },
    { id: "send_email", label: "Send Email", icon: "Mail" },
    { id: "create_task", label: "Create Task", icon: "ClipboardCheck" },
    { id: "add_tag", label: "Add Tag to Contact", icon: "Tag" },
];

export function CreateWorkflowModal() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [steps, setSteps] = useState<WorkflowStep[]>([]);

    const addStep = (type: StepType) => {
        setSteps([...steps, { id: crypto.randomUUID(), type, config: {} }]);
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    const updateStepConfig = (id: string, key: string, value: any) => {
        setSteps(steps.map(s => s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Please enter a workflow name");
            return;
        }
        if (steps.length === 0) {
            toast.error("Please add at least one step");
            return;
        }

        // TODO: Call server action to save custom workflow
        toast.success("Workflow created (mock)");
        setOpen(false);
        setName("");
        setSteps([]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Workflow
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Workflow</DialogTitle>
                    <DialogDescription>
                        Build an automation by chaining triggers, delays, and actions.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Workflow Name */}
                    <div className="space-y-2">
                        <Label>Workflow Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., New Lead Follow-up"
                        />
                    </div>

                    {/* Steps Builder */}
                    <div className="space-y-4">
                        <Label>Steps</Label>

                        {steps.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                <p className="text-sm text-muted-foreground mb-4">No steps yet. Start by adding a trigger.</p>
                                <Button variant="outline" size="sm" onClick={() => addStep("trigger")}>
                                    <Zap className="w-4 h-4 mr-2" /> Add Trigger
                                </Button>
                            </div>
                        )}

                        {steps.map((step, index) => (
                            <div key={step.id} className="relative">
                                {index > 0 && (
                                    <div className="absolute left-6 -top-4 h-4 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
                                )}
                                <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step.type === 'trigger' ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' :
                                            step.type === 'delay' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                                'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                        }`}>
                                        {step.type === 'trigger' && <Zap className="w-5 h-5" />}
                                        {step.type === 'delay' && <Clock className="w-5 h-5" />}
                                        {step.type === 'action' && <ArrowRight className="w-5 h-5" />}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                {step.type}
                                            </span>
                                            <Button variant="ghost" size="sm" onClick={() => removeStep(step.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>

                                        {step.type === 'trigger' && (
                                            <Select value={step.config.event || ""} onValueChange={(v) => updateStepConfig(step.id, 'event', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select trigger event" /></SelectTrigger>
                                                <SelectContent>
                                                    {TRIGGERS.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {step.type === 'delay' && (
                                            <div className="flex gap-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Duration"
                                                    value={step.config.duration || ""}
                                                    onChange={(e) => updateStepConfig(step.id, 'duration', e.target.value)}
                                                    className="w-24"
                                                />
                                                <Select value={step.config.unit || "minutes"} onValueChange={(v) => updateStepConfig(step.id, 'unit', v)}>
                                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="seconds">Seconds</SelectItem>
                                                        <SelectItem value="minutes">Minutes</SelectItem>
                                                        <SelectItem value="hours">Hours</SelectItem>
                                                        <SelectItem value="days">Days</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {step.type === 'action' && (
                                            <div className="space-y-3">
                                                <Select value={step.config.action || ""} onValueChange={(v) => updateStepConfig(step.id, 'action', v)}>
                                                    <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                                                    <SelectContent>
                                                        {ACTIONS.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                {(step.config.action === 'send_sms' || step.config.action === 'send_email') && (
                                                    <Input
                                                        placeholder="Message template..."
                                                        value={step.config.template || ""}
                                                        onChange={(e) => updateStepConfig(step.id, 'template', e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Step Buttons */}
                        {steps.length > 0 && (
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" onClick={() => addStep("delay")}>
                                    <Clock className="w-4 h-4 mr-2" /> Add Delay
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addStep("action")}>
                                    <ArrowRight className="w-4 h-4 mr-2" /> Add Action
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Workflow</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
