"use client";

import { useState } from "react";
import { Check, Star, MessageSquare, Calendar, Lock, Smartphone, ShieldCheck, Zap } from "lucide-react";

export function FeaturesBento() {
  const [selectedSlot, setSelectedSlot] = useState("9:00 AM");

  return (
    <section id="features" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-border">
      <div className="max-w-3xl mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
          Built around your customer relationships
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Keep every text, appointment, invoice, and review connected to the person behind it in one coordinated system.
        </p>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Bento Card 1: Text-to-Pay Invoicing (2 Cols on md/lg) */}
        <div className="md:col-span-2 bg-card border border-border hover:border-primary/50 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs transition-all group">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-3">
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                Frictionless Text Invoicing. <br />Paid before you leave the driveway.
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2.5">
                Send Apple Pay &amp; Google Pay checkout links directly inside the customer&apos;s active SMS conversation. No PDF attachments, portal logins, or mailed checks.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>83% paid in &lt; 1 hour</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Apple Pay &bull; Google Pay &bull; Cards</span>
                </div>
              </div>
            </div>

            {/* Micro-UI: Interactive Invoice Payment Sheet */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Invoice #1094</div>
                  <div className="text-xs font-bold text-foreground">Emergency Drain Clearing</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  Paid
                </span>
              </div>

              <div className="flex items-baseline justify-between py-1">
                <span className="text-xs text-muted-foreground">Amount Due</span>
                <span className="text-2xl font-extrabold text-foreground font-mono">$285.00</span>
              </div>

              {/* Payment Action Simulator */}
              <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                    
                  </div>
                  <span className="text-[11px] font-medium text-foreground">Apple Pay &bull;&bull;&bull;&bull; 4092</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Instant Transfer</span>
              </div>

              <div className="text-[10px] text-center text-muted-foreground">
                Receipt auto-sent via SMS to (512) 839-4412
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Stripe Connect powered &bull; Same-day payouts
            </span>
            <span className="text-primary font-semibold text-[11px]">Instant Settlement</span>
          </div>
        </div>

        {/* Bento Card 2: Automatic Google Reviews (1 Col) */}
        <div className="bg-card border border-border hover:border-primary/50 rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all group">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-3">
            </div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Automatic 5-Star Reviews.
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
              HighReach detects completed jobs and fires a personalized text with a 1-tap direct link to your Google Business profile.
            </p>

            {/* Micro-UI: Google Review Card */}
            <div className="mt-5 p-3.5 rounded-xl border border-border bg-muted/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                  ))}
                  <span className="text-[10px] font-bold text-foreground ml-1">5.0 on Google</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Just now</span>
              </div>
              <p className="text-[11px] italic text-foreground leading-snug">
                &ldquo;Marcus had someone at my house in 45 minutes. Super transparent pricing and easiest text payment ever.&rdquo;
              </p>
              <div className="pt-1.5 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border">
                <span>Customer: Sarah T.</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">+14 reviews this mo</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Direct Google Maps link</span>
            <span className="text-primary font-semibold">1-Tap Review</span>
          </div>
        </div>

        {/* Bento Card 3: Unified Team Inbox (1 Col) */}
        <div className="bg-card border border-border hover:border-primary/50 rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all group">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              One Shared Inbox. <br />SMS, Email &amp; Web.
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
              No lost conversations on personal phones. Your dispatcher, technician, and office manager reply from a shared thread.
            </p>

            {/* Micro-UI: Mini Inbox snippet with Team Whispers */}
            <div className="mt-5 p-3 rounded-xl border border-border bg-muted/40 space-y-2">
              <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground">David Sterling</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-medium">SMS</span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">&ldquo;Can we schedule for tomorrow 9 AM?&rdquo;</div>
              </div>

              {/* Internal Whisper Note */}
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                <Lock className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Team Note:</strong> Alex is assigned to this zone tomorrow morning.</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Internal team tags &amp; notes</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">Zero Miscommunication</span>
          </div>
        </div>

        {/* Bento Card 4: Connected Scheduling (2 Cols on md/lg) */}
        <div className="md:col-span-2 bg-card border border-border hover:border-primary/50 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs transition-all group">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                Live Calendar Sync. <br />Eliminate phone tag forever.
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2.5">
                Two-way sync with Google Calendar and Microsoft Outlook. HighReach sends customer-specific booking links that only show actual free dispatch windows.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-muted text-[11px] font-semibold text-foreground">Google Calendar</span>
                <span className="px-2 py-1 rounded bg-muted text-[11px] font-semibold text-foreground">Outlook 365</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Auto-buffers drive time
                </span>
              </div>
            </div>

            {/* Micro-UI: Interactive Slot Picker */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border">
                <span className="font-bold text-foreground">Tomorrow, Oct 16</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">3 Slots Available</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["9:00 AM", "11:30 AM", "2:00 PM"].map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedSlot(time)}
                    className={`p-2 rounded-lg text-[10px] font-bold text-center transition-all ${
                      selectedSlot === time
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-border bg-card text-foreground hover:border-primary/60"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              <div className="p-2 rounded bg-card border border-border text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Assigned: Van 3 (Austin South)</span>
                <span className="font-bold text-foreground">Selected: {selectedSlot}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Direct 2-way real-time calendar synchronization</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">Zero Double Bookings</span>
          </div>
        </div>

      </div>
    </section>
  );
}
