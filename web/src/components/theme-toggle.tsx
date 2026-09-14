"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

export interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    iconClassName?: string;
}

export function ThemeToggle({
    className,
    iconClassName,
    title = "Theme Preference",
    ...props
}: ThemeToggleProps = {}) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div
                className={cn(
                    "w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10",
                    className
                )}
            />
        )
    }

    return (
        <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-background text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                className
            )}
            aria-label={title || "Toggle theme"}
            title={title}
            {...props}
        >
            <Sun
                className={cn(
                    "h-[1.5rem] w-[1.5rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0",
                    iconClassName
                )}
            />
            <Moon
                className={cn(
                    "absolute h-[1.5rem] w-[1.5rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100",
                    iconClassName
                )}
            />
            <span className="sr-only">{title || "Toggle theme"}</span>
        </button>
    )
}
