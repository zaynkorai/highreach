import { createClient } from "@/lib/supabase/server";
import { ContactList } from "./components/contact-list";

export default async function ContactsPage() {
    const supabase = await createClient();

    // Fetch contacts for the current tenant via RLS
    const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

    // Fetch saved views
    const { data: savedViews } = await supabase
        .from("contact_views")
        .select("*")
        .order("created_at", { ascending: true });

    return <ContactList initialContacts={contacts || []} initialViews={savedViews || []} />;
}
