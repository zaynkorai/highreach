"use client";

import { PhoneMissed, Zap, MessageSquare, Calendar, Sparkles } from "lucide-react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-border">
      <div className="max-w-3xl mb-14">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          How It Works
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
          From missed call to booked job in under 2 minutes
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          No porting phone numbers. No robotic menus. Just instant two-way SMS that captures the client and queues the dispatch while you stay focused on the job.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: Line Forwarding & Missed Call Webhook */}
        <div className="bg-card border border-border hover:border-primary/50 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-xs hover:shadow-sm group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[11px] font-mono text-muted-foreground">
                
              </span>
            </div>

            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Keep your number. <br />Zero-loss call forwarding.
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2 mb-6">
              Works on your existing business line via carrier conditional forwarding (<code className="bg-muted px-1 py-0.5 rounded text-[11px] font-semibold text-foreground font-mono">*71</code>). When you&apos;re busy or on a roof, HighReach detects the unanswered call in real time.
            </p>

            {/* Micro-UI 1: Simulated Call Event & Webhook Trigger */}
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-3">
              {/* Carrier Status Header */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-medium text-foreground">AT&amp;T / Verizon Forwarding</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
              </div>

              {/* Missed Call Event Item */}
              <div className="bg-card border border-border rounded-lg p-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center font-bold text-sm shrink-0">
                      <PhoneMissed className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground leading-none">
                        (512) 839-4412
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Incoming Call &bull; Unanswered (14s)
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">2:14 PM</span>
                </div>
              </div>

              {/* Instant Webhook Tag */}
              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary font-medium">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-primary" />
                  <span className="text-[10px] font-semibold">HighReach Webhook Captured</span>
                </div>
                <span className="text-[10px] font-mono font-bold">1.2s response</span>
              </div>
            </div>
          </div>

          {/* Card Footer Info */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>No number porting required</span>
            <span className="text-primary font-semibold text-[11px]">Plug &amp; Play</span>
          </div>
        </div>

        {/* CARD 2: Adaptive 2-Way SMS Intake */}
        <div className="bg-card border-2 border-primary rounded-2xl p-6 flex flex-col justify-between transition-all shadow-md relative group">

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[11px] font-mono text-muted-foreground">
                
              </span>
            </div>

            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Personalized intake. <br />Engages before they look elsewhere.
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2 mb-6">
              Instead of a generic automated reply, a warm text goes out asking how your team can help, collecting job details, and setting customer expectations.
            </p>

            {/* Micro-UI 2: Two-way SMS Thread with Extracted Intent */}
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-3">
              {/* Simulated SMS Thread */}
              <div className="space-y-2.5 text-xs">
                {/* Outgoing Bot Text (HighReach) */}
                <div className="flex flex-col items-end">
                  <div className="max-w-[90%] rounded-2xl rounded-br-xs px-3 py-2 bg-primary text-primary-foreground text-[11px] leading-relaxed shadow-xs">
                    Hi, this is Marcus&apos;s team at Apex! Sorry we missed your call—we&apos;re on a service visit. What can we help you with today?
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-0.5 mr-1 font-mono">Delivered &bull; 2:14 PM</span>
                </div>

                {/* Incoming Customer Reply */}
                <div className="flex flex-col items-start">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-xs px-3 py-2 bg-card text-foreground border border-border text-[11px] leading-relaxed shadow-xs">
                    Hey Marcus, kitchen drain is backing up into the sink. Any chance you have time today?
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-0.5 ml-1 font-mono">2:15 PM</span>
                </div>
              </div>

              {/* Auto-Extracted Job Info Chip */}
              <div className="p-2.5 rounded-lg bg-card border border-border text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Extracted Intent</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">High Intent</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-medium text-foreground">
                    🔧 Emergency Drain
                  </span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-medium text-primary">
                    ⏱ Same-Day Request
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer Info */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>98% open rate within 3 mins</span>
            <span className="text-foreground font-semibold text-[11px]">Zero Lead Drop</span>
          </div>
        </div>

        {/* CARD 3: Unified Team Dispatch & CRM Pipeline */}
        <div className="bg-card border border-border hover:border-primary/50 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-xs hover:shadow-sm group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[11px] font-mono text-muted-foreground">
                
              </span>
            </div>

            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Queued for your team. <br />1-click quote &amp; booking.
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2 mb-6">
              The lead automatically lands in your shared team inbox and pipeline. Review customer context, send a booking link, or dispatch a technician right from your phone.
            </p>

            {/* Micro-UI 3: Shared Inbox Lead Card & Quick Actions */}
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-3">
              {/* Lead Card Preview */}
              <div className="bg-card border border-border rounded-lg p-3 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      Marcus Vance
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Inquiry via Missed Call &bull; 2 mins ago
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    New Lead
                  </span>
                </div>

                {/* Quick Meta */}
                <div className="grid grid-cols-2 gap-2 text-[11px] py-1.5 border-y border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Assigned Tech:</span>
                    <span className="font-medium text-foreground text-[11px]">Alex R. (Field 2)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Target Window:</span>
                    <span className="font-medium text-foreground text-[11px]">Today 3:30 - 5 PM</span>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div className="px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center gap-1 shadow-xs cursor-default">
                    <Calendar className="w-3 h-3" />
                    <span>Book Time</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-[10px] font-semibold text-foreground transition-colors flex items-center justify-center gap-1 cursor-default">
                    <MessageSquare className="w-3 h-3" />
                    <span>Reply SMS</span>
                  </div>
                </div>
              </div>

              {/* Sync Alert Pill */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Synced with Google Calendar &amp; Team Inbox</span>
              </div>
            </div>
          </div>

          {/* Card Footer Info */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Complete customer paper trail</span>
            <span className="text-primary font-semibold text-[11px]">Zero Friction</span>
          </div>
        </div>
      </div>
    </section>
  );
}
