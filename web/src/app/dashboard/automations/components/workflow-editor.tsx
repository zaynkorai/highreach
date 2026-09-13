"use client";

import { useCallback, useState, useMemo, useEffect, memo, useRef } from "react";
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap, // Added MiniMap
    useNodesState,
    useEdgesState,
    addEdge,
    Node,
    Edge,
    Connection,
    BackgroundVariant,
    NodeProps,
    EdgeProps,
    getBezierPath,
    BaseEdge,
    EdgeLabelRenderer,
    ReactFlowProvider,
    useReactFlow,
    ReactFlowInstance,
    Panel, // Added Panel for toolbar
    Handle,
    Position,
    MarkerType,
    ConnectionLineType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    Zap, Clock, MessageSquare, ArrowRight, Plus, Flag, Phone, Mail,
    ChevronLeft, Save, MousePointer2, X, Trash2, Copy, AlertCircle,
    GitBranch, CheckSquare, FileText, PhoneMissed, Calendar, Tag, UserPlus, Target, Bell, History as HistoryIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { TRIGGERS, ACTIONS } from "../lib/workflow-types";
import { TriggerPanel, ActionPanel, WaitConfigPanel, IfElseConfigPanel } from "./selection-panels";
import { saveWorkflow, publishWorkflow, getServiceConfigStatus } from "../actions";
import { EditorSidebar } from "./editor-sidebar";
import { WorkflowHistory } from "./workflow-history";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ... (Icon mapping and Helper functions remain same)
const iconMap: Record<string, any> = { Zap, Clock, MessageSquare, ArrowRight, Plus, Flag, Phone, Mail };
function getIconComponent(iconName: string) { return iconMap[iconName] || Zap; }

// ============ CUSTOM NODES (COMPACT) ============
// (Keeping existing definitions from previous step, assuming they are correct)
// I will override them here to ensure they are the compact versions you liked.
const HandleStyle = "w-4 h-4 !bg-white border-2 border-brand-500 shadow-md hover:scale-125 transition-all cursor-crosshair z-50 !opacity-100";
const HandleHitArea = ""; // Simplified for now to ensure connectivity works

const TriggerNode = memo(({ data, selected }: NodeProps) => {
    const triggerId = (data as any)?.triggerId;
    const trigger = TRIGGERS.find(t => t.id === triggerId);
    const Icon = trigger ? getIconComponent(trigger.icon) : Zap;
    const label = trigger?.label || (data as any)?.label || "Select Trigger";
    return (
        <div className={cn("relative group transition-all duration-300", selected && "ring-2 ring-brand-500 ring-offset-4 rounded-xl scale-102")}>
            <div className="p-2 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-600 text-white rounded-xl shadow-xl min-w-[150px] border border-white/10 text-center">
                <div className="flex flex-col items-center gap-1.5">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm border border-white/10"><Icon className="w-3.5 h-3.5" /></div>
                    <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-90 block leading-tight">Start</span>
                        <p className="font-bold text-xs leading-tight mt-0.5">{label}</p>
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className={HandleStyle} />
        </div>
    );
});
TriggerNode.displayName = "TriggerNode";

const ActionNode = memo(({ data, selected }: NodeProps) => {
    const actionId = (data as any)?.actionId;
    const action = ACTIONS.find(a => a.id === actionId);
    const Icon = action ? getIconComponent(action.icon) : ArrowRight;
    const label = action?.label || (data as any)?.label || "Select Action";
    const template = (data as any)?.template;
    return (
        <div className={cn("relative group transition-all duration-300", selected && "ring-2 ring-blue-500 ring-offset-4 rounded-xl scale-102")}>
            <Handle type="target" position={Position.Top} className={HandleStyle} />
            <div className="p-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl shadow-lg min-w-[150px] hover:border-blue-400/50 transition-colors">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"><Icon className="w-3.5 h-3.5" /></div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-zinc-400 block leading-tight">Step</span>
                        <p className="font-bold text-xs text-slate-700 dark:text-zinc-100 leading-tight mt-0.5 truncate">
                            {label}
                            {template && <span className="font-normal text-slate-400 ml-1 opacity-75">"{String(template)}"</span>}
                        </p>
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className={HandleStyle} />
        </div>
    );
});
ActionNode.displayName = "ActionNode";

const WaitNode = memo(({ data, selected }: NodeProps) => {
    const label = (data as any)?.label || "Wait";
    return (
        <div className={cn("relative group transition-all duration-300", selected && "ring-2 ring-amber-500 ring-offset-4 rounded-xl scale-102")}>
            <Handle type="target" position={Position.Top} className={HandleStyle} />
            <div className="p-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-900/30 rounded-xl min-w-[150px] shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white dark:bg-amber-900/20 rounded-lg text-amber-600 shadow-sm"><Clock className="w-3.5 h-3.5" /></div>
                    <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-700 dark:text-amber-400 block leading-tight">Pause</span>
                        <p className="font-bold text-xs text-amber-900 dark:text-amber-200 leading-tight mt-0.5">{label}</p>
                    </div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className={HandleStyle} />
        </div>
    );
});
WaitNode.displayName = "WaitNode";

const IfElseNode = memo(({ data, selected }: NodeProps) => {
    const label = (data as any)?.name || (data as any)?.label || "Condition";
    return (
        <div className={cn("relative group transition-all duration-300", selected && "ring-2 ring-purple-500 ring-offset-4 rounded-xl scale-102")}>
            <Handle type="target" position={Position.Top} className={HandleStyle} />
            <div className="p-2 bg-purple-50 dark:bg-purple-900/5 border border-purple-200 dark:border-purple-900/30 rounded-xl min-w-[150px] shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white dark:bg-purple-900/20 rounded-lg text-purple-600 shadow-sm"><GitBranch className="w-3.5 h-3.5" /></div>
                    <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-700 dark:text-purple-400 block leading-tight">Logic</span>
                        <p className="font-bold text-xs text-purple-900 dark:text-purple-200 leading-tight mt-0.5">{label}</p>
                    </div>
                </div>
            </div>

            {/* YES BRANCH */}
            <div className="absolute -bottom-6 left-1/4 -translate-x-1/2 flex flex-col items-center">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1">Yes</span>
                <Handle
                    type="source"
                    id="yes"
                    position={Position.Bottom}
                    className={cn(HandleStyle, "!border-emerald-500")}
                    style={{ left: 'auto' }}
                />
            </div>

            {/* NO BRANCH */}
            <div className="absolute -bottom-6 right-1/4 translate-x-1/2 flex flex-col items-center">
                <span className="text-[10px] font-black text-red-500 uppercase mb-1">No</span>
                <Handle
                    type="source"
                    id="no"
                    position={Position.Bottom}
                    className={cn(HandleStyle, "!border-red-500")}
                    style={{ left: 'auto' }}
                />
            </div>
        </div>
    );
});
IfElseNode.displayName = "IfElseNode";

const EndNode = memo(({ selected }: NodeProps) => {
    return (
        <div className={cn("relative group transition-all duration-300", selected && "ring-2 ring-slate-400 ring-offset-4 rounded-full scale-105")}>
            <Handle type="target" position={Position.Top} className={HandleStyle} />
            <div className="p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full border border-slate-200 dark:border-zinc-700 shadow-lg text-slate-500">
                <Flag className="w-3.5 h-3.5" />
            </div>
        </div>
    );
});
EndNode.displayName = "EndNode";

function SmartEdge(props: EdgeProps) {
    const { id, selected, data, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd } = props;
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    strokeWidth: selected ? 4 : 2.5,
                    stroke: selected ? "var(--color-brand-600)" : "#94a3b8",
                    transition: "all 0.3s",
                    strokeDasharray: (data as any)?.isDraft ? "5,5" : "none"
                }}
            />
            {selected && (
                <BaseEdge
                    path={edgePath}
                    style={{ strokeWidth: 10, stroke: "var(--color-brand-600)", opacity: 0.1 }}
                />
            )}

            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan flex items-center justify-center gap-2"
                >
                    <button
                        className={cn(
                            "w-8 h-8 bg-brand-600 border-2 border-white rounded-full flex items-center justify-center hover:scale-125 hover:rotate-90 transition-all shadow-xl z-20 group text-white",
                            !selected && "opacity-40 hover:opacity-100 scale-90 hover:scale-100"
                        )}
                        onClick={(e) => { e.stopPropagation(); (data as any)?.onAddClick?.(id); }}
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    {selected && (
                        <button
                            className="w-8 h-8 bg-white dark:bg-zinc-800 border-2 border-red-100 dark:border-red-900/50 rounded-full flex items-center justify-center hover:bg-red-500 hover:border-red-500 hover:scale-110 transition-all shadow-xl z-20 group text-red-500 hover:text-white"
                            onClick={(e) => { e.stopPropagation(); (data as any)?.onDeleteClick?.(id); }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

const EditorCanvas = memo(({
    nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick,
    setReactFlowInstance, setNodes
}: any) => {
    const { screenToFlowPosition } = useReactFlow();

    const nodeTypes = useMemo(() => ({ trigger: TriggerNode, action: ActionNode, wait: WaitNode, if_else: IfElseNode as any, end: EndNode }), []);
    const edgeTypes = useMemo(() => ({ smart: SmartEdge }), []);

    return (
        <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes as any} edgeTypes={edgeTypes}
            onInit={setReactFlowInstance}
            onDrop={(event) => {
                event.preventDefault();
                const type = event.dataTransfer.getData('application/reactflow');
                const payload = event.dataTransfer.getData('application/payload');
                if (!type) return;

                const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
                let parsedData: any = {};
                if (payload) {
                    try {
                        parsedData = JSON.parse(payload) || {};
                    } catch {
                        parsedData = {};
                    }
                }
                const newNode = {
                    id: `dnd-${Date.now()}`,
                    type,
                    position,
                    data: parsedData
                };
                setNodes((nds: any) => nds.concat(newNode));
            }}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
            fitView className="bg-zinc-50 dark:bg-zinc-950/50"
            minZoom={0.5} maxZoom={1.5}
            connectionLineType={ConnectionLineType.Bezier}
            connectionLineStyle={{ stroke: 'var(--color-brand-500)', strokeWidth: 3, strokeDasharray: '5,5' }}
            defaultEdgeOptions={{ type: 'smart', animated: true }}
        >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#e4e4e7" />
            <Controls className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-md rounded-lg m-4" />
            <MiniMap
                nodeStrokeWidth={3}
                zoomable pannable
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md rounded-lg overflow-hidden m-4"
            />
            <Panel position="top-center" className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm text-xs text-muted-foreground font-medium">
                Drag drop elements or use + to insert
            </Panel>
        </ReactFlow>
    );
});
EditorCanvas.displayName = "EditorCanvas";

// ============ MAIN EDITOR SHELL ============

interface WorkflowEditorProps {
    workflowId: string;
    workflowName: string;
    initialDefinition?: any;
}

export function WorkflowEditor({ workflowId, workflowName, initialDefinition }: WorkflowEditorProps) {
    const initialNodes = useMemo(() => {
        if (initialDefinition?.nodes && Array.isArray(initialDefinition.nodes) && initialDefinition.nodes.length > 0) {
            return initialDefinition.nodes.map((n: any, idx: number) => ({
                ...n,
                id: n.id || `node-${idx}`,
                data: n.data || {}
            }));
        }
        return [{ id: "trigger-1", type: "trigger", position: { x: 300, y: 50 }, data: { triggerId: null, label: "Click to Select Trigger" } }];
    }, [initialDefinition?.nodes]);

    const initialEdges = useMemo(() => {
        if (initialDefinition?.edges && Array.isArray(initialDefinition.edges)) {
            return initialDefinition.edges.map((e: any, idx: number) => ({
                ...e,
                id: e.id || `e-${e.source || 'src'}-${e.target || 'tgt'}-${idx}`,
                data: e.data || {}
            }));
        }
        return [];
    }, [initialDefinition?.edges]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const [name, setName] = useState(workflowName);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [activeTab, setActiveTab] = useState<"builder" | "history">("builder");
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [inspectorView, setInspectorView] = useState<"none" | "trigger" | "action" | "wait" | "condition">("none");
    const [insertEdgeId, setInsertEdgeId] = useState<string | null>(null);
    const [configStatus, setConfigStatus] = useState<{ telnyx: boolean; resend: boolean } | null>(null);

    useEffect(() => {
        getServiceConfigStatus().then(setConfigStatus);
    }, []);

    // -- Handlers --

    const handleNodeClick = useCallback((e: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
        if (node.type === "trigger") setInspectorView("trigger");
        else if (node.type === "action") setInspectorView("action");
        else if (node.type === "wait") setInspectorView("wait");
        else if (node.type === "if_else") setInspectorView("condition");
    }, []);

    const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
        setInspectorView("none");
        setInsertEdgeId(null);
    }, []);

    const handleAddClick = useCallback((edgeId: string) => {
        setInsertEdgeId(edgeId);
        // We open the action panel, but logic might differ if we want dragged items
        // For now, reuse ActionPanel as "Picker"
        setInspectorView("action");
    }, []);

    const handleDeleteEdge = useCallback((edgeId: string) => {
        setEdges(eds => eds.filter(e => e.id !== edgeId));
        toast.success("Connection removed");
    }, []);

    const edgesWithHandler = useMemo(() => edges.map((edge, idx) => ({
        ...edge,
        id: edge.id || `edge-${edge.source || 'src'}-${edge.target || 'tgt'}-${idx}`,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: edge.selected ? "var(--color-brand-600)" : "#cbd5e1" },
        data: { ...edge.data, onAddClick: handleAddClick, onDeleteClick: handleDeleteEdge }
    })), [edges, handleAddClick, handleDeleteEdge]);

    // Handlers for node configuration & insertion
    const handleTriggerSelect = (triggerId: string) => {
        const triggerDef = TRIGGERS.find(t => t.id === triggerId);
        const label = triggerDef?.label || triggerId;
        if (selectedNode) {
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? {
                ...n,
                data: { ...n.data, triggerId, label }
            } : n));
            toast.success(`Trigger set to ${label}`);
        }
        handlePaneClick();
    };

    const handleActionPanelSave = (actionId: string, config: any) => {
        if (actionId === "wait") {
            setInspectorView("wait");
            return;
        }
        if (actionId === "if_else") {
            setInspectorView("condition");
            return;
        }
        const action = ACTIONS.find(a => a.id === actionId);
        const label = action?.label || actionId;

        if (selectedNode && selectedNode.type === "action") {
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? {
                ...n,
                data: { ...n.data, actionId, label, ...config }
            } : n));
            toast.success("Updated Action");
            handlePaneClick();
        } else if (insertEdgeId) {
            const edge = edges.find(e => e.id === insertEdgeId);
            if (edge) {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                const posX = sourceNode && targetNode ? Math.round((sourceNode.position.x + targetNode.position.x) / 2) : 300;
                const posY = sourceNode && targetNode ? Math.round((sourceNode.position.y + targetNode.position.y) / 2) : 300;
                const newNodeId = `node-${Date.now()}`;
                const newNode: Node = {
                    id: newNodeId,
                    type: "action",
                    position: { x: posX, y: posY },
                    data: { actionId, label, ...config }
                };
                setNodes(nds => nds.concat(newNode));
                setEdges(eds => [
                    ...eds.filter(e => e.id !== insertEdgeId),
                    { id: `e-${edge.source}-${newNodeId}`, source: edge.source, sourceHandle: edge.sourceHandle, target: newNodeId, type: "smart", animated: true },
                    { id: `e-${newNodeId}-${edge.target}`, source: newNodeId, target: edge.target, type: "smart", animated: true }
                ]);
                toast.success("Inserted Action");
                setInsertEdgeId(null);
            }
            handlePaneClick();
        }
    };

    const handleWaitSave = (config: any) => {
        const label = `Wait ${config.duration || 1} ${config.unit || 'days'}`;
        if (selectedNode && selectedNode.type === "wait") {
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? {
                ...n,
                data: { ...n.data, ...config, label }
            } : n));
            toast.success("Updated Wait Step");
        } else if (insertEdgeId) {
            const edge = edges.find(e => e.id === insertEdgeId);
            if (edge) {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                const posX = sourceNode && targetNode ? Math.round((sourceNode.position.x + targetNode.position.x) / 2) : 300;
                const posY = sourceNode && targetNode ? Math.round((sourceNode.position.y + targetNode.position.y) / 2) : 300;
                const newNodeId = `node-${Date.now()}`;
                const newNode: Node = {
                    id: newNodeId,
                    type: "wait",
                    position: { x: posX, y: posY },
                    data: { ...config, label }
                };
                setNodes(nds => nds.concat(newNode));
                setEdges(eds => [
                    ...eds.filter(e => e.id !== insertEdgeId),
                    { id: `e-${edge.source}-${newNodeId}`, source: edge.source, sourceHandle: edge.sourceHandle, target: newNodeId, type: "smart", animated: true },
                    { id: `e-${newNodeId}-${edge.target}`, source: newNodeId, target: edge.target, type: "smart", animated: true }
                ]);
                toast.success("Inserted Wait Step");
                setInsertEdgeId(null);
            }
        }
        handlePaneClick();
    };

    const handleIfElseSave = (config: any) => {
        const label = config.name || "Check Condition";
        if (selectedNode && selectedNode.type === "if_else") {
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? {
                ...n,
                data: { ...n.data, ...config, label }
            } : n));
            toast.success("Updated Condition");
        } else if (insertEdgeId) {
            const edge = edges.find(e => e.id === insertEdgeId);
            if (edge) {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                const posX = sourceNode && targetNode ? Math.round((sourceNode.position.x + targetNode.position.x) / 2) : 300;
                const posY = sourceNode && targetNode ? Math.round((sourceNode.position.y + targetNode.position.y) / 2) : 300;
                const newNodeId = `node-${Date.now()}`;
                const newNode: Node = {
                    id: newNodeId,
                    type: "if_else",
                    position: { x: posX, y: posY },
                    data: { ...config, label }
                };
                setNodes(nds => nds.concat(newNode));
                setEdges(eds => [
                    ...eds.filter(e => e.id !== insertEdgeId),
                    { id: `e-${edge.source}-${newNodeId}`, source: edge.source, sourceHandle: edge.sourceHandle, target: newNodeId, type: "smart", animated: true },
                    { id: `e-${newNodeId}-${edge.target}-yes`, source: newNodeId, sourceHandle: "yes", target: edge.target, type: "smart", animated: true }
                ]);
                toast.success("Inserted Condition");
                setInsertEdgeId(null);
            }
        }
        handlePaneClick();
    };

    const handleDeleteNode = () => {
        if (!selectedNode) return;
        setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
        setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id)); // Naive edge removal
        setSelectedNode(null);
        setInspectorView("none");
        toast.success("Deleted");
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveWorkflow(workflowId, { nodes, edges }, name);
            toast.success("Saved");
        } catch (e) { toast.error("Error saving"); } finally { setIsSaving(false); }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const res = await publishWorkflow(workflowId, { nodes, edges });
            if (res.success) toast.success("Workflow published and live!");
            else toast.error(res.error || "Failed to publish");
        } catch (e) { toast.error("Error publishing"); } finally { setIsPublishing(false); }
    };

    return (
        <ReactFlowProvider>
            <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
                {/* Header */}
                <header className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/automations" className="p-2 hover:bg-zinc-100 rounded-md transition-colors"><ChevronLeft className="w-4 h-4 text-zinc-500" /></Link>
                        <div className="flex flex-col">
                            <input value={name} onChange={e => setName(e.target.value)} className="font-semibold bg-transparent outline-none text-sm" />
                            <span className="text-[10px] text-muted-foreground">{isSaving ? "Saving..." : "All changes saved"}</span>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="absolute left-1/2 -translate-x-1/2">
                        <TabsList className="h-9 bg-zinc-100 dark:bg-zinc-800">
                            <TabsTrigger value="builder" className="px-6 text-xs gap-2">
                                <Zap className="w-3 h-3" /> Builder
                            </TabsTrigger>
                            <TabsTrigger value="history" className="px-6 text-xs gap-2">
                                <HistoryIcon className="w-3 h-3" /> History
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving || isPublishing}>
                            <Save className="w-3.5 h-3.5 mr-2" /> {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" className="bg-brand-600 hover:bg-brand-700" onClick={handlePublish} disabled={isPublishing}>
                            {isPublishing ? "Publishing..." : "Publish"}
                        </Button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden relative">
                    {activeTab === "builder" ? (
                        <>
                            {/* LEFT: Library */}
                            <EditorSidebar />

                            {/* CENTER: Canvas */}
                            <div className="flex-1 relative">
                                <EditorCanvas
                                    nodes={nodes} edges={edgesWithHandler}
                                    onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                                    onConnect={(p: Connection) => setEdges(eds => addEdge({ ...p, type: 'smart', animated: true }, eds))}
                                    onNodeClick={handleNodeClick}
                                    onPaneClick={handlePaneClick}
                                    setNodes={setNodes}
                                />
                            </div>

                            {/* RIGHT: Inspector (Slide-over) */}
                            {(inspectorView !== "none" || insertEdgeId) && (
                                <div className="w-[400px] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shadow-2xl z-20 animate-in slide-in-from-right duration-300">
                                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50">
                                        <h3 className="font-semibold text-sm">
                                            {inspectorView === "trigger" && "Configure Trigger"}
                                            {inspectorView === "action" && (insertEdgeId ? "Select Action" : "Edit Action")}
                                            {inspectorView === "wait" && "Wait Settings"}
                                            {inspectorView === "condition" && "Condition"}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            {selectedNode && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleDeleteNode}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePaneClick}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        {inspectorView === "trigger" && (
                                            <TriggerPanel
                                                initialTriggerId={(selectedNode?.data?.triggerId as string) || undefined}
                                                onSelect={handleTriggerSelect}
                                                onClose={handlePaneClick}
                                            />
                                        )}
                                        {inspectorView === "action" && (
                                            <ActionPanel
                                                initialActionId={(selectedNode?.data?.actionId as string) || undefined}
                                                initialConfig={selectedNode?.data}
                                                onSave={handleActionPanelSave}
                                                onClose={handlePaneClick}
                                                isSmsConfigured={configStatus?.telnyx ?? true}
                                            />
                                        )}
                                        {inspectorView === "wait" && (
                                            <WaitConfigPanel
                                                initialConfig={selectedNode?.data}
                                                onSave={handleWaitSave}
                                                onClose={handlePaneClick}
                                            />
                                        )}
                                        {inspectorView === "condition" && (
                                            <IfElseConfigPanel
                                                initialConfig={selectedNode?.data}
                                                onSave={handleIfElseSave}
                                                onClose={handlePaneClick}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
                            <WorkflowHistory workflowId={workflowId} />
                        </div>
                    )}
                </div>
            </div>
        </ReactFlowProvider>
    );
}
