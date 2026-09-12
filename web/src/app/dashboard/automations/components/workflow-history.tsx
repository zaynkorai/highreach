"use client";

import { useEffect, useState } from "react";
import { getWorkflowExecutions } from "../actions";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDistanceToNow, format } from "date-fns";
import {
    Activity, CheckCircle2, XCircle, Clock,
    ChevronRight, Search, Filter, History as HistoryIcon,
    AlertTriangle, Code2, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WorkflowHistoryProps {
    workflowId: string;
}

export function WorkflowHistory({ workflowId }: WorkflowHistoryProps) {
    const [executions, setExecutions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedExecution, setSelectedExecution] = useState<any | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        const data = await getWorkflowExecutions(workflowId);
        setExecutions(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, [workflowId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1 font-medium"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>;
            case "failed":
                return <Badge variant="destructive" className="gap-1 font-medium"><XCircle className="w-3 h-3" /> Failed</Badge>;
            case "running":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1 font-medium animate-pulse"><Clock className="w-3 h-3" /> Running</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filtered = executions.filter(e => {
        const contactEmail = e.trigger_data?.contact?.email || e.trigger_data?.email || "";
        return contactEmail.toLowerCase().includes(search.toLowerCase());
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground animate-pulse">
                <Activity className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">Crunching history data...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950/50">
            {/* Toolbar */}
            <div className="p-4 border-b bg-white dark:bg-zinc-900 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by contact email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-zinc-50 dark:bg-zinc-800"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2 shrink-0">
                    <HistoryIcon className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4">
                            <HistoryIcon className="w-8 h-8 opacity-40" />
                        </div>
                        <h3 className="font-semibold text-foreground">No executions found</h3>
                        <p className="max-w-xs text-sm mt-1">This workflow hasn't run for any contacts yet. Once it triggers, you'll see a line-by-line audit here.</p>
                    </div>
                ) : (
                    <div className="p-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[200px]">Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead className="text-right">Triggered</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((exec) => (
                                    <TableRow
                                        key={exec.id}
                                        onClick={() => setSelectedExecution(exec)}
                                        className="cursor-pointer group hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">
                                                    {exec.trigger_data?.contact?.email || exec.trigger_data?.email || "Unknown Lead"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground uppercase opacity-70">
                                                    ID: {exec.id.split('-')[0]}...
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(exec.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] font-bold">v{exec.version?.version_number || 1}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-medium">
                                                    {formatDistanceToNow(new Date(exec.started_at), { addSuffix: true })}
                                                </span>
                                                {exec.status === 'failed' && exec.error_message && (
                                                    <span className="text-[10px] text-red-500 font-medium italic mt-0.5">
                                                        {exec.error_message.slice(0, 30)}...
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </ScrollArea>

            {/* Execution Detail Modal */}
            <Dialog open={!!selectedExecution} onOpenChange={(open) => !open && setSelectedExecution(null)}>
                <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
                    <DialogHeader>
                        <div className="flex items-center justify-between mr-6">
                            <DialogTitle className="text-base flex items-center gap-2">
                                Execution Details
                                <Badge variant="outline" className="text-[10px]">v{selectedExecution?.version?.version_number || 1}</Badge>
                            </DialogTitle>
                            {selectedExecution && getStatusBadge(selectedExecution.status)}
                        </div>
                        <DialogDescription className="text-xs">
                            Execution ID: <code className="font-mono">{selectedExecution?.id}</code>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedExecution && (
                        <div className="space-y-4 py-2 overflow-y-auto flex-1">
                            {/* Timing */}
                            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-xs">
                                <div>
                                    <span className="text-muted-foreground block text-[11px]">Started</span>
                                    <span className="font-medium">
                                        {selectedExecution.started_at ? format(new Date(selectedExecution.started_at), "PPpp") : "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-[11px]">Completed</span>
                                    <span className="font-medium">
                                        {selectedExecution.completed_at ? format(new Date(selectedExecution.completed_at), "PPpp") : "In Progress"}
                                    </span>
                                </div>
                            </div>

                            {/* Error if failed */}
                            {selectedExecution.status === "failed" && selectedExecution.error_message && (
                                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Execution Error</p>
                                        <p className="mt-0.5">{selectedExecution.error_message}</p>
                                    </div>
                                </div>
                            )}

                            {/* Trigger Event Payload */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                    <Code2 className="w-3.5 h-3.5" />
                                    <span>Trigger Context Payload</span>
                                </div>
                                <pre className="p-3 bg-zinc-950 text-zinc-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                                    {JSON.stringify(selectedExecution.trigger_data, null, 2)}
                                </pre>
                            </div>

                            {/* Step Data if available */}
                            {selectedExecution.step_data && Object.keys(selectedExecution.step_data).length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                        <Activity className="w-3.5 h-3.5" />
                                        <span>Step Results</span>
                                    </div>
                                    <pre className="p-3 bg-zinc-950 text-zinc-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                                        {JSON.stringify(selectedExecution.step_data, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Footer Stats Area */}
            <div className="p-3 border-t bg-white dark:bg-zinc-900 flex items-center gap-6 px-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground justify-center">
                <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    {executions.filter(e => e.status === 'completed').length} Success
                </div>
                <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="w-3 h-3" />
                    {executions.filter(e => e.status === 'failed').length} Failed
                </div>
                <div className="flex items-center gap-2 text-blue-500">
                    <Clock className="w-3 h-3" />
                    {executions.filter(e => e.status === 'running').length} Active
                </div>
            </div>
        </div>
    );
}
