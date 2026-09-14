"use client";

import { useState, useRef } from "react";
import type { OrganizationProfile } from "./actions";
import { updateOrganizationProfile } from "./actions";
import { toast } from "sonner";
import { Loader2, Building2, Upload, Trash2, Globe, Phone, Mail, MapPin, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const INDUSTRIES = [
    { value: "plumbing", label: "Plumbing" },
    { value: "hvac", label: "HVAC & Heating" },
    { value: "electrical", label: "Electrical" },
    { value: "roofing", label: "Roofing & Siding" },
    { value: "landscaping", label: "Landscaping & Lawn" },
    { value: "cleaning", label: "Cleaning & Maid Services" },
    { value: "auto", label: "Auto Repair & Detailing" },
    { value: "legal", label: "Legal Services" },
    { value: "dental", label: "Dental Practice" },
    { value: "medical", label: "Medical & Health" },
    { value: "real_estate", label: "Real Estate" },
    { value: "general", label: "General Contractor / Other" },
];

export function OrganizationClient({
    initialProfile,
    canEdit,
}: {
    initialProfile: OrganizationProfile | null;
    canEdit: boolean;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [name, setName] = useState(initialProfile?.name || "");
    const [industry, setIndustry] = useState(initialProfile?.industry || "general");
    const [phoneNumber, setPhoneNumber] = useState(initialProfile?.phoneNumber || "");
    const [website, setWebsite] = useState(initialProfile?.website || "");
    const [email, setEmail] = useState(initialProfile?.email || "");
    const [address, setAddress] = useState(initialProfile?.address || "");
    const [logoUrl, setLogoUrl] = useState(initialProfile?.logoUrl || "");

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Logo file must be smaller than 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                setLogoUrl(reader.result);
                toast.success("Logo preview updated. Remember to save changes!");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setLogoUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.info("Logo removed. Click Save Changes to confirm.");
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) {
            toast.error("You do not have permission to edit organization settings");
            return;
        }

        if (!name.trim()) {
            toast.error("Business name is required");
            return;
        }

        setIsSaving(true);
        try {
            const res = await updateOrganizationProfile({
                name,
                industry,
                phoneNumber,
                website,
                email,
                address,
                logoUrl,
            });

            if (res.success) {
                toast.success("Organization profile updated successfully!");
            } else {
                toast.error(res.error || "Failed to save organization profile");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/[0.08] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50 dark:bg-white/[0.02]">
                <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Organization Profile
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Update your business identity, public contact info, and branding.
                    </p>
                </div>
                {canEdit ? (
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 bg-primary hover:opacity-90 text-white shadow-sm shadow-primary/20 shrink-0"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-1.5" />
                                Save Changes
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-500/20">
                        <ShieldAlert className="w-4 h-4" />
                        <span>View-only (Requires Admin or Owner role)</span>
                    </div>
                )}
            </div>

            <div className="p-6 md:p-8 space-y-8">
                {/* Logo Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div className="relative w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-white/5 border-2 border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt="Organization Logo"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <Building2 className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                        )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                        <div className="text-sm font-semibold text-foreground">Company Logo</div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Recommended format: PNG, JPG or SVG. Max 2MB. Displayed across review request emails, booking forms, and invoices.
                        </p>
                        {canEdit && (
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    id="logo-upload"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5 border-zinc-200 dark:border-white/10"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload Logo
                                </Button>
                                {logoUrl && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 gap-1.5"
                                        onClick={handleRemoveLogo}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Core Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            disabled={!canEdit}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Apex Plumbing & HVAC"
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
                        />
                    </div>

                    {/* Industry */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Industry / Trade
                        </label>
                        <select
                            disabled={!canEdit}
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
                        >
                            {INDUSTRIES.map((ind) => (
                                <option key={ind.value} value={ind.value}>
                                    {ind.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-zinc-400" />
                            Business Phone Number
                        </label>
                        <input
                            type="tel"
                            disabled={!canEdit}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
                        />
                    </div>

                    {/* Website */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-zinc-400" />
                            Website URL
                        </label>
                        <input
                            type="url"
                            disabled={!canEdit}
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
                        />
                    </div>

                    {/* Public Email */}
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-400" />
                            Public Contact Email
                        </label>
                        <input
                            type="email"
                            disabled={!canEdit}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="contact@company.com"
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
                        />
                    </div>

                    {/* Physical Address */}
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                            Business Physical Address
                        </label>
                        <textarea
                            disabled={!canEdit}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            placeholder="123 Market Street, Suite 400, Austin, TX 78701"
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none disabled:opacity-60"
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}
