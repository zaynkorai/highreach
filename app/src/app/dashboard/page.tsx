import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";


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
        <>
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
        </>
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
