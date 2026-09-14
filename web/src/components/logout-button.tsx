"use client";

import { useState } from "react";
import { logoutAction } from "@/lib/auth/actions";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
    className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps = {}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        await logoutAction();
        router.push("/login");
        router.refresh();
    };

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={isLoading}
            className={cn(
                "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-all duration-150 ease-out select-none outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 text-zinc-600 dark:text-zinc-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 border border-transparent disabled:opacity-50 disabled:pointer-events-none w-full",
                className
            )}
        >
            <LogOut className="w-4.5 h-4.5 shrink-0 transition-colors ml-1 text-zinc-400 dark:text-zinc-500 group-hover:text-red-600 dark:group-hover:text-red-400" />
            <span className="truncate tracking-[-0.01em]">{isLoading ? "Signing out..." : "Log Out"}</span>
        </button>
    );
}
