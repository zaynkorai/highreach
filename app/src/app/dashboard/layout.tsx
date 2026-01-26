import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Onboarding Guard
    const { data: profile } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

    if (profile && !profile.onboarding_completed) {
        redirect("/onboarding");
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <DashboardSidebar />
            <main className="ml-64 p-8">
                <div className="max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
