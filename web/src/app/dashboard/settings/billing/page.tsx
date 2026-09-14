import { requirePermission } from "@/lib/rbac/guard";
import { db, tenantMembers, contacts, forms, tenants } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { BillingClient } from "./billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
    const session = await requirePermission("billing.read");

    const [membersRes, contactsRes, formsRes, tenantRes] = await Promise.all([
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(tenantMembers)
            .where(eq(tenantMembers.tenantId, session.tenantId)),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(contacts)
            .where(eq(contacts.tenantId, session.tenantId)),
        db
            .select({ count: sql<number>`count(*)::int` })
            .from(forms)
            .where(eq(forms.tenantId, session.tenantId)),
        db
            .select({ name: tenants.name })
            .from(tenants)
            .where(eq(tenants.id, session.tenantId))
            .limit(1),
    ]);

    const metrics = {
        membersCount: membersRes[0]?.count ?? 1,
        contactsCount: contactsRes[0]?.count ?? 0,
        formsCount: formsRes[0]?.count ?? 0,
        tenantName: tenantRes[0]?.name ?? "Workspace",
    };

    return (
        <div className="space-y-6">
            <BillingClient metrics={metrics} />
        </div>
    );
}
