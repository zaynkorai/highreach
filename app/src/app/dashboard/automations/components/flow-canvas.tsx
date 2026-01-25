"use client";

import { useCallback, useState } from "react";
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Node,
    Edge,
    Connection,
    MarkerType,
    BackgroundVariant,
    Handle,
    Position,
    NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Zap, Clock, MessageSquare, ArrowRight, Plus, Flag, Phone, Mail, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom Node Components
function TriggerNode({ data }: NodeProps) {
    return (
        <div className="relative">
            <div className="px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-lg min-w-[180px]">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold text-sm">{data.label as string}</span>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3" />
        </div>
    );
}

function ActionNode({ data }: NodeProps) {
    return (
        <div className="relative">
            <Handle type="target" position={Position.Top} className="!bg-zinc-400 !w-3 !h-3" />
            <div className="px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-blue-500 rounded-lg shadow-md min-w-[180px]">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    {getActionIcon(data.actionType as string)}
                    <span className="font-medium text-sm">{data.label as string}</span>
                </div>
                {(data.description as string) && (
                    <p className="text-xs text-muted-foreground mt-1">{data.description as string}</p>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-zinc-400 !w-3 !h-3" />
        </div>
    );
}

function DelayNode({ data }: NodeProps) {
    return (
        <div className="relative">
            <Handle type="target" position={Position.Top} className="!bg-zinc-400 !w-3 !h-3" />
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-500 rounded-lg shadow-md min-w-[140px]">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-sm">{data.label as string}</span>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-zinc-400 !w-3 !h-3" />
        </div>
    );
}

function ConditionNode({ data }: NodeProps) {
    return (
        <div className="relative">
            <Handle type="target" position={Position.Top} className="!bg-zinc-400 !w-3 !h-3" />
            <div className={cn(
                "px-4 py-3 rounded-lg shadow-md min-w-[140px] border-2",
                data.variant === "success"
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-600"
                    : "bg-red-50 dark:bg-red-900/30 border-red-500 text-red-600"
            )}>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{data.label as string}</span>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-zinc-400 !w-3 !h-3" />
        </div>
    );
}

function EndNode({ data }: NodeProps) {
    return (
        <div className="relative">
            <Handle type="target" position={Position.Top} className="!bg-zinc-400 !w-3 !h-3" />
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full shadow-md flex items-center justify-center">
                <Flag className="w-5 h-5 text-zinc-500" />
            </div>
        </div>
    );
}

function getActionIcon(type: string) {
    switch (type) {
        case "sms": return <MessageSquare className="w-4 h-4" />;
        case "email": return <Mail className="w-4 h-4" />;
        case "call": return <Phone className="w-4 h-4" />;
        default: return <ArrowRight className="w-4 h-4" />;
    }
}

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    delay: DelayNode,
    condition: ConditionNode,
    end: EndNode,
};

// Initial nodes for the "Missed Call Text-Back" workflow
const initialNodes: Node[] = [
    { id: "1", type: "trigger", position: { x: 250, y: 0 }, data: { label: "Call Missed" } },
    { id: "2", type: "delay", position: { x: 250, y: 100 }, data: { label: "Wait 30s" } },
    { id: "3", type: "action", position: { x: 250, y: 200 }, data: { label: "Send SMS", actionType: "sms", description: "Hey! Sorry I missed your call..." } },
    { id: "4", type: "action", position: { x: 250, y: 320 }, data: { label: "Create Conversation", actionType: "system" } },
    { id: "5", type: "end", position: { x: 280, y: 420 }, data: { label: "End" } },
];

const initialEdges: Edge[] = [
    { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#6366f1" }, markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" } },
    { id: "e2-3", source: "2", target: "3", type: "smoothstep", style: { strokeDasharray: "5 5" } },
    { id: "e3-4", source: "3", target: "4", type: "smoothstep", style: { strokeDasharray: "5 5" } },
    { id: "e4-5", source: "4", target: "5", type: "smoothstep", style: { strokeDasharray: "5 5" } },
];

interface FlowCanvasProps {
    workflowKey?: string;
}

export function FlowCanvas({ workflowKey }: FlowCanvasProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: "smoothstep", style: { strokeDasharray: "5 5" } }, eds)),
        [setEdges]
    );

    return (
        <div className="w-full h-[500px] bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-zinc-50 dark:bg-zinc-950"
            >
                <Controls className="!bg-white dark:!bg-zinc-800 !border-zinc-200 dark:!border-zinc-700 !rounded-lg !shadow-lg" />
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="!bg-zinc-50 dark:!bg-zinc-950" />
            </ReactFlow>
        </div>
    );
}
