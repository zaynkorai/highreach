import { create } from 'zustand';
import { Review, ReputationStats, ReviewFilter } from '@/types/reputation';
import { getReviews, replyToReviewAction, generateAiReviewReplyAction } from '@/app/dashboard/reputation/actions';

interface ReputationState {
    reviews: Review[];
    stats: ReputationStats;
    filters: ReviewFilter;
    savedReplies: string[];
    isLoading: boolean;

    actions: {
        setReviews: (reviews: Review[]) => void;
        setStats: (stats: ReputationStats) => void;
        setFilters: (filters: ReviewFilter) => void;
        setLoading: (loading: boolean) => void;
        replyToReview: (reviewId: string, replyText: string) => Promise<void>;
        generateAiReply: (reviewText: string) => Promise<string>;
        fetchReviews: () => Promise<void>;
        addSavedReply: (text: string) => void;
    };
}

export const useReputationStore = create<ReputationState>((set) => ({
    reviews: [],
    stats: {
        averageRating: 0,
        totalReviews: 0,
        newReviewsThisMonth: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageResponseTime: '0h',
        responseRate: 0,
    },
    filters: {},
    savedReplies: [],
    isLoading: false,

    actions: {
        setReviews: (reviews) => set({ reviews }),
        setStats: (stats) => set({ stats }),
        setFilters: (filters) => set({ filters }),
        setLoading: (isLoading) => set({ isLoading }),

        replyToReview: async (reviewId, replyText) => {
            await replyToReviewAction(reviewId, replyText);

            set((state) => ({
                reviews: state.reviews.map(r =>
                    r.id === reviewId
                        ? { ...r, isReplied: true, reply: { text: replyText, time: Date.now() } }
                        : r
                )
            }));
        },

        generateAiReply: async (reviewText) => {
            try {
                return await generateAiReviewReplyAction(reviewText);
            } catch (err) {
                console.error("Failed to generate AI reply:", err);
                return "Thank you for sharing your feedback! We truly appreciate your review and look forward to continuing to provide you with great service.";
            }
        },

        fetchReviews: async () => {
            set({ isLoading: true });

            const reviewsData = await getReviews();

            const reviews: Review[] = (reviewsData || []).map((r) => {
                const source: Review["source"] =
                    r.platform === "google" || r.platform === "facebook"
                        ? r.platform
                        : "other";

                return {
                    id: r.id,
                    authorName: r.reviewer_name,
                    authorPhotoUrl: r.reviewer_photo_url || '',
                    rating: r.rating,
                    text: r.content || '',
                    relativeTimeDescription: r.review_date ? new Date(r.review_date).toLocaleDateString() : 'recently',
                    time: r.review_date ? new Date(r.review_date).getTime() : Date.now(),
                    source,
                    sentiment: r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative',
                    isReplied: r.status === 'replied',
                    reply: r.reply_content ? {
                        text: r.reply_content,
                        time: r.updated_at ? new Date(r.updated_at).getTime() : Date.now()
                    } : undefined
                };
            });

            // Calculate Stats
            const total = reviews.length;
            const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
            const dist = reviews.reduce((acc, r) => {
                const rt = Math.round(r.rating);
                acc[rt] = (acc[rt] || 0) + 1;
                return acc;
            }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>);

            set({
                reviews,
                stats: {
                    averageRating: avg,
                    totalReviews: total,
                    newReviewsThisMonth: reviews.filter(r => new Date(r.time).getMonth() === new Date().getMonth()).length,
                    ratingDistribution: dist,
                    averageResponseTime: '2h',
                    responseRate: total ? Math.round((reviews.filter(r => r.isReplied).length / total) * 100) : 0,
                },
                isLoading: false
            });
        },

        addSavedReply: (text) => set((s) => ({ savedReplies: [...s.savedReplies, text] })),
    }
}));

export const useReputationActions = () => useReputationStore((state) => state.actions);
export const useReviews = () => useReputationStore((state) => state.reviews);
export const useReputationStats = () => useReputationStore((state) => state.stats);
export const useSavedReplies = () => useReputationStore((state) => state.savedReplies);
export const useReputationLoading = () => useReputationStore((state) => state.isLoading);
export const useReputationFilters = () => useReputationStore((state) => state.filters);
