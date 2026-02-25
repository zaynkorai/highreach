"use client";

import { useEffect, useState, useCallback } from "react";
import { Form, FormFieldType } from "@/types/form";
import { updateForm } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    DndContext,
    DragEndEvent,
    closestCenter,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {
    User, Calendar, Phone, Mail,
    Type, Hash, AlignLeft, ChevronDown, CircleDot, CheckSquare,
    MousePointerClick, Archive, CreditCard, MapPin, Building2, Map, Globe, Link
} from "lucide-react";
import {
    SortableContext,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import {
    useFormEditorStore,
    useFormEditorActions,
    useFormFields,
    useSelectedFieldId,
    useSelectedField,
    useIsFormSaving,
    useSaveStatus,
    useFormTheme,
    useUndo,
    useRedo,
    usePastStates,
    useFutureStates
} from "@/stores/form-editor-store";
import { SortableField } from "./components/sortable-field";
import { ShareModal } from "./components/share-modal";
import { LogicEditor } from "./components/logic-editor";
import debounce from "lodash.debounce";

interface FormBuilderProps {
    form: Form;
}

interface SidebarItem {
    type: string;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
}

const ELEMENT_CATEGORIES: { title: string; items: SidebarItem[] }[] = [
    {
        title: "Personal Info",
        items: [
            { type: "text", label: "Full Name", icon: <User className="w-5 h-5" /> },
            { type: "text", label: "First Name", icon: <User className="w-5 h-5" /> },
            { type: "text", label: "Last Name", icon: <User className="w-5 h-5" /> },
            { type: "date", label: "Date of birth", icon: <Calendar className="w-5 h-5" /> },
            { type: "phone", label: "Phone", icon: <Phone className="w-5 h-5" /> },
            { type: "email", label: "Email", icon: <Mail className="w-5 h-5" /> },
        ]
    },
    {
        title: "Submit",
        items: [
            { type: "text", label: "Button", icon: <MousePointerClick className="w-5 h-5" />, disabled: true },
        ]
    },
    {
        title: "Payments",
        items: [
            { type: "text", label: "Sell Products", icon: <Archive className="w-5 h-5" />, disabled: true },
            { type: "text", label: "Collect Payment", icon: <CreditCard className="w-5 h-5" />, disabled: true },
        ]
    },
    {
        title: "Address",
        items: [
            { type: "text", label: "Address", icon: <MapPin className="w-5 h-5" /> },
            { type: "text", label: "City", icon: <Building2 className="w-5 h-5" /> },
            { type: "text", label: "State", icon: <Map className="w-5 h-5" /> },
            { type: "text", label: "Country", icon: <Globe className="w-5 h-5" /> },
            { type: "number", label: "Postal Code", icon: <Hash className="w-5 h-5" /> },
        ]
    },
    {
        title: "General",
        items: [
            { type: "text", label: "Text Field", icon: <Type className="w-5 h-5" /> },
            { type: "number", label: "Number", icon: <Hash className="w-5 h-5" /> },
            { type: "textarea", label: "Long Text", icon: <AlignLeft className="w-5 h-5" /> },
            { type: "select", label: "Dropdown", icon: <ChevronDown className="w-5 h-5" /> },
            { type: "radio", label: "Radio", icon: <CircleDot className="w-5 h-5" /> },
            { type: "checkbox", label: "Checkbox", icon: <CheckSquare className="w-5 h-5" /> },
        ]
    },
];

const PRESET_THEMES = [
    { id: 'brand', label: 'HighReach Red (Default)', primary: '#FF2D55', bg: '#ffffff', text: '#000000', font: 'modern' },
    { id: 'midnight', label: 'Midnight Ocean', primary: '#3b82f6', bg: '#0f172a', text: '#ffffff', font: 'sans' },
    { id: 'elegant', label: 'Classic Elegant', primary: '#FF2D55', bg: '#faf5ff', text: '#1e1b4b', font: 'serif' },
    { id: 'professional', label: 'Graphite Pro', primary: '#0f172a', bg: '#f8fafc', text: '#0f172a', font: 'mono' },
];

export function FormBuilder({ form }: FormBuilderProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"build" | "appearance" | "settings">("build");
    const [isShareOpen, setIsShareOpen] = useState(false);

    // Store State
    const fields = useFormFields();
    const theme = useFormTheme();
    const selectedFieldId = useSelectedFieldId();
    const selectedField = useSelectedField();
    const isSaving = useIsFormSaving();
    const saveStatus = useSaveStatus();

    // Zundo
    const undo = useUndo();
    const redo = useRedo();
    const pastStates = usePastStates();
    const futureStates = useFutureStates();

    // Actions
    const {
        setFields,
        setTheme,
        updateTheme,
        addField,
        updateField,
        deleteField,
        moveField,
        setSelectedFieldId,
        setIsSaving,
        setSaveStatus
    } = useFormEditorActions();

    // Helper to add option
    const addOption = (fieldId: string) => {
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;
        const newOption = { label: `Option ${field.options?.length ? field.options.length + 1 : 1}`, value: `option_${Date.now()}` };
        updateField(fieldId, { options: [...(field.options || []), newOption] });
    };

    // Helper to update option
    const updateOption = (fieldId: string, index: number, updates: { label?: string; value?: string }) => {
        const field = fields.find(f => f.id === fieldId);
        if (!field || !field.options) return;
        const newOptions = [...field.options];
        newOptions[index] = { ...newOptions[index], ...updates };
        updateField(fieldId, { options: newOptions });
    };

    // Helper to delete option
    const deleteOption = (fieldId: string, index: number) => {
        const field = fields.find(f => f.id === fieldId);
        if (!field || !field.options) return;
        updateField(fieldId, { options: field.options.filter((_, i) => i !== index) });
    };

    // Initialize Store - Only once on mount
    useEffect(() => {
        if (fields.length === 0 && !theme) {
            setFields(form.fields || []);
            if (form.theme) {
                setTheme(form.theme);
            } else {
                setTheme({
                    primaryColor: "#FF2D55",
                    backgroundColor: "#ffffff",
                    textColor: "#000000",
                    borderRadius: 8,
                    fontFamily: "modern"
                });
            }
        }
    }, [form.id]); // Only re-run if we switch to a different form

    // Auto-Save Logic
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSave = useCallback(
        debounce(async (currentFields, currentTheme) => {
            setSaveStatus('saving');
            try {
                // Only save draft status updates implicitly
                const result = await updateForm(form.id, {
                    fields: currentFields,
                    theme: currentTheme,
                });

                if (result.success) {
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } else {
                    console.error("Auto-save failed:", result.error);
                    setSaveStatus('error');
                }
            } catch (error) {
                console.error("Auto-save failed", error);
                setSaveStatus('error');
            }
        }, 1000),
        [form.id]
    );

    useEffect(() => {
        if (fields.length > 0 || theme) {
            debouncedSave(fields, theme);
        }
    }, [fields, theme, debouncedSave]);

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor)
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over) {
            moveField(active.id as string, over.id as string);
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteField(id);
    };

    const handleSelectField = (id: string) => {
        setSelectedFieldId(id);
        if (activeTab !== 'build') {
            setActiveTab('build');
        }
    };

    const handlePublish = async () => {
        setIsSaving(true);
        try {
            const result = await updateForm(form.id, {
                fields,
                theme,
                status: "active"
            });

            if (result.success) {
                toast.success("Form published successfully!");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to publish form");
            }
        } catch (error) {
            console.error("Failed to publish", error);
            toast.error("An unexpected error occurred while publishing");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            {/* Toolbar */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/[0.08] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 text-sm mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${form.status === 'active'
                                ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400'
                                }`}>
                                {form.status}
                            </span>
                            <span className="text-zinc-400 flex items-center gap-1.5 min-w-[100px]">
                                {saveStatus === 'saving' && (
                                    <>
                                        <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                    </>
                                )}
                                {saveStatus === 'saved' && (
                                    <>
                                        <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        <span className="text-brand-600 dark:text-brand-400">Saved</span>
                                    </>
                                )}
                                {saveStatus === 'error' && (
                                    <>
                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="text-red-500">Error saving</span>
                                    </>
                                )}
                                {saveStatus === 'idle' && (
                                    <span className="opacity-50">All changes saved</span>
                                )}
                            </span>
                        </div>
                        <h1 className="text-lg font-bold text-foreground">{form.name}</h1>
                    </div>

                    {/* Undo/Redo */}
                    <div className="flex items-center gap-1 ml-4 border-l border-zinc-200 dark:border-white/10 pl-4">
                        <button
                            onClick={() => undo()}
                            disabled={pastStates.length === 0}
                            className="p-1.5 text-zinc-500 hover:text-foreground disabled:opacity-30 transition-colors"
                            title="Undo"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        <button
                            onClick={() => redo()}
                            disabled={futureStates.length === 0}
                            className="p-1.5 text-zinc-500 hover:text-foreground disabled:opacity-30 transition-colors"
                            title="Redo"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                        </button>
                    </div>
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
                        <button
                            onClick={() => setActiveTab("appearance")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'appearance' ? 'bg-white dark:bg-zinc-800 shadow-sm text-foreground' : 'text-zinc-500 hover:text-foreground'}`}
                        >
                            Appearance
                        </button>
                    </div>

                    <a href={`/f/${form.id}`} target="_blank" className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                        <span></span> Preview
                    </a>

                    <button
                        onClick={() => setIsShareOpen(true)}
                        className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <span></span> Share
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={isSaving}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        Publish
                    </button>
                </div>
            </header>

            {/* Main Area */}
            {(activeTab === "build" || activeTab === "appearance") ? (
                <div className="flex-1 flex overflow-hidden">
                    {/* Components Sidebar (Left) - Only show in Build mode */}
                    {activeTab === "build" && (
                        <div className="w-64 bg-zinc-50 dark:bg-black/20 border-r border-zinc-200 dark:border-white/[0.08] p-4 overflow-y-auto">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Form Elements</h3>
                            <div className="space-y-2">
                                {ELEMENT_CATEGORIES.map((category, idx) => (
                                    <div key={idx} className="mb-6 last:mb-0">
                                        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{category.title}</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {category.items.map((item, i) => (
                                                <button
                                                    key={i}
                                                    disabled={item.disabled}
                                                    onClick={() => !item.disabled && addField(item.type as FormFieldType)}
                                                    className="flex flex-col items-center justify-center gap-2 p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg hover:border-brand-500 hover:shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group h-24"
                                                >
                                                    <span className="text-2xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all">{item.icon}</span>
                                                    <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 text-center leading-tight">{item.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Appearance Sidebar (Left) - Only show in Appearance mode */}
                    {activeTab === "appearance" && (
                        <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-white/[0.08] p-4 overflow-y-auto">
                            <h3 className="text-sm font-bold text-foreground border-b border-zinc-100 dark:border-white/10 pb-2 mb-4">Theme Settings</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 text-[10px]">Theme Presets</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {PRESET_THEMES.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => updateTheme({
                                                    primaryColor: p.primary,
                                                    backgroundColor: p.bg,
                                                    textColor: p.text,
                                                    fontFamily: p.font as any
                                                })}
                                                className="group w-full flex items-center gap-3 p-2 rounded-lg border border-zinc-100 dark:border-white/5 hover:border-brand-500/50 transition-all text-left"
                                            >
                                                <div className="flex -space-x-1.5">
                                                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: p.primary }}></div>
                                                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: p.bg }}></div>
                                                </div>
                                                <span className="text-[11px] font-medium opacity-80 group-hover:opacity-100">{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-100 dark:border-white/10">
                                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 text-[10px]">Custom Colors</label>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">Primary</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={theme?.primaryColor || '#10b981'}
                                                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                                                    className="w-6 h-6 rounded-md border-0 cursor-pointer p-0"
                                                />
                                                <span className="text-[10px] text-zinc-400 font-mono">{theme?.primaryColor}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-zinc-500 mb-1">Secondary / BG</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={theme?.backgroundColor || '#ffffff'}
                                                    onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                                                    className="w-6 h-6 rounded-md border-0 cursor-pointer p-0"
                                                />
                                                <span className="text-[10px] text-zinc-400 font-mono">{theme?.backgroundColor}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Border Radius: {theme?.borderRadius}px</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="24"
                                        step="1"
                                        value={theme?.borderRadius || 8}
                                        onChange={(e) => updateTheme({ borderRadius: parseInt(e.target.value) })}
                                        className="w-full accent-brand-500"
                                    />
                                </div>

                                <div className="pt-4 border-t border-zinc-100 dark:border-white/10">
                                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Typography</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'modern', label: 'Modern', stack: 'font-sans italic' },
                                            { id: 'sans', label: 'Classic Sans', stack: 'font-sans' },
                                            { id: 'serif', label: 'Elegant Serif', stack: 'font-serif' },
                                            { id: 'mono', label: 'Technical Mono', stack: 'font-mono' },
                                        ].map((font) => (
                                            <button
                                                key={font.id}
                                                onClick={() => updateTheme({ fontFamily: font.id as any })}
                                                className={`px-3 py-2 text-xs rounded-lg border transition-all text-left ${theme?.fontFamily === font.id
                                                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400'
                                                    : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                                                    }`}
                                            >
                                                <div className={`${font.stack} text-sm font-bold mb-0.5`}>Abc</div>
                                                <div className="text-[10px] opacity-60">{font.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Canvas */}
                    <div className="flex-1 bg-zinc-100 dark:bg-black/40 p-8 overflow-y-auto flex justify-center">
                        <div
                            className={`w-full max-w-4xl rounded-xl shadow-sm border border-zinc-200 dark:border-white/[0.08] min-h-[500px] p-8 space-y-6 transition-colors duration-200 ${theme?.fontFamily === 'serif' ? 'font-serif' :
                                theme?.fontFamily === 'mono' ? 'font-mono' :
                                    theme?.fontFamily === 'modern' ? 'font-sans italic' : 'font-sans'
                                }`}
                            style={{
                                backgroundColor: theme?.backgroundColor || '#ffffff',
                                color: theme?.textColor || '#000000',
                                borderRadius: `${theme?.borderRadius || 8}px`
                            }}
                        >
                            <div className="border-b border-zinc-100 dark:border-white/[0.08] pb-6 mb-6">
                                <h2 style={{ color: theme?.textColor || 'inherit' }} className="text-3xl font-bold mb-2">{form.name}</h2>
                                <p style={{ color: theme?.textColor || 'inherit' }} className="opacity-70">{form.description || "No description provided."}</p>
                            </div>

                            {fields.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl text-zinc-400">
                                    <p>Your form is empty.</p>
                                    <p className="text-sm">Click an element on the left to add specific fields.</p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={fields.map(f => f.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="flex flex-wrap gap-y-4">
                                            {fields.map((field) => (
                                                <div
                                                    key={field.id}
                                                    style={{ width: field.width || '100%' }}
                                                    className="px-2 transition-all duration-200"
                                                >
                                                    <SortableField
                                                        field={field}
                                                        isSelected={selectedFieldId === field.id}
                                                        onSelect={handleSelectField}
                                                        onDelete={handleDelete}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </div>

                    {/* Properties Sidebar (Right) - Hide in Appearance Mode or if no field selected */}
                    {activeTab === "build" && (
                        <div className="w-72 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-white/[0.08] flex flex-col">
                            {selectedField ? (
                                <div className="p-4 space-y-6">
                                    <h3 className="text-sm font-bold text-foreground border-b border-zinc-100 dark:border-white/10 pb-2">Properties</h3>

                                    {/* Width Control */}
                                    <div className="space-y-3 p-3 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Width</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateField(selectedField.id, { width: '100%' })}
                                                className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all ${(!selectedField.width || selectedField.width === '100%')
                                                    ? 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-500/20 dark:text-brand-400 dark:border-brand-500/30 ring-1 ring-brand-500/20'
                                                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:border-zinc-300'
                                                    }`}
                                            >
                                                Full Width (100%)
                                            </button>
                                            <button
                                                onClick={() => updateField(selectedField.id, { width: '50%' })}
                                                className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all ${selectedField.width === '50%'
                                                    ? 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-500/20 dark:text-brand-400 dark:border-brand-500/30 ring-1 ring-brand-500/20'
                                                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:border-zinc-300'
                                                    }`}
                                            >
                                                Half Width (50%)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Field Label</label>
                                        <input
                                            type="text"
                                            value={selectedField.label}
                                            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                                        />
                                    </div>

                                    {(selectedField.type === 'text' || selectedField.type === 'email' || selectedField.type === 'phone' || selectedField.type === 'textarea') && (
                                        <div className="space-y-3">
                                            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Placeholder</label>
                                            <input
                                                type="text"
                                                value={selectedField.placeholder || ''}
                                                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Helper Text</label>
                                        <input
                                            type="text"
                                            value={selectedField.helperText || ''}
                                            onChange={(e) => updateField(selectedField.id, { helperText: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                                            placeholder="Small hint text below field"
                                        />
                                    </div>

                                    {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                                        <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-white/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Options</label>
                                                    {(selectedField.options?.length || 0) < 2 && (
                                                        <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">At least 2 required</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => addOption(selectedField.id)}
                                                    className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                                                >
                                                    + Add Option
                                                </button>
                                            </div>
                                            <div className={`space-y-2 p-2 rounded-lg transition-colors ${(selectedField.options?.length || 0) < 2 ? 'bg-amber-500/5 ring-1 ring-amber-500/20' : ''}`}>
                                                {selectedField.options?.map((option, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={option.label}
                                                            onChange={(e) => updateOption(selectedField.id, index, { label: e.target.value, value: e.target.value })}
                                                            placeholder="Option Label"
                                                            className="flex-1 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-500"
                                                        />
                                                        <button
                                                            onClick={() => deleteOption(selectedField.id, index)}
                                                            className="text-zinc-400 hover:text-red-500 p-1"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!selectedField.options || selectedField.options.length === 0) && (
                                                    <p className="text-xs text-zinc-400 italic text-center py-2">No options added yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-white/10">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-foreground">Required Field</label>
                                            <input
                                                type="checkbox"
                                                checked={selectedField.required}
                                                onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                                                className="w-4 h-4 text-brand-500 rounded border-zinc-300 focus:ring-brand-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-100 dark:border-white/10">
                                        <LogicEditor />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
                                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    <p className="text-sm">Select a field on the canvas to edit its properties.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-6">
                        <h2 className="text-lg font-bold mb-4">Form Settings</h2>

                        <div className="space-y-4">
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

            <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} formId={form.id} />
        </div>
    );
}
