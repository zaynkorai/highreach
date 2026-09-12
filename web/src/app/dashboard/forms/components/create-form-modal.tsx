"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createForm } from "../actions";
import { toast } from "sonner";
import { FormField } from "@/types/form";
import { Check, Sparkles, MessageSquare, Briefcase, Star, Calendar } from "lucide-react";

interface CreateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TemplatePreset {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    fields: FormField[];
}

const TEMPLATES: TemplatePreset[] = [
    {
        id: "lead_capture",
        title: "Lead Capture & Contact",
        description: "Collect qualified leads with name, email, phone, company, and message.",
        icon: MessageSquare,
        fields: [
            { id: "f_first_name", type: "text", label: "First Name", placeholder: "Jane", required: true, width: "50%" },
            { id: "f_last_name", type: "text", label: "Last Name", placeholder: "Doe", required: true, width: "50%" },
            { id: "f_email", type: "email", label: "Email Address", placeholder: "jane@example.com", required: true, width: "50%" },
            { id: "f_phone", type: "phone", label: "Phone Number", placeholder: "(555) 000-0000", required: false, width: "50%" },
            { id: "f_company", type: "text", label: "Company Name", placeholder: "Acme Corp", required: false },
            { id: "f_message", type: "textarea", label: "How can we help you?", placeholder: "Tell us about your project or inquiry...", required: true },
            { id: "f_consent", type: "checkbox", label: "Marketing Consent", required: false, helperText: "I agree to receive communications from your team." },
        ],
    },
    {
        id: "quote_request",
        title: "Service Quote Request",
        description: "Capture project scope, budget range, and timeline for customer estimates.",
        icon: Briefcase,
        fields: [
            { id: "f_full_name", type: "text", label: "Full Name", placeholder: "Jane Doe", required: true },
            { id: "f_email", type: "email", label: "Email Address", placeholder: "jane@example.com", required: true, width: "50%" },
            { id: "f_phone", type: "phone", label: "Phone Number", placeholder: "(555) 000-0000", required: true, width: "50%" },
            {
                id: "f_service_type",
                type: "select",
                label: "Service Needed",
                required: true,
                options: [
                    { label: "Consulting & Strategy", value: "consulting" },
                    { label: "Implementation & Setup", value: "implementation" },
                    { label: "Custom Development", value: "custom_dev" },
                    { label: "Support & Maintenance", value: "support" },
                ],
            },
            {
                id: "f_budget",
                type: "select",
                label: "Estimated Budget",
                required: true,
                options: [
                    { label: "Under $2,500", value: "under_2500" },
                    { label: "$2,500 - $5,000", value: "2500_5000" },
                    { label: "$5,000 - $10,000", value: "5000_10000" },
                    { label: "$10,000+", value: "10000_plus" },
                ],
            },
            { id: "f_target_date", type: "date", label: "Desired Start Date", required: false },
            { id: "f_scope", type: "textarea", label: "Project Scope & Details", placeholder: "Describe what you need built or solved...", required: true },
        ],
    },
    {
        id: "feedback",
        title: "Customer Feedback & Reviews",
        description: "Measure customer satisfaction, gather feedback, and collect testimonials.",
        icon: Star,
        fields: [
            { id: "f_name", type: "text", label: "Your Name", placeholder: "Jane Doe (optional)", required: false },
            {
                id: "f_rating",
                type: "radio",
                label: "Overall Experience",
                required: true,
                options: [
                    { label: "5 - Exceptional", value: "5" },
                    { label: "4 - Very Good", value: "4" },
                    { label: "3 - Average", value: "3" },
                    { label: "2 - Poor", value: "2" },
                    { label: "1 - Very Poor", value: "1" },
                ],
            },
            { id: "f_positives", type: "textarea", label: "What did you like most?", placeholder: "What stood out during your experience?", required: false },
            { id: "f_improvements", type: "textarea", label: "What could we improve?", placeholder: "Tell us where we can do better...", required: false },
            { id: "f_testimonial_ok", type: "checkbox", label: "Permission to share", required: false, helperText: "Yes, you have permission to use this testimonial in marketing materials." },
        ],
    },
    {
        id: "event_rsvp",
        title: "Event RSVP & Attendance",
        description: "Collect attendance confirmations, guest counts, and dietary preferences.",
        icon: Calendar,
        fields: [
            { id: "f_name", type: "text", label: "Full Name", placeholder: "Jane Doe", required: true },
            { id: "f_email", type: "email", label: "Email Address", placeholder: "jane@example.com", required: true },
            {
                id: "f_attending",
                type: "radio",
                label: "Will you attend?",
                required: true,
                options: [
                    { label: "Yes, I will attend", value: "yes" },
                    { label: "No, unfortunately I cannot attend", value: "no" },
                    { label: "Maybe / Not sure yet", value: "maybe" },
                ],
            },
            { id: "f_guests", type: "number", label: "Number of Additional Guests", placeholder: "0", required: false },
            {
                id: "f_dietary",
                type: "select",
                label: "Dietary Preferences",
                required: false,
                options: [
                    { label: "No restrictions", value: "none" },
                    { label: "Vegetarian", value: "vegetarian" },
                    { label: "Vegan", value: "vegan" },
                    { label: "Gluten-free", value: "gluten_free" },
                    { label: "Other", value: "other" },
                ],
            },
        ],
    },
];

export function CreateFormModal({ isOpen, onClose }: CreateFormModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selection, setSelection] = useState<'scratch' | 'templates'>('scratch');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("lead_capture");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let initialFields: FormField[] = [];
            let formName = name;
            let formDesc = description;

            if (selection === 'templates') {
                const template = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
                initialFields = template.fields.map(f => ({ ...f, id: crypto.randomUUID() }));
                formName = name || template.title;
                formDesc = description || template.description;
            } else {
                formName = name || "New Form";
            }

            const result = await createForm(formName, formDesc, initialFields);
            if (result.success) {
                toast.success("Form created successfully!");
                onClose();
                router.push(`/dashboard/forms/${result.data.id}`);
            } else {
                toast.error(result.error || "Failed to create form");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplateId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] w-full max-w-3xl rounded-2xl shadow-xl p-0 relative animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Create New Form</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Build a custom form from scratch or start with a prebuilt layout.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Top Choice Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Scratch Card */}
                        <div
                            onClick={() => setSelection('scratch')}
                            className={`relative cursor-pointer group border-2 rounded-xl p-4 transition-all ${selection === 'scratch'
                                ? 'border-brand-500 bg-brand-50/10'
                                : 'border-zinc-200 dark:border-white/10 hover:border-brand-500/50 hover:bg-zinc-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </div>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selection === 'scratch' ? 'border-brand-500 bg-brand-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                    {selection === 'scratch' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                            </div>
                            <h3 className="font-bold text-foreground text-sm mb-0.5">Start from Scratch</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Design a blank form canvas with custom fields</p>
                        </div>

                        {/* Templates Card */}
                        <div
                            onClick={() => setSelection('templates')}
                            className={`relative cursor-pointer group border-2 rounded-xl p-4 transition-all ${selection === 'templates'
                                ? 'border-brand-500 bg-brand-50/10'
                                : 'border-zinc-200 dark:border-white/10 hover:border-brand-500/50 hover:bg-zinc-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selection === 'templates' ? 'border-brand-500 bg-brand-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                    {selection === 'templates' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                            </div>
                            <h3 className="font-bold text-foreground text-sm mb-0.5">Prebuilt Templates</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Jump-start with verified conversion templates</p>
                        </div>
                    </div>

                    {/* Template Picker if selection is templates */}
                    {selection === 'templates' && (
                        <div className="space-y-3 mb-6">
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                Select a Template
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                                {TEMPLATES.map((tmpl) => {
                                    const Icon = tmpl.icon;
                                    const isSelected = selectedTemplateId === tmpl.id;
                                    return (
                                        <div
                                            key={tmpl.id}
                                            onClick={() => {
                                                setSelectedTemplateId(tmpl.id);
                                                if (!name) setName(tmpl.title);
                                            }}
                                            className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${isSelected
                                                ? 'border-brand-500 bg-brand-50/10 shadow-sm'
                                                : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg shrink-0 ${isSelected
                                                ? 'bg-brand-500 text-white'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                                }`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-foreground flex items-center justify-between">
                                                    <span className="truncate">{tmpl.title}</span>
                                                    {isSelected && <Check className="w-4 h-4 text-brand-500 shrink-0" />}
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                                                    {tmpl.description}
                                                </p>
                                                <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                                                    {tmpl.fields.length} fields included
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Common Details (Name & Description) */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                                    Form Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={selection === 'templates' && currentTemplate ? currentTemplate.title : "e.g. Website Contact Form"}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                                    Description <span className="text-zinc-400 font-normal lowercase">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={selection === 'templates' && currentTemplate ? currentTemplate.description : "Internal notes or form header..."}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? "Creating..." : "Create Form"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

