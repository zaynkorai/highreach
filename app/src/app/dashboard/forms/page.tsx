"use client";

// Dummy data
const forms = [
    {
        id: "1",
        title: "Contact Us",
        description: "General inquiry form for website visitors",
        views: 124,
        submissions: 15,
        conversionRate: "12.1%",
        lastUpdated: "2 days ago",
        status: "Active"
    },
    {
        id: "2",
        title: "Get a Quote",
        description: "Detailed service request form",
        views: 45,
        submissions: 8,
        conversionRate: "17.7%",
        lastUpdated: "5 days ago",
        status: "Active"
    },
    {
        id: "3",
        title: "Newsletter Signup",
        description: "Simple email capture form",
        views: 302,
        submissions: 45,
        conversionRate: "14.9%",
        lastUpdated: "1 week ago",
        status: "Draft"
    },
];

export default function FormsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Forms</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                        Create and manage forms to capture leads.
                    </p>
                </div>
                <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-emerald-500/20 flex items-center gap-2 active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Form
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
                    <div className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Total Views</div>
                    <div className="text-2xl font-bold text-foreground dark:text-white">471</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
                    <div className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Total Submissions</div>
                    <div className="text-2xl font-bold text-foreground dark:text-white">68</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
                    <div className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Avg. Conversion</div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">14.4%</div>
                </div>
            </div>

            {/* Forms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                    <div key={form.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-md dark:shadow-none cursor-pointer">
                        <div className="p-6 border-b border-zinc-100 dark:border-white/[0.08] group-hover:bg-emerald-50/10 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.status === "Active"
                                        ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400"
                                    }`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${form.status === "Active"
                                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                                        : "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:border-white/10"
                                    }`}>
                                    {form.status}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{form.title}</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{form.description}</p>
                        </div>
                        <div className="px-6 py-4 bg-zinc-50/50 dark:bg-white/[0.02]">
                            <div className="flex justify-between text-sm">
                                <div>
                                    <span className="text-zinc-500 dark:text-zinc-400 block text-xs mb-0.5">Views</span>
                                    <span className="font-semibold text-foreground dark:text-white">{form.views}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 dark:text-zinc-400 block text-xs mb-0.5">Submissions</span>
                                    <span className="font-semibold text-foreground dark:text-white">{form.submissions}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500 dark:text-zinc-400 block text-xs mb-0.5">Conversion</span>
                                    <span className="font-semibold text-foreground dark:text-white">{form.conversionRate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Create New Card */}
                <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-all group h-full min-h-[220px]">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-center mb-4 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-white">Create New Form</span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Start from scratch or a template</span>
                </button>
            </div>
        </div>
    );
}
