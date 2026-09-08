import { requirePermission } from "@/lib/rbac/guard";
import { FormService } from "@/lib/services/form.service";
import { FormBuilder } from "./form-builder";
import { notFound } from "next/navigation";

export default async function FormEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await requirePermission("forms.read");
    const form = await FormService.getForm(session.tenantId, id);

    if (!form) {
        notFound();
    }

    return <FormBuilder form={form} />;
}
