import { redirect } from "next/navigation";

interface ContactsRedirectProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ContactsRedirect({ searchParams }: ContactsRedirectProps) {
    const params = searchParams ? await searchParams : {};
    const searchParamsObj = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (typeof value === "string") {
            searchParamsObj.set(key, value);
        } else if (Array.isArray(value)) {
            value.forEach((v) => searchParamsObj.append(key, v));
        }
    }

    const query = searchParamsObj.toString();
    redirect(`/dashboard/pipelines/contacts${query ? `?${query}` : ""}`);
}
