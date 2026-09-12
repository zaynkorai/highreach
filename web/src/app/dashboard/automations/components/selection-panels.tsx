"use client";

import { useState, useEffect } from "react";
import {
    TRIGGERS, TRIGGER_CATEGORIES,
    ACTIONS, ACTION_CATEGORIES,
    WAIT_TYPES, TIME_UNITS
} from "../lib/workflow-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { VariablePicker } from "./variable-picker";
import {
    X, Search, Zap, MessageSquare, Mail, Phone, Clock, Tag,
    UserPlus, Calendar, Target, CreditCard, Bell, GitBranch,
    CheckSquare, FileText, PhoneMissed, Flag, ArrowLeft, AlertCircle,
    Check, ArrowRight, UserCheck, Globe, Edit
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping
const iconMap: Record<string, any> = {
    Zap, MessageSquare, Mail, Phone, Clock, Tag, UserPlus, Calendar,
    Target, CreditCard, Bell, GitBranch, CheckSquare, FileText, PhoneMissed, Flag,
    UserCheck, Globe, Edit, ArrowRight
};

function getIcon(iconName: string) {
    const IconComponent = iconMap[iconName] || Zap;
    return <IconComponent className="w-5 h-5" />;
}

// ============ TRIGGER PANEL ============

interface TriggerPanelProps {
    onSelect: (triggerId: string) => void;
    onClose: () => void;
    initialTriggerId?: string | null;
}

export function TriggerPanel({ onSelect, onClose, initialTriggerId }: TriggerPanelProps) {
    const [search, setSearch] = useState("");
    const filteredTriggers = TRIGGERS.filter(trigger =>
        trigger.label.toLowerCase().includes(search.toLowerCase()) ||
        trigger.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Select Trigger</h3>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-4 border-b"><Input placeholder="Search triggers..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <ScrollArea className="flex-1 px-4 py-2">
                <div className="space-y-2">
                    {filteredTriggers.map(trigger => {
                        const isSelected = initialTriggerId === trigger.id;
                        return (
                            <button
                                key={trigger.id}
                                onClick={() => onSelect(trigger.id)}
                                className={cn(
                                    "w-full p-3 rounded-lg border text-left flex items-center justify-between group transition-colors",
                                    isSelected
                                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                                        : "hover:border-brand-500"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-brand-600 dark:text-brand-400">{getIcon(trigger.icon)}</div>
                                    <div>
                                        <p className="font-medium text-sm">{trigger.label}</p>
                                        <p className="text-xs text-muted-foreground">{trigger.description}</p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <Check className="w-4 h-4 text-brand-600 shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}

// ============ ACTION PANEL (SELECTION + CONFIG) ============

interface ActionPanelProps {
    onSave: (actionId: string, config: any) => void;
    onClose: () => void;
    initialActionId?: string | null;
    initialConfig?: any;
    isSmsConfigured?: boolean;
}

export function ActionPanel({
    onSave,
    onClose,
    initialActionId,
    initialConfig,
    isSmsConfigured = true
}: ActionPanelProps) {
    const [step, setStep] = useState<"select" | "config">(initialActionId ? "config" : "select");
    const [selectedActionId, setSelectedActionId] = useState<string | null>(initialActionId || null);
    const [config, setConfig] = useState<any>(initialConfig || {});
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (initialActionId) {
            setSelectedActionId(initialActionId);
            setConfig(initialConfig || {});
            setStep("config");
        }
    }, [initialActionId, initialConfig]);

    const handleSelect = (actionId: string) => {
        const action = ACTIONS.find(a => a.id === actionId);
        if (action?.category === "logic") {
            onSave(actionId, {});
            return;
        }
        setSelectedActionId(actionId);
        setStep("config");
    };

    const handleSave = () => {
        onSave(selectedActionId!, config);
    };

    const filteredActions = ACTIONS.filter(a => a.label.toLowerCase().includes(search.toLowerCase()));
    const selectedAction = ACTIONS.find(a => a.id === selectedActionId);

    if (step === "config" && selectedAction) {
        return (
            <div className="w-full bg-white dark:bg-zinc-900 h-full flex flex-col">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setStep("select")}><ArrowLeft className="w-4 h-4" /></Button>
                        <h3 className="font-semibold text-foreground text-sm">{selectedAction.label}</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
                </div>

                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    {/* Email Config */}
                    {selectedAction.id === "send_email" && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Subject Line</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Enter email subject..."
                                        value={config.subject || ""}
                                        onChange={e => setConfig({ ...config, subject: e.target.value })}
                                        className="pr-10"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <VariablePicker onSelect={(val) => setConfig((prev: any) => ({ ...prev, subject: (prev.subject || "") + " " + val }))} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Email Body</Label>
                                <div className="relative">
                                    <Textarea
                                        placeholder="Write your email content..."
                                        value={config.template || ""}
                                        onChange={e => setConfig({ ...config, template: e.target.value })}
                                        className="min-h-[160px] resize-none pb-8"
                                    />
                                    <div className="absolute bottom-2 right-2">
                                        <VariablePicker onSelect={(val) => setConfig((prev: any) => ({ ...prev, template: (prev.template || "") + " " + val }))} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* SMS Config */}
                    {selectedAction.id === "send_sms" && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">SMS Message</Label>
                                <div className="relative">
                                    <Textarea
                                        placeholder="Type your message..."
                                        value={config.template || ""}
                                        onChange={e => setConfig({ ...config, template: e.target.value })}
                                        className="min-h-[120px] resize-none pb-8"
                                    />
                                    <div className="absolute bottom-2 right-2">
                                        <VariablePicker onSelect={(val) => setConfig((prev: any) => ({ ...prev, template: (prev.template || "") + " " + val }))} />
                                    </div>
                                </div>
                            </div>
                            {!isSmsConfigured && (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                                        Telnyx API key is not configured. Outbound messages will be simulated in the activity audit.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Tag Actions */}
                    {(selectedAction.id === "add_tag" || selectedAction.id === "remove_tag") && (
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Tag Name</Label>
                            <Input
                                placeholder="e.g. lead, vip, newsletter"
                                value={config.tag || ""}
                                onChange={e => setConfig({ ...config, tag: e.target.value })}
                            />
                        </div>
                    )}

                    {/* Update Contact */}
                    {selectedAction.id === "update_contact" && (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Field to Update</Label>
                                <Select value={config.field || "notes"} onValueChange={v => setConfig({ ...config, field: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="notes">Notes</SelectItem>
                                        <SelectItem value="first_name">First Name</SelectItem>
                                        <SelectItem value="last_name">Last Name</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="phone">Phone</SelectItem>
                                        <SelectItem value="source">Lead Source</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">New Value</Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Enter updated value..."
                                        value={config.value || ""}
                                        onChange={e => setConfig({ ...config, value: e.target.value })}
                                        className="pr-10"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <VariablePicker onSelect={v => setConfig((p: any) => ({ ...p, value: (p.value || "") + " " + v }))} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Create Opportunity */}
                    {selectedAction.id === "create_opportunity" && (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Opportunity Title</Label>
                                <Input
                                    placeholder="e.g. Website Redesign Deal"
                                    value={config.title || ""}
                                    onChange={e => setConfig({ ...config, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Estimated Value ($)</Label>
                                <Input
                                    type="number"
                                    placeholder="2500"
                                    value={config.value || ""}
                                    onChange={e => setConfig({ ...config, value: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Initial Stage</Label>
                                <Input
                                    placeholder="e.g. Discovery, Lead, Proposal"
                                    value={config.stage || ""}
                                    onChange={e => setConfig({ ...config, stage: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Move Stage / Update Opportunity */}
                    {(selectedAction.id === "move_pipeline_stage" || selectedAction.id === "update_opportunity") && (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Pipeline Stage</Label>
                                <Input
                                    placeholder="e.g. meeting_scheduled, closed_won"
                                    value={config.stage || config.stageId || ""}
                                    onChange={e => setConfig({ ...config, stage: e.target.value, stageId: e.target.value })}
                                />
                            </div>
                            {selectedAction.id === "update_opportunity" && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Status</Label>
                                        <Select value={config.status || "open"} onValueChange={v => setConfig({ ...config, status: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="open">Open</SelectItem>
                                                <SelectItem value="won">Won</SelectItem>
                                                <SelectItem value="lost">Lost</SelectItem>
                                                <SelectItem value="abandoned">Abandoned</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Deal Value ($)</Label>
                                        <Input
                                            type="number"
                                            placeholder="5000"
                                            value={config.value || ""}
                                            onChange={e => setConfig({ ...config, value: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Internal Notification */}
                    {selectedAction.id === "internal_notification" && (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Notification Title</Label>
                                <Input
                                    placeholder="e.g. Important Lead Follow-up"
                                    value={config.title || ""}
                                    onChange={e => setConfig({ ...config, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Message</Label>
                                <div className="relative">
                                    <Textarea
                                        placeholder="Message details..."
                                        value={config.message || config.template || ""}
                                        onChange={e => setConfig({ ...config, message: e.target.value, template: e.target.value })}
                                        className="min-h-[100px] resize-none pb-8"
                                    />
                                    <div className="absolute bottom-2 right-2">
                                        <VariablePicker onSelect={v => setConfig((p: any) => ({ ...p, message: (p.message || "") + " " + v, template: (p.template || "") + " " + v }))} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Create Task */}
                    {selectedAction.id === "create_task" && (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Task Title</Label>
                                <Input
                                    placeholder="e.g. Call client back"
                                    value={config.title || ""}
                                    onChange={e => setConfig({ ...config, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Due In (Days)</Label>
                                <Input
                                    type="number"
                                    placeholder="2"
                                    value={config.dueInDays || "2"}
                                    onChange={e => setConfig({ ...config, dueInDays: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Description</Label>
                                <Textarea
                                    placeholder="Details for this task..."
                                    value={config.description || ""}
                                    onChange={e => setConfig({ ...config, description: e.target.value })}
                                    className="min-h-[80px] resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Webhook */}
                    {selectedAction.id === "webhook" && (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Webhook URL</Label>
                                <Input
                                    placeholder="https://example.com/webhook"
                                    value={config.url || ""}
                                    onChange={e => setConfig({ ...config, url: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Method</Label>
                                <Select value={config.method || "POST"} onValueChange={v => setConfig({ ...config, method: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Fallback for other actions */}
                    {!["send_email", "send_sms", "add_tag", "remove_tag", "update_contact", "create_opportunity", "move_pipeline_stage", "update_opportunity", "internal_notification", "create_task", "webhook"].includes(selectedAction.id) && (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-xs text-muted-foreground text-center">
                            No additional settings required for this step. Click Save to apply.
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                    <Button onClick={handleSave} className="w-full bg-brand-600 hover:bg-brand-700 text-white">Save Action</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Add Action</h3>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-4 border-b"><Input placeholder="Search actions..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <ScrollArea className="flex-1 px-4 py-2">
                <div className="space-y-2">
                    {filteredActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleSelect(action.id)}
                            className={cn(
                                "w-full p-3 rounded-lg border hover:border-brand-500 text-left flex gap-3 relative transition-colors",
                                action.category === "logic" && "border-amber-300 dark:border-amber-700/50"
                            )}
                        >
                            <div className={cn("text-brand-600 dark:text-brand-400", action.category === "logic" && "text-amber-600")}>{getIcon(action.icon)}</div>
                            <div>
                                <p className="font-medium text-sm">{action.label}</p>
                                <p className="text-xs text-muted-foreground">{action.description}</p>
                            </div>
                            {action.id === "send_sms" && !isSmsConfigured && (
                                <AlertCircle className="w-4 h-4 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2" />
                            )}
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

// ============ WAIT CONFIG PANEL ============

export function WaitConfigPanel({ onSave, onClose, initialConfig }: any) {
    const [waitType, setWaitType] = useState(initialConfig?.waitType || "time_delay");
    const [duration, setDuration] = useState(initialConfig?.duration?.toString() || "1");
    const [unit, setUnit] = useState(initialConfig?.unit || "days");

    useEffect(() => {
        if (initialConfig) {
            setWaitType(initialConfig.waitType || "time_delay");
            setDuration(initialConfig.duration?.toString() || "1");
            setUnit(initialConfig.unit || "days");
        }
    }, [initialConfig]);

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold text-sm">Wait Settings</h3>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-4 space-y-4 flex-1">
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Wait Type</Label>
                    <Select value={waitType} onValueChange={setWaitType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {WAIT_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {waitType === 'time_delay' && (
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Duration</Label>
                        <div className="flex gap-2">
                            <Input
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                type="number"
                                min="1"
                                className="w-24"
                            />
                            <Select value={unit} onValueChange={setUnit}>
                                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {TIME_UNITS.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 mt-auto border-t">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => onSave({ waitType, duration: parseInt(duration) || 1, unit })}>
                    Save Wait Step
                </Button>
            </div>
        </div>
    );
}

// ============ IF/ELSE CONFIG PANEL ============

export function IfElseConfigPanel({ onSave, onClose, initialConfig }: any) {
    const [name, setName] = useState(initialConfig?.name || "Check Condition");
    const [field, setField] = useState(initialConfig?.field || "contact.email");
    const [operator, setOperator] = useState(initialConfig?.operator || "contains");
    const [value, setValue] = useState(initialConfig?.value || "");

    useEffect(() => {
        if (initialConfig) {
            setName(initialConfig.name || "Check Condition");
            setField(initialConfig.field || "contact.email");
            setOperator(initialConfig.operator || "contains");
            setValue(initialConfig.value || "");
        }
    }, [initialConfig]);

    const fields = [
        { id: "contact.email", label: "Email Address" },
        { id: "contact.first_name", label: "First Name" },
        { id: "contact.last_name", label: "Last Name" },
        { id: "contact.phone", label: "Phone Number" },
        { id: "contact.source", label: "Lead Source" },
        { id: "contact.tags", label: "Tags (Comma separated)" },
        { id: "opportunity.value", label: "Opportunity Value ($)" },
        { id: "opportunity.status", label: "Opportunity Status" }
    ];

    const operators = [
        { id: "equals", label: "is strictly equal to" },
        { id: "not_equals", label: "is not equal to" },
        { id: "contains", label: "contains" },
        { id: "does_not_contain", label: "does not contain" },
        { id: "starts_with", label: "starts with" },
        { id: "ends_with", label: "ends with" },
        { id: "is_empty", label: "is empty" },
        { id: "is_not_empty", label: "is not empty" },
        { id: "greater_than", label: "is greater than" },
        { id: "less_than", label: "is less than" }
    ];

    const handleSave = () => {
        onSave({
            name,
            field,
            operator,
            value,
            branching: true
        });
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center group bg-purple-50/30">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-600 text-white rounded-md shadow-sm">
                        <GitBranch className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm">Logic Branch</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Step Name */}
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Step Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Check if Gmail" />
                    </div>

                    <div className="p-4 border border-purple-100 dark:border-purple-900/30 bg-purple-50/10 rounded-xl space-y-4">
                        <div className="flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase tracking-tighter">
                            <CheckSquare className="w-3 h-3" />
                            If condition is met
                        </div>

                        {/* Property Field */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Contact / Lead Property</Label>
                            <Select value={field} onValueChange={setField}>
                                <SelectTrigger className="bg-white dark:bg-zinc-950">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {fields.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Operator */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Comparison</Label>
                            <Select value={operator} onValueChange={setOperator}>
                                <SelectTrigger className="bg-white dark:bg-zinc-950">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {operators.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Value */}
                        {!['is_empty', 'is_not_empty'].includes(operator) && (
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Value to Check</Label>
                                <div className="relative">
                                    <Input
                                        value={value}
                                        onChange={e => setValue(e.target.value)}
                                        placeholder="Enter value..."
                                        className="bg-white dark:bg-zinc-950 pr-10"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 border-l pl-2">
                                        <VariablePicker onSelect={(val) => setValue((prev: string) => prev + " " + val)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
                        <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
                            Contacts that match this condition will follow the <span className="font-bold text-emerald-600">YES</span> branch. All others follow the <span className="font-bold text-red-500">NO</span> branch.
                        </p>
                    </div>
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-zinc-50/50">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20" onClick={handleSave}>
                    Save Condition
                </Button>
            </div>
        </div>
    );
}
