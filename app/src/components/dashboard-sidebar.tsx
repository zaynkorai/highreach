"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { useIsSidebarOpen, useUIActions } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Inbox,
    Users,
    Folders,
    FileText,
    Zap,
    Calendar,
    Star,
    Settings,
    X,
    Menu
} from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/inbox", icon: Inbox, label: "Inbox" },
    { href: "/dashboard/contacts", icon: Users, label: "Contacts" },
    { href: "/dashboard/pipelines", icon: Folders, label: "Pipelines" },
    { href: "/dashboard/forms", icon: FileText, label: "Forms" },
    { href: "/dashboard/automations", icon: Zap, label: "Automations" },
    { href: "/dashboard/calendars", icon: Calendar, label: "Calendars" },
    { href: "/dashboard/reputation", icon: Star, label: "Reputation" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function DashboardSidebar() {
    const pathname = usePathname();
    const isOpen = useIsSidebarOpen();
    const { setSidebarOpen } = useUIActions();

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                "fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-white/[0.08] flex flex-col z-50 transition-transform duration-300 transform lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Section */}
                <div className="p-4 border-b border-zinc-100 dark:border-white/[0.08] flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-500/20">
                            <span className="text-white font-bold text-sm">G</span>
                        </div>
                        <span className="text-lg font-semibold text-foreground">
                            GHL<span className="text-indigo-500">Lite</span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 lg:hidden text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Body */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                                )}
                            >
                                <Icon className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                                )} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Controls */}
                <div className="p-3 border-t border-zinc-100 dark:border-white/[0.08] space-y-1 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
                        <ThemeToggle />
                        <span>Theme Preference</span>
                    </div>
                    <LogoutButton />
                </div>
            </aside>
        </>
    );
}
