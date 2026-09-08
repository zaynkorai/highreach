import { getSessionWithRole } from "@/lib/auth/session";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
    const session = await getSessionWithRole();

    if (!session) {
        redirect("/login");
    }

    // Check if user is already onboarded
    const [profile] = await db
        .select({
            onboardingCompleted: users.onboardingCompleted,
            email: users.email,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

    if (profile?.onboardingCompleted) {
        redirect("/dashboard");
    }

    return <OnboardingClient userEmail={profile?.email || ""} />;
}
