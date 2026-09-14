"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { AppRole } from "@/lib/types/database";
import { hasPermission } from "@/lib/rbac/permissions";
import { cn } from "@/lib/utils";
import { Building2, User, Users, Plug, CreditCard } from "lucide-react";

interface SettingsSidebarProps {
    userRole?: AppRole;
}

export function SettingsSidebar({ userRole = "member" }: SettingsSidebarProps) {
    const pathname = usePathname();

    const tabs = [
        { id: "organization", label: "Organization Profile", icon: Building2, href: "/dashboard/settings", permission: null },
        { id: "account", label: "Personal Profile", icon: User, href: "/dashboard/settings/account", permission: null },
        { id: "team", label: "Team", icon: Users, href: "/dashboard/settings/team", permission: "team.read" as const },
        { id: "integrations", label: "Integrations", icon: Plug, href: "/dashboard/settings/integrations", permission: null },
        { id: "billing", label: "Billing", icon: CreditCard, href: "/dashboard/settings/billing", permission: "billing.read" as const },
    ];

    const visibleTabs = tabs.filter(
        (tab) => !tab.permission || hasPermission(userRole, tab.permission)
    );

    return (
        <div className="w-full md:w-64 flex-shrink-0 space-y-1.5">
            <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-zinc-400/90 dark:text-zinc-500 uppercase font-mono select-none">
                Settings & Admin
            </div>
            {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                            "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] transition-all duration-150 ease-out select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                            isActive
                                ? "bg-white dark:bg-zinc-900/90 text-zinc-950 dark:text-zinc-100 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_1px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_3px_rgba(0,0,0,0.4)] border border-zinc-200/80 dark:border-white/[0.08]"
                                : "text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-200/50 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent"
                        )}
                    >
                        {/* Precision Ember Register Notch */}
                        <span
                            className={cn(
                                "absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ease-out",
                                isActive
                                    ? "h-4 bg-primary shadow-[0_0_8px_rgba(217,72,38,0.55)] opacity-100 scale-100"
                                    : "h-0 bg-transparent opacity-0 scale-50"
                            )}
                            aria-hidden="true"
                        />

                        {/* Naked Icon without decorative box */}
                        <Icon
                            className={cn(
                                "w-4.5 h-4.5 shrink-0 transition-colors duration-150 ml-1",
                                isActive
                                    ? "text-primary"
                                    : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                            )}
                        />

                        {/* Label */}
                        <span className="truncate tracking-[-0.01em]">{tab.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
