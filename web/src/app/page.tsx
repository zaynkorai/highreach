import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "../components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">






      {/* Navigation - Full Width Sticky */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-background border-b border-border/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group/logo">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm shadow-primary/20 bg-background flex items-center justify-center p-0.5 border border-border">
              <Image src="/icon.svg" alt="HighReach Logo" width={32} height={32} className="group-hover/logo:scale-110 transition-transform object-contain" />
            </div>
            <span className="text-xl font-semibold text-foreground tracking-tight">
              HighReach
            </span>
          </Link>

          {/* Central Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {["Features", "Pricing", "Reviews"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors hover:bg-foreground/5 rounded-lg"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>

            <Link href="/signup" className="group/btn relative px-5 py-2 overflow-hidden rounded-xl active:scale-95 transition-all">
              {/* Neon Border Effect */}
              <div className="absolute inset-0 bg-primary animate-pulse" />
              <div className="absolute inset-[1px] bg-background rounded-[11px] group-hover/btn:bg-transparent transition-colors" />
              <span className="relative text-[10px] font-black uppercase tracking-[0.2em] text-foreground group-hover/btn:text-background transition-colors">
                Get Started
              </span>
              {/* Glow */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-4 bg-primary blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            </Link>

            <div className="w-px h-6 bg-border mx-2" />

            <div className="hover:bg-foreground/5 rounded-lg p-1 transition-colors">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero - Alignment Grid Layout */}
      <section className="relative z-10 px-4 md:px-6 pt-32 pb-24 w-full max-w-7xl mx-auto border-x border-border/40">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 border-y border-border/40">

          {/* Column 1: The Problem (Chaos) */}
          <div className="hidden lg:flex flex-col justify-between p-8 border-r border-border/40 min-h-[500px]">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-red-500/80 uppercase tracking-wider mb-1">Missed Call</div>
                    <div className="text-sm font-semibold text-foreground/90">Unknown Number</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 & 3: The Solution (Control) - Centerpiece */}
          <div className="lg:col-span-2 border-r border-border/40 flex flex-col items-center justify-center text-center p-12 md:p-24">
            <div className="space-y-8">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                GROW YOUR<br />BUSINESS.
              </h1>

              <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-md mx-auto">
                The ultimate tool for business owners. Manage customers, automate tasks, and scale operations with <span className="text-foreground font-bold">one simple platform.</span>
              </p>

              <div className="pt-4">
                <Link href="/signup" className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background font-bold rounded-full hover:opacity-90 transition-all active:scale-95">
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>

          {/* Column 4: The Result (Growth) */}
          <div className="hidden lg:flex flex-col justify-between p-8 min-h-[500px]">
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wide mb-2">AI Response</div>
                <div className="text-sm text-foreground/80 font-medium italic">&ldquo;Hey! Sorry I missed you. How can I help?&rdquo;</div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide">Lead Captured</span>
                  <span className="text-xs font-bold text-green-500">+$250</span>
                </div>
                <div className="w-full bg-border rounded-full h-1">
                  <div className="bg-green-500 h-full w-[80%] rounded-full" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-2">
                <div className="flex gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <div className="text-xs font-bold">5-Star Review</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* How It Works - Grid Layout */}
      <section className="relative z-10 w-full max-w-7xl mx-auto border-x border-border/40 border-b border-border/40">
        <div className="grid md:grid-cols-3 divide-x divide-border/40">
          {[
            {
              title: "You Miss A Call",
              desc: "It happens. You're busy working or living life. The phone rings, and you can't answer.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            },
            {
              title: "We Jump In",
              desc: "Before they call a competitor, we text them back: \"Hey! Sorry I missed you. How can I help?\"",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            },
            {
              title: "You Win the Lead",
              desc: "The conversation starts. You get the lead. You look professional. Effortlessly.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            }
          ].map((step, i) => (
            <div key={i} className="p-12 flex flex-col items-center text-center group hover:bg-muted/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-8 border border-border group-hover:border-primary/50 transition-colors">
                <svg className="w-8 h-8 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">{step.icon}</svg>
              </div>
              <h3 className="text-xl font-bold mb-4">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Features - Grid Layout */}
      <section id="features" className="relative z-10 w-full max-w-7xl mx-auto border-x border-border/40 border-b border-border/40 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-border/40">
          {[
            {
              title: "Missed Call Text Back",
              desc: "Never lose a lead again. Instant automated responses the moment you miss a call.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            },
            {
              title: "Unified Inbox",
              desc: "Texts, emails, and DMs all in one place. Stop switching between a dozen apps.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            },
            {
              title: "Instant Invoices",
              desc: "Get paid faster. Send professional invoices via text link in seconds.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            },
            {
              title: "Reputation Manager",
              desc: "Boost your Google ranking. Automatically request reviews from happy customers.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            },
            {
              title: "Simple CRM",
              desc: "Manage leads without the bloat. Just the tools you need to stay organized.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20H7v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            },
            {
              title: "Booking Online",
              desc: "Let customers book 24/7. Syncs perfectly with your calendar.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            }
          ].map((feature, i) => (
            <div key={i} className="p-12 group hover:bg-muted/20 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-6 border border-border group-hover:bg-background transition-colors">
                <svg className="w-6 h-6 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">{feature.icon}</svg>
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Pricing - Plain & Simple */}
      <section id="pricing" className="relative z-10 w-full max-w-7xl mx-auto border-x border-border/40 border-b border-border/40 py-24">
        <div className="px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Pricing</h2>
            <p className="text-muted-foreground">Straightforward plans for every stage.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border border-border/40">
            <PricingCard tier="Free" price={0} features={["50 SMS/mo", "Email inbox", "Basic CRM", "1 Form"]} />
            <PricingCard tier="Starter" price={49} features={["500 SMS/mo", "Missed call text-back", "SMS inbox", "Unlimited forms"]} />
            <PricingCard tier="Pro" price={99} features={["2,000 SMS/mo", "Pipeline view", "Booking calendar", "Review requests"]} />
            <PricingCard tier="Agency" price={199} features={["5,000 SMS/mo", "White-label", "Multi-location", "Priority support"]} />
          </div>
        </div>
      </section>


      {/* Testimonials */}
      <section id="reviews" className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-brand-400 text-sm font-semibold tracking-wider uppercase mb-4">Reviews</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              People Are Talking
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <TestimonialCard quote="I was missing 40% of my calls while on jobs. Now every missed call gets an instant text. My close rate went up 35%." author="Mike R." role="Plumber, Austin TX" />
            <TestimonialCard quote="Setup took 10 minutes. Within a week, we went from 3.2 to 4.6 stars on Google. The review request feature is magic." author="Sarah K." role="Salon Owner, Miami FL" />
            <TestimonialCard quote="I used to pay an admin $2000/mo just to answer phones. This does it better for $49. No brainer." author="David L." role="HVAC Tech, Denver CO" />
            <TestimonialCard quote="My customers think I have a whole support team. Nope, just me and HighReach." author="Jenny P." role="Photographer, Seattle WA" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-10">
            Join 2,000+ happy business owners who let HighReach handle the busy work.
          </p>
          <Link href="/signup" className="group inline-flex items-center gap-2 bg-foreground text-background font-semibold px-8 py-4 rounded-full hover:opacity-90 transition">
            Start My Free Trial
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-zinc-500 text-sm">© 2026 HighReach. Built for busy business owners.</span>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-black dark:hover:text-white transition">Privacy</Link>
              <Link href="/terms" className="hover:text-black dark:hover:text-white transition">Terms</Link>
              <Link href="/support" className="hover:text-black dark:hover:text-white transition">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ tier, price, features }: { tier: string; price: number; features: string[] }) {
  return (
    <div className="bg-background p-8 flex flex-col items-center text-center">
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">{tier}</h3>
        <div className="text-4xl font-bold text-foreground">${price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
      </div>
      <ul className="space-y-4 mb-10 flex-1">
        {features.map((f, i) => (
          <li key={i} className="text-sm text-muted-foreground">{f}</li>
        ))}
      </ul>
      <Link href="/signup" className="w-full py-3 border border-border font-bold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors rounded-none">
        Select Plan
      </Link>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
      <div className="flex gap-0.5 mb-4">{[1, 2, 3, 4, 5].map((i) => <svg key={i} className="w-4 h-4 text-brand-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}</div>
      <p className="text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div><div className="font-medium text-foreground dark:text-white">{author}</div><div className="text-zinc-500 dark:text-zinc-400 text-sm">{role}</div></div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="group border border-zinc-200 dark:border-white/10 rounded-2xl bg-background overflow-hidden transition-all hover:border-primary/50">
      <details className="p-6 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex items-center justify-between gap-4 font-semibold text-lg text-foreground list-none">
          {question}
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center transition-transform group-open:rotate-180">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </summary>
        <div className="mt-4 text-muted-foreground leading-relaxed animate-in slide-in-from-top-2 fade-in duration-300">
          {answer}
        </div>
      </details>
    </div>
  );
}
