"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Columns3, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function PipelineTabs() {
    const pathname = usePathname();
    const isContacts = pathname.startsWith("/dashboard/pipelines/contacts");
    const isBoard = !isContacts && (pathname === "/dashboard/pipelines" || pathname === "/dashboard/pipelines/");

    return (
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] w-fit">
            <Link
                href="/dashboard/pipelines"
                className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                    isBoard
                        ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-white/[0.08]"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
                )}
            >
                <Columns3 className={cn("w-3.5 h-3.5", isBoard ? "text-primary" : "text-zinc-400")} />
                <span>Board</span>
            </Link>

            <Link
                href="/dashboard/pipelines/contacts"
                className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                    isContacts
                        ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-white/[0.08]"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
                )}
            >
                <Users className={cn("w-3.5 h-3.5", isContacts ? "text-primary" : "text-zinc-400")} />
                <span>Contacts</span>
            </Link>
        </div>
    );
}
