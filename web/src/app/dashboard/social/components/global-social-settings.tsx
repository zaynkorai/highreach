"use client";

import React, { useState, useEffect } from "react";
import {
    useSocialSettings,
    useSocialActions,
    useSocialStreak,
    useSocialAccounts,
} from "@/stores/social-store";
import type { ShortLinkingPreference } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Settings,
    Link2,
    Clock,
    Hash,
    Flame,
    Mail,
    Plus,
    X,
    Check,
    Loader2,
    Radio,
    Shield,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function GlobalSocialSettings() {
    const settings = useSocialSettings();
    const streak = useSocialStreak();
    const accounts = useSocialAccounts();
    const { updateSettings } = useSocialActions();

    // Local form state
    const [shortLinking, setShortLinking] = useState<ShortLinkingPreference>(
        settings.shortLinking || "ask"
    );
    const [timeSlots, setTimeSlots] = useState<string[]>(
        settings.defaultTimeSlots || ["09:00", "13:00", "18:00", "21:00"]
    );
    const [newSlotInput, setNewSlotInput] = useState("");
    const [tags, setTags] = useState<string[]>(settings.defaultTags || []);
    const [newTagInput, setNewTagInput] = useState("");
    const [streakEmail, setStreakEmail] = useState<boolean>(
        settings.streakReminderEmail ?? true
    );
    const [isSaving, setIsSaving] = useState(false);

    // Sync when store settings update
    useEffect(() => {
        if (settings) {
            setShortLinking(settings.shortLinking || "ask");
            setTimeSlots(settings.defaultTimeSlots || ["09:00", "13:00", "18:00", "21:00"]);
            setTags(settings.defaultTags || []);
            setStreakEmail(settings.streakReminderEmail ?? true);
        }
    }, [settings]);

    // Handle Time Slot Add
    const handleAddTimeSlot = () => {
        const trimmed = newSlotInput.trim();
        if (!trimmed) return;
        // Basic HH:MM regex check
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(trimmed)) {
            toast.error("Please enter a valid time in HH:MM format (e.g. 14:30)");
            return;
        }
        if (timeSlots.includes(trimmed)) {
            toast.error("Time slot already exists");
            return;
        }
        const updated = [...timeSlots, trimmed].sort();
        setTimeSlots(updated);
        setNewSlotInput("");
    };

    // Handle Time Slot Remove
    const handleRemoveTimeSlot = (slot: string) => {
        setTimeSlots(timeSlots.filter((s) => s !== slot));
    };

    // Preset Slot Fill
    const handleApplyPresets = (preset: "business" | "prime" | "all_day") => {
        if (preset === "business") {
            setTimeSlots(["09:00", "12:00", "15:00", "17:00"]);
        } else if (preset === "prime") {
            setTimeSlots(["08:30", "13:00", "18:30", "21:00"]);
        } else {
            setTimeSlots(["09:00", "11:30", "14:00", "16:30", "19:00", "21:30"]);
        }
        toast.info("Applied time slot preset!");
    };

    // Handle Tag Add
    const handleAddTag = () => {
        const clean = newTagInput.trim().replace(/^#/, "");
        if (!clean) return;
        if (tags.includes(clean)) {
            toast.error("Tag already in default list");
            return;
        }
        setTags([...tags, clean]);
        setNewTagInput("");
    };

    // Handle Tag Remove
    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    // Save All Settings
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings({
                shortLinking,
                defaultTimeSlots: timeSlots,
                defaultTags: tags,
                streakReminderEmail: streakEmail,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
            {/* Header Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center">
                        <Settings className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-foreground">Global Studio Settings</h2>
                        <p className="text-xs text-zinc-500">
                            Configure channel-wide defaults, automated URL shorteners, queue scheduling windows, and streak alerts
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs h-9 px-4 gap-1.5 shadow-sm"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Short-Linking Preference */}
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-brand-600" />
                            <span>URL Short-Linking Preference</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-500">
                            Control how outbound URLs in posts are converted into HighReach tracked shortlinks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            {[
                                {
                                    id: "ask",
                                    label: "Always Ask in Composer",
                                    desc: "Shows a prompt in the composer when a long link is pasted.",
                                },
                                {
                                    id: "always",
                                    label: "Always Automatically Shorten",
                                    desc: "Every external URL will automatically be wrapped with click tracking.",
                                },
                                {
                                    id: "never",
                                    label: "Never Shorten Links",
                                    desc: "Always leave links in their original raw destination form.",
                                },
                            ].map((opt) => (
                                <label
                                    key={opt.id}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                                        shortLinking === opt.id
                                            ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20"
                                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="shortlinking"
                                        value={opt.id}
                                        checked={shortLinking === opt.id}
                                        onChange={() => setShortLinking(opt.id as ShortLinkingPreference)}
                                        className="mt-0.5 text-brand-600 focus:ring-brand-500"
                                    />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                                        <p className="text-[11px] text-zinc-500">{opt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Streak Gamification & Email Alerts */}
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Flame className="w-4 h-4 text-amber-500" />
                            <span>Posting Streak & Consistency</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-500">
                            Build addictive publishing habits and get notified before losing your streak.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-xl">
                                    🔥
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                        Current Streak: {streak.currentStreak} Days
                                    </p>
                                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400">
                                        Personal Best: {streak.longestStreak} Days
                                    </p>
                                </div>
                            </div>
                            {streak.isAtRisk && (
                                <Badge variant="destructive" className="text-[10px] animate-pulse">
                                    At Risk Today!
                                </Badge>
                            )}
                        </div>

                        <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={streakEmail}
                                onChange={(e) => setStreakEmail(e.target.checked)}
                                className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                            />
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                                    <span className="text-xs font-semibold text-foreground">
                                        Daily Streak Saver Emails
                                    </span>
                                </div>
                                <p className="text-[11px] text-zinc-500">
                                    Receive a friendly reminder email at 6:00 PM if no post has been scheduled or published today.
                                </p>
                            </div>
                        </label>
                    </CardContent>
                </Card>

                {/* 3. Sleek Time Slot Designer */}
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 md:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span>Time Slot Designer (Publishing Queue)</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-zinc-500">
                                    Define recurring daily time slots. When clicking "Auto-pick queue slot", the studio reserves the next available window.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-zinc-400 text-[11px] mr-1">Presets:</span>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPresets("business")}
                                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300"
                                >
                                    Business
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPresets("prime")}
                                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300"
                                >
                                    Prime Time
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyPresets("all_day")}
                                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300"
                                >
                                    All Day (6x)
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Time Slot Chips */}
                        <div className="flex flex-wrap gap-2">
                            {timeSlots.map((slot) => (
                                <div
                                    key={slot}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold shadow-xs"
                                >
                                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{slot}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTimeSlot(slot)}
                                        className="hover:text-rose-500 transition-colors ml-1"
                                        title="Remove slot"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Custom Time Slot */}
                        <div className="flex items-center gap-2 max-w-xs">
                            <Input
                                type="time"
                                value={newSlotInput}
                                onChange={(e) => setNewSlotInput(e.target.value)}
                                className="h-8 text-xs font-mono"
                            />
                            <Button
                                size="sm"
                                type="button"
                                onClick={handleAddTimeSlot}
                                className="h-8 text-xs font-semibold px-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Slot
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Default Tags Manager */}
                <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 md:col-span-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Hash className="w-4 h-4 text-emerald-500" />
                            <span>Default Channel Tags</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-500">
                            Hashtags automatically suggested or appended when authoring brand announcements. Click the delete icon on any tag to remove it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Tags Chips */}
                        <div className="flex flex-wrap gap-2">
                            {tags.length === 0 ? (
                                <p className="text-xs text-zinc-400 italic">No default tags configured yet.</p>
                            ) : (
                                tags.map((t) => (
                                    <div
                                        key={t}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                                    >
                                        <span>#{t}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(t)}
                                            className="hover:text-rose-500 transition-colors ml-1 p-0.5"
                                            title={`Delete #${t}`}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add New Tag */}
                        <div className="flex items-center gap-2 max-w-sm">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono">
                                    #
                                </span>
                                <Input
                                    value={newTagInput}
                                    onChange={(e) => setNewTagInput(e.target.value)}
                                    placeholder="growth, ai, marketing"
                                    className="h-8 text-xs pl-7"
                                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                                />
                            </div>
                            <Button
                                size="sm"
                                type="button"
                                onClick={handleAddTag}
                                className="h-8 text-xs font-semibold px-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Tag
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
