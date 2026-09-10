import { create } from "zustand";
import type {
    SocialAccount,
    SocialPost,
    SocialPlatform,
    SocialPostStatus,
    SocialPostSettings,
    TenantSocialSettings,
} from "@/lib/types/database";
import {
    getSocialAccountsAction,
    getSocialPostsAction,
    getSocialStatsAction,
    createSocialPostAction,
    deleteSocialPostAction,
    publishSocialPostNowAction,
    duplicateSocialPostAction,
    getNextAvailableQueueSlotAction,
    getChannelAnalyticsBreakdownAction,
    getTenantSocialSettingsAction,
    updateTenantSocialSettingsAction,
} from "@/app/dashboard/social/actions";
import { calculatePostingStreak, DEFAULT_SOCIAL_SETTINGS } from "@/lib/services/social-utils";
import { toast } from "sonner";

export type SocialStudioTab = "calendar" | "posts" | "channels" | "settings";

export interface StreakState {
    currentStreak: number;
    longestStreak: number;
    isAtRisk: boolean;
}

interface ComposerState {
    isOpen: boolean;
    editingPostId?: string;
    content: string;
    selectedPlatforms: SocialPlatform[];
    mediaUrls: string[];
    scheduledAt: string | null;
    settings: SocialPostSettings;
    previewPlatform: SocialPlatform;
    activeOverridePlatform?: SocialPlatform;
}

interface SocialState {
    activeTab: SocialStudioTab;
    accounts: SocialAccount[];
    posts: SocialPost[];
    socialSettings: TenantSocialSettings;
    streak: StreakState;
    activeLightboxUrl: string | null;
    activeAnalyticsPost: SocialPost | null;
    publishedPostWarning: SocialPost | null;
    stats: {
        totalPosts: number;
        scheduledCount: number;
        publishedCount: number;
        draftsCount: number;
        totalImpressions: number;
        totalEngagements: number;
        connectedAccountsCount: number;
    };
    channelBreakdown: {
        platform: SocialPlatform;
        name: string;
        impressions: number;
        engagements: number;
        postCount: number;
    }[];
    statusFilter: "all" | SocialPostStatus;
    platformFilter: "all" | SocialPlatform;
    searchQuery: string;
    isLoading: boolean;
    isSaving: boolean;
    composer: ComposerState;

    actions: {
        setActiveTab: (tab: SocialStudioTab) => void;
        setStatusFilter: (filter: "all" | SocialPostStatus) => void;
        setPlatformFilter: (filter: "all" | SocialPlatform) => void;
        setSearchQuery: (query: string) => void;
        fetchAccounts: () => Promise<void>;
        fetchPosts: () => Promise<void>;
        fetchStats: () => Promise<void>;
        fetchBreakdown: () => Promise<void>;
        fetchSettings: () => Promise<void>;
        updateSettings: (updates: Partial<TenantSocialSettings>) => Promise<boolean>;
        refreshAll: () => Promise<void>;
        openComposer: (initialData?: Partial<ComposerState>) => void;
        closeComposer: () => void;
        updateComposer: (updates: Partial<ComposerState>) => void;
        togglePlatform: (platform: SocialPlatform) => void;
        assignNextQueueSlot: () => Promise<void>;
        savePost: (publishNow?: boolean) => Promise<boolean>;
        publishNow: (postId: string) => Promise<boolean>;
        deletePost: (postId: string) => Promise<boolean>;
        duplicatePost: (postId: string) => Promise<boolean>;
        openLightbox: (url: string) => void;
        closeLightbox: () => void;
        openAnalytics: (post: SocialPost) => void;
        closeAnalytics: () => void;
        setPublishedPostWarning: (post: SocialPost | null) => void;
        handleEditPost: (post: SocialPost) => void;
    };
}

const initialComposerState: ComposerState = {
    isOpen: false,
    content: "",
    selectedPlatforms: ["twitter", "linkedin"],
    mediaUrls: [],
    scheduledAt: null,
    settings: {
        tags: [],
        firstComment: "",
        platformOverrides: {},
    },
    previewPlatform: "twitter",
};

export const useSocialStore = create<SocialState>((set, get) => ({
    activeTab: "calendar",
    accounts: [],
    posts: [],
    socialSettings: DEFAULT_SOCIAL_SETTINGS,
    streak: {
        currentStreak: 0,
        longestStreak: 0,
        isAtRisk: false,
    },
    activeLightboxUrl: null,
    activeAnalyticsPost: null,
    publishedPostWarning: null,
    stats: {
        totalPosts: 0,
        scheduledCount: 0,
        publishedCount: 0,
        draftsCount: 0,
        totalImpressions: 0,
        totalEngagements: 0,
        connectedAccountsCount: 0,
    },
    channelBreakdown: [],
    statusFilter: "all",
    platformFilter: "all",
    searchQuery: "",
    isLoading: false,
    isSaving: false,
    composer: initialComposerState,

    actions: {
        setActiveTab: (tab) => set({ activeTab: tab }),
        setStatusFilter: (filter) => set({ statusFilter: filter }),
        setPlatformFilter: (filter) => set({ platformFilter: filter }),
        setSearchQuery: (query) => set({ searchQuery: query }),

        fetchAccounts: async () => {
            const res = await getSocialAccountsAction();
            if (res.success) {
                set({ accounts: res.accounts });
            }
        },

        fetchPosts: async () => {
            set({ isLoading: true });
            try {
                const res = await getSocialPostsAction();
                if (res.success) {
                    set({ posts: res.posts });

                    // Recalculate posting consistency streak from published and scheduled dates
                    const postDates = res.posts
                        .map((p) => p.published_at || p.scheduled_at)
                        .filter((d): d is string => Boolean(d));
                    const streak = calculatePostingStreak(postDates);
                    set({ streak });
                }
            } finally {
                set({ isLoading: false });
            }
        },

        fetchStats: async () => {
            const res = await getSocialStatsAction();
            if (res.success && res.stats) {
                set({ stats: res.stats });
            }
        },

        fetchBreakdown: async () => {
            const res = await getChannelAnalyticsBreakdownAction();
            if (res.success && res.breakdown) {
                set({ channelBreakdown: res.breakdown });
            }
        },

        fetchSettings: async () => {
            const res = await getTenantSocialSettingsAction();
            if (res.success && res.settings) {
                set({ socialSettings: res.settings });
            }
        },

        updateSettings: async (updates) => {
            try {
                const res = await updateTenantSocialSettingsAction(updates);
                if (res.success && res.settings) {
                    set({ socialSettings: res.settings });
                    toast.success("Studio settings saved!");
                    return true;
                } else {
                    toast.error(res.error || "Failed to update settings");
                    return false;
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Error saving settings";
                toast.error(msg);
                return false;
            }
        },

        refreshAll: async () => {
            set({ isLoading: true });
            try {
                await Promise.all([
                    get().actions.fetchAccounts(),
                    get().actions.fetchPosts(),
                    get().actions.fetchStats(),
                    get().actions.fetchBreakdown(),
                    get().actions.fetchSettings(),
                ]);
            } finally {
                set({ isLoading: false });
            }
        },

        openComposer: (initialData) => {
            set((state) => ({
                composer: {
                    ...initialComposerState,
                    ...initialData,
                    isOpen: true,
                    previewPlatform:
                        initialData?.selectedPlatforms?.[0] || state.composer.previewPlatform || "twitter",
                },
            }));
        },

        closeComposer: () => {
            set({ composer: initialComposerState });
        },

        updateComposer: (updates) => {
            set((state) => ({
                composer: { ...state.composer, ...updates },
            }));
        },

        togglePlatform: (platform) => {
            set((state) => {
                const current = state.composer.selectedPlatforms;
                const next = current.includes(platform)
                    ? current.filter((p) => p !== platform)
                    : [...current, platform];

                let previewPlatform = state.composer.previewPlatform;
                if (!next.includes(previewPlatform)) {
                    previewPlatform = next[0] || "twitter";
                }

                let activeOverridePlatform = state.composer.activeOverridePlatform;
                if (activeOverridePlatform && !next.includes(activeOverridePlatform)) {
                    activeOverridePlatform = undefined;
                }

                return {
                    composer: {
                        ...state.composer,
                        selectedPlatforms: next,
                        previewPlatform,
                        activeOverridePlatform,
                    },
                };
            });
        },

        savePost: async (publishNow = false) => {
            const { composer, actions } = get();
            if (!composer.content.trim()) {
                toast.error("Please enter post content");
                return false;
            }
            if (composer.selectedPlatforms.length === 0) {
                toast.error("Please select at least one social platform");
                return false;
            }

            set({ isSaving: true });
            try {
                const res = await createSocialPostAction({
                    content: composer.content,
                    platforms: composer.selectedPlatforms,
                    mediaUrls: composer.mediaUrls,
                    scheduledAt: publishNow ? null : composer.scheduledAt,
                    settings: composer.settings,
                    publishNow,
                });

                if (res.success) {
                    toast.success(
                        publishNow
                            ? "Post published successfully!"
                            : composer.scheduledAt
                            ? "Post scheduled successfully!"
                            : "Draft saved successfully!"
                    );
                    actions.closeComposer();
                    await actions.refreshAll();
                    return true;
                } else {
                    toast.error(res.error || "Failed to save post");
                    return false;
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Error saving post";
                toast.error(msg);
                return false;
            } finally {
                set({ isSaving: false });
            }
        },

        publishNow: async (postId: string) => {
            try {
                const res = await publishSocialPostNowAction(postId);
                if (res.success) {
                    toast.success("Post dispatched and published!");
                    await get().actions.refreshAll();
                    return true;
                } else {
                    toast.error(res.error || "Failed to dispatch post");
                    return false;
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Failed to publish";
                toast.error(msg);
                return false;
            }
        },

        deletePost: async (postId: string) => {
            try {
                const res = await deleteSocialPostAction(postId);
                if (res.success) {
                    toast.success("Post removed");
                    await get().actions.refreshAll();
                    return true;
                } else {
                    toast.error(res.error || "Failed to remove post");
                    return false;
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Failed to delete";
                toast.error(msg);
                return false;
            }
        },

        assignNextQueueSlot: async () => {
            try {
                const res = await getNextAvailableQueueSlotAction();
                if (res.success && res.slot) {
                    const localIso = res.slot.slice(0, 16);
                    set((state) => ({
                        composer: {
                            ...state.composer,
                            scheduledAt: localIso,
                        },
                    }));
                    toast.success(`Queued for ${new Date(res.slot).toLocaleString()}`);
                }
            } catch (err) {
                toast.error("Failed to query queue slot");
            }
        },

        duplicatePost: async (postId: string) => {
            try {
                const res = await duplicateSocialPostAction(postId);
                if (res.success && res.post) {
                    toast.success("Post cloned as new draft!");
                    await get().actions.refreshAll();
                    // Open composer with duplicated post contents
                    get().actions.openComposer({
                        content: res.post.content,
                        selectedPlatforms: res.post.platforms,
                        mediaUrls: res.post.media_urls || [],
                        settings: res.post.settings || {},
                        scheduledAt: null,
                    });
                    return true;
                } else {
                    toast.error(res.error || "Failed to duplicate post");
                    return false;
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Duplicate failed";
                toast.error(msg);
                return false;
            }
        },

        openLightbox: (url: string) => set({ activeLightboxUrl: url }),
        closeLightbox: () => set({ activeLightboxUrl: null }),

        openAnalytics: (post: SocialPost) => set({ activeAnalyticsPost: post }),
        closeAnalytics: () => set({ activeAnalyticsPost: null }),

        setPublishedPostWarning: (post: SocialPost | null) => set({ publishedPostWarning: post }),

        handleEditPost: (post: SocialPost) => {
            // Guard against editing published posts (Postiz edge-case protection)
            if (post.status === "published") {
                set({ publishedPostWarning: post });
                return;
            }

            get().actions.openComposer({
                editingPostId: post.id,
                content: post.content,
                selectedPlatforms: post.platforms,
                mediaUrls: post.media_urls || [],
                scheduledAt: post.scheduled_at ? post.scheduled_at.slice(0, 16) : null,
                settings: post.settings || {},
                previewPlatform: post.platforms[0] || "twitter",
            });
        },
    },
}));

export const useSocialActions = () => useSocialStore((s) => s.actions);
export const useSocialActiveTab = () => useSocialStore((s) => s.activeTab);
export const useSocialAccounts = () => useSocialStore((s) => s.accounts);
export const useSocialPosts = () => useSocialStore((s) => s.posts);
export const useSocialStats = () => useSocialStore((s) => s.stats);
export const useSocialChannelBreakdown = () => useSocialStore((s) => s.channelBreakdown);
export const useSocialComposer = () => useSocialStore((s) => s.composer);
export const useSocialSettings = () => useSocialStore((s) => s.socialSettings);
export const useSocialStreak = () => useSocialStore((s) => s.streak);
export const useSocialLightbox = () =>
    useSocialStore((s) => ({
        activeUrl: s.activeLightboxUrl,
        open: s.actions.openLightbox,
        close: s.actions.closeLightbox,
    }));
export const useSocialAnalytics = () =>
    useSocialStore((s) => ({
        activePost: s.activeAnalyticsPost,
        open: s.actions.openAnalytics,
        close: s.actions.closeAnalytics,
    }));
export const useSocialPublishedWarning = () =>
    useSocialStore((s) => ({
        post: s.publishedPostWarning,
        setWarning: s.actions.setPublishedPostWarning,
    }));
export const useSocialFilters = () =>
    useSocialStore((s) => ({
        statusFilter: s.statusFilter,
        platformFilter: s.platformFilter,
        searchQuery: s.searchQuery,
        isLoading: s.isLoading,
        isSaving: s.isSaving,
    }));
