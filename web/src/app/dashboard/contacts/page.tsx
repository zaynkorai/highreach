import { getSessionWithRole } from "@/lib/auth/session";
import { ContactService } from "@/lib/services/contact.service";
import { redirect } from "next/navigation";
import { ContactList } from "./components/contact-list";

export default async function ContactsPage() {
    const session = await getSessionWithRole();

    if (!session) {
        redirect("/login");
    }

    const contacts = await ContactService.getContacts(session.tenantId);
    const views = await ContactService.getContactViews(session.tenantId);

    return <ContactList initialContacts={contacts} initialViews={views} />;
}
