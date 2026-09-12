import { getSessionWithRole } from "@/lib/auth/session";
import { 
    db, 
    tenants, 
    users, 
    contacts, 
    conversations, 
    forms, 
    opportunities, 
    calendars, 
    tenantKnowledgeSources, 
    contactActivities 
} from "@/lib/db";
import { eq, sql, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
    const session = await getSessionWithRole();

    if (!session) {
        redirect("/login");
    }

    // 1. User and Tenant profile
    const [profile] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

    const [tenant] = await db
        .select({
            id: tenants.id,
            name: tenants.name,
            phoneNumber: tenants.phoneNumber,
        })
        .from(tenants)
        .where(eq(tenants.id, session.tenantId))
        .limit(1);

    // 2. Metrics
    const [contactsCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(eq(contacts.tenantId, session.tenantId));

    const [conversationsCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(conversations)
        .where(eq(conversations.tenantId, session.tenantId));

    const [formsCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(forms)
        .where(eq(forms.tenantId, session.tenantId));

    const [pipelineResult] = await db
        .select({ 
            count: sql<number>`count(*)::int`,
            totalValue: sql<number>`COALESCE(SUM(value), 0)::int` 
        })
        .from(opportunities)
        .where(eq(opportunities.tenantId, session.tenantId));

    const [calendarsCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(calendars)
        .where(eq(calendars.tenantId, session.tenantId));

    const [knowledgeCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tenantKnowledgeSources)
        .where(eq(tenantKnowledgeSources.tenantId, session.tenantId));

    // 3. Real Recent Activities
    const rawActivities = await db
        .select({
            id: contactActivities.id,
            type: contactActivities.type,
            content: contactActivities.content,
            createdAt: contactActivities.createdAt,
            contactFirstName: contacts.firstName,
            contactLastName: contacts.lastName,
        })
        .from(contactActivities)
        .leftJoin(contacts, eq(contactActivities.contactId, contacts.id))
        .where(eq(contactActivities.tenantId, session.tenantId))
        .orderBy(desc(contactActivities.createdAt))
        .limit(8);

    const activities = rawActivities.map((act) => {
        const contactName = [act.contactFirstName, act.contactLastName].filter(Boolean).join(" ") || "Contact";
        return {
            id: act.id,
            type: act.type,
            title: act.type === "call_log" 
                ? `Call with ${contactName}` 
                : act.type === "sms" 
                ? `SMS with ${contactName}` 
                : act.type === "email" 
                ? `Email to ${contactName}` 
                : `Activity with ${contactName}`,
            desc: act.content || "No details provided",
            createdAt: act.createdAt.toISOString(),
        };
    });

    const contactsCount = contactsCountResult?.count || 0;
    const conversationsCount = conversationsCountResult?.count || 0;
    const formsCount = formsCountResult?.count || 0;
    const opportunitiesCount = pipelineResult?.count || 0;
    const pipelineValue = pipelineResult?.totalValue || 0;
    const calendarsCount = calendarsCountResult?.count || 0;
    const knowledgeCount = knowledgeCountResult?.count || 0;

    const userName = profile?.fullName ? profile.fullName.split(" ")[0] : "there";

    return (
        <DashboardOverview
            userName={userName}
            phoneNumber={tenant?.phoneNumber || null}
            contactsCount={contactsCount}
            conversationsCount={conversationsCount}
            formsCount={formsCount}
            opportunitiesCount={opportunitiesCount}
            pipelineValue={pipelineValue}
            calendarsCount={calendarsCount}
            knowledgeCount={knowledgeCount}
            activities={activities}
        />
    );
}
