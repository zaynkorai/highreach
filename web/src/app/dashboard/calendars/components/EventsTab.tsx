"use client";

import { useState, useEffect } from "react";
import {
    Calendar as CalendarIcon, MoreHorizontal, ExternalLink,
    Settings, Trash2, Clock, Globe, Plus, Video, Phone, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NextLink from "next/link";
import { toast } from "sonner";
import {
    Card, CardContent, CardDescription,
    CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Sheet, SheetContent, SheetHeader,
    SheetTitle, SheetDescription, SheetFooter,
    SheetTrigger
} from "@/components/ui/sheet";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCalendars, createCalendar, deleteCalendar } from "../actions";

export default function EventsTab() {
    const [calendars, setCalendars] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newCalendar, setNewCalendar] = useState({
        name: "",
        slug: "",
        duration: "30",
        location: "zoom"
    });

    // Delete State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [calendarToDelete, setCalendarToDelete] = useState<string | null>(null);

    const fetchCalendars = async () => {
        setIsLoading(true);
        const data = await getCalendars();
        setCalendars(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCalendars();
    }, []);

    const handleCreate = async () => {
        if (!newCalendar.name || !newCalendar.slug) {
            toast.error("Please fill in all fields");
            return;
        }

        const payload = {
            name: newCalendar.name,
            slug: newCalendar.slug,
            duration: parseInt(newCalendar.duration),
            location: newCalendar.location
        };

        const res = await createCalendar(payload);

        if (res.success) {
            toast.success("Event type created!");
            setIsCreateOpen(false);
            setNewCalendar({ name: "", slug: "", duration: "30", location: "zoom" });
            fetchCalendars();
        } else {
            toast.error((res as any).error || "Failed to create");
        }
    };

    const confirmDelete = (id: string, e: Event) => {
        e.preventDefault();
        setCalendarToDelete(id);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!calendarToDelete) return;
        const res = await deleteCalendar(calendarToDelete);
        if (res.success) {
            toast.success("Calendar deleted");
            setCalendars(prev => prev.filter(c => c.id !== calendarToDelete));
        } else {
            toast.error((res as any).error || "Failed to delete");
        }
        setIsDeleteOpen(false);
        setCalendarToDelete(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div>
                    <h3 className="font-bold text-lg">Event Types</h3>
                    <p className="text-sm text-muted-foreground">Manage your booking links and availability rules.</p>
                </div>
                <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <SheetTrigger asChild>
                        <Button className="bg-brand-600 hover:bg-brand-700 shadow-md">
                            <Plus className="w-4 h-4 mr-2" /> New Event Type
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-none sm:w-[20%] min-w-[320px] p-0 gap-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Create Event Type</SheetTitle>
                            <SheetDescription>Configure a new meeting event type.</SheetDescription>
                        </SheetHeader>
                        <div className="p-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event type</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-brand-500 flex-shrink-0" />
                                <Input
                                    className="text-xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/50"
                                    placeholder="New Meeting"
                                    value={newCalendar.name}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setNewCalendar(prev => ({
                                            ...prev,
                                            name: val,
                                            slug: val.toLowerCase().replace(/[^a-z0-9]/g, '-')
                                        }));
                                    }}
                                />
                            </div>
                            <div className="ml-7 mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                /book/
                                <input
                                    value={newCalendar.slug}
                                    onChange={e => setNewCalendar(prev => ({ ...prev, slug: e.target.value }))}
                                    className="bg-transparent border-none outline-none text-muted-foreground w-full"
                                    placeholder="event-slug"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* Duration Section */}
                            <div className="p-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 space-y-4">
                                <label className="text-sm font-bold text-foreground flex items-center justify-between">
                                    Duration
                                </label>
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <Clock className="w-4 h-4" />
                                    <Select
                                        value={newCalendar.duration}
                                        onValueChange={(val) => setNewCalendar(prev => ({ ...prev, duration: val }))}
                                    >
                                        <SelectTrigger className="w-[120px] h-8 border-none shadow-none p-0 text-base font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 min</SelectItem>
                                            <SelectItem value="30">30 min</SelectItem>
                                            <SelectItem value="45">45 min</SelectItem>
                                            <SelectItem value="60">60 min</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Location Section */}
                            <div className="p-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 space-y-4">
                                <label className="text-sm font-bold text-foreground">Location</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'zoom', label: 'Zoom', icon: Video },
                                        { id: 'phone', label: 'Phone', icon: Phone },
                                        { id: 'in_person', label: 'In-person', icon: MapPin },
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setNewCalendar(prev => ({ ...prev, location: type.id }))}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200",
                                                newCalendar.location === type.id
                                                    ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-500"
                                                    : "border-zinc-200 dark:border-zinc-800 hover:border-brand-200 dark:hover:border-zinc-700"
                                            )}
                                        >
                                            <type.icon className={cn("w-5 h-5", newCalendar.location === type.id ? "text-brand-600 dark:text-brand-400" : "text-zinc-500")} />
                                            <span className="text-xs font-medium">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Availability (Static for creation) */}
                            <div className="p-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 space-y-2 opacity-60">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-foreground">Availability</label>
                                    <span className="text-xs text-muted-foreground">Default</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Mon-Fri, 9:00 AM - 5:00 PM</p>
                            </div>

                            {/* Host (Static) */}
                            <div className="p-6 bg-white dark:bg-zinc-900 space-y-4">
                                <label className="text-sm font-bold text-foreground">Host</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs ring-2 ring-white dark:ring-zinc-900">
                                        ME
                                    </div>
                                    <span className="text-sm font-medium">You</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <Button variant="ghost" size="sm" onClick={() => toast.info("Advanced options in Phase 4")}>More options</Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button className="bg-brand-600 hover:bg-brand-700 rounded-full px-6" onClick={handleCreate}>
                                    Create
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    ))}
                </div>
            ) : calendars.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm mb-6">
                        <CalendarIcon className="w-10 h-10 text-brand-500" />
                    </div>
                    <h3 className="text-xl font-bold">No event types yet</h3>
                    <p className="text-muted-foreground max-w-sm text-center mt-2">
                        Create your first event type to start accepting bookings.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => setIsCreateOpen(true)}>
                        Create Event Type
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {calendars.map((cal) => (
                        <Card key={cal.id} className="group hover:border-brand-500/50 hover:shadow-xl transition-all duration-300 shadow-sm overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-2.5 bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/20 dark:to-zinc-900 text-brand-600 rounded-xl border border-brand-100 dark:border-brand-500/10 shadow-sm">
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <NextLink href={`/dashboard/calendars/${cal.id}`} className="flex items-center gap-2">
                                                    <Settings className="w-4 h-4" /> Edit Settings
                                                </NextLink>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/book/${cal.slug}`);
                                                toast.success("Link copied!");
                                            }} className="gap-2">
                                                <ExternalLink className="w-4 h-4" /> Copy Link
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-500 gap-2" onSelect={(e) => confirmDelete(cal.id, e)}>
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="mt-4">{cal.name}</CardTitle>
                                <CardDescription className="line-clamp-1">{cal.description || "No description set"}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pb-4">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" /> {cal.duration_minutes}m
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5" /> {cal.timezone}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                        Active
                                    </Badge>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 h-10 px-4 flex justify-between items-center group/footer border-t">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">/book/{cal.slug}</span>
                                <Button variant="ghost" size="sm" className="h-7 text-brand-500 hover:text-brand-600 gap-1 text-[10px] uppercase font-bold p-0" asChild>
                                    <NextLink href={`/book/${cal.slug}`} target="_blank">
                                        Preview <ExternalLink className="w-3 h-3" />
                                    </NextLink>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this calendar and all of its associated appointments. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCalendarToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                            Delete Calendar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
