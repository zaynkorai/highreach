import Link from "next/link";
import { ThemeToggle } from "../components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">






      {/* Navigation */}
      <nav className="relative z-50 px-6 py-5 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-black font-black text-lg">G</span>
              </div>
            </div>
            <span className="text-xl font-semibold tracking-tight">
              GHL<span className="text-emerald-400">Lite</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-full px-2 py-1">
            {["Features", "Pricing", "Reviews"].map((item) => (
              <Link key={item} href={`#${item.toLowerCase()}`} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:bg-white/5 rounded-full transition">
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white text-sm font-medium transition">
              Login
            </Link>
            <Link href="/signup" className="group relative px-5 py-2.5 rounded-full text-sm font-semibold overflow-hidden bg-emerald-500 hover:bg-emerald-400 transition">
              <span className="relative text-black">Get Started</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-12 pt-20 md:pt-32 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Pill Badge */}
          <div className="flex justify-center mb-8">
            <div className="group inline-flex items-center gap-3 bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] rounded-full pl-1.5 pr-4 py-1.5 transition cursor-pointer">
              <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                NEW
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-300 transition">AI-powered review responses now live</span>
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-8">
            <span className="block text-black dark:text-white">Never Miss</span>
            <span className="block text-emerald-400">
              Another Lead
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-center text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            The all-in-one CRM that <span className="text-black dark:text-white">texts back instantly</span> when you miss a call, captures leads 24/7, and gets you more 5-star reviews.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup" className="group relative w-full sm:w-auto">
              <div className="relative flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-xl transition">
                Start Free — No Card Required
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
            <Link href="/demo" className="flex items-center justify-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white font-medium px-6 py-4 rounded-xl border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/5 dark:bg-white/5 transition w-full sm:w-auto">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Watch 2-min Demo
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-black" />
                ))}
              </div>
              <span>2,000+ businesses</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-4">Features</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Everything you need.<br />
              <span className="text-zinc-500">Nothing you don&apos;t.</span>
            </h2>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Large Card */}
            <div className="md:col-span-2 group relative bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-8 overflow-hidden hover:border-emerald-500/30 transition-all">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-foreground dark:text-white">Missed Call Text-Back</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed max-w-md">
                  Miss a call? We&apos;ll text them back in seconds. <span className="text-black dark:text-white">&ldquo;Hey, sorry I missed you! How can I help?&rdquo;</span> — automatically.
                </p>
              </div>
            </div>

            {/* Small Card 1 */}
            <div className="group relative bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-6 overflow-hidden hover:border-cyan-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground dark:text-white">Unified Inbox</h3>
              <p className="text-zinc-600 dark:text-zinc-400">SMS, email, DMs — all in one place.</p>
            </div>

            {/* Small Card 2 */}
            <div className="group relative bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-6 overflow-hidden hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground dark:text-white">Review Booster</h3>
              <p className="text-zinc-600 dark:text-zinc-400">One-click 5-star review requests.</p>
            </div>

            {/* Small Card 3 */}
            <div className="md:col-span-2 group relative bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-6 overflow-hidden hover:border-violet-500/30 transition-all">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground dark:text-white">Simple CRM + Forms</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">Contact management and lead capture forms. No bloat — just what works.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-4">Pricing</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Start free. Scale when ready.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PricingCard tier="Free" price={0} features={["50 SMS/mo", "Email inbox", "Basic CRM", "1 Form"]} />
            <PricingCard tier="Starter" price={49} features={["500 SMS/mo", "Missed call text-back", "SMS inbox", "Unlimited forms"]} highlighted />
            <PricingCard tier="Pro" price={99} features={["2,000 SMS/mo", "Pipeline view", "Booking calendar", "Review requests"]} />
            <PricingCard tier="Agency" price={199} features={["5,000 SMS/mo", "White-label", "Multi-location", "Priority support"]} />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-4">Reviews</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Loved by local businesses
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <TestimonialCard quote="I was missing 40% of my calls while on jobs. Now every missed call gets an instant text. My close rate went up 35%." author="Mike R." role="Plumber, Austin TX" />
            <TestimonialCard quote="Setup took 10 minutes. Within a week, we went from 3.2 to 4.6 stars on Google. The review request feature is magic." author="Sarah K." role="Salon Owner, Miami FL" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Ready to stop missing leads?
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-10">
            Join 2,000+ businesses growing with GHL Lite.
          </p>
          <Link href="/signup" className="group inline-flex items-center gap-2 bg-foreground text-background font-semibold px-8 py-4 rounded-full hover:opacity-90 transition">
            Start Your Free Trial
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
            <span className="text-zinc-500 text-sm">© 2026 GHL Lite. Built for busy business owners.</span>
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

function PricingCard({ tier, price, features, highlighted = false }: { tier: string; price: number; features: string[]; highlighted?: boolean }) {
  return (
    <div className={`relative rounded-2xl p-6 transition-all hover:-translate-y-1 ${highlighted ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"}`}>
      {highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">Popular</div>}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-white">{tier}</h3>
      </div>
      <div className="text-4xl font-bold mb-6 text-foreground dark:text-white">${price}<span className="text-base text-zinc-500 dark:text-zinc-400 font-normal">/mo</span></div>
      <ul className="space-y-3 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            {f}
          </li>
        ))}
      </ul>
      <Link href="/signup" className={`block text-center py-3 rounded-xl font-medium text-sm transition ${highlighted ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20"}`}>
        Get Started
      </Link>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
      <div className="flex gap-0.5 mb-4">{[1, 2, 3, 4, 5].map((i) => <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}</div>
      <p className="text-zinc-700 dark:text-zinc-300 mb-4 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div><div className="font-medium text-foreground dark:text-white">{author}</div><div className="text-zinc-500 dark:text-zinc-400 text-sm">{role}</div></div>
    </div>
  );
}
