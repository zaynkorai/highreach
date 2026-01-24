"use client";

import { useState } from "react";
import { submitForm } from "./actions";
import { Form, FormField } from "@/types/form";

interface PublicFormProps {
    form: Form;
}

export function PublicForm({ form }: PublicFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await submitForm(form.id, formData);
            if (result.error) {
                setError(result.error);
            } else {
                if (result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                } else {
                    setIsSuccess(true);
                }
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-zinc-200">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">Thank You!</h2>
                    <p className="text-zinc-600">Your submission has been received.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
                    <h1 className="text-2xl font-bold text-zinc-900">{form.name}</h1>
                    {form.description && <p className="text-zinc-500 mt-2">{form.description}</p>}
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {form.fields.map((field) => (
                        <div key={field.id} className="space-y-1.5">
                            <label htmlFor={field.id} className="block text-sm font-medium text-zinc-700">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    id={field.id}
                                    name={field.id}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    rows={4}
                                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-y"
                                />
                            ) : field.type === 'checkbox' ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={field.id}
                                        name={field.id}
                                        required={field.required}
                                        className="w-4 h-4 text-emerald-500 border-zinc-300 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-zinc-600">Yes</span>
                                </div>
                            ) : (
                                <input
                                    type={field.type}
                                    id={field.id}
                                    name={field.id}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                />
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                </form>
            </div>

            <div className="mt-8 flex items-center gap-2 opacity-50">
                <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">G</span>
                </div>
                <span className="text-xs text-zinc-400 font-medium">Powered by GHL Lite</span>
            </div>
        </div>
    );
}
