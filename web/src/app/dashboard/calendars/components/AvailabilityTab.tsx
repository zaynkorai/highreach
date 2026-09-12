"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Plus, Trash2, Calendar as CalendarIcon, Ban, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { getCalendars, getOverrides, createOverride, deleteOverride } from "../actions";
import type { CalendarService } from "@/lib/services/calendar.service";
import Link from "next/link";

type CalendarItem = Awaited<ReturnType<typeof CalendarService.getCalendars>>[number];
type OverrideItem = Awaited<ReturnType<typeof CalendarService.getOverrides>>[number];

export default function AvailabilityTab() {
    const [calendars, setCalendars] = useState<CalendarItem[]>([]);
    const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
    const [overrides, setOverrides] = useState<OverrideItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // New Override Form State
    const [newOverride, setNewOverride] = useState({
        date: format(new Date(), "yyyy-MM-dd"),
        is_unavailable: true,
        start_time: "09:00",
        end_time: "17:00",
    });

    const loadCalendars = useCallback(async () => {
        setIsLoading(true);
        const res = await getCalendars();
        if (res.success && res.data) {
            setCalendars(res.data);
            if (res.data.length > 0) {
                setSelectedCalendarId((prev) => prev || res.data[0].id);
            }
        }
        setIsLoading(false);
    }, []);

    const loadOverrides = useCallback(async (calId: string) => {
        if (!calId) return;
        const res = await getOverrides(calId);
        if (res.success && res.data) {
            setOverrides(res.data);
        } else {
            setOverrides([]);
        }
    }, []);

    useEffect(() => {
        loadCalendars();
    }, [loadCalendars]);

    useEffect(() => {
        if (selectedCalendarId) {
            loadOverrides(selectedCalendarId);
        }
    }, [selectedCalendarId, loadOverrides]);

    const handleCreateOverride = async () => {
        if (!selectedCalendarId || !newOverride.date) {
            toast.error("Please choose a date");
            return;
        }

        setIsCreating(true);
        const payload = {
            calendar_id: selectedCalendarId,
            date: newOverride.date,
            is_unavailable: newOverride.is_unavailable,
            start_time: newOverride.is_unavailable ? null : newOverride.start_time,
            end_time: newOverride.is_unavailable ? null : newOverride.end_time,
        };

        const res = await createOverride(payload);
        if (res.success) {
            toast.success("Date override added");
            setIsDialogOpen(false);
            setNewOverride({
                date: format(new Date(), "yyyy-MM-dd"),
                is_unavailable: true,
                start_time: "09:00",
                end_time: "17:00",
            });
            loadOverrides(selectedCalendarId);
        } else {
            toast.error(res.error || "Failed to add override");
        }
        setIsCreating(false);
    };

    const handleDeleteOverride = async (id: string) => {
        const res = await deleteOverride(id);
        if (res.success) {
            toast.success("Override removed");
            setOverrides((prev) => prev.filter((o) => o.id !== id));
        } else {
            toast.error(res.error || "Failed to remove override");
        }
    };

    const activeCalendar = calendars.find((c) => c.id === selectedCalendarId);

    if (isLoading) {
        return (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
                Loading availability & overrides...
            </div>
        );
    }

    if (calendars.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl bg-zinc-50 dark:bg-zinc-900/50">
                <Clock className="w-10 h-10 text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold">No calendars configured</h3>
                <p className="text-muted-foreground max-w-sm text-center mt-2">
                    Create an event type in the Scheduling tab before setting up overrides.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Selector Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <Label htmlFor="calendar-select" className="text-sm font-semibold">
                        Calendar:
                    </Label>
                    <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                        <SelectTrigger id="calendar-select" className="w-[240px] bg-white dark:bg-zinc-900">
                            <SelectValue placeholder="Select calendar" />
                        </SelectTrigger>
                        <SelectContent>
                            {calendars.map((cal) => (
                                <SelectItem key={cal.id} value={cal.id}>
                                    {cal.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {activeCalendar && (
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs py-1">
                            Timezone: {activeCalendar.timezone}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/calendars/${activeCalendar.id}`}>
                                Edit Weekly Hours
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Date Overrides Card */}
                <Card className="lg:col-span-2 shadow-sm border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-brand-600" /> Date Overrides
                            </CardTitle>
                            <CardDescription>
                                Add dates when you are unavailable or offer custom hours (holidays, time-off, vacations).
                            </CardDescription>
                        </div>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-brand-600 hover:bg-brand-700">
                                    <Plus className="w-4 h-4 mr-1.5" /> Add Date Override
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Date Override</DialogTitle>
                                    <DialogDescription>
                                        Block out a day or customize available hours for a specific date.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Select Date</Label>
                                        <Input
                                            type="date"
                                            value={newOverride.date}
                                            onChange={(e) => setNewOverride({ ...newOverride, date: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <div>
                                            <p className="text-sm font-semibold">Unavailable all day</p>
                                            <p className="text-xs text-muted-foreground">Block all bookings on this date</p>
                                        </div>
                                        <Switch
                                            checked={newOverride.is_unavailable}
                                            onCheckedChange={(checked) => setNewOverride({ ...newOverride, is_unavailable: checked })}
                                        />
                                    </div>

                                    {!newOverride.is_unavailable && (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                            <div className="space-y-2">
                                                <Label>Start Time</Label>
                                                <Input
                                                    type="time"
                                                    value={newOverride.start_time}
                                                    onChange={(e) => setNewOverride({ ...newOverride, start_time: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Time</Label>
                                                <Input
                                                    type="time"
                                                    value={newOverride.end_time}
                                                    onChange={(e) => setNewOverride({ ...newOverride, end_time: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleCreateOverride} disabled={isCreating}>
                                        {isCreating ? "Saving..." : "Save Override"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>

                    <CardContent>
                        {overrides.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 text-center">
                                <Clock className="w-8 h-8 text-zinc-400 mb-2" />
                                <p className="text-sm font-medium">No overrides scheduled</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                    Your standard weekly recurring hours will apply every day without interruptions.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border rounded-xl overflow-hidden">
                                {overrides.map((ov) => {
                                    let formattedDate = ov.date;
                                    try {
                                        formattedDate = format(parseISO(ov.date), "EEEE, MMMM do, yyyy");
                                    } catch {}

                                    return (
                                        <div
                                            key={ov.id}
                                            className="p-4 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`p-2 rounded-lg ${
                                                        ov.is_unavailable
                                                            ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                                                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                                                    }`}
                                                >
                                                    {ov.is_unavailable ? <Ban className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{formattedDate}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {ov.is_unavailable
                                                            ? "Unavailable all day"
                                                            : `Custom Hours: ${ov.start_time?.slice(0, 5)} - ${ov.end_time?.slice(0, 5)}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={ov.is_unavailable ? "destructive" : "secondary"}
                                                    className="text-[10px] uppercase font-bold"
                                                >
                                                    {ov.is_unavailable ? "Blocked" : "Custom Hours"}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 hover:text-red-600"
                                                    onClick={() => handleDeleteOverride(ov.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Reference & Info Card */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start text-xs gap-2"
                                onClick={() => {
                                    setNewOverride({
                                        date: format(new Date(), "yyyy-MM-dd"),
                                        is_unavailable: true,
                                        start_time: "09:00",
                                        end_time: "17:00",
                                    });
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Ban className="w-3.5 h-3.5 text-red-500" /> Block Out Today
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-xs gap-2"
                                onClick={() => {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    setNewOverride({
                                        date: format(tomorrow, "yyyy-MM-dd"),
                                        is_unavailable: true,
                                        start_time: "09:00",
                                        end_time: "17:00",
                                    });
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Ban className="w-3.5 h-3.5 text-amber-500" /> Block Out Tomorrow
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm bg-gradient-to-br from-brand-50/50 to-transparent dark:from-brand-950/20 border-brand-100 dark:border-brand-900/30">
                        <CardContent className="p-5 space-y-3 text-xs leading-relaxed text-muted-foreground">
                            <div className="flex items-center gap-2 font-bold text-foreground">
                                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                                How Overrides Work
                            </div>
                            <p>
                                Date overrides take absolute precedence over recurring weekly schedules. When a date is blocked,
                                no customer or visitor can book on that date.
                            </p>
                            <p>
                                If your Google or Outlook calendar is connected with Bi-directional sync, busy times in external
                                calendars are also blocked automatically.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
