import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | HighReach",
  description: "HighReach Privacy Policy and Data Handling Terms.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center p-0.5 border border-border">
              <Image src="/icon.svg" alt="HighReach" width={28} height={28} className="object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">HighReach</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-4 pb-8 border-b border-border">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Legal Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-muted-foreground">
            Last Updated: September 14, 2026
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none py-10 space-y-8 text-foreground/90 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">1. Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              HighReach (&ldquo;HighReach&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates a speed-to-lead communication platform, unified inbox, and customer relationship management application. This Privacy Policy describes how we collect, use, and handle personal information when you use our web applications, telephony integration endpoints, and associated services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information in the following categories:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Account Information:</strong> Name, business email, organization name, billing details, and authentication credentials.
              </li>
              <li>
                <strong className="text-foreground">Customer and Contact Data:</strong> Phone numbers, customer names, interaction notes, transaction amounts, and tags provided by you or your leads.
              </li>
              <li>
                <strong className="text-foreground">Telephony and Message Metadata:</strong> Call timestamps, duration, caller ID metadata, inbound webhook payloads, SMS message text, and delivery receipt acknowledgments processed through our telephony partner Telnyx.
              </li>
              <li>
                <strong className="text-foreground">System Usage and Logs:</strong> Browser user-agent, IP addresses, session duration, and feature activity for audit, security, and rate-limiting enforcement.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. How We Use Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We process data strictly to operate and fulfill the services requested by your account:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Dispatching automated SMS responses to inbound missed calls and web form leads.</li>
              <li>Maintaining unified conversation threads across SMS and email.</li>
              <li>Providing multi-tenant data isolation and row-level security across organizations.</li>
              <li>Generating pipeline opportunity records, invoices, and review requests upon your instruction.</li>
              <li>Complying with telecommunications regulations, 10DLC campaign registrations, and carrier policies.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. Zero Sale of Personal Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, rent, or trade your personal data or your customer contact records to any third party for marketing or advertising purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">5. Service Providers &amp; Infrastructure</h2>
            <p className="text-muted-foreground leading-relaxed">
              We transmit data only to verified cloud infrastructure providers necessary to perform platform functionality:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Telnyx:</strong> SMS routing, phone number provisioning, and telephony webhooks.</li>
              <li><strong className="text-foreground">Supabase / PostgreSQL:</strong> Encrypted persistent database storage and authentication.</li>
              <li><strong className="text-foreground">Resend:</strong> Transactional email notifications and unified inbox email routing.</li>
              <li><strong className="text-foreground">Vercel:</strong> Web application hosting and edge computing execution.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">6. Data Security &amp; Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We employ industry-standard TLS encryption in transit and AES encryption at rest. Multi-tenant data is partitioned using database Row-Level Security (RLS) policies to prevent cross-tenant access. You may export or request deletion of your organization data at any time through your dashboard or by contacting support.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">7. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions regarding this Privacy Policy or your data, reach out to us at privacy@highreach.io.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} HighReach. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
