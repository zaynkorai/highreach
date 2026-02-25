
"use client";

import { useState } from "react";
import { updateWorkflowSetting } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner"; // Assuming sonner is installed as per previous context

interface AutomationCardProps {
    title: string;
    description: string;
    settingKey: string;
    initialData?: any;
    defaultTemplate?: string;
    hasTemplate?: boolean;
}

export function AutomationCard({
    title,
    description,
    settingKey,
    initialData,
    defaultTemplate,
    hasTemplate = true
}: AutomationCardProps) {
    const [enabled, setEnabled] = useState(initialData?.enabled || false);
    const [template, setTemplate] = useState(initialData?.config?.template || defaultTemplate || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateWorkflowSetting(settingKey, enabled, hasTemplate ? template : undefined);
        setIsSaving(false);

        if (res.success) {
            toast.success("Settings saved");
        } else {
            toast.error(res.error || "Failed to save");
            // revert
            // setEnabled(initialData?.enabled || false);
        }
    };

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground shadow-sm">
            <div className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={`toggle-${settingKey}`}
                            checked={enabled}
                            onCheckedChange={(checked) => {
                                setEnabled(checked === true);
                            }}
                        />
                        <Label htmlFor={`toggle-${settingKey}`} className="cursor-pointer">
                            {enabled ? "On" : "Off"}
                        </Label>
                    </div>
                </div>

                {hasTemplate && (
                    <div className={`space-y-2 transition-all ${enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                        <Label>Message Template</Label>
                        <Input
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            placeholder="Enter message template..."
                        />
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={isSaving} size="sm">
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
