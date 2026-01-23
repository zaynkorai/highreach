import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user's tenant info
    const { data: profile } = await supabase
        .from("users")
        .select("*, tenants(*)")
        .eq("id", user.id)
        .single();

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Sidebar */}
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
                    <NavItem href="/dashboard" icon="📊" label="Dashboard" active />
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

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="max-w-6xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            Here&apos;s what&apos;s happening with your business today.
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <StatCard label="Leads Today" value="0" change="+0%" />
                        <StatCard label="Conversations" value="0" change="+0%" />
                        <StatCard label="Forms Submitted" value="0" change="+0%" />
                        <StatCard label="Reviews Sent" value="0" change="+0%" />
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Get Started</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <ActionCard
                                icon="📱"
                                title="Set up phone number"
                                description="Enable missed call text-back"
                            />
                            <ActionCard
                                icon="📝"
                                title="Create your first form"
                                description="Capture leads from your website"
                            />
                            <ActionCard
                                icon="👥"
                                title="Import contacts"
                                description="Bring in your existing customers"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div >
    );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: string; label: string; active?: boolean }) {
    return (
        <a
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active
                ? "bg-zinc-200 dark:bg-white/10 text-foreground dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white"
                }`}
        >
            <span>{icon}</span>
            <span>{label}</span>
        </a>
    );
}

function StatCard({ label, value, change }: { label: string; value: string; change: string }) {
    return (
        <div className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4">
            <div className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">{label}</div>
            <div className="text-2xl font-bold text-foreground dark:text-white">{value}</div>
            <div className="text-emerald-500 dark:text-emerald-400 text-xs mt-1">{change}</div>
        </div>
    );
}

function ActionCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 hover:border-emerald-500/30 transition cursor-pointer shadow-sm dark:shadow-none">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-foreground dark:text-white font-medium mb-1">{title}</div>
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">{description}</div>
        </div>
    );
}
