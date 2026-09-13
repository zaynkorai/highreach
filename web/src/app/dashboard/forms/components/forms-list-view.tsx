"use client";

import { useState, useMemo, useEffect } from "react";
import { FormWithStats } from "@/types/form";
import { CreateFormModal } from "./create-form-modal";
import { ShareModal } from "../[id]/components/share-modal";
import { deleteForm } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Search,
    Plus,
    FileText,
    Eye,
    CheckCircle2,
    TrendingUp,
    MoreHorizontal,
    Edit3,
    Table,
    ExternalLink,
    Share2,
    Trash2,
    X
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FormsListViewProps {
    initialForms: FormWithStats[];
}

export function FormsListView({ initialForms }: FormsListViewProps) {
    const router = useRouter();
    const [forms, setForms] = useState<FormWithStats[]>(initialForms);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [shareModalFormId, setShareModalFormId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        setForms(initialForms);
    }, [initialForms]);

    const totalViews = useMemo(() => forms.reduce((acc, f) => acc + (f.views || 0), 0), [forms]);
    const totalSubmissions = useMemo(() => forms.reduce((acc, f) => acc + (f.submissions_count || 0), 0), [forms]);
    const avgConversion = totalViews > 0 ? ((totalSubmissions / totalViews) * 100).toFixed(1) + "%" : "0%";

    const counts = useMemo(() => ({
        all: forms.length,
        active: forms.filter((f) => f.status === "active").length,
        draft: forms.filter((f) => f.status === "draft").length,
        archived: forms.filter((f) => f.status === "archived").length,
    }), [forms]);

    const filteredForms = useMemo(() => {
        return forms.filter((form) => {
            if (statusFilter !== "all" && form.status !== statusFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const nameMatch = form.name.toLowerCase().includes(query);
                const descMatch = form.description?.toLowerCase().includes(query);
                if (!nameMatch && !descMatch) return false;
            }
            return true;
        });
    }, [forms, statusFilter, searchQuery]);

    const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return;
        }

        setDeletingId(id);
        try {
            const res = await deleteForm(id);
            if (res.success) {
                setForms((prev) => prev.filter((f) => f.id !== id));
                toast.success("Form deleted successfully");
            } else {
                toast.error(res.error || "Failed to delete form");
            }
        } catch {
            toast.error("Failed to delete form");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Forms</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                        Create and manage forms to capture leads and drive customer conversions.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-brand-500/20 flex items-center gap-2 active:scale-95 self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    Create Form
                </button>
            </div>

            {/* KPI Metric Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider">Total Forms</span>
                        <FileText className="w-4 h-4 text-brand-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-foreground">{forms.length}</div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider">Total Views</span>
                        <Eye className="w-4 h-4 text-sky-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-foreground">{totalViews.toLocaleString()}</div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider">Submissions</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-foreground">{totalSubmissions.toLocaleString()}</div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider">Avg. Conversion</span>
                        <TrendingUp className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="text-2xl font-black font-mono text-foreground">{avgConversion}</div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.08]">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                    {(["all", "active", "draft", "archived"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                                statusFilter === tab
                                    ? "bg-brand-500 text-white shadow-sm"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                            }`}
                        >
                            {tab}
                            <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    statusFilter === tab
                                        ? "bg-white/20 text-white"
                                        : "bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400"
                                }`}
                            >
                                {counts[tab]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="relative flex-1 md:max-w-xs">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search forms..."
                        className="w-full pl-9 pr-8 py-1.5 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg text-xs text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Forms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredForms.map((form) => {
                    const formViews = form.views || 0;
                    const formSubs = form.submissions_count || 0;
                    const conv = formViews > 0 ? ((formSubs / formViews) * 100).toFixed(1) + "%" : "0%";

                    return (
                        <div
                            key={form.id}
                            onClick={() => router.push(`/dashboard/forms/${form.id}`)}
                            className="group h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl overflow-hidden hover:border-brand-500/30 transition-all shadow-sm hover:shadow-md dark:shadow-none cursor-pointer flex flex-col relative"
                        >
                            <div className="p-6 border-b border-zinc-100 dark:border-white/[0.08] group-hover:bg-brand-50/10 transition-colors flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className={
                                            form.status === "active"
                                                ? "text-brand-600 dark:text-brand-400"
                                                : "text-zinc-500 dark:text-zinc-400"
                                        }
                                    >
                                        <FileText className="w-7 h-7" />
                                    </div>

                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                                                form.status === "active"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                                    : form.status === "draft"
                                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                                    : "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:border-white/10"
                                            }`}
                                        >
                                            {form.status}
                                        </span>

                                        {/* Actions Menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                                                    aria-label="Form actions"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/${form.id}`)}>
                                                    <Edit3 className="w-4 h-4 mr-2" />
                                                    Edit Builder
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/dashboard/forms/${form.id}?tab=submissions`)}
                                                >
                                                    <Table className="w-4 h-4 mr-2" />
                                                    Submissions
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => window.open(`/f/${form.id}`, "_blank")}
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Preview Live Form
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setShareModalFormId(form.id)}>
                                                    <Share2 className="w-4 h-4 mr-2" />
                                                    Share & Embed
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={(e) => handleDelete(e, form.id, form.name)}
                                                    disabled={deletingId === form.id}
                                                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete Form
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                    {form.name}
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                    {form.description || "No description provided"}
                                </p>
                            </div>
                            <div className="px-6 py-4 bg-zinc-50/50 dark:bg-white/[0.02]">
                                <div className="flex justify-between text-sm">
                                    <div>
                                        <span className="text-zinc-500 dark:text-zinc-400 block text-xs mb-0.5">Views</span>
                                        <span className="font-semibold text-foreground dark:text-white">
                                            {formViews.toLocaleString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 dark:text-zinc-400 block text-xs mb-0.5">
                                            Submissions
                                        </span>
                                        <span className="font-semibold text-foreground dark:text-white">
                                            {formSubs.toLocaleString()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500 dark:text-zinc-400 block text-xs mb-0.5">
                                            Conversion
                                        </span>
                                        <span className="font-semibold text-foreground dark:text-white">
                                            {conv}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Create New Card (Trigger) */}
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-brand-500/50 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition-all group h-full min-h-[220px]"
                >
                    <div className="text-zinc-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 mb-4 transition-all group-hover:scale-110">
                        <Plus className="w-10 h-10" />
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-white">Create New Form</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Start from template or scratch</span>
                </button>
            </div>

            {/* Empty State when filters yield 0 forms */}
            {filteredForms.length === 0 && forms.length > 0 && (
                <div className="text-center py-12 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-8">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3">No forms match your search or filter.</p>
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                        }}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            <CreateFormModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            <ShareModal
                isOpen={!!shareModalFormId}
                onClose={() => setShareModalFormId(null)}
                formId={shareModalFormId || ""}
            />
        </div>
    );
}
