"use client";

import { useEffect, useState } from "react";
import { getWorkflowExecutions } from "../actions";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
    Activity, CheckCircle2, XCircle, Clock,
    ChevronRight, Search, Filter, History as HistoryIcon
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
                                    <TableRow key={exec.id} className="cursor-pointer group hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors">
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
