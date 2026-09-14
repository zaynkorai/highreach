import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | HighReach",
  description: "HighReach Terms of Service and Telephony Usage Guidelines.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-muted-foreground">
            Last Updated: September 14, 2026
          </p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none py-10 space-y-8 text-foreground/90 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using HighReach (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or legal entity, you represent that you possess the authority to bind such entity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              HighReach provides software tools for communication management, automated SMS responses, unified customer inbox routing, pipeline management, calendar scheduling, and payment link generation for service businesses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. Telephony and SMS Compliance (TCPA &amp; 10DLC)</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to comply with all applicable telecommunications laws and carrier regulations, including the Telephone Consumer Protection Act (TCPA), CTIA guidelines, and carrier 10DLC brand and campaign registration requirements:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>You may only send automated SMS messages to individuals who have directly initiated contact or provided explicit consent to receive communications from your business.</li>
              <li>You must honor all opt-out requests (such as &ldquo;STOP&rdquo;, &ldquo;UNSUBSCRIBE&rdquo;, or equivalent keywords) immediately upon receipt.</li>
              <li>You may not use HighReach to send unsolicited mass spam, deceptive messages, or prohibited content categories under carrier A2P rules.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. Subscriptions, Quotas &amp; Overages</h2>
            <p className="text-muted-foreground leading-relaxed">
              Paid plans are billed on a recurring monthly or annual basis. Each plan includes a designated allocation of SMS messages. Outbound or inbound messages exceeding plan quotas are billed at the stated overage rate of $0.01 per message segment. Subscriptions may be canceled at any time prior to the next billing cycle.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">5. Data Ownership and Export</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain full ownership of all customer contacts, message history, pipeline data, and invoices uploaded to or created through your account. You may export your contact database at any time in standard CSV format.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              HighReach and its upstream carrier partners shall not be liable for indirect, incidental, or consequential damages resulting from mobile carrier outages, SMS delivery latencies imposed by mobile network operators, or unauthorized third-party actions beyond our reasonable control.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">7. Modifications to Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or discontinue features with reasonable notice. Continued use of the Service constitutes agreement to updated terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions regarding these Terms of Service, contact support@highreach.io.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} HighReach. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
