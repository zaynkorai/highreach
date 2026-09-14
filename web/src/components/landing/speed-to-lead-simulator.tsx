"use client";

import { useState } from "react";
import { Check, ArrowRight, RotateCcw } from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  leadName: string;
  leadPhone: string;
  businessType: string;
  inquiry: string;
  autoReplyText: string;
  customerReplyText: string;
  confirmationText: string;
  dealStage: string;
}

const scenarios: Scenario[] = [
  {
    id: "trades",
    name: "Plumbing & HVAC",
    leadName: "Marcus Vance",
    leadPhone: "(512) 839-4412",
    businessType: "Apex Home Services",
    inquiry: "Leaking pipe under kitchen sink",
    autoReplyText: "Hi Marcus, sorry we missed your call at Apex! We're currently out on a job. What can we help you with today?",
    customerReplyText: "We have a pipe leaking under the kitchen sink. Can someone come take a look?",
    confirmationText: "We have an opening tomorrow between 9:00 AM and 11:00 AM to inspect it. Does that time work for you?",
    dealStage: "Estimate Scheduled",
  },
  {
    id: "dental",
    name: "Dental Practice",
    leadName: "Elena Rostova",
    leadPhone: "(415) 670-1920",
    businessType: "Downtown Dental",
    inquiry: "New patient cleaning & checkup",
    autoReplyText: "Hi Elena, thanks for calling Downtown Dental. We're assisting patients at the front desk right now—are you looking to book an appointment?",
    customerReplyText: "Yes, looking to schedule a cleaning and checkup sometime this week.",
    confirmationText: "We have an opening this Thursday at 2:00 PM with Dr. Chen. Would that work for you?",
    dealStage: "Appointment Scheduled",
  },
  {
    id: "realty",
    name: "Real Estate",
    leadName: "David Sterling",
    leadPhone: "(602) 441-9873",
    businessType: "Sterling Realty",
    inquiry: "Showing request on 12th St",
    autoReplyText: "Hi David, sorry I missed your call, currently in a showing. Which property or listing were you inquiring about?",
    customerReplyText: "Looking at the 12th St listing. Are you available for a walkthrough this weekend?",
    confirmationText: "We are showing the property this Saturday at 10:00 AM. I've added you to the visitor list.",
    dealStage: "Showing Scheduled",
  },
];

export function SpeedToLeadSimulator() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const activeScenario = scenarios[selectedScenarioIndex];

  const [step, setStep] = useState<"idle" | "calling" | "missed" | "sending" | "responded" | "converted">("idle");

  const startSimulation = () => {
    setStep("calling");

    setTimeout(() => {
      setStep("missed");

      setTimeout(() => {
        setStep("sending");

        setTimeout(() => {
          setStep("responded");

          setTimeout(() => {
            setStep("converted");
          }, 1200);
        }, 1100);
      }, 600);
    }, 1100);
  };

  const reset = () => {
    setStep("idle");
  };

  return (
    <div className="w-full max-w-6xl mx-auto rounded-xl border border-border bg-card shadow-sm overflow-hidden text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-6 border-b border-border bg-muted/30">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Interactive Walkthrough
          </div>
          <div className="text-base font-bold text-foreground mt-0.5">
            How a missed call turns into a conversation
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {scenarios.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => {
                setSelectedScenarioIndex(idx);
                reset();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                idx === selectedScenarioIndex
                  ? "bg-foreground text-background font-semibold shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        <div className="lg:col-span-5 p-6 space-y-5 bg-muted/10">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Business Profile
            </div>
            <div className="text-base font-bold text-foreground">
              {activeScenario.businessType}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Connected to existing business phone number
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Caller
              </div>
              <div className="text-sm font-bold text-foreground">
                {activeScenario.leadName}
              </div>
              <div className="text-muted-foreground font-mono">
                {activeScenario.leadPhone}
              </div>
              <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                Reason: <span className="text-foreground font-medium">{activeScenario.inquiry}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card space-y-2.5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Activity
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inbound Call:</span>
                  <span className="font-medium text-foreground">
                    {step === "idle" ? "Ready" : step === "calling" ? "Ringing..." : "Unanswered"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Follow-Up Text:</span>
                  <span className="font-medium text-foreground">
                    {step === "idle" || step === "calling" || step === "missed" ? "Waiting" : "Sent"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Step:</span>
                  <span className="font-medium text-foreground">
                    {step === "converted" ? activeScenario.dealStage : "Pending reply"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {step === "idle" ? (
              <button
                type="button"
                onClick={startSimulation}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Simulate Missed Call</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={reset}
                className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg border border-border transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Walkthrough</span>
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 p-6 flex flex-col justify-between bg-card min-h-[440px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{activeScenario.leadName}</span>
                <span className="text-muted-foreground font-mono">({activeScenario.leadPhone})</span>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {step === "calling"
                  ? "Incoming call..."
                  : step === "missed"
                  ? "Call missed"
                  : step === "idle"
                  ? "Ready"
                  : "Active text thread"}
              </div>
            </div>

            <div className="py-6 space-y-4">
              {step === "calling" && (
                <div className="p-4 rounded-lg bg-muted border border-border text-xs text-center space-y-1">
                  <div className="font-bold text-foreground">Incoming phone call ringing...</div>
                  <div className="text-muted-foreground">You are currently occupied with another job</div>
                </div>
              )}

              {step === "missed" && (
                <div className="p-4 rounded-lg bg-muted border border-border text-xs text-center space-y-1">
                  <div className="font-bold text-foreground">Call missed &middot; Sending text message</div>
                  <div className="text-muted-foreground">HighReach initiates text follow-up immediately</div>
                </div>
              )}

              {(step === "sending" || step === "responded" || step === "converted") && (
                <div className="space-y-3.5">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-primary text-primary-foreground rounded-xl rounded-tr-xs p-3.5 text-xs sm:text-sm font-normal shadow-xs">
                      <div className="text-[10px] uppercase font-semibold text-primary-foreground/80 mb-1 flex justify-between gap-4">
                        <span>Your Business</span>
                        <span>Just now</span>
                      </div>
                      <p className="leading-relaxed">{activeScenario.autoReplyText}</p>
                      <div className="text-[10px] text-primary-foreground/80 mt-1.5 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" />
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>

                  {(step === "responded" || step === "converted") && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-muted text-foreground rounded-xl rounded-tl-xs p-3.5 text-xs sm:text-sm font-normal border border-border">
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1 flex justify-between gap-4">
                          <span>{activeScenario.leadName}</span>
                          <span>1 min later</span>
                        </div>
                        <p className="leading-relaxed">{activeScenario.customerReplyText}</p>
                      </div>
                    </div>
                  )}

                  {step === "converted" && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-primary text-primary-foreground rounded-xl rounded-tr-xs p-3.5 text-xs sm:text-sm font-normal shadow-xs">
                        <div className="text-[10px] uppercase font-semibold text-primary-foreground/80 mb-1 flex justify-between gap-4">
                          <span>Your Business</span>
                          <span>Just now</span>
                        </div>
                        <p className="leading-relaxed">{activeScenario.confirmationText}</p>
                        <div className="text-[10px] text-primary-foreground/80 mt-1.5 flex items-center gap-1 font-medium">
                          <Check className="w-3 h-3" />
                          <span>Added to Schedule</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === "idle" && (
                <div className="text-center py-12 px-6 rounded-lg bg-muted/20 border border-dashed border-border">
                  <div className="text-sm font-bold text-foreground mb-1">
                    Ready to test
                  </div>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Click &ldquo;Simulate Missed Call&rdquo; to see the message exchange between your business and a customer who calls while you are busy.
                  </p>
                </div>
              )}
            </div>
          </div>

          {step === "converted" && (
            <div className="p-3.5 rounded-lg bg-muted border border-border flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-foreground">Pipeline Stage:</span>{" "}
                <span className="text-foreground">{activeScenario.dealStage}</span>
              </div>
              <div className="text-muted-foreground">
                Logged in your team inbox
              </div>
            </div>
          )}

          {step !== "converted" && (
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Uses your existing business phone number</span>
              <span className="font-medium text-foreground">No customer app required</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
