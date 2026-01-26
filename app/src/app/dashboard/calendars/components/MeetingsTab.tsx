"use client";

import { useState, useEffect } from "react";
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Plus, User, Loader2, Globe, Mail, Phone, Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Card, CardContent // Verify Card usage for Meeting Grid
} from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Sheet, SheetContent, SheetHeader,
    SheetTitle, SheetDescription, SheetFooter
} from "@/components/ui/sheet";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, format, isSameMonth, isSameDay, subMonths
} from "date-fns";
import { cn } from "@/lib/utils";
import { getAppointments, getCalendars, createManualAppointment, cancelAppointment } from "../actions";

export default function MeetingsTab() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<any[]>([]);
    const [calendars, setCalendars] = useState<any[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

    // Manual Appointment
    const [isApptOpen, setIsApptOpen] = useState(false);
    const [newAppt, setNewAppt] = useState({
        calendar_id: "",
        name: "",
        email: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
        duration: "30"
    });
    const [isBooking, setIsBooking] = useState(false);

    // View Appointment
    const [selectedAppt, setSelectedAppt] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const fetchCalendars = async () => {
        const data = await getCalendars();
        setCalendars(data);
        if (data.length > 0 && !newAppt.calendar_id) {
            setNewAppt(prev => ({ ...prev, calendar_id: data[0].id }));
        }
    };

    const fetchAppointments = async () => {
        setIsLoadingAppointments(true);
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();
        const data = await getAppointments(start, end);
        setAppointments(data || []);
        setIsLoadingAppointments(false);
    };

    useEffect(() => {
        fetchCalendars();
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [currentDate]);

    const handleCreateAppointment = async () => {
        setIsBooking(true);
        // Combine date + time
        const start = new Date(`${newAppt.date}T${newAppt.time}`);
        const end = new Date(start.getTime() + 30 * 60000); // hardcoded 30m for manual entry MVP

        const payload = {
            calendar_id: newAppt.calendar_id,
            name: newAppt.name,
            email: newAppt.email,
            start_time: start.toISOString(),
            end_time: end.toISOString()
        };

        const res = await createManualAppointment(payload);

        if (res.success) {
            toast.success("Appointment scheduled");
            setIsApptOpen(false);
            fetchAppointments();
        } else {
            toast.error((res as any).error || "Failed to schedule");
        }
        setIsBooking(false);
    };

    const handleCancelAppt = async () => {
        if (!selectedAppt) return;
        const res = await cancelAppointment(selectedAppt.id);
        if (res.success) {
            toast.success("Appointment cancelled");
            setIsSheetOpen(false);
            fetchAppointments();
        } else {
            toast.error((res as any).error || "Failed to cancel");
        }
    };

    // Calendar Grid Calculation
    const calendarDays = (() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    })();

    return (
        <>
            <Card className="shadow-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-4 flex items-center justify-between border-b dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => subMonths(prev, 1))}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <h2 className="text-lg font-bold min-w-32 text-center">
                            {format(currentDate, "MMMM yyyy")}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prev => addMonths(prev, 1))}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>

                        <Dialog open={isApptOpen} onOpenChange={setIsApptOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                                    <Plus className="w-4 h-4 mr-1.5" /> Appointment
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>New Appointment</DialogTitle>
                                    <DialogDescription>Manually schedule an appointment.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Date</label>
                                            <Input
                                                type="date"
                                                value={newAppt.date}
                                                onChange={e => setNewAppt({ ...newAppt, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Time</label>
                                            <Input
                                                type="time"
                                                value={newAppt.time}
                                                onChange={e => setNewAppt({ ...newAppt, time: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Calendar / Type</label>
                                        <Select
                                            value={newAppt.calendar_id}
                                            onValueChange={val => setNewAppt({ ...newAppt, calendar_id: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select calendar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {calendars.map(cal => (
                                                    <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Contact Name</label>
                                        <Input
                                            placeholder="John Doe"
                                            value={newAppt.name}
                                            onChange={e => setNewAppt({ ...newAppt, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Contact Email</label>
                                        <Input
                                            type="email"
                                            placeholder="john@example.com"
                                            value={newAppt.email}
                                            onChange={e => setNewAppt({ ...newAppt, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsApptOpen(false)}>Cancel</Button>
                                    <Button className="bg-indigo-600" onClick={handleCreateAppointment} disabled={isBooking}>
                                        {isBooking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Schedule
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center text-xs font-bold uppercase text-muted-foreground tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 divide-x dark:divide-zinc-800 divide-y dark:divide-zinc-800">
                    {calendarDays.map((date, idx) => {
                        const isCurrentMonth = isSameMonth(date, currentDate);
                        const isToday = isSameDay(date, new Date());
                        const dayAppts = appointments.filter(a => isSameDay(new Date(a.start_time), date));

                        return (
                            <div key={date.toISOString()} className={cn(
                                "min-h-[120px] p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]",
                                !isCurrentMonth && "bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-400"
                            )}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={cn(
                                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                        isToday ? "bg-indigo-600 text-white" : "text-muted-foreground"
                                    )}>
                                        {format(date, "d")}
                                    </span>
                                    {dayAppts.length > 0 && (
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                            {dayAppts.length}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-1.5 overflow-y-auto max-h-[85px] custom-scrollbar">
                                    {dayAppts.map(appt => (
                                        <div
                                            key={appt.id}
                                            onClick={() => { setSelectedAppt(appt); setIsSheetOpen(true); }}
                                            className={cn(
                                                "text-[10px] p-1.5 rounded-md border shadow-sm truncate cursor-pointer hover:scale-[1.02] transition-all group",
                                                appt.status === 'cancelled'
                                                    ? "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 opacity-60 line-through"
                                                    : "bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800"
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-200">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    appt.status === 'cancelled' ? "bg-red-500" : "bg-indigo-500"
                                                )} />
                                                {format(new Date(appt.start_time), "h:mm a")}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5 text-zinc-500 dark:text-zinc-400 pl-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                <User className="w-3 h-3" />
                                                <span className="truncate">{appt.contact?.first_name || "Guest"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Appointment Details Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            Appointment Details
                            {selectedAppt?.status && (
                                <Badge variant={selectedAppt.status === 'cancelled' ? 'destructive' : 'outline'} className="uppercase text-[10px]">
                                    {selectedAppt.status}
                                </Badge>
                            )}
                        </SheetTitle>
                        <SheetDescription>
                            View and manage this booking.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedAppt && (
                        <div className="space-y-6 py-6">
                            {/* Time Card */}
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                        <CalendarIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {format(new Date(selectedAppt.start_time), "EEEE, MMMM do")}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(selectedAppt.start_time), "h:mm a")} - {format(new Date(selectedAppt.end_time), "h:mm a")}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-px bg-zinc-200 dark:bg-zinc-700/50" />
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>Timezone: {selectedAppt.calendar?.timezone || "UTC"}</span>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Contact</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{selectedAppt.contact?.first_name || "Unknown"}</p>
                                            <p className="text-xs text-muted-foreground">Lead</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                        <Mail className="w-4 h-4 text-zinc-400" />
                                        {selectedAppt.contact?.email || "No email"}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                        <Phone className="w-4 h-4 text-zinc-400" />
                                        {selectedAppt.contact?.phone || "No phone"}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedAppt.notes && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Notes</h4>
                                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 text-sm border border-yellow-100 dark:border-yellow-900/20">
                                        {selectedAppt.notes}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <SheetFooter className="gap-2 sm:justify-start flex-col sm:flex-row">
                        {selectedAppt?.status !== 'cancelled' && (
                            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleCancelAppt}>
                                <Ban className="w-4 h-4 mr-2" /> Cancel Booking
                            </Button>
                        )}
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsSheetOpen(false)}>
                            Close
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
