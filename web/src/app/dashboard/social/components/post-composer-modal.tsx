"use client";

import React, { useState } from "react";
import {
    useSocialComposer,
    useSocialActions,
    useSocialAccounts,
    useSocialFilters,
    useSocialLightbox,
} from "@/stores/social-store";
import { PLATFORM_SPECS, buildUtmUrl, type AiTone } from "@/lib/services/social.service";
import { generateAiSocialDraftAction } from "@/app/dashboard/social/actions";
import { PlatformPreview } from "./platform-preview";
import type { SocialPlatform } from "@/lib/types/database";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    Calendar,
    Send,
    Save,
    Image as ImageIcon,
    Hash,
    MessageSquare,
    Check,
    Loader2,
    Link2,
    Plus,
    Trash2,
    Layers,
    Clock,
    Flame,
    Zap,
    X,
    Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AVAILABLE_PLATFORMS: { id: SocialPlatform; label: string; icon: string }[] = [
    { id: "twitter", label: "X / Twitter", icon: "𝕏" },
    { id: "linkedin", label: "LinkedIn", icon: "in" },
    { id: "facebook", label: "Facebook", icon: "f" },
    { id: "instagram", label: "Instagram", icon: "📸" },
    { id: "threads", label: "Threads", icon: "@" },
    { id: "youtube", label: "YouTube", icon: "▶" },
    { id: "twitch", label: "Twitch", icon: "🟣" },
    { id: "kick", label: "Kick", icon: "🟢" },
];

export function PostComposerModal() {
    const composer = useSocialComposer();
    const accounts = useSocialAccounts();
    const { isSaving } = useSocialFilters();
    const { closeComposer, updateComposer, togglePlatform, savePost, assignNextQueueSlot } = useSocialActions();
    const { open: openLightbox } = useSocialLightbox();

    // AI Assist local state
    const [aiTopic, setAiTopic] = useState("");
    const [aiTone, setAiTone] = useState<AiTone>("engaging");
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [mediaInput, setMediaInput] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [scheduleMode, setScheduleMode] = useState<"now" | "schedule" | "draft">(
        composer.scheduledAt ? "schedule" : "now"
    );

    // Advanced Postiz Features State
    const [customizingPlatform, setCustomizingPlatform] = useState<SocialPlatform | "all">("all");
    const [isUtmOpen, setIsUtmOpen] = useState(false);
    const [utmTargetUrl, setUtmTargetUrl] = useState("");
    const [utmCampaign, setUtmCampaign] = useState("leadgen_q1");

    // Safe platform toggle: gracefully reset customize platform if deselected
    const handleSafeTogglePlatform = (platform: SocialPlatform) => {
        if (customizingPlatform === platform) {
            setCustomizingPlatform("all");
        }
        togglePlatform(platform);
    };

    // Interactive Tag Management (Postiz Parity)
    const handleAddTag = () => {
        const clean = tagInput.trim().replace(/^#/, "");
        if (!clean) return;
        const currentTags = composer.settings?.tags || [];
        if (currentTags.includes(clean)) {
            toast.error("Tag already added");
            return;
        }
        updateComposer({
            settings: {
                ...composer.settings,
                tags: [...currentTags, clean],
            },
        });
        setTagInput("");
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const currentTags = composer.settings?.tags || [];
        updateComposer({
            settings: {
                ...composer.settings,
                tags: currentTags.filter((t) => t !== tagToRemove),
            },
        });
    };

    // Quick Time Slot Preset Handlers
    const handleApplyTimePreset = (timeStr: string) => {
        const now = new Date();
        const [hours, minutes] = timeStr.split(":").map(Number);
        const target = new Date();
        target.setHours(hours, minutes, 0, 0);

        if (target.getTime() <= now.getTime()) {
            target.setDate(target.getDate() + 1);
        }

        const y = target.getFullYear();
        const m = String(target.getMonth() + 1).padStart(2, "0");
        const d = String(target.getDate()).padStart(2, "0");
        const hh = String(target.getHours()).padStart(2, "0");
        const mm = String(target.getMinutes()).padStart(2, "0");

        updateComposer({ scheduledAt: `${y}-${m}-${d}T${hh}:${mm}` });
        setScheduleMode("schedule");
        toast.success(`Scheduled for ${timeStr} (${target.toLocaleDateString()})`);
    };

    const threadItems = composer.settings?.thread || [];

    // Current effective content being edited
    const activeText =
        customizingPlatform === "all"
            ? composer.content
            : composer.settings.platformOverrides?.[customizingPlatform]?.content ?? composer.content;

    // Calculate minimum platform char limit among selected
    const activePlatformLimit =
        customizingPlatform !== "all"
            ? PLATFORM_SPECS[customizingPlatform]?.maxCharacters || 280
            : composer.selectedPlatforms.length > 0
            ? Math.min(...composer.selectedPlatforms.map((p) => PLATFORM_SPECS[p]?.maxCharacters || 280))
            : 280;

    const currentLength = activeText.length;
    const isOverLimit = currentLength > activePlatformLimit;

    // Handle Content Edit (Global or Per-Platform Override)
    const handleTextChange = (text: string) => {
        if (customizingPlatform === "all") {
            updateComposer({ content: text });
        } else {
            updateComposer({
                settings: {
                    ...composer.settings,
                    platformOverrides: {
                        ...composer.settings.platformOverrides,
                        [customizingPlatform]: { content: text },
                    },
                },
            });
        }
    };

    // AI Generation Handler
    const handleGenerateAi = async () => {
        if (!aiTopic.trim()) {
            toast.error("Please enter a topic or concept for the AI");
            return;
        }

        setIsGeneratingAi(true);
        try {
            const res = await generateAiSocialDraftAction(
                aiTopic,
                aiTone,
                composer.selectedPlatforms[0] || "twitter"
            );

            if (res.success && res.content) {
                handleTextChange(res.content);
                toast.success("AI draft generated!");
            } else {
                toast.error(res.error || "Failed to generate copy");
            }
        } catch {
            toast.error("AI service error");
        } finally {
            setIsGeneratingAi(false);
        }
    };

    // Append Hashtags
    const handleAppendHashtags = async () => {
        if (!aiTopic.trim() && !activeText.trim()) {
            toast.error("Provide a topic or write some text first");
            return;
        }
        const topic = aiTopic.trim() || activeText.slice(0, 30);
        setIsGeneratingAi(true);
        try {
            const res = await generateAiSocialDraftAction(topic, aiTone);
            if (res.success && res.hashtags && res.hashtags.length > 0) {
                const tagsFormatted = res.hashtags.map((h) => `#${h}`).join(" ");
                handleTextChange(activeText ? `${activeText}\n\n${tagsFormatted}` : tagsFormatted);
                toast.success("Hashtags added!");
            }
        } finally {
            setIsGeneratingAi(false);
        }
    };

    // UTM Link Generator
    const handleInsertUtmLink = () => {
        if (!utmTargetUrl.trim()) return;
        const targetPlatform = customizingPlatform !== "all" ? customizingPlatform : (composer.selectedPlatforms[0] || "twitter");
        const taggedUrl = buildUtmUrl(utmTargetUrl, targetPlatform, utmCampaign);
        handleTextChange(activeText ? `${activeText}\n\n${taggedUrl}` : taggedUrl);
        setIsUtmOpen(false);
        toast.success("Tracked UTM link inserted!");
    };

    // Thread Builder Handlers (X/Twitter & Threads)
    const handleAddThreadPost = () => {
        const nextThread = [...threadItems, ""];
        updateComposer({
            settings: { ...composer.settings, thread: nextThread },
        });
    };

    const handleUpdateThreadPost = (idx: number, text: string) => {
        const nextThread = [...threadItems];
        nextThread[idx] = text;
        updateComposer({
            settings: { ...composer.settings, thread: nextThread },
        });
    };

    const handleRemoveThreadPost = (idx: number) => {
        const nextThread = [...threadItems];
        nextThread.splice(idx, 1);
        updateComposer({
            settings: { ...composer.settings, thread: nextThread },
        });
    };

    // Add Media URLs (Unlimited batch upload supported)
    const handleAddMedia = () => {
        if (!mediaInput.trim()) return;
        const urls = mediaInput
            .split(/[\n,\s]+/)
            .map((u) => u.trim())
            .filter(Boolean);

        if (urls.length === 0) return;

        updateComposer({ mediaUrls: [...composer.mediaUrls, ...urls] });
        setMediaInput("");
        toast.success(`Added ${urls.length} media ${urls.length === 1 ? "item" : "items"} to batch`);
    };

    // Remove Media
    const handleRemoveMedia = (index: number) => {
        const next = [...composer.mediaUrls];
        next.splice(index, 1);
        updateComposer({ mediaUrls: next });
    };

    // Save/Submit Form
    const handleSubmit = async () => {
        if (scheduleMode === "now") {
            await savePost(true);
        } else if (scheduleMode === "schedule") {
            if (!composer.scheduledAt) {
                toast.error("Please pick a date & time to schedule");
                return;
            }
            await savePost(false);
        } else {
            updateComposer({ scheduledAt: null });
            await savePost(false);
        }
    };

    return (
        <Dialog open={composer.isOpen} onOpenChange={(open) => !open && closeComposer()}>
            <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-zinc-200 dark:border-zinc-800">
                <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80 sticky top-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md z-10">
                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <span>Social Studio Composer</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200/60 dark:border-brand-900/40">
                                Postiz Parity
                            </span>
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                onClick={() => {
                                    setScheduleMode("schedule");
                                    assignNextQueueSlot();
                                }}
                                className="h-7 text-xs font-semibold text-brand-600 border-brand-500/30 hover:bg-brand-50 gap-1.5"
                                title="Queue post for next available smart time slot"
                            >
                                <Zap className="w-3.5 h-3.5 fill-brand-500" />
                                Next Queue Slot
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
                    {/* Left Column: Editor & Options */}
                    <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-zinc-100 dark:border-zinc-800 space-y-6">
                        {/* 1. Platform Selector Chips */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Target Channels
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_PLATFORMS.map((platform) => {
                                    const isSelected = composer.selectedPlatforms.includes(platform.id);
                                    return (
                                        <button
                                            key={platform.id}
                                            type="button"
                                            onClick={() => handleSafeTogglePlatform(platform.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                                                isSelected
                                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                                                    : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                            )}
                                        >
                                            <span className="font-bold">{platform.icon}</span>
                                            <span>{platform.label}</span>
                                            {isSelected && <Check className="w-3 h-3" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Platform-Specific Customizer Tabs (Postiz Parity) */}
                        {composer.selectedPlatforms.length > 1 && (
                            <div className="p-2 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/70 flex items-center gap-1.5 overflow-x-auto">
                                <span className="text-[11px] font-bold text-zinc-400 px-2 flex items-center gap-1 shrink-0">
                                    <Layers className="w-3.5 h-3.5" /> Customize:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCustomizingPlatform("all")}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                                        customizingPlatform === "all"
                                            ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs font-bold"
                                            : "text-zinc-500 hover:text-foreground"
                                    )}
                                >
                                    All Channels (Master)
                                </button>
                                {composer.selectedPlatforms.map((p) => {
                                    const hasOverride = !!composer.settings.platformOverrides?.[p]?.content;
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => {
                                                setCustomizingPlatform(p);
                                                updateComposer({ previewPlatform: p });
                                            }}
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all flex items-center gap-1",
                                                customizingPlatform === p
                                                    ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs font-bold"
                                                    : "text-zinc-500 hover:text-foreground"
                                            )}
                                        >
                                            <span>{p}</span>
                                            {hasOverride && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* 3. AI Content Generator Box */}
                        <div className="rounded-xl p-3.5 bg-gradient-to-br from-brand-50/50 to-indigo-50/30 dark:from-brand-950/20 dark:to-indigo-950/10 border border-brand-200/60 dark:border-brand-900/40 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-300">
                                    <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                                    <span>AI Caption Copilot</span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px]">
                                    {(["engaging", "viral_hook", "professional", "storyteller", "concise"] as AiTone[]).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setAiTone(t)}
                                            className={cn(
                                                "px-2 py-0.5 rounded-md capitalize transition-colors",
                                                aiTone === t
                                                    ? "bg-brand-600 text-white font-medium shadow-xs"
                                                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                            )}
                                        >
                                            {t.replace("_", " ")}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                    placeholder="Enter topic: e.g. Speed to lead, 5-star customer review, promo..."
                                    className="h-8 text-xs bg-white dark:bg-zinc-900"
                                    onKeyDown={(e) => e.key === "Enter" && handleGenerateAi()}
                                />
                                <Button
                                    size="sm"
                                    type="button"
                                    disabled={isGeneratingAi || !aiTopic.trim()}
                                    onClick={handleGenerateAi}
                                    className="h-8 px-3 text-xs bg-brand-600 hover:bg-brand-700 font-semibold shrink-0 gap-1.5"
                                >
                                    {isGeneratingAi ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-3.5 h-3.5" />
                                    )}
                                    Generate
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    type="button"
                                    onClick={handleAppendHashtags}
                                    className="h-8 px-2.5 text-xs shrink-0 gap-1"
                                    title="Suggest relevant hashtags"
                                >
                                    <Hash className="w-3.5 h-3.5 text-zinc-500" />
                                </Button>
                            </div>
                        </div>

                        {/* 4. Text Area & Character Counter */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-zinc-500">
                                <Label htmlFor="post-content" className="font-semibold flex items-center gap-1.5">
                                    <span>
                                        {customizingPlatform === "all"
                                            ? "Main Post Body"
                                            : `Custom Copy for ${PLATFORM_SPECS[customizingPlatform]?.name || customizingPlatform}`}
                                    </span>
                                </Label>
                                <div className="flex items-center gap-1">
                                    <span
                                        className={cn(
                                            "font-mono font-medium",
                                            isOverLimit ? "text-rose-500 font-bold" : "text-zinc-500"
                                        )}
                                    >
                                        {currentLength} / {activePlatformLimit}
                                    </span>
                                    {isOverLimit && (
                                        <Badge variant="destructive" className="text-[10px] h-4 px-1">
                                            Exceeds limit
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <Textarea
                                id="post-content"
                                value={activeText}
                                onChange={(e) => handleTextChange(e.target.value)}
                                placeholder="What would you like to share with your audience?"
                                rows={5}
                                className={cn(
                                    "resize-none text-sm leading-relaxed",
                                    isOverLimit && "border-rose-400 focus-visible:ring-rose-400"
                                )}
                            />
                        </div>

                        {/* 5. Thread Builder (for X/Twitter & Threads) */}
                        {(composer.selectedPlatforms.includes("twitter") || composer.selectedPlatforms.includes("threads")) && (
                            <div className="space-y-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Multi-Post Thread Builder</span>
                                    </Label>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        type="button"
                                        onClick={handleAddThreadPost}
                                        className="h-7 text-xs gap-1 font-semibold text-brand-600 hover:bg-brand-50"
                                    >
                                        <Plus className="w-3 h-3" /> Add to Thread
                                    </Button>
                                </div>

                                {threadItems.map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                            <span className="font-bold">Thread Post #{idx + 2}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono">{item.length} / 280</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveThreadPost(idx)}
                                                    className="text-zinc-400 hover:text-rose-500"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                        <Textarea
                                            value={item}
                                            onChange={(e) => handleUpdateThreadPost(idx, e.target.value)}
                                            placeholder="Write next tweet in the thread..."
                                            rows={2}
                                            className="text-xs resize-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 6. UTM Campaign Link Tool */}
                        <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setIsUtmOpen(!isUtmOpen)}
                                    className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 hover:text-brand-600"
                                >
                                    <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>UTM Campaign Link Builder</span>
                                    <span className="text-[10px] text-zinc-400 font-normal">
                                        {isUtmOpen ? "(hide)" : "(show)"}
                                    </span>
                                </button>
                            </div>

                            {isUtmOpen && (
                                <div className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2 text-xs">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[11px] font-semibold text-zinc-500">Destination URL</Label>
                                            <Input
                                                value={utmTargetUrl}
                                                onChange={(e) => setUtmTargetUrl(e.target.value)}
                                                placeholder="https://highreach.io/book"
                                                className="h-8 text-xs bg-white dark:bg-zinc-900"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] font-semibold text-zinc-500">Campaign Name</Label>
                                            <Input
                                                value={utmCampaign}
                                                onChange={(e) => setUtmCampaign(e.target.value)}
                                                placeholder="spring_promo"
                                                className="h-8 text-xs bg-white dark:bg-zinc-900"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        type="button"
                                        onClick={handleInsertUtmLink}
                                        disabled={!utmTargetUrl.trim()}
                                        className="h-7 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 w-full"
                                    >
                                        Insert Auto-Tagged UTM Link
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* 7. Media Attachment URLs */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Media URL (Image / Video)</span>
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    value={mediaInput}
                                    onChange={(e) => setMediaInput(e.target.value)}
                                    placeholder="https://images.unsplash.com/... or media URL"
                                    className="h-8 text-xs"
                                    onKeyDown={(e) => e.key === "Enter" && handleAddMedia()}
                                />
                                <Button
                                    size="sm"
                                    type="button"
                                    variant="secondary"
                                    onClick={handleAddMedia}
                                    className="h-8 px-3 text-xs shrink-0"
                                >
                                    Add
                                </Button>
                            </div>

                            {composer.mediaUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {composer.mediaUrls.map((url, idx) => (
                                        <div
                                            key={idx}
                                            className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 cursor-pointer"
                                            onClick={() => openLightbox(url)}
                                            title="Click to view in lightbox"
                                        >
                                            <img src={url} alt="Media thumbnail" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-between p-1 transition-opacity">
                                                <Maximize2 className="w-3.5 h-3.5 text-white" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveMedia(idx);
                                                    }}
                                                    className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs hover:bg-rose-700"
                                                    title="Remove media"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 8. Interactive Post Tags Manager (Postiz Parity) */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5" />
                                <span>Post Tags / Categories</span>
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono">
                                        #
                                    </span>
                                    <Input
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        placeholder="tech, marketing, growth..."
                                        className="h-8 text-xs pl-6"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    size="sm"
                                    type="button"
                                    variant="secondary"
                                    onClick={handleAddTag}
                                    className="h-8 px-3 text-xs shrink-0"
                                >
                                    Add Tag
                                </Button>
                            </div>

                            {composer.settings.tags && composer.settings.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {composer.settings.tags.map((t) => (
                                        <Badge
                                            key={t}
                                            variant="secondary"
                                            className="flex items-center gap-1 text-[11px] py-0.5 px-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200"
                                        >
                                            <span>#{t}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(t)}
                                                className="text-zinc-400 hover:text-rose-500 ml-0.5 transition-colors"
                                                title="Delete tag"
                                            >
                                                ✕
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 9. First Comment Option */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>First Comment (Auto-published for links/UTMs)</span>
                            </Label>
                            <Input
                                value={composer.settings.firstComment || ""}
                                onChange={(e) =>
                                    updateComposer({
                                        settings: { ...composer.settings, firstComment: e.target.value },
                                    })
                                }
                                placeholder="Add first comment..."
                                className="h-8 text-xs"
                            />
                        </div>

                        {/* 10. Scheduling / Publishing Mode */}
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setScheduleMode("now")}
                                    className={cn(
                                        "py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                                        scheduleMode === "now"
                                            ? "bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300"
                                            : "border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-zinc-300"
                                    )}
                                >
                                    <Send className="w-3.5 h-3.5" /> Publish Now
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScheduleMode("schedule")}
                                    className={cn(
                                        "py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                                        scheduleMode === "schedule"
                                            ? "bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300"
                                            : "border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-zinc-300"
                                    )}
                                >
                                    <Calendar className="w-3.5 h-3.5" /> Schedule
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScheduleMode("draft")}
                                    className={cn(
                                        "py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                                        scheduleMode === "draft"
                                            ? "bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300"
                                            : "border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:border-zinc-300"
                                    )}
                                >
                                    <Save className="w-3.5 h-3.5" /> Save Draft
                                </button>
                            </div>

                            {scheduleMode === "schedule" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-zinc-600">
                                            Select Schedule Date & Time
                                        </Label>
                                        <button
                                            type="button"
                                            onClick={assignNextQueueSlot}
                                            className="text-[11px] text-brand-600 hover:underline font-semibold flex items-center gap-1"
                                        >
                                            <Zap className="w-3 h-3" /> Auto-pick next queue slot
                                        </button>
                                    </div>
                                    <Input
                                        type="datetime-local"
                                        value={composer.scheduledAt || ""}
                                        onChange={(e) => updateComposer({ scheduledAt: e.target.value })}
                                        className="h-9 text-xs"
                                        min={new Date().toISOString().slice(0, 16)}
                                    />

                                    {/* Quick Time Slot Designer Presets */}
                                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                        <span className="text-[11px] text-zinc-400">Quick Time:</span>
                                        {[
                                            { label: "Morning 09:00", time: "09:00" },
                                            { label: "Lunch 13:00", time: "13:00" },
                                            { label: "Evening 18:00", time: "18:00" },
                                            { label: "Night 21:00", time: "21:00" },
                                        ].map((preset) => (
                                            <button
                                                key={preset.time}
                                                type="button"
                                                onClick={() => handleApplyTimePreset(preset.time)}
                                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 text-zinc-600 dark:text-zinc-300 transition-colors border border-zinc-200/60 dark:border-zinc-800"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Live Platform Mockup Preview */}
                    <div className="lg:col-span-5 p-6 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col justify-between space-y-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                    Live Platform Preview
                                </span>
                                <div className="flex gap-1">
                                    {composer.selectedPlatforms.map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => updateComposer({ previewPlatform: p })}
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all",
                                                composer.previewPlatform === p
                                                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700"
                                                    : "text-zinc-400 hover:text-zinc-600"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <PlatformPreview
                                platform={composer.previewPlatform}
                                content={
                                    composer.settings.platformOverrides?.[composer.previewPlatform]?.content ??
                                    composer.content
                                }
                                mediaUrls={composer.mediaUrls}
                                thread={composer.previewPlatform === "twitter" ? threadItems : undefined}
                            />
                        </div>

                        {/* Action Footer */}
                        <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-end gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={closeComposer}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving || !activeText.trim() || isOverLimit}
                                className="bg-brand-600 hover:bg-brand-700 font-bold px-5"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : scheduleMode === "now" ? (
                                    <>
                                        <Send className="w-3.5 h-3.5 mr-1.5" />
                                        Publish Now
                                    </>
                                ) : scheduleMode === "schedule" ? (
                                    <>
                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                        Schedule Post
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5 mr-1.5" />
                                        Save Draft
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
