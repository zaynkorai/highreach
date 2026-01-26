"use client";

import { useState, useEffect } from "react";
import { format, addMinutes, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { createBooking, getAvailableSlots } from "../actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Clock, Globe, Loader2, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BookingWidget({ calendar }: { calendar: any }) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [slots, setSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [step, setStep] = useState<"date-time" | "form" | "success">("date-time");

    const [formData, setFormData] = useState({ name: "", email: "", phone: "", notes: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch slots when date changes
    useEffect(() => {
        if (!date) return;

        const fetchSlots = async () => {
            setIsLoadingSlots(true);
            setSlots([]); // clear previous
            setSelectedSlot(null); // clear selection
            try {
                const dateStr = format(date, "yyyy-MM-dd");
                const res = await getAvailableSlots(calendar.id, dateStr, Intl.DateTimeFormat().resolvedOptions().timeZone);
                setSlots(res);
            } catch (e) {
                toast.error("Failed to load availability");
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [date, calendar.id]);

    const handleSlotClick = (slot: string) => {
        setSelectedSlot(slot);
        setStep("form");
    };

    const handleSubmit = async () => {
        if (!selectedSlot || !formData.name || !formData.email) {
            toast.error("Please fill in required fields");
            return;
        }

        setIsSubmitting(true);
        const startTime = selectedSlot;
        const endTime = addMinutes(new Date(startTime), calendar.duration_minutes).toISOString();

        const payload = {
            tenant_id: calendar.tenant_id,
            ...formData,
            start_time: startTime,
            end_time: endTime,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        try {
            const res = await createBooking(calendar.id, payload);
            if (res.success) {
                setStep("success");
            } else {
                toast.error(res.error || "Booking failed");
            }
        } catch (e) {
            toast.error("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === "success") {
        return (
            <Card className="w-full max-w-lg shadow-2xl border-0 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="bg-green-500 h-2 w-full" />
                <CardContent className="pt-10 pb-10 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
                        <p className="text-muted-foreground mt-2">
                            You are scheduled with us on <br />
                            <strong className="text-foreground">{format(new Date(selectedSlot!), "EEEE, MMMM do, yyyy 'at' h:mm a")}</strong>.
                        </p>
                    </div>
                    <div className="pt-4">
                        <p className="text-sm text-muted-foreground">A calendar invitation has been sent to your email.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-5xl h-[600px] shadow-2xl border-0 bg-white dark:bg-zinc-900 flex overflow-hidden rounded-2xl">
            {/* Sidebar / Info Panel */}
            <div className="w-1/3 bg-zinc-50 dark:bg-zinc-950/50 p-8 border-r border-zinc-100 dark:border-zinc-800 flex flex-col justify-between hidden md:flex">
                <div className="space-y-6">
                    {/* Logo or Avatar could go here */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">Scheduling with</p>
                        <h1 className="text-2xl font-bold">{calendar.name}</h1>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            <Clock className="w-5 h-5" />
                            {calendar.duration_minutes} min
                        </div>
                        {selectedSlot && (
                            <div className="flex items-center gap-3 text-sm font-medium text-green-600 dark:text-green-500 animate-in fade-in slide-in-from-left-2">
                                <CalendarIcon className="w-5 h-5" />
                                {format(new Date(selectedSlot), "EEEE, MMMM do, yyyy")}
                            </div>
                        )}
                        {selectedSlot && (
                            <div className="flex items-center gap-3 text-sm font-medium text-green-600 dark:text-green-500 animate-in fade-in slide-in-from-left-2 delay-75">
                                <Globe className="w-5 h-5" />
                                {format(new Date(selectedSlot), "h:mm a")}
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {calendar.description}
                    </p>
                </div>

                <div className="text-xs text-muted-foreground">
                    Cookie & Privacy Policy
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative">
                {step === "date-time" ? (
                    <div className="flex-1 flex overflow-hidden">
                        {/* Date Picker Column */}
                        <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center border-r border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-lg font-semibold mb-6">Select a Date</h3>
                            <div className="calendar-wrapper">
                                <DayPicker
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={[{ before: new Date() }]}
                                    className="p-3 border rounded-xl bg-white dark:bg-zinc-950 shadow-sm"
                                    modifiersClassNames={{
                                        selected: "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white rounded-md",
                                        today: "font-bold text-indigo-600"
                                    }}
                                />
                            </div>
                        </div>

                        {/* Slots Column */}
                        <div className="w-[280px] p-6 overflow-y-auto bg-white dark:bg-zinc-900 border-l border-zinc-50 dark:border-zinc-800/50">
                            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                                {date ? format(date, "EEEE, MMM do") : "Select Date"}
                            </h3>

                            {isLoadingSlots ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                </div>
                            ) : slots.length > 0 ? (
                                <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {slots.map(slot => (
                                        <Button
                                            key={slot}
                                            variant="outline"
                                            className="w-full justify-center font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-600 hover:text-indigo-700 transition-all"
                                            onClick={() => handleSlotClick(slot)}
                                        >
                                            {format(new Date(slot), "h:mm a")}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-sm text-muted-foreground py-10">
                                    No availability on this day.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-indigo-600" onClick={() => setStep("date-time")}>
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Calendar
                        </Button>

                        <div className="max-w-md mx-auto space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">Enter Details</h2>
                                <p className="text-muted-foreground">Tell us a bit about yourself.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name *</label>
                                    <Input placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address *</label>
                                    <Input placeholder="john@example.com" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone Number (Optional)</label>
                                    <Input placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Additional Notes</label>
                                    <Textarea placeholder="Please share anything that will help prepare for our meeting." className="min-h-[100px]" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                            </div>

                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base font-semibold" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {isSubmitting ? "Booking..." : "Schedule Event"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
