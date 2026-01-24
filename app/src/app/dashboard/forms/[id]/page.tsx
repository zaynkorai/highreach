import { getForm } from "../actions";
import { FormBuilder } from "./form-builder";
import { notFound } from "next/navigation";

export default async function FormEditorPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const form = await getForm(id);

    if (!form) {
        notFound();
    }

    return <FormBuilder form={form} />;
}
