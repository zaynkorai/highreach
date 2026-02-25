"use client";

import { useEffect, useState, use } from "react";
import { getCalendarWithAvailability, updateAvailability, updateCalendar, getIntegrations } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    ChevronLeft, Save, Clock, Globe,
    Calendar as CalendarIcon, Info, Copy, ExternalLink, Activity
} from "lucide-react";
import {
    Card, CardContent, CardDescription,
    CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

const DAYS = [
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
    { label: "Sunday", value: 0 },
];

const HOURS = Array.from({ length: 24 }).map((_, i) => ({
    label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i < 12 ? 'AM' : 'PM'}`,
    value: `${i.toString().padStart(2, '0')}:00`
}));

// Common timezones
const TIMEZONES = [
    "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney"
];

export default function CalendarDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [calendar, setCalendar] = useState<any>(null);
    const [availability, setAvailability] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [integrations, setIntegrations] = useState<any[]>([]);

    useEffect(() => {
        const fetch = async () => {
            const data = await getCalendarWithAvailability(id);
            if (data) {
                setCalendar(data);
                setAvailability(data.availability || []);
            }
            const intData = await getIntegrations();
            setIntegrations(intData);
            setIsLoading(false);
        };
        fetch();
    }, [id]);

    const toggleDay = (dayValue: number) => {
        const isActive = availability.some(a => a.day_of_week === dayValue);
        if (isActive) {
            setAvailability(prev => prev.filter(a => a.day_of_week !== dayValue));
        } else {
            setAvailability(prev => [...prev, { day_of_week: dayValue, start_time: "09:00", end_time: "17:00" }]);
        }
    };

    const updateTime = (dayValue: number, type: 'start_time' | 'end_time', time: string) => {
        setAvailability(prev => prev.map(a =>
            a.day_of_week === dayValue ? { ...a, [type]: time } : a
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);

        // Parallel save
        const [calRes, availRes] = await Promise.all([
            updateCalendar(id, calendar),
            updateAvailability(id, availability)
        ]);

        if (calRes.success && availRes.success) {
            toast.success("Settings updated successfully!");
        } else {
            const errorMsg = (!calRes.success && (calRes as any).error) || (!availRes.success && (availRes as any).error) || "Failed to update";
            toast.error(errorMsg);
        }
        setIsSaving(false);
    };

    if (isLoading) return <div className="p-8 flex items-center justify-center h-screen text-muted-foreground">Loading settings...</div>;
    if (!calendar) return <div className="p-8">Calendar not found.</div>;

    const bookingLink = typeof window !== 'undefined' ? `${window.location.origin}/book/${calendar.slug}` : `/book/${calendar.slug}`;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-24 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/calendars" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-zinc-500" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight">{calendar.name}</h1>
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-bold uppercase tracking-wider">Active</span>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-1.5 mt-1 text-sm">
                            <Globe className="w-3.5 h-3.5" />
                            {bookingLink}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => {
                        navigator.clipboard.writeText(bookingLink);
                        toast.success("Copied to clipboard");
                    }}>
                        <Copy className="w-4 h-4 mr-2" /> Copy Link
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-brand-600 hover:bg-brand-700 font-bold min-w-[140px]">
                        {isSaving ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-8 bg-zinc-100 dark:bg-zinc-800">
                    <TabsTrigger value="general">General & Links</TabsTrigger>
                    <TabsTrigger value="schedule">Availability & Limits</TabsTrigger>
                    <TabsTrigger value="sync">Calendar Sync</TabsTrigger>
                </TabsList>

                {/* TAB: GENERAL */}
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                            <CardDescription>Basic information about this event type.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Internal Name</Label>
                                <Input
                                    value={calendar.name}
                                    onChange={e => setCalendar({ ...calendar, name: e.target.value })}
                                    placeholder="e.g. Discovery Call"
                                />
                                <p className="text-xs text-muted-foreground">Internal reference name for your dashboard.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Description / Instructions</Label>
                                <Textarea
                                    value={calendar.description || ""}
                                    onChange={e => setCalendar({ ...calendar, description: e.target.value })}
                                    placeholder="e.g. Please come prepared with your questions..."
                                    className="min-h-[100px]"
                                />
                                <p className="text-xs text-muted-foreground">This text will appear on the booking page.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input
                                    value={calendar.location || ""}
                                    onChange={e => setCalendar({ ...calendar, location: e.target.value })}
                                    placeholder="e.g. Zoom Link, Google Meet, or Physical Address"
                                />
                                <p className="text-xs text-muted-foreground">Where will this meeting take place? (e.g. Video Link)</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Booking Link</CardTitle>
                            <CardDescription>Customize the URL where people can book this event.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>URL Slug</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-l-md border border-r-0">
                                        /book/
                                    </span>
                                    <Input
                                        value={calendar.slug}
                                        onChange={e => setCalendar({ ...calendar, slug: e.target.value.replace(/[^a-z0-9-]/g, "") })}
                                        className="rounded-l-none"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and dashes allowed.</p>
                            </div>

                            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg flex items-center justify-between border">
                                <span className="text-sm text-muted-foreground font-mono">{bookingLink}</span>
                                <Button size="sm" variant="ghost" asChild>
                                    <Link href={`/book/${calendar.slug}`} target="_blank">
                                        Open <ExternalLink className="w-3 h-3 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: SCHEDULE */}
                <TabsContent value="schedule" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Time Settings</CardTitle>
                            <CardDescription>Control how long meetings last and where they happen.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Duration (Minutes)</Label>
                                <Select
                                    value={String(calendar.duration_minutes)}
                                    onValueChange={v => setCalendar({ ...calendar, duration_minutes: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 min</SelectItem>
                                        <SelectItem value="30">30 min</SelectItem>
                                        <SelectItem value="45">45 min</SelectItem>
                                        <SelectItem value="60">60 min</SelectItem>
                                        <SelectItem value="90">1.5 hours</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Buffer After (Minutes)</Label>
                                <Select
                                    value={String(calendar.buffer_minutes || 0)}
                                    onValueChange={v => setCalendar({ ...calendar, buffer_minutes: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">None</SelectItem>
                                        <SelectItem value="5">5 min</SelectItem>
                                        <SelectItem value="10">10 min</SelectItem>
                                        <SelectItem value="15">15 min</SelectItem>
                                        <SelectItem value="30">30 min</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Timezone</Label>
                                <Select
                                    value={calendar.timezone}
                                    onValueChange={v => setCalendar({ ...calendar, timezone: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIMEZONES.map(tz => (
                                            <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md border-brand-100 dark:border-brand-900/20">
                        <CardHeader className="bg-gradient-to-r from-brand-50/50 to-transparent dark:from-brand-950/20">
                            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400">
                                <CalendarIcon className="w-5 h-5" />
                                <CardTitle>Weekly Hours</CardTitle>
                            </div>
                            <CardDescription>
                                Set the hours you are available for this specific event type.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {DAYS.map((day) => {
                                    const active = availability.find(a => a.day_of_week === day.value);
                                    return (
                                        <div key={day.value} className={cn(
                                            "flex items-center justify-between p-4 px-6 transition-all",
                                            active ? "bg-white dark:bg-zinc-950" : "bg-zinc-50 dark:bg-zinc-900/40 opacity-70"
                                        )}>
                                            <div className="flex items-center gap-4">
                                                <Checkbox
                                                    id={`day-${day.value}`}
                                                    checked={!!active}
                                                    onCheckedChange={() => toggleDay(day.value)}
                                                    className="data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600"
                                                />
                                                <label htmlFor={`day-${day.value}`} className="font-semibold text-sm w-24 cursor-pointer">
                                                    {day.label}
                                                </label>
                                            </div>

                                            {active ? (
                                                <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                                                    <Select value={active.start_time.slice(0, 5) + ":00"} onValueChange={(v) => updateTime(day.value, 'start_time', v)}>
                                                        <SelectTrigger className="w-32 h-9 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <span className="text-zinc-400 font-light text-sm">to</span>
                                                    <Select value={active.end_time.slice(0, 5) + ":00"} onValueChange={(v) => updateTime(day.value, 'end_time', v)}>
                                                        <SelectTrigger className="w-32 h-9 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {HOURS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest px-4 py-2 border rounded-md border-dashed">Unavailable</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 p-4 border-t text-xs text-muted-foreground flex gap-2">
                            <Info className="w-4 h-4 text-brand-500" />
                            These hours are strictly for <strong>{calendar.timezone}</strong>.
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* TAB: SYNC */}
                <TabsContent value="sync" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bi-directional Sync</CardTitle>
                            <CardDescription>Connect this calendar to an external account to keep bookings in sync.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label>Select Connected Account</Label>
                                <Select
                                    value={calendar.external_account_id || "none"}
                                    onValueChange={v => setCalendar({ ...calendar, external_account_id: v === "none" ? null : v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose an account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Not Connected</SelectItem>
                                        {integrations.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.provider === 'google' ? 'Google' : 'Outlook'}: {acc.provider_account_id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {integrations.length === 0 && (
                                    <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        No accounts connected. <Link href="/dashboard/settings/integrations" className="underline font-bold">Manage Integrations</Link>
                                    </p>
                                )}
                            </div>

                            {calendar.external_account_id && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Sync Direction</Label>
                                        <Select
                                            value={calendar.sync_direction || "off"}
                                            onValueChange={v => setCalendar({ ...calendar, sync_direction: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="off">Off</SelectItem>
                                                <SelectItem value="one_way">One-way (GAL {"->"} External)</SelectItem>
                                                <SelectItem value="bi_directional">Bi-directional (GAL {"<->"} External)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Bi-directional sync will block slots in GAL if you are busy in your external calendar.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Target Calendar ID</Label>
                                        <Input
                                            value={calendar.external_calendar_id || "primary"}
                                            onChange={e => setCalendar({ ...calendar, external_calendar_id: e.target.value })}
                                            placeholder="primary"
                                        />
                                        <p className="text-xs text-muted-foreground">Use 'primary' for your default calendar.</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
