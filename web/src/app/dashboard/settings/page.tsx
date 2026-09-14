import { redirect } from "next/navigation";
import { getOrganizationProfile } from "./actions";
import { OrganizationClient } from "./organization-client";
import { getSessionWithRole } from "@/lib/auth/session";
import { hasPermission } from "@/lib/rbac/permissions";
import type { AppRole } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function OrganizationSettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;

    // Gracefully route legacy '?tab=integrations' callbacks to the actual subroute
    if (params.tab === "integrations") {
        const queryParams = new URLSearchParams();
        if (typeof params.success === "string") queryParams.set("success", params.success);
        if (typeof params.error === "string") queryParams.set("error", params.error);
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
        redirect(`/dashboard/settings/integrations${qs}`);
    }

    const session = await getSessionWithRole();
    const userRole = (session?.role as AppRole) || "member";
    const canEdit = hasPermission(userRole, "settings.write");

    const profile = await getOrganizationProfile();

    return (
        <div className="space-y-6">
            <OrganizationClient initialProfile={profile} canEdit={canEdit} />
        </div>
    );
}
