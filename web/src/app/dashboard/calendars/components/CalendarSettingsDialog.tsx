"use client";

import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getCalendarSettings, updateCalendarSettings } from "../actions";

interface CalendarSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CalendarSettingsDialog({ open, onOpenChange }: CalendarSettingsDialogProps) {
    const [timezone, setTimezone] = useState("UTC");
    const [use24h, setUse24h] = useState(false);
    const [buffer, setBuffer] = useState("15");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        let isMounted = true;
        setIsLoading(true);
        getCalendarSettings().then((res) => {
            if (!isMounted) return;
            if (res.success && res.data) {
                setTimezone(res.data.timezone || "UTC");
                setBuffer(String(res.data.buffer !== undefined ? res.data.buffer : "15"));
                setUse24h(Boolean(res.data.use24h));
            }
            setIsLoading(false);
        });
        return () => {
            isMounted = false;
        };
    }, [open]);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateCalendarSettings({
            timezone,
            buffer: parseInt(buffer) || 0,
            use24h,
        });

        if (res.success) {
            toast.success("Global calendar settings saved");
            onOpenChange(false);
        } else {
            toast.error(res.error || "Failed to save settings");
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Calendar Settings</DialogTitle>
                    <DialogDescription>
                        Configure global defaults for your tenant scheduling system.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                        Loading settings...
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="timezone" className="text-right text-xs font-semibold">
                                Timezone
                            </Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UTC">UTC (Universal)</SelectItem>
                                    <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                                    <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
                                    <SelectItem value="America/Denver">Mountain Time (US)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                    <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="buffer" className="text-right text-xs font-semibold">
                                Default Buffer
                            </Label>
                            <Select value={buffer} onValueChange={setBuffer}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select buffer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">None (0 mins)</SelectItem>
                                    <SelectItem value="5">5 minutes</SelectItem>
                                    <SelectItem value="10">10 minutes</SelectItem>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="24h" className="text-right text-xs font-semibold">
                                24h Format
                            </Label>
                            <div className="col-span-3 flex items-center space-x-2">
                                <Switch id="24h" checked={use24h} onCheckedChange={setUse24h} />
                                <span className="text-xs text-muted-foreground">
                                    {use24h ? "24-Hour (14:00)" : "12-Hour (2:00 PM)"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-brand-600 hover:bg-brand-700"
                        disabled={isSaving || isLoading}
                    >
                        {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
