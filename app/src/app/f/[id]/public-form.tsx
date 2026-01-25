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

    // Logic Engine State
    const [values, setValues] = useState<Record<string, any>>({});

    const handleFieldChange = (fieldId: string, value: any) => {
        setValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const checkCondition = (condition: any, fieldValue: any) => {
        const val = condition.value?.toLowerCase();
        const fieldVal = String(fieldValue || '').toLowerCase(); // MVP string comparison

        switch (condition.operator) {
            case 'equals': return fieldVal === val;
            case 'not_equals': return fieldVal !== val;
            case 'contains': return fieldVal.includes(val);
            case 'greater_than': return parseFloat(fieldVal) > parseFloat(val);
            case 'less_than': return parseFloat(fieldVal) < parseFloat(val);
            default: return false;
        }
    };

    const isFieldVisible = (field: FormField) => {
        if (!field.logic || field.logic.length === 0) return true;
        let visible = !field.logic.some(r => r.action === 'show');
        for (const rule of field.logic) {
            const conditionsMet = rule.conditions.every(c => checkCondition(c, values[c.fieldId]));
            if (conditionsMet) {
                if (rule.action === 'show') visible = true;
                if (rule.action === 'hide') visible = false;
            }
        }
        return visible;
    };

    const visibleFields = form.fields.filter(isFieldVisible);

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
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">Thank You!</h2>
                    <p className="text-zinc-600">Your submission has been received.</p>
                </div>
            </div>
        );
    }

    const theme = form.theme || {
        primaryColor: "#6366f1",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        borderRadius: 8,
        fontFamily: "modern"
    };

    const fontClass = theme.fontFamily === 'serif' ? 'font-serif' :
        theme.fontFamily === 'mono' ? 'font-mono' :
            theme.fontFamily === 'modern' ? 'font-sans italic' : 'font-sans';

    return (
        <div
            className={`min-h-screen flex flex-col items-center justify-center p-4 ${fontClass}`}
            style={{ backgroundColor: theme.backgroundColor + '10' }} // Subtle tint of BG color for page background
        >
            <div
                className="w-full max-w-lg shadow-sm border border-zinc-200 dark:border-white/10 overflow-hidden"
                style={{
                    backgroundColor: theme.backgroundColor,
                    color: theme.textColor,
                    borderRadius: `${theme.borderRadius}px`
                }}
            >
                <div className="p-8 border-b border-zinc-100 dark:border-white/5" style={{ backgroundColor: theme.backgroundColor + '05' }}>
                    <h1 className="text-2xl font-bold" style={{ color: theme.textColor }}>{form.name}</h1>
                    {form.description && <p className="opacity-70 mt-2" style={{ color: theme.textColor }}>{form.description}</p>}
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 mb-6">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-y-6 -mx-2">
                        {visibleFields.map((field) => (
                            <div key={field.id} style={{ width: field.width || '100%' }} className="px-2">
                                <div className="space-y-2">
                                    <label htmlFor={field.id} className="block text-sm font-medium opacity-80" style={{ color: theme.textColor }}>
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>

                                    {field.type === 'textarea' ? (
                                        <textarea
                                            id={field.id}
                                            name={field.id}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            rows={4}
                                            className="w-full border border-zinc-300 dark:border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all resize-y"
                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                            style={{
                                                borderRadius: `${theme.borderRadius}px`,
                                                backgroundColor: theme.backgroundColor,
                                                color: theme.textColor,
                                                '--tw-ring-color': theme.primaryColor + '30'
                                            } as any}
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            id={field.id}
                                            name={field.id}
                                            required={field.required}
                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        >
                                            <option value="">Select an option</option>
                                            {field.options?.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'radio' ? (
                                        <div className="space-y-2">
                                            {field.options?.map((opt, i) => (
                                                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="radio"
                                                            name={field.id}
                                                            value={opt.value}
                                                            required={field.required}
                                                            className="peer appearance-none w-5 h-5 border border-zinc-300 dark:border-white/20 rounded-full checked:border-transparent transition-all"
                                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                            style={{ '--checked-bg': theme.primaryColor } as any}
                                                        />
                                                        <div
                                                            className="absolute w-5 h-5 rounded-full scale-0 peer-checked:scale-100 transition-transform duration-200"
                                                            style={{ backgroundColor: theme.primaryColor }}
                                                        />
                                                        <div
                                                            className="absolute w-2 h-2 bg-white rounded-full scale-0 peer-checked:scale-100 transition-transform duration-300"
                                                        />
                                                    </div>
                                                    <span className="text-sm opacity-80" style={{ color: theme.textColor }}>{opt.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : field.type === 'checkbox' ? (
                                        <div className="space-y-2">
                                            {field.options && field.options.length > 0 ? (
                                                field.options.map((opt, i) => (
                                                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                                        <div className="relative flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                name={field.id}
                                                                value={opt.value}
                                                                className="peer appearance-none w-5 h-5 border border-zinc-300 dark:border-white/20 rounded transition-all"
                                                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                                style={{ borderRadius: `${theme.borderRadius / 4}px` }}
                                                            />
                                                            <div
                                                                className="absolute w-5 h-5 scale-0 peer-checked:scale-100 transition-transform duration-200 flex items-center justify-center"
                                                                style={{ backgroundColor: theme.primaryColor, borderRadius: `${theme.borderRadius / 4}px` }}
                                                            >
                                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm opacity-80" style={{ color: theme.textColor }}>{opt.label}</span>
                                                    </label>
                                                ))
                                            ) : (
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            id={field.id}
                                                            name={field.id}
                                                            required={field.required}
                                                            className="peer appearance-none w-5 h-5 border border-zinc-300 dark:border-white/20 rounded transition-all"
                                                            onChange={(e) => handleFieldChange(field.id, e.target.checked ? "true" : "")}
                                                            style={{ borderRadius: `${theme.borderRadius / 4}px` }}
                                                        />
                                                        <div
                                                            className="absolute w-5 h-5 scale-0 peer-checked:scale-100 transition-transform duration-200 flex items-center justify-center"
                                                            style={{ backgroundColor: theme.primaryColor, borderRadius: `${theme.borderRadius / 4}px` }}
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm opacity-80" style={{ color: theme.textColor }}>Yes, I agree</span>
                                                </label>
                                            )}
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type}
                                            id={field.id}
                                            name={field.id}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="w-full border border-zinc-300 dark:border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
                                            style={{
                                                borderRadius: `${theme.borderRadius}px`,
                                                backgroundColor: theme.backgroundColor,
                                                color: theme.textColor,
                                                '--tw-ring-color': theme.primaryColor + '30'
                                            } as any}
                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full font-semibold py-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md"
                            style={{
                                backgroundColor: theme.primaryColor,
                                color: '#ffffff', // Usually white text on primary
                                borderRadius: `${theme.borderRadius}px`
                            }}
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                    </div>
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
