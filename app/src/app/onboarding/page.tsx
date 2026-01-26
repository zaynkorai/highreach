import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Check if user is already onboarded
    const { data: profile } = await supabase
        .from("users")
        .select("onboarding_completed, email")
        .eq("id", user.id)
        .single();

    if (profile?.onboarding_completed) {
        redirect("/dashboard");
    }

    return <OnboardingClient userEmail={profile?.email || ""} />;
}
