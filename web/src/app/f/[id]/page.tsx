import { db, forms } from "@/lib/db";
import { eq } from "drizzle-orm";
import { PublicForm } from "./public-form";
import { notFound } from "next/navigation";
import { Form } from "@/types/form";
import { Suspense } from "react";

export default function PublicFormPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
                <div className="w-full max-w-lg bg-white h-96 rounded-2xl shadow-sm border border-zinc-200 animate-pulse"></div>
            </div>
        }>
            <FormContainer params={params} />
        </Suspense>
    );
}

async function FormContainer({ params }: { params: { id: string } }) {
    const { id } = await params;

    const [found] = await db
        .select()
        .from(forms)
        .where(eq(forms.id, id))
        .limit(1);

    if (!found) {
        notFound();
    }

    const form: Form = {
        id: found.id,
        tenant_id: found.tenantId,
        name: found.name,
        fields: found.fields as any,
        theme: found.theme as any,
        redirect_url: found.redirectUrl || undefined,
        status: "active",
        views: 0,
        created_at: found.createdAt.toISOString(),
        updated_at: found.updatedAt.toISOString(),
    };

    return <PublicForm form={form} />;
}
