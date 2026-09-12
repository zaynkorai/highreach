"use client";

import Link from "next/link";
import { 
  Users, 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  PhoneCall, 
  ArrowUpRight, 
  CheckCircle2, 
  Circle, 
  Share2, 
  ArrowRight,
  ShieldCheck,
  Star,
  Clock,
  Plus
} from "lucide-react";

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  desc: string;
  createdAt: string;
}

interface DashboardOverviewProps {
  userName: string;
  phoneNumber: string | null;
  contactsCount: number;
  conversationsCount: number;
  formsCount: number;
  opportunitiesCount: number;
  pipelineValue: number;
  calendarsCount: number;
  knowledgeCount: number;
  activities: ActivityItem[];
}

export function DashboardOverview({
  userName,
  phoneNumber,
  contactsCount,
  conversationsCount,
  formsCount,
  opportunitiesCount,
  pipelineValue,
  calendarsCount,
  knowledgeCount,
  activities,
}: DashboardOverviewProps) {
  // Real dynamic checklist derived strictly from database state
  const checklist = [
    { 
      title: "Configure Phone Number", 
      desc: phoneNumber ? `Active: ${phoneNumber}` : "Enable missed-call text-back",
      href: "/dashboard/settings", 
      done: Boolean(phoneNumber) 
    },
    { 
      title: "Import or Add Contacts", 
      desc: contactsCount > 0 ? `${contactsCount} contacts recorded` : "Add customer records",
      href: "/dashboard/contacts", 
      done: contactsCount > 0 
    },
    { 
      title: "Create Lead Capture Form", 
      desc: formsCount > 0 ? `${formsCount} forms active` : "Capture leads on website",
      href: "/dashboard/forms", 
      done: formsCount > 0 
    },
    { 
      title: "Connect Booking Calendar", 
      desc: calendarsCount > 0 ? `${calendarsCount} calendars synced` : "Sync Google or Outlook",
      href: "/dashboard/calendars", 
      done: calendarsCount > 0 
    },
    { 
      title: "Train AI Knowledge Base", 
      desc: knowledgeCount > 0 ? `${knowledgeCount} sources indexed` : "Add company service answers",
      href: "/dashboard/knowledge", 
      done: knowledgeCount > 0 
    },
  ];

  const completedCount = checklist.filter(c => c.done).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Header & Real System Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {userName}!
            </h1>
            {phoneNumber ? (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Text-Back Active ({phoneNumber})</span>
              </div>
            ) : (
              <Link 
                href="/dashboard/settings"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20 hover:underline"
              >
                <span>Phone Not Configured &bull; Set Up &rarr;</span>
              </Link>
            )}
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Real-time operations, customer pipelines, and live communication metrics.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/contacts"
            className="px-3.5 py-2 rounded-xl bg-card hover:bg-muted border border-border text-foreground font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Contacts</span>
          </Link>
          <Link
            href="/dashboard/inbox"
            className="shimmer-button px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Open Inbox</span>
          </Link>
        </div>
      </div>

      {/* 2. Real KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Contacts */}
        <div className="card-elevated card-interactive rounded-2xl p-5 bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Contacts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {contactsCount.toLocaleString()}
            </div>
            <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {contactsCount === 1 ? "1 Contact" : `${contactsCount} Contacts`}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Customer directory</span>
            <Link href="/dashboard/contacts" className="text-primary font-semibold hover:underline flex items-center gap-0.5">
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Speed to Lead / Phone Setup */}
        <div className="card-elevated card-interactive rounded-2xl p-5 bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Speed to Lead</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              phoneNumber ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
            }`}>
              <Zap className={`w-4 h-4 ${phoneNumber ? "fill-emerald-500" : ""}`} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-foreground font-mono truncate max-w-[170px]">
              {phoneNumber ? "Ready" : "Inactive"}
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              phoneNumber 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                : "bg-muted text-muted-foreground border-border"
            }`}>
              {phoneNumber ? "Auto-Reply On" : "Number Needed"}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="truncate">{phoneNumber || "No number assigned"}</span>
            <Link href="/dashboard/settings" className="text-primary font-semibold hover:underline flex items-center gap-0.5 shrink-0">
              Configure <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Conversations */}
        <div className="card-elevated card-interactive rounded-2xl p-5 bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conversations</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {conversationsCount.toLocaleString()}
            </div>
            <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {conversationsCount === 1 ? "1 Thread" : `${conversationsCount} Threads`}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>2-Way Unified Inbox</span>
            <Link href="/dashboard/inbox" className="text-primary font-semibold hover:underline flex items-center gap-0.5">
              Open <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Pipeline Value */}
        <div className="card-elevated card-interactive rounded-2xl p-5 bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pipeline Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              ${pipelineValue.toLocaleString()}
            </div>
            <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {opportunitiesCount} {opportunitiesCount === 1 ? "Deal" : "Deals"}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Kanban Pipeline</span>
            <Link href="/dashboard/pipelines" className="text-primary font-semibold hover:underline flex items-center gap-0.5">
              Deals <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* 3. Mid-Grid: Real Checklist & Real Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Setup Checklist */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="card-elevated rounded-2xl p-6 bg-card border border-border/70 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Account Setup</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wide">
                    {progressPercent}% Complete
                  </span>
                </h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Complete these essential setups to automate your speed to lead.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground">
                {completedCount} of {checklist.length} Completed
              </span>
            </div>

            {/* Real Progress Bar */}
            <div className="w-full bg-muted/80 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>

            {/* Real Checklist Items */}
            <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
              {checklist.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium transition-all ${
                    item.done
                      ? "bg-muted/30 border-border/50 text-muted-foreground"
                      : "bg-card hover:bg-muted/60 border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className={`font-semibold truncate ${item.done ? "line-through opacity-80" : ""}`}>
                        {item.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/dashboard/pipelines"
              className="card-elevated card-interactive rounded-2xl p-5 bg-card border border-border/70 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Pipelines</h3>
              <p className="text-xs text-muted-foreground mt-1">Manage leads, opportunities, and deal stages.</p>
            </Link>

            <Link
              href="/dashboard/social"
              className="card-elevated card-interactive rounded-2xl p-5 bg-card border border-border/70 group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Social Studio</h3>
              <p className="text-xs text-muted-foreground mt-1">Schedule social posts and track engagement.</p>
            </Link>

            <Link
              href="/dashboard/reputation"
              className="card-elevated card-interactive rounded-2xl p-5 bg-card border border-border/70 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Reputation</h3>
              <p className="text-xs text-muted-foreground mt-1">Request reviews & monitor your Google ranking.</p>
            </Link>
          </div>

        </div>

        {/* Right 1 Col: Real Activity Stream */}
        <div className="card-elevated rounded-2xl p-6 bg-card border border-border/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Recent Activity</h2>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {activities.length > 0 ? `${activities.length} logged` : "Live Feed"}
              </span>
            </div>

            {/* Activity Stream */}
            <div className="divide-y divide-border/30">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className="py-3.5 space-y-1 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {act.type === "call_log" ? (
                          <PhoneCall className="w-4 h-4 text-primary shrink-0" />
                        ) : act.type === "sms" ? (
                          <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-xs font-bold text-foreground truncate max-w-[160px]">
                          {act.title}
                        </span>
                      </div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {act.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug pl-6 line-clamp-2">
                      {act.desc}
                    </p>
                    <div className="text-[10px] text-muted-foreground/80 pl-6 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(act.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-14 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">No recent activity</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[210px] leading-relaxed">
                    Customer calls, messages, and notes will appear here automatically.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 w-full max-w-[180px]">
                    <Link
                      href="/dashboard/contacts"
                      className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add a Contact</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Carrier Connected
            </span>
            <Link href="/dashboard/inbox" className="text-primary font-semibold hover:underline">
              View Inbox &rarr;
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
