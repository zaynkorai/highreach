import { getSessionWithRole } from "@/lib/auth/session";
import { ContactService } from "@/lib/services/contact.service";
import { redirect } from "next/navigation";
import { ContactList } from "@/app/dashboard/contacts/components/contact-list";

interface ContactsPageProps {
    searchParams: Promise<{
        q?: string;
        tag?: string;
        source?: string;
        page?: string;
        limit?: string;
        sortBy?: "name" | "email" | "source" | "created_at";
        sortOrder?: "asc" | "desc";
    }>;
}

export default async function PipelinesContactsPage({ searchParams }: ContactsPageProps) {
    const session = await getSessionWithRole();

    if (!session) {
        redirect("/login");
    }

    const params = await searchParams;
    const search = typeof params?.q === "string" 
        ? params.q 
        : typeof (params as Record<string, unknown>)?.search === "string" 
        ? (params as Record<string, string>).search 
        : undefined;
    const tag = typeof params?.tag === "string" ? params.tag : undefined;
    const source = typeof params?.source === "string" ? params.source : undefined;
    const pageNum = params?.page ? parseInt(params.page, 10) : 1;
    const limitNum = params?.limit ? parseInt(params.limit, 10) : 25;
    const sortBy = params?.sortBy;
    const sortOrder = params?.sortOrder;

    const paginatedContacts = await ContactService.getContacts(session.tenantId, {
        search,
        tag,
        source,
        page: isNaN(pageNum) ? 1 : pageNum,
        limit: isNaN(limitNum) ? 25 : limitNum,
        sortBy,
        sortOrder,
    });
    const views = await ContactService.getContactViews(session.tenantId);

    return (
        <ContactList
            initialPaginatedContacts={paginatedContacts}
            initialViews={views}
        />
    );
}
