import { createClient } from "@/lib/supabase/server";
import { ContactList } from "./components/contact-list";

export default async function ContactsPage() {
    const supabase = await createClient();

    // Fetch contacts for the current tenant via RLS
    const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

    return <ContactList initialContacts={contacts || []} />;
}
