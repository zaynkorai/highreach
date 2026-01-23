"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login"); // Redirect to login page after logout
        router.refresh(); // Refresh the page to clear any server-side state
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 w-full"
        >
            <span>🚪</span>
            <span>{isLoading ? "Signing out..." : "Log Out"}</span>
        </button>
    );
}
