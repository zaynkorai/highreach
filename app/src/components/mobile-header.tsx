"use client";

import { Menu } from "lucide-react";
import { useUIActions } from "@/stores/ui-store";
import Link from "next/link";

export function MobileHeader() {
    const { setSidebarOpen } = useUIActions();

    return (
        <header className="lg:hidden h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between px-4 sticky top-0 z-30">
            <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-500/20">
                    <span className="text-white font-bold text-xs">G</span>
                </div>
                <span className="text-base font-semibold text-foreground">
                    GHL<span className="text-indigo-500">Lite</span>
                </span>
            </Link>

            <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Open menu"
            >
                <Menu className="w-6 h-6" />
            </button>
        </header>
    );
}
