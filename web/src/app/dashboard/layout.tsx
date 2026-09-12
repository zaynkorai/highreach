import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { getSessionWithRole } from "@/lib/auth/session";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSessionWithRole();

    if (!session) {
        redirect("/login");
    }

    // Onboarding Guard
    const [profile] = await db
        .select({ onboardingCompleted: users.onboardingCompleted })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

    if (profile && !profile.onboardingCompleted) {
        redirect("/onboarding");
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
            <DashboardSidebar />
            <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-64">
                <MobileHeader />
                <main className="flex-1 p-4 md:p-8 min-w-0 overflow-x-hidden">
                    <div className="max-w-[1600px] w-full min-w-0 mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
