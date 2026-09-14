import { PipelineTabs } from "./components/pipeline-tabs";

export default function PipelinesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-white/[0.08]">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        Pipelines
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Track deals across stages and manage your customer directory.
                    </p>
                </div>
                <PipelineTabs />
            </div>
            <div className="flex-1 min-h-0">
                {children}
            </div>
        </div>
    );
}
