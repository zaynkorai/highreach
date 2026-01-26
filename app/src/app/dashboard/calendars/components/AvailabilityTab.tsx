import { Clock } from "lucide-react";

export default function AvailabilityTab() {
    return (
        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 opacity-60">
            <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm mb-6">
                <Clock className="w-10 h-10 text-zinc-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-500">Availability Schedules</h3>
            <p className="text-muted-foreground max-w-sm text-center mt-2">
                Global availability settings and holiday overrides will go here.
            </p>
        </div>
    );
}
