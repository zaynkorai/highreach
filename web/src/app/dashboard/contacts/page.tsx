import { getSessionWithRole } from "@/lib/auth/session";
import { db, contacts, contactViews } from "@/lib/db";
import { eq, desc, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ContactList } from "./components/contact-list";

export default async function ContactsPage() {
    const session = await getSessionWithRole();

    if (!session) {
        redirect("/login");
    }

    // Fetch contacts for the current tenant
    const tenantContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.tenantId, session.tenantId))
        .orderBy(desc(contacts.createdAt));

    // Map fields to match Contact entity interface
    const formattedContacts = tenantContacts.map((c) => ({
        id: c.id,
        tenant_id: c.tenantId,
        first_name: c.firstName,
        last_name: c.lastName,
        email: c.email,
        phone: c.phone,
        tags: c.tags || [],
        source: c.source,
        notes: c.notes,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
    }));

    // Fetch saved views for the current tenant
    const tenantViews = await db
        .select()
        .from(contactViews)
        .where(eq(contactViews.tenantId, session.tenantId))
        .orderBy(asc(contactViews.createdAt));

    const formattedViews = tenantViews.map((v) => ({
        id: v.id,
        tenant_id: v.tenantId,
        name: v.name,
        filters: v.filters as any,
        created_at: v.createdAt.toISOString(),
        created_by: v.createdBy,
    }));

    return <ContactList initialContacts={formattedContacts as any} initialViews={formattedViews as any} />;
}
