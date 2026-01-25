import Link from "next/link";
import { ThemeToggle } from "../components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">






      {/* Navigation - Full Width Sticky */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-xl border-b border-primary/10 dark:border-primary/20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group/logo">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover/logo:scale-110 transition-transform shadow-primary/40">
                <span className="text-primary-foreground font-black text-sm">G</span>
              </div>
              <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-50" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-sm font-black tracking-widest text-foreground uppercase italic">Galaxy</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] opacity-80">Lite</span>
            </div>
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

      {/* Hero - Command Grid Layout */}
      <section className="relative z-10 px-4 md:px-6 pt-24 pb-12 w-full max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">

          {/* Column 1: The Problem (Chaos) */}
          <div className="hidden lg:flex flex-col justify-between p-6 rounded-[2rem] bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 overflow-hidden relative group transition-all hover:bg-white/50 dark:hover:bg-white/[0.07]">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ring-4 ring-red-500/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Missed Opportunities</span>
            </div>

            {/* Missed Call Items - Floating Effect */}
            <div className="space-y-4 relative z-10 mask-image-b-gradient">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 backdrop-blur-sm transition-all hover:scale-[1.02] group/item">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 group-hover/item:bg-red-500/20 transition-colors">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-wider">Missed Call</span>
                      <span className="text-[10px] text-muted-foreground font-mono">2m ago</span>
                    </div>
                    <div className="text-sm font-bold text-foreground/90 truncate">Unknown Number</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Fade out bottom */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/10 to-transparent pointer-events-none" />
          </div>

          {/* Column 2 & 3: The Solution (Control) - Centerpiece */}
          <div className="lg:col-span-2 rounded-[2rem] bg-white/30 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 overflow-hidden relative flex flex-col items-center justify-center text-center p-8 md:p-16 group">

            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            {/* Typography */}
            <div className="relative z-10 space-y-8 max-w-2xl">
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.85] select-none">
                <span className="block text-foreground gradient-text-subtle">GROW YOUR</span>
                <span className="block text-foreground gradient-text-subtle">BUSINESS TODAY.</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-lg mx-auto">
                The ultimate tool for business owners. Manage your customers, automate your tasks, and scale your operations with <span className="text-foreground font-bold border-b-2 border-primary/30">one simple platform.</span>
              </p>

              {/* Enhanced CTA */}
              <div className="pt-4">
                {/* Re-using the nav button style or making a bigger variant */}
                <Link href="/signup" className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden rounded-full bg-foreground text-background font-bold transition-all hover:scale-105">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <span className="relative flex items-center gap-2">
                    Start Free Trial
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </span>
                </Link>
              </div>
            </div>

            {/* Decorative noise/grain if user had it - skipping for clean look */}
          </div>

          {/* Column 4: The Result (Growth) */}
          <div className="hidden lg:flex flex-col justify-between p-6 rounded-[2rem] bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 overflow-hidden relative group transition-all hover:bg-white/50 dark:hover:bg-white/[0.07]">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Revenue Saved</span>
            </div>

            {/* Success Items - Floating Effect */}
            <div className="space-y-4 relative z-10">
              {/* Card 1 */}
              <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/10 transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-[10px]">AI</div>
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wide">We Handled It</div>
                </div>
                <div className="text-sm text-foreground/80 font-medium leading-snug">&ldquo;Hey! Sorry I missed you. How can I help?&rdquo;</div>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 backdrop-blur-sm transition-all hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wide">Lead Captured</span>
                  <span className="text-xs font-mono font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">+$250</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div className="bg-green-500 h-full w-[80%] rounded-full" />
                </div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-[0.1em] font-medium">CRM Updated Automatically</div>
              </div>

              {/* Card 3 */}
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 backdrop-blur-sm flex flex-col gap-2 transition-all hover:scale-[1.02]">
                <div className="flex gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <div className="text-xs font-bold text-foreground">Nice! A 5-Star Review</div>
              </div>
            </div>
            {/* Fade out bottom */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/10 to-transparent pointer-events-none" />
          </div>

        </div>
      </section>

      {/* Trusted By Strip */}
      <section className="relative z-10 border-y border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
            TRUSTED BY BUSINESSES THAT ACTUALLY SLEEP AT NIGHT
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {["Nexus", "Vortex", "Horizon", "Elevate", "Momentum"].map((brand) => (
              <span key={brand} className="text-xl md:text-2xl font-black text-foreground">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Visual Arts Polish */}
      <section className="relative z-10 px-6 md:px-12 py-32 bg-background border-t border-zinc-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 text-foreground">
              From &ldquo;Missed&rdquo; to <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-400 to-zinc-600 dark:from-zinc-400 dark:to-zinc-600">Money in the Bank.</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We&apos;ve distilled lead capture down to a science. Three automated steps that run 24/7, so you never have to worry about a missed opportunity again.
            </p>
          </div>

          <div className="relative grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Timeline Connector (Desktop) */}
            <div className="hidden md:block absolute top-[3.5rem] left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-zinc-300 dark:via-white/20 to-transparent" />

            {/* Step 1 */}
            <div className="relative group perspective-1000">
              <div className="relative flex flex-col items-center text-center p-8 rounded-[2rem] bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 transition-all duration-500 group-hover:translate-y-[-10px] group-hover:shadow-2xl group-hover:shadow-zinc-200/50 dark:group-hover:shadow-none group-hover:bg-white dark:group-hover:bg-white/[0.05]">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-5xl font-black text-foreground select-none">01</div>

                <div className="w-28 h-28 rounded-full bg-white dark:bg-[#0A0A0A] border-[6px] border-zinc-50 dark:border-[#111] flex items-center justify-center mb-10 z-10 shadow-xl group-hover:scale-110 transition-transform duration-500 relative">
                  <div className="absolute inset-0 rounded-full border border-zinc-200 dark:border-white/10" />
                  <svg className="w-10 h-10 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
                </div>

                <h3 className="text-2xl font-bold mb-4 tracking-tight">You Miss A Call</h3>
                <p className="text-muted-foreground leading-relaxed">It happens to the best of us. You&apos;re busy working, driving, or living life. The phone rings, and you can&apos;t answer.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group perspective-1000">
              <div className="relative flex flex-col items-center text-center p-8 rounded-[2rem] bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 transition-all duration-500 group-hover:translate-y-[-10px] group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:bg-white dark:group-hover:bg-white/[0.05]">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-5xl font-black text-primary select-none">02</div>

                <div className="w-28 h-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-10 z-10 shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform duration-500 relative ring-8 ring-primary/10">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>

                <h3 className="text-2xl font-bold mb-4 tracking-tight">We Jump In Instantly</h3>
                <p className="text-muted-foreground leading-relaxed">Before they can call your competitor, Galaxy Lite texts them back: &ldquo;Hey! Sorry I missed you. How can I help?&rdquo;</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group perspective-1000">
              <div className="relative flex flex-col items-center text-center p-8 rounded-[2rem] bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/5 transition-all duration-500 group-hover:translate-y-[-10px] group-hover:shadow-2xl group-hover:shadow-green-500/10 group-hover:bg-white dark:group-hover:bg-white/[0.05]">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity text-5xl font-black text-green-500 select-none">03</div>

                <div className="w-28 h-28 rounded-full bg-white dark:bg-[#0A0A0A] border-[6px] border-zinc-50 dark:border-[#111] flex items-center justify-center mb-10 z-10 shadow-xl group-hover:scale-110 transition-transform duration-500 relative">
                  <div className="absolute inset-0 rounded-full border border-zinc-200 dark:border-white/10" />
                  <svg className="w-10 h-10 text-green-600 dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>

                <h3 className="text-2xl font-bold mb-4 tracking-tight">You Win the Lead</h3>
                <p className="text-muted-foreground leading-relaxed">The conversation starts. You get the lead. You look professional. And you didn&apos;t even have to pick up the phone.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features - Museum Quality */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-32 bg-zinc-50 dark:bg-black">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-8xl font-black tracking-tighter mb-8 text-foreground">
              ALL SIGNAL.<br />
              <span className="text-zinc-400 dark:text-zinc-700">NO NOISE.</span>
            </h2>
            <p className="max-w-xl mx-auto text-xl text-muted-foreground font-medium">
              We stripped away the clutter to give you exactly what you need to grow.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 md:gap-8">

            {/* Main Feature: Missed Call Text Back (Span 8) */}
            <div className="md:col-span-6 lg:col-span-8 group relative rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50">
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-64 h-64 text-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
              </div>

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="mb-8">
                  <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-foreground mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </span>
                  <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">The &ldquo;I Got You&rdquo; Text</h3>
                  <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-lg leading-relaxed">
                    You can&apos;t practice cloning yourself yet. Until then, we text every missed call instantly. It&apos;s the closest thing to magic.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                  See it in action <span className="text-lg">&rarr;</span>
                </div>
              </div>
            </div>

            {/* Side Feature: Reviews (Span 4) */}
            <div className="md:col-span-6 lg:col-span-4 group relative rounded-[2.5rem] bg-zinc-900 dark:bg-white text-white dark:text-black p-8 md:p-12 overflow-hidden transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map(i => <svg key={i} className="w-6 h-6 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">Reputation<br />Polisher</h3>
                  <p className="opacity-80 leading-relaxed">Ask for reviews without the awkwardness. Watch 5 stars roll in.</p>
                </div>
              </div>
            </div>

            {/* Bottom Row - Three Cards */}
            <div className="md:col-span-6 lg:col-span-4 group relative rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Unified Inbox</h3>
              <p className="text-muted-foreground">Texts, emails, DMs. One screen to rule them all.</p>
            </div>

            <div className="md:col-span-6 lg:col-span-4 group relative rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Instant Invoices</h3>
              <p className="text-muted-foreground">Text an invoice. Get paid in seconds. Cha-ching.</p>
            </div>

            <div className="md:col-span-6 lg:col-span-4 group relative rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Simple CRM</h3>
              <p className="text-muted-foreground">No bloated software. Just the contacts that pay you.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-indigo-400 text-sm font-semibold tracking-wider uppercase mb-4">Pricing</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Simple Pricing. No Surprises.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">We believe in transparent pricing. Start for free, grow when you&apos;re ready.</p>
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
            <span className="inline-block text-indigo-400 text-sm font-semibold tracking-wider uppercase mb-4">Reviews</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              People Are Talking
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <TestimonialCard quote="I was missing 40% of my calls while on jobs. Now every missed call gets an instant text. My close rate went up 35%." author="Mike R." role="Plumber, Austin TX" />
            <TestimonialCard quote="Setup took 10 minutes. Within a week, we went from 3.2 to 4.6 stars on Google. The review request feature is magic." author="Sarah K." role="Salon Owner, Miami FL" />
            <TestimonialCard quote="I used to pay an admin $2000/mo just to answer phones. This does it better for $49. No brainer." author="David L." role="HVAC Tech, Denver CO" />
            <TestimonialCard quote="My customers think I have a whole support team. Nope, just me and Galaxy Lite." author="Jenny P." role="Photographer, Seattle WA" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 px-6 md:px-12 py-24 bg-zinc-50/50 dark:bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Questions? We&apos;ve got answers.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">No confusion allowed.</p>
          </div>

          <div className="space-y-4">
            <FaqItem question="Is this hard to set up?" answer="Not unless you find plugging in a toaster difficult. It takes about 10 minutes. We guide you every step of the way." />
            <FaqItem question="Do I need a new phone number?" answer="Nope! We play nice with your current business number. Or we can give you a new one. Your call (pun intended)." />
            <FaqItem question="What if I don't like it?" answer="Then you don't pay. We have a 14-day free trial. Cancel anytime with one click. No angry emails required." />
            <FaqItem question="Does it work for my specific industry?" answer="If you have customers who call you, then yes. We work with plumbers, lawyers, salons, gyms, and that guy who sells antique spoons." />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Let&apos;s Get Your Life Back
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-10">
            Join 2,000+ happy business owners who let Galaxy Lite handle the busy work.
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
            <span className="text-zinc-500 text-sm">© 2026 Galaxy Lite. Built for busy business owners.</span>
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
    <div className={`relative rounded-2xl p-6 transition-all hover:-translate-y-1 ${highlighted ? "bg-indigo-500/10 border border-indigo-500/30" : "bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"}`}>
      {highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-black text-xs font-bold px-3 py-1 rounded-full">Popular</div>}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-white">{tier}</h3>
      </div>
      <div className="text-4xl font-bold mb-6 text-foreground dark:text-white">${price}<span className="text-base text-zinc-500 dark:text-zinc-400 font-normal">/mo</span></div>
      <ul className="space-y-3 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            {f}
          </li>
        ))}
      </ul>
      <Link href="/signup" className={`block text-center py-3 rounded-xl font-medium text-sm transition ${highlighted ? "bg-indigo-500 text-black hover:bg-indigo-400" : "bg-black/10 dark:bg-white/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20"}`}>
        Get Started
      </Link>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
      <div className="flex gap-0.5 mb-4">{[1, 2, 3, 4, 5].map((i) => <svg key={i} className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}</div>
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
