import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export function DashboardSidebar() {
    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-white/[0.08] p-4">
            <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-emerald-400 flex items-center justify-center">
                    <span className="text-black font-bold text-sm">G</span>
                </div>
                <span className="text-lg font-semibold text-foreground">
                    GHL<span className="text-emerald-400">Lite</span>
                </span>
            </div>

            <nav className="space-y-1">
                <NavItem href="/dashboard" icon="📊" label="Dashboard" />
                <NavItem href="/dashboard/inbox" icon="💬" label="Inbox" />
                <NavItem href="/dashboard/contacts" icon="👥" label="Contacts" />
                <NavItem href="/dashboard/forms" icon="📝" label="Forms" />
                <NavItem href="/dashboard/settings" icon="⚙️" label="Settings" />
            </nav>

            <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                    <ThemeToggle />
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Theme</span>
                </div>
                <LogoutButton />
            </div>
        </aside>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
    return (
        <a
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white"
        >
            <span>{icon}</span>
            <span>{label}</span>
        </a>
    );
}
