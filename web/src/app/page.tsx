import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "../components/theme-toggle";
import { SpeedToLeadSimulator } from "../components/landing/speed-to-lead-simulator";
import { HowItWorks } from "../components/landing/how-it-works";
import { FeaturesBento } from "../components/landing/features-bento";
import { ArrowRight, Check } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center p-0.5 border border-border">
              <Image src="/icon.svg" alt="HighReach" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              HighReach
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="#how-it-works"
              className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              How It Works
            </Link>
            <Link
              href="#features"
              className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              Features
            </Link>
            <Link
              href="#why-highreach"
              className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              Why HighReach
            </Link>
            <Link
              href="#pricing"
              className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-block px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <div className="w-px h-4 bg-border mx-1" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <section className="pt-32 sm:pt-36 pb-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-foreground text-balance">
              Take care of the job in front of you. <br className="hidden sm:inline" />
              We&apos;ll take care of the next one.
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto text-balance font-normal">
              Turn more conversations into revenue. HighReach replies and gathers what they need, and lines up the details so you never lose a customer while doing great work.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-7 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Start Free 14-Day Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-lg border border-border transition-colors flex items-center justify-center gap-2"
              >
                <span>Explore Live Dashboard</span>
              </Link>
            </div>
          </div>

          <div className="mt-16">
            <SpeedToLeadSimulator />
          </div>
        </section>

        <HowItWorks />

        <FeaturesBento />

        <section id="why-highreach" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-border">
          <div className="max-w-3xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
              Your customers want a conversation, not a voicemail
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              When someone reaches out with an urgent need, voicemail feels like a dead end. An immediate, personal text keeps them engaged.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-7 rounded-xl border border-border bg-muted/20 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Leaving callers on voicemail
              </div>
              <h3 className="text-xl font-bold text-foreground">
                The voicemail dead end
              </h3>
              <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold shrink-0">&times;</span>
                  <span>Callers often hang up because they do not know when someone will listen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold shrink-0">&times;</span>
                  <span>You listen to voicemails hours later between job sites.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold shrink-0">&times;</span>
                  <span>By the time you call back, they have frequently already spoken to another provider.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold shrink-0">&times;</span>
                  <span>Customer notes and conversation history remain scattered across sticky notes and personal phones.</span>
                </li>
              </ul>
            </div>

            <div className="p-7 rounded-xl border-2 border-foreground bg-card space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">
                Responding with HighReach
              </div>
              <h3 className="text-xl font-bold text-foreground">
                A connected, personal experience
              </h3>
              <ul className="space-y-3 text-xs text-foreground/90 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>A warm text response begins the conversation the moment the call drops.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Customers can text back photos, job details, and addresses on their own time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>You have all the context in writing before you reach back out.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>The entire conversation history stays organized in one shared inbox for your team.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-border">
          <div className="max-w-3xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1">
              Simple, transparent plans
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Start with a 14-day free trial. No credit card required, cancel anytime.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-border bg-card p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Professional
                </div>
                <div className="text-4xl font-extrabold text-foreground tracking-tight">
                  $400
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 mb-8 leading-relaxed">
                  For active service businesses and growing teams that need complete missed-call follow-up.
                </p>

                <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                  What&apos;s included:
                </div>
                <ul className="space-y-3 text-xs text-foreground/90">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold">Missed Call Text-Back automation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>2-Way Unified Team Inbox (SMS &amp; Email)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>3,000 SMS segments included per month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Visual Deal Pipeline (Kanban)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Google &amp; Outlook 24/7 Booking Sync</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Text-to-Pay Mobile Invoicing</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Automated Google Review Requests</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Up to 5 team member seats</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/signup"
                  className="w-full py-3 rounded-lg border border-border bg-background hover:bg-muted text-center font-semibold text-xs transition-colors text-foreground flex items-center justify-center gap-2"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <div className="text-[11px] text-muted-foreground text-center mt-2">
                  No credit card required &middot; 5-minute setup
                </div>
              </div>
            </div>

            <div className="rounded-xl border-2 border-foreground bg-card p-8 flex flex-col justify-between relative shadow-sm">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded bg-foreground text-background text-[10px] uppercase font-bold tracking-wider">
                Full Operations
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Scale &amp; Enterprise
                </div>
                <div className="text-4xl font-extrabold text-foreground tracking-tight">
                  $600
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 mb-8 leading-relaxed">
                  For multi-truck operations, high-volume clinics, and multi-location businesses.
                </p>

                <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                  Everything in Professional, plus:
                </div>
                <ul className="space-y-3 text-xs text-foreground/90">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold">8,000 SMS segments included per month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold">Unlimited team member seats</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Multi-location &amp; territory call routing</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Custom Workflow Automations &amp; Webhooks</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Priority carrier throughput (10DLC A2P)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Dedicated onboarding engineer &amp; live setup</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Priority phone &amp; chat support</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Quarterly workflow &amp; conversion reviews</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/signup"
                  className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-center font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-[11px] text-muted-foreground text-center mt-2">
                  No credit card required &middot; Priority onboarding
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-border">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Ready to stop losing customers to missed calls?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Setup takes only a few minutes with your existing business number. Start your free 14-day trial with no credit card required.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg shadow-sm active:scale-95 transition-all"
              >
                <span>Start Free 14-Day Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/icon.svg" alt="HighReach" width={20} height={20} />
            <span className="font-bold text-foreground">HighReach</span>
            <span>&copy; {new Date().getFullYear()}. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Account Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
