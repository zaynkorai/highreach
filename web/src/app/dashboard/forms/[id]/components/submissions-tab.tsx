"use client";

import { useEffect, useState, useMemo } from "react";
import { Form, FormSubmissionWithContact } from "@/types/form";
import { getSubmissions, deleteSubmission } from "../../actions";
import { toast } from "sonner";
import {
    Download,
    Trash2,
    Eye,
    Search,
    User,
    Mail,
    Phone,
    Calendar,
    FileSpreadsheet,
    X,
    Loader2,
} from "lucide-react";

interface SubmissionsTabProps {
    form: Form;
}

export function SubmissionsTab({ form }: SubmissionsTabProps) {
    const [submissions, setSubmissions] = useState<FormSubmissionWithContact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionWithContact | null>(null);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    const loadSubmissions = async () => {
        setIsLoading(true);
        try {
            const res = await getSubmissions(form.id);
            if (res.success) {
                setSubmissions(res.data || []);
            } else {
                toast.error(res.error || "Failed to load submissions");
            }
        } catch (err) {
            console.error("Error loading submissions:", err);
            toast.error("Failed to load submissions");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, [form.id]);

    const handleDelete = async (submissionId: string) => {
        if (!confirm("Are you sure you want to delete this submission?")) return;
        setIsDeletingId(submissionId);
        try {
            const res = await deleteSubmission(form.id, submissionId);
            if (res.success) {
                setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
                if (selectedSubmission?.id === submissionId) {
                    setSelectedSubmission(null);
                }
                toast.success("Submission deleted");
            } else {
                toast.error(res.error || "Failed to delete submission");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete submission");
        } finally {
            setIsDeletingId(null);
        }
    };

    const handleExportCSV = () => {
        if (submissions.length === 0) {
            toast.info("No submissions to export");
            return;
        }

        // Determine all unique field columns
        const fieldLabels = Array.from(
            new Set(
                form.fields.map((f) => f.label)
            )
        );

        const headers = ["Submission ID", "Submitted At", "Contact Name", "Contact Email", "Contact Phone", ...fieldLabels];

        const rows = submissions.map((sub) => {
            const contactName = sub.contact
                ? `${sub.contact.firstName || ""} ${sub.contact.lastName || ""}`.trim()
                : "";
            const contactEmail = sub.contact?.email || "";
            const contactPhone = sub.contact?.phone || "";

            const answers = fieldLabels.map((label) => {
                const val = sub.data[label] ?? "";
                const str = typeof val === "object" ? JSON.stringify(val) : String(val);
                // Escape quotes and wrap in quotes for CSV
                return `"${str.replace(/"/g, '""')}"`;
            });

            return [
                `"${sub.id}"`,
                `"${new Date(sub.submitted_at).toLocaleString()}"`,
                `"${contactName.replace(/"/g, '""')}"`,
                `"${contactEmail.replace(/"/g, '""')}"`,
                `"${contactPhone.replace(/"/g, '""')}"`,
                ...answers,
            ].join(",");
        });

        const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const sanitizedName = form.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
        link.setAttribute("download", `${sanitizedName}-responses-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV exported successfully");
    };

    const filteredSubmissions = useMemo(() => {
        if (!searchQuery.trim()) return submissions;
        const q = searchQuery.toLowerCase();
        return submissions.filter((sub) => {
            const contactMatch = sub.contact && (
                `${sub.contact.firstName} ${sub.contact.lastName}`.toLowerCase().includes(q) ||
                sub.contact.email?.toLowerCase().includes(q) ||
                sub.contact.phone?.toLowerCase().includes(q)
            );
            const dataMatch = Object.values(sub.data).some((v) =>
                String(v).toLowerCase().includes(q)
            );
            return contactMatch || dataMatch;
        });
    }, [submissions, searchQuery]);

    const totalContactsCaptured = submissions.filter((s) => s.contact_id).length;
    const lastSubmissionDate = submissions[0]
        ? new Date(submissions[0].submitted_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "None yet";

    return (
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-5 shadow-sm">
                    <div className="text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">
                        Total Responses
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                        {submissions.length}
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-5 shadow-sm">
                    <div className="text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">
                        CRM Contacts Synced
                    </div>
                    <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                        {totalContactsCaptured}
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-5 shadow-sm">
                    <div className="text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">
                        Last Response
                    </div>
                    <div className="text-xl font-semibold text-foreground truncate mt-1">
                        {lastSubmissionDate}
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] p-4 rounded-xl shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search responses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                        onClick={handleExportCSV}
                        disabled={submissions.length === 0}
                        className="px-4 py-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-foreground border border-zinc-200 dark:border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={loadSubmissions}
                        className="px-3 py-2 text-zinc-500 hover:text-foreground text-sm font-medium transition-colors"
                        title="Refresh"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Table or Empty State */}
            {isLoading ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-16 flex flex-col items-center justify-center text-zinc-400">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-3" />
                    <p className="text-sm font-medium">Loading form responses...</p>
                </div>
            ) : filteredSubmissions.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-16 text-center">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">
                        {searchQuery ? "No matching submissions" : "No responses yet"}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                        {searchQuery
                            ? "Try adjusting your search terms."
                            : "Share your form link to begin collecting inquiries, contact info, and customer feedback."}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-white/[0.08] text-xs uppercase font-semibold text-zinc-500 tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Contact</th>
                                    {form.fields.slice(0, 3).map((f) => (
                                        <th key={f.id} className="py-3 px-4 truncate max-w-[200px]">
                                            {f.label}
                                        </th>
                                    ))}
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                                {filteredSubmissions.map((sub) => {
                                    const contactName = sub.contact
                                        ? `${sub.contact.firstName || ""} ${sub.contact.lastName || ""}`.trim()
                                        : null;

                                    return (
                                        <tr
                                            key={sub.id}
                                            className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="py-3 px-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400 text-xs">
                                                {new Date(sub.submitted_at).toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {sub.contact ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-semibold">
                                                            {(sub.contact.firstName?.[0] || sub.contact.email?.[0] || "C").toUpperCase()}
                                                        </div>
                                                        <div className="text-xs">
                                                            <div className="font-semibold text-foreground">
                                                                {contactName || sub.contact.email || "Contact"}
                                                            </div>
                                                            {sub.contact.email && (
                                                                <div className="text-zinc-400 text-[11px]">
                                                                    {sub.contact.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic">
                                                        Anonymous
                                                    </span>
                                                )}
                                            </td>
                                            {form.fields.slice(0, 3).map((f) => {
                                                const val = sub.data[f.label];
                                                return (
                                                    <td
                                                        key={f.id}
                                                        className="py-3 px-4 text-zinc-700 dark:text-zinc-300 max-w-[200px] truncate text-xs"
                                                    >
                                                        {val !== undefined && val !== null && String(val) !== ""
                                                            ? String(val)
                                                            : "—"}
                                                    </td>
                                                );
                                            })}
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => setSelectedSubmission(sub)}
                                                        className="p-1.5 text-zinc-400 hover:text-brand-500 rounded transition-colors"
                                                        title="View details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sub.id)}
                                                        disabled={isDeletingId === sub.id}
                                                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition-colors disabled:opacity-50"
                                                        title="Delete submission"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                            <div>
                                <h3 className="font-bold text-base text-foreground">
                                    Response Details
                                </h3>
                                <div className="text-xs text-zinc-500 mt-0.5">
                                    Submitted on {new Date(selectedSubmission.submitted_at).toLocaleString()}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSubmission(null)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Contact Card if attached */}
                            {selectedSubmission.contact && (
                                <div className="p-4 bg-brand-50/20 dark:bg-brand-500/5 rounded-xl border border-brand-500/20 space-y-2">
                                    <div className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                                        Linked Contact
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">
                                        {`${selectedSubmission.contact.firstName || ""} ${selectedSubmission.contact.lastName || ""}`.trim() || "Contact"}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                                        {selectedSubmission.contact.email && (
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5 opacity-60" />
                                                {selectedSubmission.contact.email}
                                            </div>
                                        )}
                                        {selectedSubmission.contact.phone && (
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 opacity-60" />
                                                {selectedSubmission.contact.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Field Data */}
                            <div className="space-y-3">
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                    Submitted Fields
                                </div>
                                <div className="space-y-2.5">
                                    {Object.entries(selectedSubmission.data).map(([key, val]) => (
                                        <div
                                            key={key}
                                            className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-white/5"
                                        >
                                            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">
                                                {key}
                                            </div>
                                            <div className="text-sm font-semibold text-foreground whitespace-pre-wrap break-words">
                                                {String(val || "—")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-3 border-t border-zinc-100 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-800/30 flex justify-between items-center">
                            <button
                                onClick={() => handleDelete(selectedSubmission.id)}
                                className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Response
                            </button>
                            <button
                                onClick={() => setSelectedSubmission(null)}
                                className="px-4 py-1.5 bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-foreground text-xs font-semibold rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
