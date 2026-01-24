"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function SettingsSidebar() {
    const pathname = usePathname();

    const tabs = [
        { id: "organization", label: "Organization Profile", href: "/dashboard/settings" },
        // { id: "account", label: "Account & Security", href: "/dashboard/settings/account" },
        // { id: "billing", label: "Billing & Plans", href: "/dashboard/settings/billing" },
        // { id: "integrations", label: "Integrations", href: "/dashboard/settings/integrations" },
    ];

    return (
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
            {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground"
                            }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
