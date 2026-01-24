"use client";

import { useState } from "react";
import { Form, FormField, FormFieldType } from "@/types/form";
import { updateForm } from "../actions";
import { useRouter } from "next/navigation";

interface FormBuilderProps {
    form: Form;
}

const FIELD_TYPES: { type: FormFieldType; label: string; icon: string }[] = [
    { type: "text", label: "Text Input", icon: "Aa" },
    { type: "email", label: "Email Address", icon: "@" },
    { type: "phone", label: "Phone Number", icon: "#" },
    { type: "textarea", label: "Long Text", icon: "¶" },
    { type: "number", label: "Number", icon: "123" },
    { type: "checkbox", label: "Checkbox", icon: "☑" },
    // { type: "select", label: "Dropdown", icon: "▼" }, // Checking later
];

export function FormBuilder({ form }: FormBuilderProps) {
    const router = useRouter();
    const [fields, setFields] = useState<FormField[]>(form.fields || []);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"build" | "settings">("build");

    const selectedField = fields.find(f => f.id === selectedFieldId);

    const addField = (type: FormFieldType) => {
        const newField: FormField = {
            id: crypto.randomUUID(),
            type,
            label: `New ${type} field`,
            placeholder: "",
            required: false,
        };
        setFields([...fields, newField]);
        setSelectedFieldId(newField.id);
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const deleteField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const handleSave = async (publish = false) => {
        setIsSaving(true);
        try {
            await updateForm(form.id, {
                fields,
                status: publish ? "active" : form.status
            });
            router.refresh(); // Refresh server data
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save form");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            {/* Toolbar */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/[0.08] px-6 py-3 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 text-sm mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${form.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400'
                            }`}>
                            {form.status}
                        </span>
                        <span className="text-zinc-400">Changed just now</span>
                    </div>
                    <h1 className="text-lg font-bold text-foreground">{form.name}</h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-100 dark:bg-white/5 rounded-lg p-1 mr-4">
                        <button
                            onClick={() => setActiveTab("build")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'build' ? 'bg-white dark:bg-zinc-800 shadow-sm text-foreground' : 'text-zinc-500 hover:text-foreground'}`}
                        >
                            Builder
                        </button>
                        <button
                            onClick={() => setActiveTab("settings")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-zinc-800 shadow-sm text-foreground' : 'text-zinc-500 hover:text-foreground'}`}
                        >
                            Settings
                        </button>
                    </div>

                    <a href={`/f/${form.id}`} target="_blank" className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                        <span>👁️</span> Preview
                    </a>
                    <button
                        onClick={() => handleSave(false)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors"
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        Publish
                    </button>
                </div>
            </header>

            {/* Main Area */}
            {activeTab === "build" ? (
                <div className="flex-1 flex overflow-hidden">
                    {/* Components Sidebar */}
                    <div className="w-64 bg-zinc-50 dark:bg-black/20 border-r border-zinc-200 dark:border-white/[0.08] p-4 overflow-y-auto">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Form Elements</h3>
                        <div className="space-y-2">
                            {FIELD_TYPES.map((ft) => (
                                <button
                                    key={ft.type}
                                    onClick={() => addField(ft.type)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg hover:border-emerald-500/50 hover:shadow-sm transition-all text-left group"
                                >
                                    <span className="w-6 h-6 rounded bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-xs font-serif text-zinc-500 group-hover:text-emerald-500">{ft.icon}</span>
                                    <span className="text-sm font-medium text-foreground">{ft.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 bg-zinc-100 dark:bg-black/40 p-8 overflow-y-auto flex justify-center">
                        <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-white/[0.08] min-h-[500px] p-8 space-y-6">
                            <div className="border-b border-zinc-100 dark:border-white/[0.08] pb-6 mb-6">
                                <h2 className="text-3xl font-bold text-foreground mb-2">{form.name}</h2>
                                <p className="text-zinc-500 dark:text-zinc-400">{form.description || "No description provided."}</p>
                            </div>

                            {fields.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl text-zinc-400">
                                    <p>Your form is empty.</p>
                                    <p className="text-sm">Click an element on the left to add specific fields.</p>
                                </div>
                            ) : (
                                fields.map((field) => (
                                    <div
                                        key={field.id}
                                        onClick={() => setSelectedFieldId(field.id)}
                                        className={`relative group p-4 -mx-4 rounded-xl border-2 transition-all cursor-pointer ${selectedFieldId === field.id
                                                ? "border-emerald-500/50 bg-emerald-50/10"
                                                : "border-transparent hover:border-zinc-200 dark:hover:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/[0.02]"
                                            }`}
                                    >
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <div className="w-full h-24 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg"></div>
                                        ) : field.type === 'checkbox' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border border-zinc-300 rounded"></div>
                                                <span className="text-sm text-zinc-500">Option label</span>
                                            </div>
                                        ) : (
                                            <div className="w-full h-10 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg"></div>
                                        )}

                                        {/* Quick Actions */}
                                        <div className={`absolute top-2 right-2 flex gap-1 ${selectedFieldId === field.id ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-opacity`}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                                                className="p-1.5 bg-white dark:bg-zinc-800 text-red-500 rounded shadow-sm hover:bg-red-50 border border-zinc-200 dark:border-white/10"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Properties Sidebar */}
                    <div className="w-72 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-white/[0.08] flex flex-col">
                        {selectedField ? (
                            <div className="p-4 space-y-6">
                                <h3 className="text-sm font-bold text-foreground border-b border-zinc-100 dark:border-white/10 pb-2">Properties</h3>

                                <div className="space-y-3">
                                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Field Label</label>
                                    <input
                                        type="text"
                                        value={selectedField.label}
                                        onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                {(selectedField.type === 'text' || selectedField.type === 'email' || selectedField.type === 'phone' || selectedField.type === 'textarea') && (
                                    <div className="space-y-3">
                                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Placeholder</label>
                                        <input
                                            type="text"
                                            value={selectedField.placeholder || ''}
                                            onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                )}

                                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-white/10">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-foreground">Required Field</label>
                                        <input
                                            type="checkbox"
                                            checked={selectedField.required}
                                            onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                                            className="w-4 h-4 text-emerald-500 rounded border-zinc-300 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
                                <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                <p className="text-sm">Select a field on the canvas to edit its properties.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-6">
                        <h2 className="text-lg font-bold mb-4">Form Settings</h2>

                        <div className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Redirect URL</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/thank-you"
                                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm"
                                    defaultValue={form.redirect_url || ""}
                                />
                                <p className="text-xs text-zinc-500 mt-1">Where to send users after they submit the form.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
