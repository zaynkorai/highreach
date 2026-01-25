"use client";

import { DragEvent, useState } from "react";
import {
    TRIGGERS, ACTIONS
} from "../lib/workflow-types";
import {
    Zap, MessageSquare, Clock, GitBranch, Flag, ArrowRight,
    Phone, Mail, Tag, UserPlus, Calendar, Target, Bell,
    CheckSquare, FileText, PhoneMissed, MousePointer2,
    ChevronDown, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const iconMap: Record<string, any> = {
    Zap, MessageSquare, Clock, GitBranch, Flag, ArrowRight, Phone,
    Mail, Tag, UserPlus, Calendar, Target, Bell, CheckSquare,
    FileText, PhoneMissed
};

function getIcon(iconName: string) {
    const Icon = iconMap[iconName] || Zap;
    return <Icon className="w-4 h-4" />;
}

function SidebarSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center w-full mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
                {isOpen ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                {title}
            </button>
            {isOpen && <div className="grid grid-cols-1 gap-2 pl-1 animate-in slide-in-from-top-2 duration-200">{children}</div>}
        </div>
    );
}

export function EditorSidebar() {
    const onDragStart = (event: DragEvent, nodeType: string, payload: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/payload', JSON.stringify(payload));
        event.dataTransfer.effectAllowed = 'move';
    };

    const DraggableItem = ({ label, icon, onDragStart, highlightColor }: any) => (
        <div
            draggable
            onDragStart={onDragStart}
            className={cn(
                "flex items-center gap-3 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group",
                "hover:border-indigo-500/50"
            )}
        >
            <div className={cn("p-1.5 rounded-md transition-colors", highlightColor)}>
                {icon}
            </div>
            <span className="text-sm font-medium group-hover:text-indigo-600 transition-colors">{label}</span>
        </div>
    );

    return (
        <div className="w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full z-10 shadow-lg shadow-zinc-200/50 dark:shadow-none">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <MousePointer2 className="w-4 h-4 text-indigo-500" />
                    Elements Library
                </h3>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 pb-20">
                    <SidebarSection title="Logic & Flow" defaultOpen={true}>
                        <DraggableItem
                            label="Wait"
                            icon={<Clock className="w-4 h-4" />}
                            highlightColor="bg-amber-50 dark:bg-amber-500/10 text-amber-600"
                            onDragStart={(e: DragEvent) => onDragStart(e, 'wait', { label: 'Wait' })}
                        />
                        <DraggableItem
                            label="If/Else Condition"
                            icon={<GitBranch className="w-4 h-4" />}
                            highlightColor="bg-purple-50 dark:bg-purple-500/10 text-purple-600"
                            onDragStart={(e: DragEvent) => onDragStart(e, 'if_else', { name: 'Condition' })}
                        />
                        <DraggableItem
                            label="End Flow"
                            icon={<Flag className="w-4 h-4" />}
                            highlightColor="bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                            onDragStart={(e: DragEvent) => onDragStart(e, 'end', {})}
                        />
                    </SidebarSection>

                    <Separator className="my-4" />

                    <SidebarSection title="Actions" defaultOpen={true}>
                        {ACTIONS.filter(a => a.category !== 'logic').map(a => (
                            <DraggableItem
                                key={a.id}
                                label={a.label}
                                icon={getIcon(a.icon)}
                                highlightColor="bg-blue-50 dark:bg-blue-500/10 text-blue-600"
                                onDragStart={(e: DragEvent) => onDragStart(e, 'action', { actionId: a.id })}
                            />
                        ))}
                    </SidebarSection>

                    <Separator className="my-4" />

                    <SidebarSection title="Triggers" defaultOpen={false}>
                        {TRIGGERS.map(t => (
                            <DraggableItem
                                key={t.id}
                                label={t.label}
                                icon={getIcon(t.icon)}
                                highlightColor="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600"
                                onDragStart={(e: DragEvent) => onDragStart(e, 'trigger', { triggerId: t.id })}
                            />
                        ))}
                    </SidebarSection>
                </div>
            </ScrollArea>
        </div>
    );
}
