"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
    Brain,
    Columns3,
    ChevronRight,
} from "lucide-react";

interface SubNavItem {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}

interface NavItem {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    subItems?: SubNavItem[];
}

interface NavGroup {
    title?: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        items: [
            { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
            { href: "/dashboard/inbox", icon: Inbox, label: "Inbox" },
            { href: "/dashboard/calendars", icon: Calendar, label: "Calendars" },
            {
                href: "/dashboard/pipelines",
                icon: Folders,
                label: "Pipelines",
                subItems: [
                    { href: "/dashboard/pipelines", icon: Columns3, label: "Board" },
                    { href: "/dashboard/pipelines/contacts", icon: Users, label: "Contacts" },
                ],
            },
        ],
    },
    {
        items: [
            { href: "/dashboard/forms", icon: FileText, label: "Forms" },
            { href: "/dashboard/reputation", icon: Star, label: "Reputation" },
        ],
    },
    {
        items: [
            { href: "/dashboard/automations", icon: Zap, label: "Automations" },
            { href: "/dashboard/knowledge", icon: Brain, label: "Knowledge Base" },
        ],
    },
];

interface NavItemRowProps {
    item: NavItem;
    pathname: string;
    onCloseSidebar: () => void;
}

function NavItemRow({ item, pathname, onCloseSidebar }: NavItemRowProps) {
    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
    const isParentActive = pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
        (item.href === "/dashboard/pipelines" && pathname.startsWith("/dashboard/contacts"));

    return (
        <div className="group/navitem relative">
            <Link
                href={item.href}
                onClick={onCloseSidebar}
                aria-current={isParentActive ? "page" : undefined}
                className={cn(
                    "group relative flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] transition-all duration-150 ease-out select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isParentActive
                        ? "bg-white dark:bg-zinc-900/90 text-zinc-950 dark:text-zinc-100 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_1px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_3px_rgba(0,0,0,0.4)] border border-zinc-200/80 dark:border-white/[0.08]"
                        : "text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-200/50 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent"
                )}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {/* Precision Ember Register Notch */}
                    <span
                        className={cn(
                            "absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ease-out",
                            isParentActive
                                ? "h-4 bg-primary shadow-[0_0_8px_rgba(217,72,38,0.55)] opacity-100 scale-100"
                                : "h-0 bg-transparent opacity-0 scale-50"
                        )}
                        aria-hidden="true"
                    />

                    {/* Naked Icon */}
                    <item.icon
                        className={cn(
                            "w-4.5 h-4.5 shrink-0 transition-colors duration-150 ml-1",
                            isParentActive
                                ? "text-primary"
                                : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                        )}
                    />

                    {/* Label */}
                    <span className="truncate tracking-[-0.01em]">{item.label}</span>
                </div>

                {hasSubItems && (
                    <ChevronRight
                        className={cn(
                            "w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-zinc-400 dark:text-zinc-500 group-hover/navitem:rotate-90 group-hover/navitem:text-zinc-700 dark:group-hover/navitem:text-zinc-300"
                        )}
                    />
                )}
            </Link>

            {/* Sub-items: strictly hidden when not hovering */}
            {hasSubItems && item.subItems && (
                <div
                    className={cn(
                        "ml-6 pl-2.5 border-l border-zinc-200/80 dark:border-white/[0.08] space-y-0.5 overflow-hidden transition-all duration-200 ease-out",
                        "max-h-0 opacity-0 pointer-events-none group-hover/navitem:max-h-28 group-hover/navitem:opacity-100 group-hover/navitem:pointer-events-auto group-hover/navitem:pt-1 group-hover/navitem:pb-0.5"
                    )}
                >
                    {item.subItems.map((sub) => {
                        const isSubActive = sub.href === "/dashboard/pipelines"
                            ? (pathname === "/dashboard/pipelines" || pathname === "/dashboard/pipelines/")
                            : (pathname.startsWith(sub.href) || (sub.href.includes("contacts") && pathname.startsWith("/dashboard/contacts")));

                        return (
                            <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={onCloseSidebar}
                                className={cn(
                                    "group/sub flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 select-none",
                                    isSubActive
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-white/[0.04]"
                                )}
                            >
                                <sub.icon
                                    className={cn(
                                        "w-3.5 h-3.5 shrink-0 transition-colors",
                                        isSubActive
                                            ? "text-primary"
                                            : "text-zinc-400 dark:text-zinc-500 group-hover/sub:text-zinc-700 dark:group-hover/sub:text-zinc-300"
                                    )}
                                />
                                <span className="truncate">{sub.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

interface NavButtonProps {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

function NavButton({ href, icon: Icon, label, isActive, onClick }: NavButtonProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            aria-current={isActive ? "page" : undefined}
            className={cn(
                "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] transition-all duration-150 ease-out select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive
                    ? "bg-white dark:bg-zinc-900/90 text-zinc-950 dark:text-zinc-100 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_1px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_3px_rgba(0,0,0,0.4)] border border-zinc-200/80 dark:border-white/[0.08]"
                    : "text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-200/50 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent"
            )}
        >
            <span
                className={cn(
                    "absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ease-out",
                    isActive
                        ? "h-4 bg-primary shadow-[0_0_8px_rgba(217,72,38,0.55)] opacity-100 scale-100"
                        : "h-0 bg-transparent opacity-0 scale-50"
                )}
                aria-hidden="true"
            />

            <Icon
                className={cn(
                    "w-4.5 h-4.5 shrink-0 transition-colors duration-150 ml-1",
                    isActive
                        ? "text-primary"
                        : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                )}
            />

            <span className="truncate tracking-[-0.01em]">{label}</span>
        </Link>
    );
}

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
                "fixed left-0 top-0 bottom-0 w-64 bg-zinc-50/70 dark:bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-200/80 dark:border-white/[0.08] flex flex-col z-50 transition-transform duration-300 transform lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Section */}
                <div className="p-4 border-b border-zinc-200/60 dark:border-white/[0.08] flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2.5 group/logo" onClick={() => setSidebarOpen(false)}>
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm shadow-primary/20 bg-background flex items-center justify-center p-0.5 border border-border">
                            <Image src="/icon.svg" alt="HighReach Logo" width={32} height={32} className="group-hover/logo:scale-110 transition-transform object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-semibold text-foreground tracking-tight leading-tight">
                                HighReach
                            </span>
                            <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-widest">
                                Platform
                            </span>
                        </div>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 lg:hidden text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-white/5 rounded-lg"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Body */}
                <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
                    {navGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-1">
                            {groupIdx > 0 && (
                                <div className="my-2.5 mx-1 border-t border-zinc-200/60 dark:border-white/[0.06]" />
                            )}
                            {group.items.map((item) => (
                                <NavItemRow
                                    key={item.href}
                                    item={item}
                                    pathname={pathname}
                                    onCloseSidebar={() => setSidebarOpen(false)}
                                />
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Footer Controls */}
                <div className="p-3 border-t border-zinc-200/70 dark:border-white/[0.08] space-y-1.5 bg-zinc-100/50 dark:bg-zinc-950/50">
                    <NavButton
                        href="/dashboard/settings"
                        icon={Settings}
                        label="Settings"
                        isActive={pathname.startsWith("/dashboard/settings")}
                        onClick={() => setSidebarOpen(false)}
                    />

                    <div className="flex items-center gap-1.5">
                        <LogoutButton className="flex-1" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-flex shrink-0">
                                    <ThemeToggle
                                        className="h-9 w-9 rounded-xl border border-zinc-200/70 dark:border-white/[0.08] bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-150"
                                        iconClassName="h-4 w-4"
                                        title="Theme Preference"
                                    />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-medium">
                                Theme Preference
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </aside>
        </>
    );
}
