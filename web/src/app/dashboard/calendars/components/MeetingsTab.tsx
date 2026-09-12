"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Plus, User, Loader2, Globe, Mail, Phone, Ban, Check, CheckCircle2, AlertCircle, RefreshCw, Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Card
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
    eachDayOfInterval, format, isSameMonth, isSameDay, subMonths, addMinutes
} from "date-fns";
import { cn } from "@/lib/utils";
import {
    getAppointments,
    getCalendars,
    createManualAppointment,
    cancelAppointment,
    updateAppointmentStatus,
    rescheduleAppointment,
    updateAppointmentDetails
} from "../actions";
import type { CalendarService } from "@/lib/services/calendar.service";
import type { AppointmentStatus } from "@/types/calendar";

type AppointmentItem = Awaited<ReturnType<typeof CalendarService.getAppointments>>[number];
type CalendarItem = Awaited<ReturnType<typeof CalendarService.getCalendars>>[number];

export default function MeetingsTab() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
    const [calendars, setCalendars] = useState<CalendarItem[]>([]);

    // Manual Appointment
    const [isApptOpen, setIsApptOpen] = useState(false);
    const [newAppt, setNewAppt] = useState({
        calendar_id: "",
        name: "",
        email: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
        duration: "30",
        notes: "",
    });
    const [isBooking, setIsBooking] = useState(false);

    // View Appointment Sheet
    const [selectedAppt, setSelectedAppt] = useState<AppointmentItem | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Reschedule State
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [rescheduleData, setRescheduleData] = useState({
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
    });
    const [isRescheduling, setIsRescheduling] = useState(false);

    // Edit details state
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editNotes, setEditNotes] = useState("");
    const [editLocation, setEditLocation] = useState("");

    const fetchAppointments = useCallback(async () => {
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();
        const res = await getAppointments(start, end);
        setAppointments(res.success ? res.data : []);
    }, [currentDate]);

    useEffect(() => {
        let isMounted = true;
        getCalendars().then((res) => {
            if (!isMounted) return;
            if (res.success) {
                setCalendars(res.data);
                if (res.data.length > 0) {
                    setNewAppt((prev) => (prev.calendar_id ? prev : { ...prev, calendar_id: res.data[0].id }));
                }
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();
        getAppointments(start, end).then((res) => {
            if (!isMounted) return;
            setAppointments(res.success ? res.data : []);
        });
        return () => {
            isMounted = false;
        };
    }, [currentDate]);

    const handleCreateAppointment = async () => {
        if (!newAppt.calendar_id || !newAppt.name || !newAppt.email) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsBooking(true);
        const selectedCal = calendars.find((c) => c.id === newAppt.calendar_id);
        const durationMin = parseInt(newAppt.duration) || selectedCal?.duration_minutes || 30;

        const start = new Date(`${newAppt.date}T${newAppt.time}`);
        const end = new Date(start.getTime() + durationMin * 60000);

        const payload = {
            calendar_id: newAppt.calendar_id,
            name: newAppt.name,
            email: newAppt.email,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            duration_minutes: durationMin,
            notes: newAppt.notes,
        };

        const res = await createManualAppointment(payload);

        if (res.success) {
            toast.success("Appointment scheduled");
            setIsApptOpen(false);
            setNewAppt({
                calendar_id: calendars[0]?.id || "",
                name: "",
                email: "",
                date: format(new Date(), "yyyy-MM-dd"),
                time: "09:00",
                duration: "30",
                notes: "",
            });
            fetchAppointments();
        } else {
            toast.error(res.error || "Failed to schedule");
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
            toast.error(res.error || "Failed to cancel");
        }
    };

    const handleStatusChange = async (newStatus: AppointmentStatus) => {
        if (!selectedAppt) return;
        const res = await updateAppointmentStatus(selectedAppt.id, newStatus);
        if (res.success) {
            toast.success(`Status updated to ${newStatus}`);
            setSelectedAppt({ ...selectedAppt, status: newStatus });
            fetchAppointments();
        } else {
            toast.error(res.error || "Failed to update status");
        }
    };

    const handleReschedule = async () => {
        if (!selectedAppt) return;
        setIsRescheduling(true);

        const currentStart = new Date(selectedAppt.start_time);
        const currentEnd = new Date(selectedAppt.end_time);
        const durationMs = currentEnd.getTime() - currentStart.getTime();

        const newStart = new Date(`${rescheduleData.date}T${rescheduleData.time}`);
        const newEnd = new Date(newStart.getTime() + durationMs);

        const res = await rescheduleAppointment(selectedAppt.id, newStart.toISOString(), newEnd.toISOString());

        if (res.success) {
            toast.success("Appointment rescheduled");
            setIsRescheduleOpen(false);
            setSelectedAppt({
                ...selectedAppt,
                start_time: newStart.toISOString(),
                end_time: newEnd.toISOString(),
                status: "rescheduled",
            });
            fetchAppointments();
        } else {
            toast.error(res.error || "Failed to reschedule");
        }
        setIsRescheduling(false);
    };

    const handleSaveDetails = async () => {
        if (!selectedAppt) return;
        const res = await updateAppointmentDetails(selectedAppt.id, {
            notes: editNotes,
            location: editLocation,
        });

        if (res.success) {
            toast.success("Details updated");
            setSelectedAppt({
                ...selectedAppt,
                notes: editNotes,
                location: editLocation,
            });
            setIsEditingDetails(false);
            fetchAppointments();
        } else {
            toast.error(res.error || "Failed to update details");
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

    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none uppercase text-[10px]">Completed</Badge>;
            case "cancelled":
                return <Badge variant="destructive" className="uppercase text-[10px]">Cancelled</Badge>;
            case "rescheduled":
                return <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-none uppercase text-[10px]">Rescheduled</Badge>;
            case "no_show":
                return <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-none uppercase text-[10px]">No-Show</Badge>;
            default:
                return <Badge className="bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border-none uppercase text-[10px]">Confirmed</Badge>;
        }
    };

    return (
        <>
            <Card className="shadow-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-4 flex items-center justify-between border-b dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate((prev) => subMonths(prev, 1))}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <h2 className="text-lg font-bold min-w-32 text-center">
                            {format(currentDate, "MMMM yyyy")}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate((prev) => addMonths(prev, 1))}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                            Today
                        </Button>

                        <Dialog open={isApptOpen} onOpenChange={setIsApptOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-brand-600 hover:bg-brand-700 shadow-sm">
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
                                                onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Time</label>
                                            <Input
                                                type="time"
                                                value={newAppt.time}
                                                onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Calendar / Type</label>
                                            <Select
                                                value={newAppt.calendar_id}
                                                onValueChange={(val) => setNewAppt({ ...newAppt, calendar_id: val })}
                                            >
                                                <SelectTrigger>
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
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Duration</label>
                                            <Select
                                                value={newAppt.duration}
                                                onValueChange={(val) => setNewAppt({ ...newAppt, duration: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="15">15 mins</SelectItem>
                                                    <SelectItem value="30">30 mins</SelectItem>
                                                    <SelectItem value="45">45 mins</SelectItem>
                                                    <SelectItem value="60">60 mins</SelectItem>
                                                    <SelectItem value="90">90 mins</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Contact Name</label>
                                        <Input
                                            placeholder="John Doe"
                                            value={newAppt.name}
                                            onChange={(e) => setNewAppt({ ...newAppt, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Contact Email</label>
                                        <Input
                                            type="email"
                                            placeholder="john@example.com"
                                            value={newAppt.email}
                                            onChange={(e) => setNewAppt({ ...newAppt, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Notes (Optional)</label>
                                        <Input
                                            placeholder="Meeting context or instructions"
                                            value={newAppt.notes}
                                            onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsApptOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button className="bg-brand-600" onClick={handleCreateAppointment} disabled={isBooking}>
                                        {isBooking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Schedule
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="p-2 text-center text-xs font-bold uppercase text-muted-foreground tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 divide-x dark:divide-zinc-800 divide-y dark:divide-zinc-800">
                    {calendarDays.map((date) => {
                        const isCurrentMonth = isSameMonth(date, currentDate);
                        const isToday = isSameDay(date, new Date());
                        const dayAppts = appointments.filter((a) => isSameDay(new Date(a.start_time), date));

                        return (
                            <div
                                key={date.toISOString()}
                                className={cn(
                                    "min-h-[120px] p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02]",
                                    !isCurrentMonth && "bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-400"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span
                                        className={cn(
                                            "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                            isToday ? "bg-brand-600 text-white" : "text-muted-foreground"
                                        )}
                                    >
                                        {format(date, "d")}
                                    </span>
                                    {dayAppts.length > 0 && (
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                            {dayAppts.length}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-1.5 overflow-y-auto max-h-[85px] custom-scrollbar">
                                    {dayAppts.map((appt) => (
                                        <div
                                            key={appt.id}
                                            onClick={() => {
                                                setSelectedAppt(appt);
                                                setEditNotes(appt.notes || "");
                                                setEditLocation(appt.location || "");
                                                setIsEditingDetails(false);
                                                setIsSheetOpen(true);
                                            }}
                                            className={cn(
                                                "text-[10px] p-1.5 rounded-md border shadow-sm truncate cursor-pointer hover:scale-[1.02] transition-all group",
                                                appt.status === "cancelled"
                                                    ? "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 opacity-60 line-through"
                                                    : appt.status === "completed"
                                                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300"
                                                    : "bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800"
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-200">
                                                <div
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        appt.status === "cancelled"
                                                            ? "bg-red-500"
                                                            : appt.status === "completed"
                                                            ? "bg-emerald-500"
                                                            : "bg-brand-500"
                                                    )}
                                                />
                                                {format(new Date(appt.start_time), "h:mm a")}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5 text-zinc-500 dark:text-zinc-400 pl-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
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
                <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                        <div className="flex items-center justify-between pr-6">
                            <SheetTitle className="flex items-center gap-2">
                                Booking Details
                            </SheetTitle>
                            {selectedAppt && getStatusBadge(selectedAppt.status)}
                        </div>
                        <SheetDescription>
                            Manage lifecycle, reschedule, or update details.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedAppt && (
                        <div className="space-y-6 py-6">
                            {/* Time Card */}
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-lg">
                                            <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {format(new Date(selectedAppt.start_time), "EEEE, MMMM do, yyyy")}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(selectedAppt.start_time), "h:mm a")} - {format(new Date(selectedAppt.end_time), "h:mm a")}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedAppt.status !== "cancelled" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs gap-1"
                                            onClick={() => {
                                                const d = new Date(selectedAppt.start_time);
                                                setRescheduleData({
                                                    date: format(d, "yyyy-MM-dd"),
                                                    time: format(d, "HH:mm"),
                                                });
                                                setIsRescheduleOpen(true);
                                            }}
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                                        </Button>
                                    )}
                                </div>
                                <div className="h-px bg-zinc-200 dark:bg-zinc-700/50" />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5" /> Timezone: {selectedAppt.calendar?.timezone || "UTC"}
                                    </span>
                                    <span>Type: {selectedAppt.calendar?.name}</span>
                                </div>
                            </div>

                            {/* Status Quick Actions */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Status
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant={selectedAppt.status === "completed" ? "default" : "outline"}
                                        size="sm"
                                        className="h-8 text-xs gap-1.5"
                                        onClick={() => handleStatusChange("completed")}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                                    </Button>
                                    <Button
                                        variant={selectedAppt.status === "no_show" ? "default" : "outline"}
                                        size="sm"
                                        className="h-8 text-xs gap-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400"
                                        onClick={() => handleStatusChange("no_show")}
                                    >
                                        <AlertCircle className="w-3.5 h-3.5" /> Mark No-Show
                                    </Button>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Contact
                                </h4>
                                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {selectedAppt.contact?.first_name} {selectedAppt.contact?.last_name || ""}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Attendee</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                                        {selectedAppt.contact?.email || "No email"}
                                    </div>
                                    {selectedAppt.contact?.phone && (
                                        <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                                            <Phone className="w-3.5 h-3.5 text-zinc-400" />
                                            {selectedAppt.contact.phone}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Location & Notes */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Location & Notes
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs gap-1"
                                        onClick={() => setIsEditingDetails(!isEditingDetails)}
                                    >
                                        <Edit3 className="w-3 h-3" /> {isEditingDetails ? "Cancel" : "Edit"}
                                    </Button>
                                </div>

                                {isEditingDetails ? (
                                    <div className="space-y-3 p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium">Location</label>
                                            <Input
                                                value={editLocation}
                                                onChange={(e) => setEditLocation(e.target.value)}
                                                placeholder="Zoom, Google Meet, or address"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium">Notes</label>
                                            <Textarea
                                                value={editNotes}
                                                onChange={(e) => setEditNotes(e.target.value)}
                                                placeholder="Notes or prep info"
                                                className="min-h-[70px]"
                                            />
                                        </div>
                                        <Button size="sm" className="w-full bg-brand-600" onClick={handleSaveDetails}>
                                            Save Details
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-xs">
                                        <div className="p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50">
                                            <span className="font-semibold">Location:</span> {selectedAppt.location || "Not specified"}
                                        </div>
                                        {selectedAppt.notes && (
                                            <div className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 text-yellow-900 dark:text-yellow-200">
                                                <span className="font-semibold">Notes:</span> {selectedAppt.notes}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <SheetFooter className="gap-2 sm:justify-start flex-col sm:flex-row border-t pt-4">
                        {selectedAppt?.status !== "cancelled" && (
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

            {/* Reschedule Dialog */}
            <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reschedule Appointment</DialogTitle>
                        <DialogDescription>
                            Pick a new date and time for this booking.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Date</label>
                            <Input
                                type="date"
                                value={rescheduleData.date}
                                onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Time</label>
                            <Input
                                type="time"
                                value={rescheduleData.time}
                                onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-brand-600 hover:bg-brand-700"
                            onClick={handleReschedule}
                            disabled={isRescheduling}
                        >
                            {isRescheduling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm Reschedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
