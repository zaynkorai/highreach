import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <DashboardSidebar />
            <main className="ml-64 p-8">
                <div className="max-w-6xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
