import { createAdminClient } from "@/lib/supabase/admin";
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
    const supabase = createAdminClient();

    // We use admin client to fetch because public users might not have RLS access to 'forms' table
    // depending on policy. Our policy is "Tenant isolation", so anon validly sees nothing.
    const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        notFound();
    }

    const form = data as Form;

    // Only allow active forms to be viewed
    if (form.status !== 'active') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-zinc-900">Form Not Available</h1>
                    <p className="text-zinc-500 mt-2">This form is currently not accepting submissions.</p>
                </div>
            </div>
        );
    }

    return <PublicForm form={form} />;
}
