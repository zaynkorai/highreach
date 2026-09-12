"use client";

import { useState } from "react";
import { PhoneCall, Zap, CheckCircle2, RotateCcw, ArrowRight, Sparkles, Building2, Wrench, Home } from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  icon: React.ReactNode;
  leadName: string;
  leadPhone: string;
  businessType: string;
  autoReplyText: string;
  customerReplyText: string;
  estimatedValue: string;
}

const scenarios: Scenario[] = [
  {
    id: "trades",
    name: "Home Services",
    icon: <Wrench className="w-3.5 h-3.5" />,
    leadName: "Marcus Vance",
    leadPhone: "(512) 839-4412",
    businessType: "Apex HVAC & Plumbing",
    autoReplyText: "Hey Marcus! Sorry I missed your call just now. Finishing up on a job. How can we help you today?",
    customerReplyText: "Hi! AC unit stopped blowing cold air this morning. Can someone come by today?",
    estimatedValue: "$450",
  },
  {
    id: "dental",
    name: "Medical / Clinic",
    icon: <Building2 className="w-3.5 h-3.5" />,
    leadName: "Elena Rostova",
    leadPhone: "(415) 670-1920",
    businessType: "Downtown Dental Studio",
    autoReplyText: "Hi Elena! Thanks for reaching out to Downtown Dental. We're with a patient—looking to book a cleaning or consultation?",
    customerReplyText: "Yes! Need an urgent consultation for toothache tomorrow morning please.",
    estimatedValue: "$320",
  },
  {
    id: "realtor",
    name: "Real Estate",
    icon: <Home className="w-3.5 h-3.5" />,
    leadName: "David Sterling",
    leadPhone: "(602) 441-9873",
    businessType: "Sterling Luxury Realty",
    autoReplyText: "Hello David! Sorry I missed your ring. In a showing right now. Which listing were you interested in seeing?",
    customerReplyText: "Saw the 4-bed on 12th St. Are you available for a private tour this Saturday?",
    estimatedValue: "$12,500",
  },
];

export function SpeedToLeadSimulator() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const activeScenario = scenarios[selectedScenarioIndex];

  // Simulation state
  const [step, setStep] = useState<"idle" | "calling" | "missed" | "sending" | "responded" | "converted">("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const startSimulation = () => {
    setStep("calling");
    setElapsedMs(0);

    // Call rings then drops
    setTimeout(() => {
      setStep("missed");

      // AI triggers response
      setTimeout(() => {
        setStep("sending");
        setElapsedMs(1240); // 1.24s speed to lead

        setTimeout(() => {
          setStep("responded");

          // Customer replies
          setTimeout(() => {
            setStep("converted");
          }, 1400);
        }, 1100);
      }, 700);
    }, 1200);
  };

  const reset = () => {
    setStep("idle");
    setElapsedMs(0);
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-border/80 via-border/40 to-primary/20 shadow-2xl backdrop-blur-xl">
      <div className="bg-card/95 dark:bg-zinc-950/95 rounded-[22px] p-5 sm:p-7 overflow-hidden border border-border/60">
        
        {/* Simulator Header & Scenarios */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              Interactive Demo <Sparkles className="w-3.5 h-3.5 text-primary" />
            </span>
          </div>

          {/* Industry Preset Selector */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            {scenarios.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenarioIndex(idx);
                  reset();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  idx === selectedScenarioIndex
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sc.icon}
                <span className="hidden sm:inline">{sc.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Simulation Canvas */}
        <div className="py-6 space-y-4">
          
          {/* Incoming Call / Missed Call Event */}
          <div className={`p-4 rounded-2xl border transition-all duration-500 ${
            step === "calling"
              ? "bg-amber-500/10 border-amber-500/40 animate-pulse"
              : step === "idle"
              ? "bg-muted/40 border-border/60"
              : "bg-red-500/10 border-red-500/30"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  step === "calling"
                    ? "bg-amber-500 text-white animate-bounce"
                    : step === "idle"
                    ? "bg-muted text-muted-foreground"
                    : "bg-red-500/20 text-red-500"
                }`}>
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    {step === "calling" ? "Incoming Call..." : step === "idle" ? "Ready for Call" : "Missed Call Registered"}
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {activeScenario.leadName} &bull; {activeScenario.leadPhone}
                  </div>
                </div>
              </div>

              {step === "idle" ? (
                <button
                  onClick={startSimulation}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Simulate Call
                </button>
              ) : (
                <button
                  onClick={reset}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  title="Reset demo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Speed to Lead Timer Gauge */}
          {(step === "sending" || step === "responded" || step === "converted") && (
            <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 fill-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Speed to Lead</span>
              </div>
              <div className="font-mono font-black text-sm tracking-tight flex items-center gap-1">
                <span>{(elapsedMs / 1000).toFixed(2)}s</span>
                <span className="text-[10px] uppercase font-bold text-primary/80">(Instant Auto-SMS)</span>
              </div>
            </div>
          )}

          {/* Chat Message Stream */}
          {(step === "sending" || step === "responded" || step === "converted") && (
            <div className="space-y-3 pt-2">
              
              {/* Outgoing AI Text */}
              <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-tr-xs p-3.5 text-xs sm:text-sm font-medium shadow-md">
                  <div className="text-[10px] font-bold text-primary-foreground/80 mb-1 flex items-center justify-between gap-4">
                    <span>HighReach AI Auto-Reply</span>
                    <span className="font-mono">Just now</span>
                  </div>
                  {activeScenario.autoReplyText}
                </div>
              </div>

              {/* Customer Response */}
              {(step === "responded" || step === "converted") && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-400">
                  <div className="max-w-[85%] bg-muted/80 text-foreground rounded-2xl rounded-tl-xs p-3.5 text-xs sm:text-sm font-medium border border-border/50">
                    <div className="text-[10px] font-bold text-muted-foreground mb-1 flex items-center justify-between gap-4">
                      <span>{activeScenario.leadName}</span>
                      <span className="font-mono">1s later</span>
                    </div>
                    {activeScenario.customerReplyText}
                  </div>
                </div>
              )}

              {/* Deal Captured Badge */}
              {step === "converted" && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between animate-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Customer Secured in {((elapsedMs + 200) / 1000).toFixed(1)}s
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Added to Pipeline &bull; Notification sent to team
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      +{activeScenario.estimatedValue}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Est. Deal</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Idle prompt if not started */}
          {step === "idle" && (
            <div className="text-center py-6 px-4 rounded-2xl bg-muted/20 border border-dashed border-border/80">
              <p className="text-xs text-muted-foreground leading-relaxed">
                62% of missed calls choose the first competitor who calls or texts them back.
                <br />
                <strong className="text-foreground font-semibold">Click &ldquo;Simulate Call&rdquo;</strong> to see HighReach capture the customer in under 2 seconds.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-primary" /> Telnyx & Resend Carrier Grade
          </span>
          <span className="font-semibold text-foreground flex items-center gap-1">
            Zero App Downloads Required <ArrowRight className="w-3 h-3" />
          </span>
        </div>

      </div>
    </div>
  );
}
