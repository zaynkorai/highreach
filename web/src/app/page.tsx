import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "../components/theme-toggle";
import { SpeedToLeadSimulator } from "../components/landing/speed-to-lead-simulator";
import { 
  Zap, 
  ArrowRight, 
  Star, 
  Check, 
  PhoneCall, 
  MessageSquare, 
  CreditCard, 
  Calendar, 
  CheckCircle2,
  TrendingUp,
  Layers
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">

      {/* Atmospheric Background Layers */}
      <div className="ambient-spotlight" />
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />

      {/* Navigation - Sticky Glass Header */}
      <nav className="fixed top-0 left-0 right-0 z-[100] glass-panel border-b border-border/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2.5 group/logo">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm shadow-primary/30 bg-background flex items-center justify-center p-0.5 border border-border group-hover:border-primary/50 transition-colors">
              <Image src="/icon.svg" alt="HighReach Logo" width={32} height={32} className="group-hover/logo:scale-110 transition-transform object-contain" />
            </div>
            <span className="text-xl font-extrabold text-foreground tracking-tight">
              HighReach
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest font-black text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
              AI Speed-to-Lead
            </span>
          </Link>

          {/* Central Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {["Features", "Pricing", "Reviews"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors hover:bg-foreground/5 rounded-lg"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>

            <Link href="/signup" className="shimmer-button relative px-5 py-2.5 overflow-hidden rounded-xl bg-primary text-primary-foreground font-bold text-xs tracking-wide shadow-lg shadow-primary/25 hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5">
              <span>Start Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <div className="w-px h-5 bg-border mx-1" />

            <div className="hover:bg-foreground/5 rounded-lg p-1 transition-colors">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-4 md:px-6 pt-32 sm:pt-36 pb-20 w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/80 border border-border/80 text-xs font-semibold text-foreground/90 backdrop-blur-md shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Average Response Speed: <strong className="text-primary font-bold">1.8 Seconds</strong></span>
            <span className="text-muted-foreground">&bull;</span>
            <span className="text-muted-foreground hidden sm:inline">Telnyx & OpenAI Powered</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] text-balance">
            Never lose a customer to a missed call again.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground font-normal leading-relaxed max-w-2xl text-balance">
            62% of missed calls hire the competitor who responds first. HighReach instantly texts back your missed callers with intelligent AI, answers questions, and locks in the appointment.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link 
              href="/signup" 
              className="shimmer-button px-8 py-4 bg-primary text-primary-foreground font-extrabold text-sm rounded-full shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Start Free 14-Day Trial</span>
            </Link>

            <Link 
              href="/dashboard" 
              className="px-7 py-4 bg-muted/60 hover:bg-muted text-foreground font-semibold text-sm rounded-full border border-border/70 hover:border-border transition-all flex items-center gap-2"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5-minute easy setup</span>
            <span className="hidden sm:flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cancel anytime</span>
          </div>
        </div>

        {/* Hero Interactive Simulation Demo */}
        <div className="mt-14 relative z-10">
          <SpeedToLeadSimulator />
        </div>
      </section>

      {/* How It Works - Visual Step Progression */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 border-t border-border/40">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">The 3-Step Advantage</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-2 text-foreground">
            Turn every ringing phone into booked revenue.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "You Miss a Call",
              desc: "You're with a customer, on a job, or busy living life. The phone rings and goes unanswered.",
              badge: "Traditional Lost Deal",
              badgeColor: "text-red-500 bg-red-500/10 border-red-500/20",
              icon: <PhoneCall className="w-6 h-6 text-red-500" />,
            },
            {
              step: "02",
              title: "AI Responds in 2s",
              desc: "Before they open Google to search for your competitor, HighReach texts them an intelligent, personalized reply.",
              badge: "HighReach Speed",
              badgeColor: "text-primary bg-primary/10 border-primary/20",
              icon: <Zap className="w-6 h-6 text-primary" />,
            },
            {
              step: "03",
              title: "Deal Locked & Logged",
              desc: "The customer books an appointment or confirms quote details. It flows directly into your pipeline and unified inbox.",
              badge: "Customer Secured",
              badgeColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
              icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
            },
          ].map((s, i) => (
            <div 
              key={i} 
              className="card-elevated card-interactive rounded-2xl p-7 bg-card/90 border border-border/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border">
                    {s.icon}
                  </div>
                  <span className="text-3xl font-black font-mono text-muted-foreground/30">{s.step}</span>
                </div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border mb-3 ${s.badgeColor}`}>
                  {s.badge}
                </span>
                <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 border-t border-border/40">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">All-in-One Operations</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-2 text-foreground">
            Everything your business needs to grow.
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-3">
            Replace 6 disjointed tools with one intuitive, high-velocity platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1: Missed Call Text-Back */}
          <div className="card-elevated card-interactive rounded-2xl p-7 bg-card/90 border border-border/60 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Missed Call Text-Back</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Autonomous SMS triggers fire within seconds of any missed inbound call. Tailored to your company voice.
              </p>
            </div>
            <div className="mt-6 p-3 rounded-xl bg-muted/60 border border-border/50 text-xs">
              <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Instant Simulation</div>
              <div className="text-foreground/90 italic">&ldquo;Hey there! Sorry I missed your call. How can our team help today?&rdquo;</div>
            </div>
          </div>

          {/* Feature 2: Unified Inbox */}
          <div className="card-elevated card-interactive rounded-2xl p-7 bg-card/90 border border-border/60 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Unified 2-Way Inbox</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                SMS, email inquiries, and website chat all merged into a single collaborative team thread.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border/50 text-xs">
              <span className="font-semibold text-foreground">Active Channels:</span>
              <div className="flex gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-background text-[10px] font-bold border border-border">SMS</span>
                <span className="px-2 py-0.5 rounded-md bg-background text-[10px] font-bold border border-border">Email</span>
                <span className="px-2 py-0.5 rounded-md bg-background text-[10px] font-bold border border-border">Web</span>
              </div>
            </div>
          </div>

          {/* Feature 3: Instant Text Invoices */}
          <div className="card-elevated card-interactive rounded-2xl p-7 bg-card/90 border border-border/60 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Text-to-Pay Invoicing</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Get paid on the spot. Generate and text 1-click payment links directly to clients from your mobile device.
              </p>
            </div>
            <div className="mt-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="font-bold text-emerald-600 dark:text-emerald-400">Invoice #2041</div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-mono font-bold text-[10px]">PAID $450</span>
            </div>
          </div>

          {/* Feature 4: Google Reputation Manager */}
          <div className="card-elevated card-interactive rounded-2xl p-7 bg-card/90 border border-border/60 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <Star className="w-5 h-5 fill-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Google Review Booster</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Automatically request 5-star Google reviews right after closing a job. Rocket your local SEO rankings.
              </p>
            </div>
            <div className="mt-6 p-3 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-between">
              <div className="flex gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-[11px] font-bold text-foreground">4.9 / 5.0 (140+ Reviews)</span>
            </div>
          </div>

          {/* Feature 5: Deal Pipeline */}
          <div className="card-elevated card-interactive rounded-2xl p-7 bg-card/90 border border-border/60 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Visual Kanban Pipeline</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Track every estimate, negotiation, and closed won customer with smooth drag-and-drop deal stages.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold">
              <span className="px-2 py-1 rounded-md bg-muted border border-border">Lead (12)</span>
              <span className="px-2 py-1 rounded-md bg-muted border border-border">Estimate (4)</span>
              <span className="px-2 py-1 rounded-md bg-primary/20 text-primary border border-primary/30">Won ($18.4k)</span>
            </div>
          </div>

          {/* Feature 6: 24/7 Booking Calendar */}
          <div className="card-elevated card-interactive rounded-2xl p-7 bg-card/90 border border-border/60 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Instant Booking Calendar</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Syncs directly with Google Calendar & Outlook. Let clients self-schedule appointments anytime without back-and-forth.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border/50 text-xs">
              <span className="text-muted-foreground font-medium">Tomorrow:</span>
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px]">10:00 AM &bull; Confirmed</span>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 border-t border-border/40">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">Transparent Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-2 text-foreground">
            Pick the plan that scales with your ambition.
          </h2>
          <p className="text-muted-foreground text-sm mt-3">
            All plans include full speed-to-lead automation, carrier-grade SMS, and unified inbox.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          
          {/* Tier 1: Free */}
          <div className="card-elevated rounded-2xl p-6 bg-card/80 border border-border/60 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Free Starter</div>
              <div className="text-3xl font-black text-foreground">$0<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
              <p className="text-xs text-muted-foreground mt-2 mb-6">Test out basic lead capture.</p>
              
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> 50 SMS / month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> Unified Email Inbox</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> 1 Custom Web Form</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> Basic CRM Contact List</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 w-full py-2.5 rounded-xl border border-border hover:bg-muted text-center font-bold text-xs transition-colors">
              Get Started
            </Link>
          </div>

          {/* Tier 2: Starter */}
          <div className="card-elevated rounded-2xl p-6 bg-card/80 border border-border/60 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Growth</div>
              <div className="text-3xl font-black text-foreground">$49<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
              <p className="text-xs text-muted-foreground mt-2 mb-6">For active solo operators.</p>
              
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> 500 SMS / month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> <strong>Missed Call Text-Back</strong></li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> 2-Way SMS Team Inbox</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> Unlimited Web Forms</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 w-full py-2.5 rounded-xl border border-border hover:bg-muted text-center font-bold text-xs transition-colors">
              Start Free Trial
            </Link>
          </div>

          {/* Tier 3: Pro (Highlighted) */}
          <div className="card-elevated rounded-2xl p-6 bg-card dark:bg-zinc-900 border-2 border-primary shadow-xl shadow-primary/10 relative flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-md">
              Most Popular
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2 mt-1">Pro Scale</div>
              <div className="text-3xl font-black text-foreground">$99<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
              <p className="text-xs text-muted-foreground mt-2 mb-6">Best for growing service businesses.</p>
              
              <ul className="space-y-3 text-xs text-foreground/90">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary font-bold" /> <strong>2,500 SMS / month</strong></li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary font-bold" /> Full Pipeline Kanban Board</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary font-bold" /> Google Review Auto-Requests</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary font-bold" /> 24/7 Booking Calendars</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary font-bold" /> AI Workflow Automations</li>
              </ul>
            </div>
            <Link href="/signup" className="shimmer-button mt-8 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-center font-bold text-xs shadow-md shadow-primary/30 hover:opacity-95 transition-opacity">
              Claim 14-Day Trial
            </Link>
          </div>

          {/* Tier 4: Agency */}
          <div className="card-elevated rounded-2xl p-6 bg-card/80 border border-border/60 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Agency / Multi</div>
              <div className="text-3xl font-black text-foreground">$199<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
              <p className="text-xs text-muted-foreground mt-2 mb-6">Multi-location & enterprise power.</p>
              
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> 6,000 SMS / month</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> Multi-location management</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> Custom Webhook API integrations</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> Dedicated account engineer</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 w-full py-2.5 rounded-xl border border-border hover:bg-muted text-center font-bold text-xs transition-colors">
              Contact Sales
            </Link>
          </div>

        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 border-t border-border/40">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">Proven ROI</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-2 text-foreground">
            Trusted by 2,000+ local businesses.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              quote: "I was losing 4 to 5 jobs every single week simply because I was on a roof and couldn't pick up. HighReach's instant text-back closed an extra $11,000 in our first month alone.",
              author: "Mike Reynolds",
              role: "Owner, Austin Precision Roofing",
              initials: "MR",
              growth: "+38% Close Rate"
            },
            {
              quote: "Our Google rating skyrocketed from 3.6 to 4.9 stars. Sending automated review requests right after our technicians wrap up has put us at the top of local map pack searches.",
              author: "Sarah K.",
              role: "Founder, Miami MedSpa Clinic",
              initials: "SK",
              growth: "4.9 Stars on Google"
            },
            {
              quote: "Before HighReach, I used 4 different tools: Calendly, Mailchimp, a CRM, and manual texting. Now everything lives in one slick place. It saves my office manager 15 hours a week.",
              author: "David Liu",
              role: "Director, Metro HVAC & Heating",
              initials: "DL",
              growth: "15 hrs/week saved"
            }
          ].map((t, i) => (
            <div key={i} className="card-elevated rounded-2xl p-7 bg-card/90 border border-border/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20">
                    {t.growth}
                  </span>
                </div>
                <p className="text-foreground/90 text-sm leading-relaxed italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-black text-sm flex items-center justify-center border border-primary/30">
                  {t.initials}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative z-10 px-6 py-24 border-t border-border/40">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Stop letting your missed calls go to competitors.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Set up HighReach in 5 minutes. Start converting your missed calls into paid clients today.
          </p>
          <div className="pt-2">
            <Link 
              href="/signup" 
              className="shimmer-button inline-flex items-center gap-2 px-9 py-4 bg-primary text-primary-foreground font-black text-sm rounded-full shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/icon.svg" alt="HighReach" width={20} height={20} />
            <span className="font-bold text-foreground">HighReach</span>
            <span>&bull; &copy; 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
