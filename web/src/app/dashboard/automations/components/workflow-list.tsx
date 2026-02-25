"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    PhoneMissed, MessageSquare, Clock, Star, Trophy,
    Play, Activity, Edit3, Zap, Calendar, FileText, UserPlus,
    Search, Filter, Command, MoreHorizontal, Copy, Trash2, ArrowUpRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { deleteWorkflow } from "../actions";
import { memo } from "react";

type Workflow = {
    id: string;
    name: string;
    description: string;
    status: string;
    trigger_type: string;
    updated_at: string;
    created_at: string;
}

const WorkflowCard = memo(({ workflow, onEdit, onDelete }: { workflow: Workflow, onEdit: (id: string) => void, onDelete: (id: string, name: string) => void }) => {
    return (
        <div
            onClick={() => onEdit(workflow.id)}
            className="group flex flex-col justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-brand-500/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden cursor-pointer"
        >
            <div className={`absolute top-0 left-0 w-full h-1 ${workflow.status === 'published' ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />

            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className={workflow.status === 'published' ? 'text-brand-600' : 'text-zinc-500'}>
                        {getTriggerIcon(workflow.trigger_type)}
                    </div>

                    <div className="relative z-20">
                        <Popover>
                            <PopoverTrigger asChild onClick={(e) => { e.stopPropagation(); }}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-zinc-400 hover:text-foreground">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-40 p-1" onClick={(e) => e.stopPropagation()}>
                                <div className="grid gap-1">
                                    <Button variant="ghost" size="sm" className="justify-start h-8 text-xs font-normal w-full" onClick={() => onEdit(workflow.id)}>
                                        <Edit3 className="w-3.5 h-3.5 mr-2" /> Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="justify-start h-8 text-xs font-normal" onClick={() => toast.info("Duplicate coming soon")}>
                                        <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                                    </Button>
                                    <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start h-8 text-xs font-normal text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        onClick={(e) => { e.stopPropagation(); onDelete(workflow.id, workflow.name); }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-foreground truncate pr-4">{workflow.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 h-10">
                        {workflow.description || "No description provided."}
                    </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    {workflow.status === 'published' ? (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none hover:bg-emerald-500/20 h-5 text-[10px] px-2 font-medium">Active</Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shadow-none hover:bg-zinc-200 h-5 text-[10px] px-2 font-medium">Draft</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(workflow.updated_at), { addSuffix: true })}
                    </span>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 z-10 pointer-events-none">
                <Button size="icon" className="rounded-full shadow-lg bg-brand-600 hover:bg-brand-700 h-8 w-8">
                    <ArrowUpRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
});
WorkflowCard.displayName = "WorkflowCard";

export function WorkflowList({ initialWorkflows }: { initialWorkflows: Workflow[] }) {
    const [workflows, setWorkflows] = useState(initialWorkflows);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all"); // 'all', 'published', 'draft'
    const router = useRouter();

    // Derived States
    const filteredWorkflows = useMemo(() => {
        return workflows.filter(w => {
            const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
                (w.description || "").toLowerCase().includes(search.toLowerCase());
            const matchesFilter = filter === "all" ? true : w.status === filter;
            return matchesSearch && matchesFilter;
        });
    }, [workflows, search, filter]);

    const stats = useMemo(() => ({
        total: workflows.length,
        active: workflows.filter(w => w.status === 'published').length,
        draft: workflows.filter(w => w.status === 'draft').length
    }), [workflows]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const res = await deleteWorkflow(id);
            if (res.success) {
                setWorkflows(prev => prev.filter(w => w.id !== id));
                toast.success("Workflow deleted");
            } else {
                toast.error("Failed to delete workflow: " + res.error);
            }
        } catch (error) {
            toast.error("An error occurred during deletion");
        }
    };

    // Empty State (Total)
    if (initialWorkflows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-full mb-4">
                    <Command className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">No workflows yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-2 text-center">
                    Automate your business by creating your first workflow.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Workflows</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                        </div>
                        <div className="text-brand-600"><Zap className="w-6 h-6 stroke-[1.5]" /></div>
                    </div>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{stats.active}</p>
                        </div>
                        <div className="text-emerald-600"><Activity className="w-6 h-6 stroke-[1.5]" /></div>
                    </div>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Drafts</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{stats.draft}</p>
                        </div>
                        <div className="text-amber-600"><Edit3 className="w-6 h-6 stroke-[1.5]" /></div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        placeholder="Search workflows..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-white dark:bg-zinc-900"
                    />
                </div>
                <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="published">Active</TabsTrigger>
                        <TabsTrigger value="draft">Drafts</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkflows.map((workflow) => (
                    <WorkflowCard
                        key={workflow.id}
                        workflow={workflow}
                        onEdit={(id) => router.push(`/dashboard/automations/${id}`)}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {filteredWorkflows.length === 0 && workflows.length > 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No workflows match your search.</p>
                </div>
            )}
        </div>
    );
}

function getTriggerIcon(type: string) {
    const t = (type || "").toLowerCase();
    if (t.includes("contact")) return <UserPlus className="w-5 h-5" />;
    if (t.includes("form")) return <FileText className="w-5 h-5" />;
    if (t.includes("appointment")) return <Calendar className="w-5 h-5" />;
    if (t.includes("call")) return <PhoneMissed className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
}

function formatTriggerName(type: string) {
    if (!type || type === "manual") return "Manual / Empty";
    return type.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
