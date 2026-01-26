"use client";

import { useState } from "react";
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

interface CalendarSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CalendarSettingsDialog({ open, onOpenChange }: CalendarSettingsDialogProps) {
    // Mock State for now (would be persisted to user_settings table)
    const [timezone, setTimezone] = useState("UTC");
    const [use24h, setUse24h] = useState(false);
    const [buffer, setBuffer] = useState("15");

    const handleSave = () => {
        // Implement backend save logic here
        toast.success("Global settings saved");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Calendar Settings</DialogTitle>
                    <DialogDescription>
                        Configure global defaults for your scheduling system.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="timezone" className="text-right">
                            Timezone
                        </Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UTC">UTC (Universal)</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="buffer" className="text-right">
                            Default Buffer
                        </Label>
                        <Select value={buffer} onValueChange={setBuffer}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select buffer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">None</SelectItem>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="24h" className="text-right">
                            24h Format
                        </Label>
                        <div className="col-span-3 flex items-center space-x-2">
                            <Switch id="24h" checked={use24h} onCheckedChange={setUse24h} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
