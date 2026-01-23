import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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

    // Get contacts count
    const { count: contactsCount } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Here&apos;s what&apos;s happening with your business today.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Contacts"
                    value={String(contactsCount || 0)}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Conversations"
                    value="0"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Forms Submitted"
                    value="0"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Missed Calls"
                    value="0"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    }
                />
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-foreground">Get Started</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">Complete these steps to set up your account</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ActionCard
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            }
                            title="Set up phone number"
                            description="Enable missed call text-back"
                            href="/dashboard/settings"
                        />
                        <ActionCard
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            }
                            title="Create your first form"
                            description="Capture leads from your website"
                            href="/dashboard/forms"
                        />
                        <ActionCard
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            }
                            title="Import contacts"
                            description="Bring in your existing customers"
                            href="/dashboard/contacts"
                        />
                    </div>
                </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
                </div>
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-zinc-900 dark:text-white font-medium mb-1">No recent activity</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs">
                            Your recent conversations, form submissions, and calls will appear here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-bold text-foreground dark:text-white mb-0.5">{value}</div>
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">{label}</div>
        </div>
    );
}

function ActionCard({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) {
    return (
        <Link
            href={href}
            className="group bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-all cursor-pointer"
        >
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="text-foreground dark:text-white font-medium mb-1">{title}</div>
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">{description}</div>
        </Link>
    );
}
