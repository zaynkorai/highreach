"use client";

import { Menu } from "lucide-react";
import { useUIActions } from "@/stores/ui-store";
import Link from "next/link";
import Image from "next/image";

export function MobileHeader() {
    const { setSidebarOpen } = useUIActions();

    return (
        <header className="lg:hidden h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between px-4 sticky top-0 z-30">
            <Link href="/dashboard" className="flex items-center gap-2 group/logo">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm shadow-primary/20 bg-background flex items-center justify-center p-0.5 border border-border">
                    <Image src="/icon.svg" alt="HighReach Logo" width={24} height={24} className="group-hover/logo:scale-110 transition-transform object-contain" />
                </div>
                <span className="text-base font-semibold text-foreground tracking-tight">
                    HighReach
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
