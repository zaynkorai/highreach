"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getGoogleBusinessLocations, setGoogleLocation, syncReviews } from "../actions";
import { toast } from "sonner";
import { RefreshCcw, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { useReputationActions } from "@/stores/reputation-store";

export function GoogleReputationConfig() {
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const { fetchReviews } = useReputationActions();

    useEffect(() => {
        const fetch = async () => {
            const res = await getGoogleBusinessLocations();
            if (res.success && res.locations) {
                setLocations(res.locations);
            }
            setIsLoading(false);
        };
        fetch();
    }, []);

    const handleSetLocation = async (locationId: string) => {
        const location = locations.find(l => l.name === locationId);
        if (!location) return;

        const res = await setGoogleLocation(location.name, location.title);
        if (res.success) {
            toast.success(`Location set to ${location.title}`);
            setSelectedLocation(location.name);
        } else {
            toast.error(res.error || "Failed to set location");
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        const res = await syncReviews();
        if (res.success) {
            toast.success(`Sync complete! ${res.count} reviews found.`);
            await fetchReviews();
        } else {
            toast.error(res.error || "Sync failed");
        }
        setIsSyncing(false);
    };

    if (isLoading) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-foreground tracking-tight">Google Business Profile</h3>
                    <p className="text-xs text-zinc-500 font-medium">Connect your location to sync reviews live.</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {locations.length > 0 ? (
                    <Select value={selectedLocation} onValueChange={handleSetLocation}>
                        <SelectTrigger className="w-full md:w-[240px] h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/[0.08] text-xs font-medium rounded-xl">
                            <SelectValue placeholder="Select a location..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-200 dark:border-white/[0.08]">
                            {locations.map((loc) => (
                                <SelectItem key={loc.name} value={loc.name} className="text-xs">
                                    {loc.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" />
                        No Locations Found
                    </div>
                )}

                <Button
                    variant="outline"
                    disabled={isSyncing}
                    onClick={handleSync}
                    className="h-10 px-4 border-zinc-200 dark:border-white/[0.08] dark:bg-zinc-950 rounded-xl text-xs font-bold gap-2 hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
                >
                    <RefreshCcw className={isSyncing ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
                    {isSyncing ? "Syncing..." : "Sync Now"}
                </Button>
            </div>
        </div>
    );
}
