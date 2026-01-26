"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import EventsTab from "./components/EventsTab";
import MeetingsTab from "./components/MeetingsTab";
import AvailabilityTab from "./components/AvailabilityTab";
import CalendarSettingsDialog from "./components/CalendarSettingsDialog";

export default function CalendarsPage() {
    const [view, setView] = useState("scheduling"); // scheduling | meetings | availability
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
            <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-6 dark:border-zinc-800">
                <div className="flex flex-col gap-4 w-full md:w-auto">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Calendars</h1>
                        <p className="text-muted-foreground">Manage appointments and booking configurations.</p>
                    </div>

                    <Tabs value={view} onValueChange={setView} className="w-full md:w-auto mt-2">
                        <TabsList className="bg-transparent p-0 gap-6 justify-start h-auto">
                            <TabsTrigger
                                value="scheduling"
                                className="pl-0 pr-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none h-9 font-bold text-zinc-500 hover:text-indigo-600 transition-colors"
                            >
                                Scheduling
                            </TabsTrigger>
                            <TabsTrigger
                                value="meetings"
                                className="pl-0 pr-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none h-9 font-bold text-zinc-500 hover:text-indigo-600 transition-colors"
                            >
                                Meetings
                            </TabsTrigger>
                            <TabsTrigger
                                value="availability"
                                className="pl-0 pr-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 rounded-none h-9 font-bold text-zinc-500 hover:text-indigo-600 transition-colors"
                            >
                                Availability
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="self-start md:self-center">
                    <Button variant="outline" className="gap-2" onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="w-4 h-4" /> Calendar Settings
                    </Button>
                </div>
            </header>

            {view === "scheduling" && <EventsTab />}
            {view === "meetings" && <MeetingsTab />}
            {view === "availability" && <AvailabilityTab />}

            <CalendarSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </div>
    );
}
