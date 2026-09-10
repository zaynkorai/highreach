import { requirePermission } from "@/lib/rbac/guard";
import { FormService } from "@/lib/services/form.service";
import { FormsListView } from "./components/forms-list-view";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
    const session = await requirePermission("forms.read");
    const forms = await FormService.getForms(session.tenantId);

    return <FormsListView initialForms={forms} />;
}
