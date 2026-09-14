"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CreditCard,
    Check,
    ArrowUpRight,
    Download,
    Users,
    UserCheck,
    FileText,
    Sparkles,
    ShieldCheck,
    Receipt,
    ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface BillingMetrics {
    membersCount: number;
    contactsCount: number;
    formsCount: number;
    tenantName: string;
}

const PLANS = [
    {
        id: "starter",
        name: "Starter",
        priceMonthly: 49,
        priceAnnually: 39,
        description: "Essential speed-to-lead and contact management for solo operators.",
        features: [
            "Up to 2 team seats",
            "1,000 CRM contacts",
            "Telnyx Missed-Call Text-Back",
            "Google & Outlook Calendar sync",
            "Standard lead capture forms",
            "Community & email support",
        ],
        seatsQuota: 2,
        contactsQuota: 1000,
    },
    {
        id: "pro",
        name: "Growth Pro",
        badge: "Current Plan",
        isCurrent: true,
        priceMonthly: 149,
        priceAnnually: 119,
        description: "Full omnichannel inbox, review automation, and AI workflows for growing teams.",
        features: [
            "Up to 5 team seats",
            "5,000 CRM contacts",
            "Automated Google review requests",
            "Speed-to-Lead AI Autopilot",
            "Full Kanban pipeline & deal stages",
            "Unified Omnichannel Inbox",
            "Custom webhooks & integrations",
            "Priority support",
        ],
        seatsQuota: 5,
        contactsQuota: 5000,
    },
    {
        id: "scale",
        name: "Enterprise Scale",
        priceMonthly: 299,
        priceAnnually: 239,
        description: "Unlimited capacity, dedicated onboarding, and multi-location management.",
        features: [
            "Unlimited team seats",
            "Unlimited CRM contacts",
            "Multi-location reputation tracking",
            "Dedicated Telnyx 10DLC routing",
            "AI customer call transcription",
            "Custom SLA & dedicated account manager",
        ],
        seatsQuota: 999,
        contactsQuota: 99999,
    },
];

const SAMPLE_INVOICES = [
    { id: "INV-2026-003", date: "Aug 1, 2026", amount: "$149.00", status: "Paid", plan: "Growth Pro Monthly" },
    { id: "INV-2026-002", date: "Jul 1, 2026", amount: "$149.00", status: "Paid", plan: "Growth Pro Monthly" },
    { id: "INV-2026-001", date: "Jun 1, 2026", amount: "$149.00", status: "Paid", plan: "Growth Pro Monthly" },
];

export function BillingClient({ metrics }: { metrics: BillingMetrics }) {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");
    const [selectedPlan, setSelectedPlan] = useState("pro");

    const currentPlan = PLANS.find((p) => p.isCurrent) || PLANS[1];

    const seatsPercent = Math.min(Math.round((metrics.membersCount / currentPlan.seatsQuota) * 100), 100);
    const contactsPercent = Math.min(Math.round((metrics.contactsCount / currentPlan.contactsQuota) * 100), 100);

    const handleUpgradeOrManage = (planName: string) => {
        if (planName === currentPlan.name) {
            toast.info("You are already subscribed to this plan. Stripe Customer Portal will open when production keys are connected.");
        } else {
            toast.success(`Plan switch to ${planName} requested. Stripe checkout session initializing...`);
        }
    };

    return (
        <div className="space-y-8">
            {/* Current Plan & Quota Meters */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/[0.08] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-foreground">Subscription & Quotas</h2>
                            <Badge className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-none font-semibold">
                                Active Subscription
                            </Badge>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Workspace: <span className="font-semibold text-foreground">{metrics.tenantName}</span> · Next billing date: September 1, 2026
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => handleUpgradeOrManage(currentPlan.name)}
                        className="border-zinc-200 dark:border-white/10 gap-1.5 text-xs shrink-0"
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        Manage Billing & Invoices
                    </Button>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    {/* Quota Progress Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Team Seats */}
                        <div className="p-4 rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" /> Team Seats
                                </span>
                                <span className="text-xs font-bold font-mono text-foreground">
                                    {metrics.membersCount} / {currentPlan.seatsQuota}
                                </span>
                            </div>
                            <div className="w-full bg-zinc-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${seatsPercent}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-zinc-400">
                                {currentPlan.seatsQuota - metrics.membersCount > 0
                                    ? `${currentPlan.seatsQuota - metrics.membersCount} seats available on this tier`
                                    : "All available seats assigned"}
                            </p>
                        </div>

                        {/* Contacts Storage */}
                        <div className="p-4 rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5" /> CRM Contacts
                                </span>
                                <span className="text-xs font-bold font-mono text-foreground">
                                    {metrics.contactsCount} / {currentPlan.contactsQuota.toLocaleString()}
                                </span>
                            </div>
                            <div className="w-full bg-zinc-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${contactsPercent}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-zinc-400">
                                {Math.max(0, currentPlan.contactsQuota - metrics.contactsCount).toLocaleString()} contacts remaining
                            </p>
                        </div>

                        {/* Active Lead Forms */}
                        <div className="p-4 rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" /> Active Forms
                                </span>
                                <span className="text-xs font-bold font-mono text-foreground">
                                    {metrics.formsCount} / Unlimited
                                </span>
                            </div>
                            <div className="w-full bg-zinc-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                <div className="bg-emerald-500 h-2 rounded-full w-1/4" />
                            </div>
                            <p className="text-[11px] text-zinc-400">
                                Unlimited forms & embeddable widgets
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Tiers & Upgrades */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Available Workspace Plans</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Upgrade or downgrade anytime. Changes apply immediately to your quota limits.
                        </p>
                    </div>

                    {/* Monthly vs Annually Toggle */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200/80 dark:border-white/10 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                billingCycle === "monthly"
                                    ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                                    : "text-zinc-500 hover:text-foreground"
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingCycle("annually")}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                                billingCycle === "annually"
                                    ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                                    : "text-zinc-500 hover:text-foreground"
                            }`}
                        >
                            <span>Annually</span>
                            <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full">
                                Save 20%
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => {
                        const price = billingCycle === "annually" ? plan.priceAnnually : plan.priceMonthly;
                        const isCurrent = plan.isCurrent;

                        return (
                            <div
                                key={plan.id}
                                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                                    isCurrent
                                        ? "bg-white dark:bg-zinc-900 border-primary shadow-md shadow-primary/5 ring-2 ring-primary/20"
                                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20"
                                }`}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-foreground text-lg">{plan.name}</h4>
                                        {isCurrent && (
                                            <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold">
                                                Current Plan
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 min-h-[36px]">
                                        {plan.description}
                                    </p>

                                    <div className="flex items-baseline gap-1 pt-2">
                                        <span className="text-3xl font-extrabold text-foreground">${price}</span>
                                        <span className="text-xs text-zinc-400">/ month</span>
                                    </div>

                                    <div className="border-t border-zinc-100 dark:border-white/5 pt-4 space-y-2.5">
                                        <div className="text-xs font-semibold text-foreground uppercase tracking-wider text-[10px]">
                                            Included Features
                                        </div>
                                        {plan.features.map((feat, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                                                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-white/5">
                                    <Button
                                        onClick={() => handleUpgradeOrManage(plan.name)}
                                        variant={isCurrent ? "outline" : "default"}
                                        className={`w-full text-xs font-semibold ${
                                            isCurrent
                                                ? "border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5"
                                                : "bg-primary hover:opacity-90 text-white shadow-sm shadow-primary/20"
                                        }`}
                                    >
                                        {isCurrent ? "Active Plan" : `Upgrade to ${plan.name}`}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Payment Method & Invoice History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payment Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm space-y-4">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Default Payment Method
                    </h4>
                    <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-7 rounded bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center text-[10px] font-mono font-bold tracking-wider">
                                VISA
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-foreground">•••• •••• •••• 4242</div>
                                <div className="text-[11px] text-zinc-400">Expires 12/28</div>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">Default</Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info("Stripe Customer Portal will open when configured.")}
                        className="w-full text-xs text-primary hover:underline h-8"
                    >
                        Update Payment Method
                    </Button>
                </div>

                {/* Billing History Table */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-primary" />
                            Recent Invoices & Receipts
                        </h4>
                        <span className="text-xs text-zinc-400">Past 3 cycles</span>
                    </div>

                    <div className="space-y-1">
                        {SAMPLE_INVOICES.map((inv) => (
                            <div
                                key={inv.id}
                                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors text-xs"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="font-mono font-semibold text-foreground">{inv.id}</div>
                                    <div className="text-zinc-500 dark:text-zinc-400">{inv.date}</div>
                                    <div className="hidden sm:block text-zinc-400 text-[11px]">{inv.plan}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-foreground">{inv.amount}</span>
                                    <Badge className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-none text-[10px] px-2 py-0.5">
                                        {inv.status}
                                    </Badge>
                                    <button
                                        type="button"
                                        onClick={() => toast.success(`Receipt downloaded for ${inv.id}`)}
                                        className="text-zinc-400 hover:text-primary transition-colors p-1"
                                        title="Download PDF"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
