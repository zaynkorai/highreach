import { SettingsSidebar } from "./components/settings-sidebar";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Manage your account settings and preferences.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <SettingsSidebar />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
